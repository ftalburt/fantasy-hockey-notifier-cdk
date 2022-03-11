import "source-map-support/register";
import { promises as fsp } from "fs";
import {
  DynamoDBClient,
  UpdateItemCommand,
  GetItemCommand,
} from "@aws-sdk/client-dynamodb";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { GetParameterCommand, SSMClient } from "@aws-sdk/client-ssm";
import * as dataAccessMethods from "./data-access-methods";
import * as FantasyHockeyTypes from "./types";

const dynamodbClient = new DynamoDBClient({});
const snsClient = new SNSClient({});
const ssmClient = new SSMClient({});

/**
 *
 * @param ssmParameter The path to a SSM parameter
 * @param stringParameter The value of  a string that was passed to the application
 * @returns The value of the SSM parameter, if set; otherwise stringParameter
 */
async function getParameter(
  ssmParameter?: string,
  stringParameter?: string
): Promise<string | undefined> {
  if (ssmParameter) {
    const ssmResponse = await ssmClient.send(
      new GetParameterCommand({ Name: ssmParameter, WithDecryption: true })
    );
    const ssmValue = ssmResponse.Parameter?.Value;
    if (ssmValue) {
      return ssmValue;
    }
  }
  return stringParameter;
}

/**
 * Main method for generating and sending messages about new transactions
 */
export async function main(): Promise<void> {
  const fhSeasonPromise = getParameter(
    process.env.FH_SEASON_SSM,
    process.env.FH_SEASON
  );
  const fhLeagueIdPromise = getParameter(
    process.env.FH_LEAGUE_ID_SSM,
    process.env.FH_LEAGUE_ID
  );
  const espnS2CookiePromise = getParameter(
    process.env.ESPN_S2_COOKIE_SSM,
    process.env.ESPN_S2_COOKIE
  );
  const discordWebhookPromise = getParameter(
    process.env.DISCORD_WEBHOOK_SSM,
    process.env.DISCORD_WEBHOOK
  );

  const [fhSeason, fhLeagueId, espnS2Cookie, discordWebhook] =
    await Promise.all([
      fhSeasonPromise,
      fhLeagueIdPromise,
      espnS2CookiePromise,
      discordWebhookPromise,
    ]);

  if (!(fhSeason && fhLeagueId && espnS2Cookie)) {
    throw new Error(
      "At least one of FH_SEASON, FH_LEAGUE_ID, and ESPN_S2_COOKIE not defined"
    );
  }

  const FH_LEAGUE_ID = fhLeagueId;
  const FH_SEASON = parseInt(fhSeason);
  const ESPN_S2_COOKIE = espnS2Cookie;
  const AWS_SNS_TOPIC_ARN = process.env.AWS_SNS_TOPIC_ARN;
  const AWS_DYNAMO_DB_TABLE_NAME = process.env.AWS_DYNAMO_DB_TABLE_NAME;
  const DISCORD_WEBHOOK = discordWebhook;
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
            value: [
              178, 179, 180, 181, 224, 225, 226, 239, 241, 242, 243, 244, 245,
              246,
            ],
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
    });
    topic.messages.sort((a, b) => {
      const collator = new Intl.Collator("en", {
        numeric: true,
        sensitivity: "base",
      });

      if (!a.humanReadableMessage) {
        return -1;
      } else if (!b.humanReadableMessage) {
        return 1;
      } else {
        return collator.compare(a.humanReadableMessage, b.humanReadableMessage);
      }
    });
    topic.messages.forEach((message) => {
      formattedMessages += `${topicHeader ? "    " : ""}${
        message.humanReadableMessage
      }\n`;
    });
    formattedMessages.trim();
    formattedMessages += "\n";
  });
  return formattedMessages;
}

