require("source-map-support").install();
import AWS from "aws-sdk";
import { promises as fsp } from "fs";
import * as FantasyHockeyTypes from "./types";
import * as dataAccessMethods from "./data-access-methods";

const dynamodb = new AWS.DynamoDB();
const sns = new AWS.SNS();

/**
 * Main method for generating and sending messages about new transactions
 */
export async function main(): Promise<void> {
  if (
    !(
      process.env.FH_SEASON &&
      process.env.FH_LEAGUE_ID &&
      process.env.ESPN_S2_COOKIE
    )
  ) {
    throw new Error(
      "At least one of FH_SEASON, FH_LEAGUE_ID, and ESPN_S2_COOKIE not defined"
    );
  }

  const FH_LEAGUE_ID = process.env.FH_LEAGUE_ID;
  const FH_SEASON = parseInt(process.env.FH_SEASON);
  const ESPN_S2_COOKIE = process.env.ESPN_S2_COOKIE;
  const AWS_SNS_TOPIC_ARN = process.env.AWS_SNS_TOPIC_ARN;
  const AWS_DYNAMO_DB_TABLE_NAME = process.env.AWS_DYNAMO_DB_TABLE_NAME;
  const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK;
  const LAST_RUN_FILE_PATH = process.env.LAST_RUN_FILE_PATH || ".lastrun";
  const EARLIEST_DATE = process.env.EARLIEST_DATE;
  const LATEST_DATE = process.env.LATEST_DATE;

  let runtime = new Date().getTime();
  let earliestDate = EARLIEST_DATE
    ? parseInt(EARLIEST_DATE)
    : await getLastRuntime(LAST_RUN_FILE_PATH, AWS_DYNAMO_DB_TABLE_NAME);
  // Decrementing value of latestDate to make earliestDate inclusive, but latestDate exclusive
  let latestDate = (LATEST_DATE ? parseInt(LATEST_DATE) : runtime) - 1;

  if (earliestDate) {
    console.log(`Earliest date: ${earliestDate} (${new Date(earliestDate)})`);
    console.log(`Latest date: ${latestDate} (${new Date(latestDate)})`);
    let [messages, leagueData, players, nhlTeamData] = await Promise.all([
      // Sorted list of adds and drops
      dataAccessMethods.getMessages(FH_SEASON, FH_LEAGUE_ID, ESPN_S2_COOKIE, {
        topics: {
          filterIncludeMessageTypeIds: {
            value: [178, 179, 180, 181, 224, 225, 239, 244, 245],
          },
          sortMessageDate: {
            sortPriority: 1,
            sortAsc: true,
          },
          sortFor: {
            sortPriority: 2,
            sortAsc: true,
          },
          filterDateRange: {
            value: earliestDate,
            additionalValue: latestDate,
          },
        },
      }),
      dataAccessMethods.getLeagueData(FH_SEASON, FH_LEAGUE_ID, ESPN_S2_COOKIE),
      dataAccessMethods.getPlayers(FH_SEASON, {
        filterActive: { value: true },
      }),
      dataAccessMethods.getNhlTeamData(FH_SEASON, ESPN_S2_COOKIE),
    ]);

    let formattedMessages = getFormattedMessage(
      messages,
      players,
      leagueData,
      nhlTeamData
    );

    await sendNotification(
      formattedMessages,
      AWS_SNS_TOPIC_ARN,
      DISCORD_WEBHOOK
    );
  } else {
    console.log(
      "WARNING: no environment variable passed for EARLIEST_DATE and no value found for lastRuntime; no notifications will be sent"
    );
  }

  await updateEpochTime(runtime, LAST_RUN_FILE_PATH, AWS_DYNAMO_DB_TABLE_NAME);
}

/**
 * Gets a human-readable formatted message detailing all transactions
 * @param messages The list of event messages
 * @param players The list of players in the league
 * @param leagueData Info about fantasy teams in the league
 * @param nhlTeamData Info about NHL teams in the league
 */
function getFormattedMessage(
  messages: FantasyHockeyTypes.MessageTopic[],
  players: FantasyHockeyTypes.NhlPlayer[],
  leagueData: FantasyHockeyTypes.FhLeagueData,
  nhlTeamData: FantasyHockeyTypes.FantasyHockeyInfoResponse
): string {
  let formattedMessages = "";
  messages.forEach((topic) => {
    let topicHeader = getTopicHeader(topic);
    if (topicHeader) {
      formattedMessages += `${topicHeader}\n`;
    }
    topic.messages.forEach((message) => {
      updateHumanReadableMessage(
        message,
        players,
        leagueData.teams,
        nhlTeamData.settings.proTeams
      );
      formattedMessages += `${topicHeader ? "    ": ""}${message.humanReadableMessage}\n`;
    });
    formattedMessages.trim();
    formattedMessages += "\n";
  });
  return formattedMessages.trim();
}

