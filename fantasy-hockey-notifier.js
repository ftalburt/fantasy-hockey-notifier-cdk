const AWS = require("aws-sdk");
const dynamodb = new AWS.DynamoDB();
const sns = new AWS.SNS();
const rp = require("request-promise-native");

// Change these constants to fit your environment
const fantasyHockeyLeagueId = 0;
const fantasyHockeySeason = 0;
const espnS2Cookie = 0;
const snsTopicArn = "";
const dynamoDbTableName = "";

let runtime = null;

exports.handler = async function(event, context) {
  runtime = new Date().getTime();

  let results = await Promise.all([
    getMessages(),
    getPlayers(),
    getLastRuntime()
  ]);

  let messagesResponse = results[0];
  let playersResponse = results[1];
  let lastRuntime = parseInt(results[2].Item.itemValue.N);

  if (messagesResponse.statusCode == 401) {
    throw new Error("Authentication to messages API failed");
  } else if (messagesResponse.statusCode != 200) {
    throw new Error(
      "Unexpected response status from messages request: " +
        messagesResponse.statusCode +
        "(" +
        messagesResponse.statusMessage +
        ")"
    );
  } else if (playersResponse.statusCode != 200) {
    throw new Error(
      "Unexpected response status from players request: " +
        playersResponse.statusCode +
        "(" +
        playersResponse.statusMessage +
        ")"
    );
  } else {
    await sendNotification(
      lastRuntime,
      messagesResponse.body,
      playersResponse.body
    );
    updateEpochTime(runtime);
  }
};

async function getMessages() {
  let messageRequestOptions = {
    url:
      `http://fantasy.espn.com/apis/v3/games/fhl/seasons/${fantasyHockeySeason}/segments/0/leagues/${fantasyHockeyLeagueId}/communication/?view=kona_league_communication`,
    headers: {
      Cookie:
        `espn_s2=${espnS2Cookie}`
    },
    resolveWithFullResponse: true
  };

  return await rp(messageRequestOptions);
}

async function getPlayers() {
  return await rp({
    url:
      `http://fantasy.espn.com/apis/v3/games/fhl/seasons/${fantasyHockeySeason}/players?scoringPeriodId=0&view=players_wl`,
    resolveWithFullResponse: true
  });
}

async function getLastRuntime() {
  let dynamoSearchParams = {
    Key: {
      keyName: {
        S: "lastRun"
      }
    },
    TableName: dynamoDbTableName
  };

  return await dynamodb.getItem(dynamoSearchParams).promise();
}

async function updateEpochTime(newTime) {
  let updateParams = {
    Key: {
      keyName: {
        S: "lastRun"
      }
    },
    ExpressionAttributeNames: { "#IV": "itemValue" },
    ExpressionAttributeValues: {
      ":t": { N: newTime.toString() }
    },
    ReturnValues: "UPDATED_NEW",
    TableName: dynamoDbTableName,
    UpdateExpression: "SET #IV = :t"
  };

  let data = await dynamodb.updateItem(updateParams).promise();
  return data;
}

function getPlayer(playerList, playerId) {
  for (let count = 0; count < playerList.length; count++) {
    if (playerList[count].id == playerId) {
      return playerList[count].fullName;
    }
  }
}

async function sendNotification(searchStartTime, messages, playersRaw) {
  let players = JSON.parse(playersRaw);
  let drops = [];
  let dropNames = [];
  let topics = JSON.parse(messages).topics;

  for (let i = 0; i < topics.length; i++) {
    if (topics[i].date > searchStartTime) {
      topics[i].messages.forEach(message => {
        if (
          message.messageTypeId == 179 ||
          message.messageTypeId == 239 ||
          message.messageTypeId == 181
        ) {
          runtime = topics[i].date > runtime ? topics[i].date : runtime;
          drops.push(message.targetId);
        }
      });
    }
  }

  drops.forEach(elm => {
    dropNames.push(getPlayer(players, elm));
  });

  if (dropNames.length > 0) {
    let formattedDrops = dropNames.join(", ");

    let dropNotificationParams = {
      TopicArn: snsTopicArn,
      Message: "Players Dropped: " + formattedDrops
    };

    return await sns.publish(dropNotificationParams).promise();
  } else {
    return null;
  }
}