export function getTopicHeader(topic: FantasyHockeyTypes.MessageTopic): string {
  if (
    topic.messages.some(
      (message) => message.messageTypeId == 224 || message.messageTypeId == 226
    )
  ) {
    return "Trade Accepted:";
  } else if (
    topic.messages.some(
      (message) => message.messageTypeId == 244 || message.messageTypeId == 246
    )
  ) {
    return "Trade Processed:";
  } else if (
    topic.messages.some(
      (message) =>
        message.messageTypeId == 241 ||
        message.messageTypeId == 242 ||
        message.messageTypeId == 243
    )
  ) {
    return "Trade Vetoed by LM:";
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

    let lastRunString = (
      await dynamodbClient.send(new GetItemCommand(dynamoSearchParams))
    ).Item?.itemValue.N;
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
    await dynamodbClient.send(
      new UpdateItemCommand({
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
    );
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
  let thisPlayer = playerList.find((player) => player.id == playerId);
  if (!thisPlayer) {
    throw new Error(
      `Could not find player in list of ESPN players (ID: ${playerId})`
    );
  }
  return thisPlayer;
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
  let thisTeam = fantasyLeagueTeams.find((team) => team.id == fantasyTeamId);
  if (!thisTeam) {
    throw new Error(
      `Could not find team in list of ESPN fantasy teams (ID: ${fantasyTeamId})`
    );
  }
  return thisTeam;
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
  let thisTeam = nhlTeams.find((team) => team.id == nhlTeamId);
  if (!thisTeam) {
    throw new Error(
      `Could not find team in list of NHL teams (ID: ${nhlTeamId})`
    );
  }
  return thisTeam;
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
  player.nonPrimaryEligiblePositions = player.eligiblePositions
    .filter((position) => position.abbrev != player.defaultPosition?.abbrev)
    .sort((a, b) => {
      if (a.abbrev < b.abbrev) {
        return -1;
      }
      if (a.abbrev > b.abbrev) {
        return 1;
      }
      return 0;
    });
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
    // Trade vetoed by LM
    case 241:
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
    // Draft pick trade vetoed by LM
    case 243:
    // Draft pick trade accepted
    case 226:
      genericUpdateHumanReadableMessage(
        message,
        players,
        fantasyLeagueTeams,
        nhlTeams,
        "trades",
        message.from,
        undefined,
        message.to,
        true
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
    // Draft pick trade processed
    case 246:
      genericUpdateHumanReadableMessage(
        message,
        players,
        fantasyLeagueTeams,
        nhlTeams,
        "traded",
        message.from,
        undefined,
        message.to,
        true
      );
      break;
    // Trade vetoed by LM drop
    case 242:
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
 * @param targetIsDraftPick Set to true to indicate that the message target is a draft pick
 */
function genericUpdateHumanReadableMessage(
  message: FantasyHockeyTypes.Message,
  players: FantasyHockeyTypes.NhlPlayer[],
  fantasyLeagueTeams: FantasyHockeyTypes.FhLeagueTeam[],
  nhlTeams: FantasyHockeyTypes.ProTeam[],
  action: string,
  teamId?: number | string,
  fromName?: string,
  toTeamId?: number | string,
  targetIsDraftPick?: boolean
): void {
  let targetPlayer =
    !targetIsDraftPick &&
    message.targetId &&
    typeof message.targetId == "number"
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

  if (
    targetIsDraftPick &&
    fhTeam &&
    fhToTeam &&
    message.targetId &&
    typeof message.targetId == "number"
  ) {
    // TODO: Add code here to get round/pick and overall pick number for draft pick
    const pickOverallNumber = message.targetId;
    const pickRound = Math.ceil(pickOverallNumber / fantasyLeagueTeams.length);
    const pickNumberInRound =
      pickOverallNumber % fantasyLeagueTeams.length != 0
        ? pickOverallNumber % fantasyLeagueTeams.length
        : fantasyLeagueTeams.length;
    message.humanReadableMessage = `${fhTeam.abbrev} ${action} pick ${pickOverallNumber} (round ${pickRound}, pick ${pickNumberInRound}) to ${fhToTeam.abbrev}`;
  } else if (fhTeam && fhToTeam && targetPlayer && targetPlayerNhlTeam) {
    message.humanReadableMessage = `${fhTeam.abbrev} ${action} ${
      targetPlayer.firstName
    } ${targetPlayer.lastName}, ${targetPlayerNhlTeam.abbrev} ${
      targetPlayer.defaultPosition?.abbrev
    }${
      targetPlayer.nonPrimaryEligiblePositions &&
      targetPlayer.nonPrimaryEligiblePositions.length > 0
        ? "/" +
          targetPlayer.nonPrimaryEligiblePositions
            ?.map((position) => position.abbrev)
            .join("/")
        : ""
    } to ${fhToTeam.abbrev}`;
  } else if (fhTeam && targetPlayer && targetPlayerNhlTeam) {
    message.humanReadableMessage = `${fhTeam.abbrev} ${action} ${
      targetPlayer.firstName
    } ${targetPlayer.lastName}, ${targetPlayerNhlTeam.abbrev} ${
      targetPlayer.defaultPosition?.abbrev
    }${
      targetPlayer.nonPrimaryEligiblePositions &&
      targetPlayer.nonPrimaryEligiblePositions.length > 0
        ? "/" +
          targetPlayer.nonPrimaryEligiblePositions
            ?.map((position) => position.abbrev)
            .join("/")
        : ""
    }${fromName ? ` from ${fromName}` : ""}`;
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
        snsClient.send(
          new PublishCommand({ TopicArn: awsSnsTopicArn, Message: message })
        )
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