export function getTopicHeader(topic: FantasyHockeyTypes.MessageTopic): string {
  if (topic.messages.some((message) => message.messageTypeId == 224)) {
    return "Trade Accepted:";
  } else if (topic.messages.some((message) => message.messageTypeId == 244)) {
    return "Trade Processed:";
  } else {
    return "";
  }
}

/**
 * Gets the unix timestamp of the last successful run from DynamoDB or a local file
 * @param lastRunFilePath The path to a local file that contains the unix time that this script was last run
 * @param awsDynamoDbTable The name of the DynamoDB to use for storing last run date
 */
async function getLastRuntime(
  lastRunFilePath: string,
  awsDynamoDbTable?: string
): Promise<number | undefined> {
  let lastRun: number | undefined;
  if (awsDynamoDbTable) {
    let dynamoSearchParams = {
      Key: {
        keyName: {
          S: "lastRun",
        },
      },
      TableName: awsDynamoDbTable,
    };

    let lastRunString = (await dynamodb.getItem(dynamoSearchParams).promise())
      .Item?.itemValue.N;
    lastRun = lastRunString ? parseInt(lastRunString) : undefined;
  } else {
    try {
      let lastRunString = await fsp.readFile(lastRunFilePath, "utf8");
      lastRun = parseInt(lastRunString);
    } catch {
      lastRun = undefined;
    }
  }

  return lastRun;
}

/**
 * Updates DynamoDB or a local file with a new value for the latest successful function execution
 * @param newTime The new unix time to store
 * @param lastRunFilePath The path to a local file to use for storage of the unix time that this script was last run
 * @param awsDynamoDbTable The name of the DynamoDB to use for storing last run date
 */
async function updateEpochTime(
  newTime: number,
  lastRunFilePath: string,
  awsDynamoDbTable?: string
): Promise<void> {
  if (awsDynamoDbTable) {
    await dynamodb
      .updateItem({
        Key: {
          keyName: {
            S: "lastRun",
          },
        },
        ExpressionAttributeNames: { "#IV": "itemValue" },
        ExpressionAttributeValues: {
          ":t": { N: newTime.toString() },
        },
        ReturnValues: "UPDATED_NEW",
        TableName: awsDynamoDbTable,
        UpdateExpression: "SET #IV = :t",
      })
      .promise();
  } else {
    await fsp.writeFile(lastRunFilePath, newTime.toString(), "utf8");
  }
}

/**
 * Looks up a player using the player's ID
 * @param playerList The list of all players
 * @param playerId The ID of the player to lookup
 */
function getPlayer(
  playerList: FantasyHockeyTypes.NhlPlayer[],
  playerId: number
): FantasyHockeyTypes.NhlPlayer {
  let player = playerList.find((player) => player.id == playerId);
  if (!player) {
    throw new Error(
      `Could not find player in list of ESPN players (ID: ${playerId})`
    );
  }
  return player;
}

/**
 * Looks up a fantasy hockey team by its ID
 * @param fantasyLeagueTeams The list of fantasy hockey teams
 * @param fantasyTeamId The ID of a fantasy hockey team
 */
function getFantasyTeam(
  fantasyLeagueTeams: FantasyHockeyTypes.FhLeagueTeam[],
  fantasyTeamId: number
): FantasyHockeyTypes.FhLeagueTeam {
  let team = fantasyLeagueTeams.find((team) => team.id == fantasyTeamId);
  if (!team) {
    throw new Error(
      `Could not find team in list of ESPN fantasy teams (ID: ${fantasyTeamId})`
    );
  }
  return team;
}

/**
 * Looks up a NHL team by its ID
 * @param nhlTeams The list of NHL teams
 * @param nhlTeamId The ID of a NHL team
 */
function getNhlTeam(
  nhlTeams: FantasyHockeyTypes.ProTeam[],
  nhlTeamId: number
): FantasyHockeyTypes.ProTeam {
  let team = nhlTeams.find((team) => team.id == nhlTeamId);
  if (!team) {
    throw new Error(
      `Could not find team in list of NHL teams (ID: ${nhlTeamId})`
    );
  }
  return team;
}

/**
 * Sets `defaultPosition` and `eligiblePositions` for a player based on existing value for `defaultPositionId` and `eligibleSlots`
 * @param player An NHL Player
 */
function updatePlayerPosition(player: FantasyHockeyTypes.NhlPlayer): void {
  switch (player.defaultPositionId) {
    case 1:
      player.defaultPosition = { abbrev: "C", name: "Center" };
      break;
    case 2:
      player.defaultPosition = { abbrev: "LW", name: "Left Wing" };
      break;
    case 3:
      player.defaultPosition = { abbrev: "RW", name: "Right Wing" };
      break;
    case 4:
      player.defaultPosition = { abbrev: "D", name: "Defenseman" };
      break;
    case 5:
      player.defaultPosition = { abbrev: "G", name: "Goalie" };
      break;
    default:
      throw new Error(
        `Unexpected default position ID: ${player.defaultPositionId}`
      );
  }

  player.eligiblePositions = player.eligibleSlots
    .map((slot) => getEligiblePosition(slot))
    .filter(
      (slot) =>
        !(
          slot.abbrev == "F" ||
          slot.abbrev == "UTIL" ||
          slot.abbrev == "BE" ||
          slot.abbrev == "IR" ||
          slot.abbrev == "INV" ||
          slot.abbrev == "SK"
        )
    );
}

/**
 * Gets the player's position from an ID
 * @param id The slot ID as set in the array of `eligibleSlots`
 */
function getEligiblePosition(id: number): FantasyHockeyTypes.PlayerPosition {
  switch (id) {
    case 0:
      return { abbrev: "C", name: "Center" };
    case 1:
      return { abbrev: "LW", name: "Left Wing" };
    case 2:
      return { abbrev: "RW", name: "Right Wing" };
    case 3:
      return { abbrev: "F", name: "Forward" };
    case 4:
      return { abbrev: "D", name: "Defenseman" };
    case 5:
      return { abbrev: "G", name: "Goalie" };
    case 6:
      return { abbrev: "UTIL", name: "Utility" };
    case 7:
      return { abbrev: "BE", name: "Bench" };
    case 8:
      return { abbrev: "IR", name: "Injury Reserve" };
    case 9:
      return { abbrev: "INV", name: "Invalid Player" };
    case 10:
      return { abbrev: "SK", name: "Skater" };
    default:
      throw new Error(`Unexpected position ID: ${id}`);
  }
}

/**
 * Generates and updates the human readable message summary for a message object
 * @param message The message that needs to be updated to set the human readable message
 * @param players The list of all NHL players
 * @param fantasyLeagueTeams The list of fantasy hockey teams
 * @param nhlTeams The list of NHL teams
 */
function updateHumanReadableMessage(
  message: FantasyHockeyTypes.Message,
  players: FantasyHockeyTypes.NhlPlayer[],
  fantasyLeagueTeams: FantasyHockeyTypes.FhLeagueTeam[],
  nhlTeams: FantasyHockeyTypes.ProTeam[]
): void {
  switch (message.messageTypeId) {
    // Add from free agency
    case 178:
      genericUpdateHumanReadableMessage(
        message,
        players,
        fantasyLeagueTeams,
        nhlTeams,
        "added",
        message.to,
        "Free Agency"
      );
      break;
    // Add from Waivers
    case 180:
      genericUpdateHumanReadableMessage(
        message,
        players,
        fantasyLeagueTeams,
        nhlTeams,
        "added",
        message.to,
        "Waivers"
      );
      break;
    // Drop
    case 179:
    case 181:
      genericUpdateHumanReadableMessage(
        message,
        players,
        fantasyLeagueTeams,
        nhlTeams,
        "dropped",
        message.to
      );
      break;
    // Trade accepted
    case 224:
      genericUpdateHumanReadableMessage(
        message,
        players,
        fantasyLeagueTeams,
        nhlTeams,
        "trades",
        message.from,
        undefined,
        message.to
      );
      break;
    // Trade processed
    case 244:
      genericUpdateHumanReadableMessage(
        message,
        players,
        fantasyLeagueTeams,
        nhlTeams,
        "traded",
        message.from,
        undefined,
        message.to
      );
      break;
    // Trade accepted drop
    case 225:
      genericUpdateHumanReadableMessage(
        message,
        players,
        fantasyLeagueTeams,
        nhlTeams,
        "drops",
        message.from
      );
      break;
    // Trade processed drop
    case 245:
      genericUpdateHumanReadableMessage(
        message,
        players,
        fantasyLeagueTeams,
        nhlTeams,
        "dropped",
        message.from
      );
      break;
    // Drop from roster
    case 239:
      genericUpdateHumanReadableMessage(
        message,
        players,
        fantasyLeagueTeams,
        nhlTeams,
        "dropped",
        message.for
      );
      break;
    default:
      throw new Error(`Unexpected message type: ${message.messageTypeId}`);
  }
}

/**
 * Generates and updates the human readable message summary for a message object
 * @param message The message that needs to be updated to set the human readable message
 * @param players The list of all NHL players
 * @param fantasyLeagueTeams The list of fantasy hockey teams
 * @param nhlTeams The list of NHL teams
 * @param action The action that the fantasy hockey team performed (i.e. `dropped`)
 * @param teamId The ID of the fantasy hockey team that made the transaction
 * @param fromName The location the player is moving from (i.e. `Waivers`)
 * @param toTeamId The ID of the fantasy hockey team the player is moving to
 */
function genericUpdateHumanReadableMessage(
  message: FantasyHockeyTypes.Message,
  players: FantasyHockeyTypes.NhlPlayer[],
  fantasyLeagueTeams: FantasyHockeyTypes.FhLeagueTeam[],
  nhlTeams: FantasyHockeyTypes.ProTeam[],
  action: string,
  teamId?: number | string,
  fromName?: string,
  toTeamId?: number | string
): void {
  let targetPlayer =
    message.targetId && typeof message.targetId == "number"
      ? getPlayer(players, message.targetId)
      : undefined;
  let targetPlayerNhlTeam: FantasyHockeyTypes.ProTeam | undefined;
  if (targetPlayer) {
    targetPlayerNhlTeam = getNhlTeam(nhlTeams, targetPlayer.proTeamId);
    updatePlayerPosition(targetPlayer);
  }
  let fhTeam: FantasyHockeyTypes.FhLeagueTeam | undefined;
  if (teamId && typeof teamId == "number" && teamId !== -1) {
    fhTeam = getFantasyTeam(fantasyLeagueTeams, teamId);
  }
  let fhToTeam: FantasyHockeyTypes.FhLeagueTeam | undefined;
  if (toTeamId && typeof toTeamId == "number" && toTeamId !== -1) {
    fhToTeam = getFantasyTeam(fantasyLeagueTeams, toTeamId);
  }
  if (fhTeam && fhToTeam && targetPlayer && targetPlayerNhlTeam) {
    message.humanReadableMessage = `${fhTeam.abbrev} ${action} ${
      targetPlayer.fullName
    }, ${targetPlayerNhlTeam.abbrev} ${targetPlayer.eligiblePositions
      ?.map((position) => position.abbrev)
      .join("/")} to ${fhToTeam.abbrev}`;
  } else if (fhTeam && targetPlayer && targetPlayerNhlTeam) {
    message.humanReadableMessage = `${fhTeam.abbrev} ${action} ${
      targetPlayer.fullName
    }, ${targetPlayerNhlTeam.abbrev} ${targetPlayer.eligiblePositions
      ?.map((position) => position.abbrev)
      .join("/")}${fromName ? ` from ${fromName}` : ""}`;
  }
}

/**
 * Sends the notification; currently, the message is sent to SNS and Discord if `SNS_TOPIC_ARN` and `DISCORD_WEBHOOK` are set
 * @param message The message to send
 * @param awsSnsTopicArn The ARN of an AWS SNS topic that the message should be sent to
 * @param discordWebhook The Discord Webhook URL that the message should be posted to
 */
async function sendNotification(
  message: string,
  awsSnsTopicArn?: string,
  discordWebhook?: string
): Promise<void> {
  if (message) {
    console.log(`Message to be sent via notification streams:\n${message}`);
    let notificationPromises: Promise<any>[] = [];
    if (awsSnsTopicArn) {
      notificationPromises.push(
        sns.publish({ TopicArn: awsSnsTopicArn, Message: message }).promise()
      );
    }
    if (discordWebhook) {
      notificationPromises.push(
        dataAccessMethods.httpPostRequest(discordWebhook, undefined, {
          content: message,
        })
      );
    }

    await Promise.all(notificationPromises);
  } else {
    console.log("No notifications to send");
  }
}
