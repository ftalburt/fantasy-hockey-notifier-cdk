import { Duration, RemovalPolicy, Stack } from "aws-cdk-lib";
import { Match, Template } from "aws-cdk-lib/assertions";
import * as dynamo from "aws-cdk-lib/aws-dynamodb";
import * as events from "aws-cdk-lib/aws-events";
import * as kms from "aws-cdk-lib/aws-kms";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as sns from "aws-cdk-lib/aws-sns";
import { FantasyHockeyNotifier } from "../src";

test("Test default parameters", () => {
  const stack = new Stack(undefined, undefined, {
    env: { account: "123456789012", region: "us-east-1" },
  });

  const cookieValue = "abc123456";
  const leagueId = "1234";
  const season = "2022";

  new FantasyHockeyNotifier(stack, "test-fh-notifier", {
    envVarValues: {
      espnS2Cookie: cookieValue,
      fhLeagueId: leagueId,
      fhSeason: season,
    },
  });

  const template = Template.fromStack(stack);
  // Lambda function created with expected default values
  template.hasResourceProperties("AWS::Lambda::Function", {
    Architectures: ["arm64"],
    Timeout: 10,
    Runtime: "nodejs14.x",
    MemorySize: 128,
    Environment: Match.objectEquals({
      Variables: {
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
        AWS_DYNAMO_DB_TABLE_NAME: { Ref: Match.anyValue() },
        ESPN_S2_COOKIE: cookieValue,
        FH_LEAGUE_ID: leagueId,
        FH_SEASON: season,
      },
    }),
  });
  // Event rule created with expected default values
  template.hasResourceProperties("AWS::Events::Rule", {
    ScheduleExpression: "rate(1 minute)",
  });
  // DynamoDB table created with expected default values
  template.hasResource("AWS::DynamoDB::Table", {
    Properties: {
      AttributeDefinitions: [{ AttributeName: "keyName", AttributeType: "S" }],
      KeySchema: [{ AttributeName: "keyName", KeyType: "HASH" }],
      ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 },
    },
    DeletionPolicy: "Retain",
    UpdateReplacePolicy: "Retain",
  });
});

test("Test DynamoDB custom removal policy", () => {
  const stack = new Stack(undefined, undefined, {
    env: { account: "123456789012", region: "us-east-1" },
  });
  new FantasyHockeyNotifier(stack, "test-fh-notifier", {
    dynamoTableRemovalPolicy: RemovalPolicy.DESTROY,
    envVarValues: {
      discordWebhook: "https://discordapp.com/api/webhooks/123456/ABC123",
      espnS2Cookie: "abc123456",
      fhLeagueId: "1234",
      fhSeason: "2022",
    },
  });
  const template = Template.fromStack(stack);
  template.hasResource("AWS::DynamoDB::Table", {
    UpdateReplacePolicy: "Delete",
    DeletionPolicy: "Delete",
  });
});

test("Test custom DynamoDB table", () => {
  const stack = new Stack(undefined, undefined, {
    env: { account: "123456789012", region: "us-east-1" },
  });
  const tableName = "MyTable";
  new FantasyHockeyNotifier(stack, "test-fh-notifier", {
    dynamoTable: dynamo.Table.fromTableName(stack, "table", tableName),
    envVarValues: {
      discordWebhook: "https://discordapp.com/api/webhooks/123456/ABC123",
      espnS2Cookie: "abc123456",
      fhLeagueId: "1234",
      fhSeason: "2022",
    },
  });
  const template = Template.fromStack(stack);
  // No Table is created
  template.resourceCountIs("AWS::DynamoDB::Table", 0);
  // Lambda function references the existing table
  template.hasResourceProperties("AWS::Lambda::Function", {
    Environment: Match.objectLike({
      Variables: {
        AWS_DYNAMO_DB_TABLE_NAME: tableName,
      },
    }),
  });
});

test("Test custom schedule", () => {
  const stack = new Stack(undefined, undefined, {
    env: { account: "123456789012", region: "us-east-1" },
  });
  new FantasyHockeyNotifier(stack, "test-fh-notifier", {
    lambdaSchedule: events.Schedule.rate(Duration.minutes(5)),
    envVarValues: {
      discordWebhook: "https://discordapp.com/api/webhooks/123456/ABC123",
      espnS2Cookie: "abc123456",
      fhLeagueId: "1234",
      fhSeason: "2022",
    },
  });
  const template = Template.fromStack(stack);
  template.hasResourceProperties("AWS::Events::Rule", {
    ScheduleExpression: "rate(5 minutes)",
  });
});

test("Test custom Lambda Architecture", () => {
  const stack = new Stack(undefined, undefined, {
    env: { account: "123456789012", region: "us-east-1" },
  });
  new FantasyHockeyNotifier(stack, "test-fh-notifier", {
    lambdaArchitecture: lambda.Architecture.X86_64,
    envVarValues: {
      discordWebhook: "https://discordapp.com/api/webhooks/123456/ABC123",
      espnS2Cookie: "abc123456",
      fhLeagueId: "1234",
      fhSeason: "2022",
    },
  });
  const template = Template.fromStack(stack);
  template.hasResourceProperties("AWS::Lambda::Function", {
    Architectures: ["x86_64"],
  });
});

test("Test custom Lambda memory size", () => {
  const stack = new Stack(undefined, undefined, {
    env: { account: "123456789012", region: "us-east-1" },
  });
  new FantasyHockeyNotifier(stack, "test-fh-notifier", {
    memorySize: 512,
    envVarValues: {
      discordWebhook: "https://discordapp.com/api/webhooks/123456/ABC123",
      espnS2Cookie: "abc123456",
      fhLeagueId: "1234",
      fhSeason: "2022",
    },
  });
  const template = Template.fromStack(stack);
  template.hasResourceProperties("AWS::Lambda::Function", {
    MemorySize: 512,
  });
});

test("Test custom Lambda timeout", () => {
  const stack = new Stack(undefined, undefined, {
    env: { account: "123456789012", region: "us-east-1" },
  });
  new FantasyHockeyNotifier(stack, "test-fh-notifier", {
    timeout: Duration.seconds(100),
    envVarValues: {
      discordWebhook: "https://discordapp.com/api/webhooks/123456/ABC123",
      espnS2Cookie: "abc123456",
      fhLeagueId: "1234",
      fhSeason: "2022",
    },
  });
  const template = Template.fromStack(stack);
  template.hasResourceProperties("AWS::Lambda::Function", {
    Timeout: 100,
  });
});

test("Test custom environment variables", () => {
  const stack = new Stack(undefined, undefined, {
    env: { account: "123456789012", region: "us-east-1" },
  });
  const webhookUrl = "https://discordapp.com/api/webhooks/123456/ABC123";
  const cookieValue = "abc123456";
  const leagueId = "1234";
  const season = "2022";
  new FantasyHockeyNotifier(stack, "test-fh-notifier", {
    envVarValues: {
      discordWebhook: webhookUrl,
      espnS2Cookie: cookieValue,
      fhLeagueId: leagueId,
      fhSeason: season,
    },
  });
  const template = Template.fromStack(stack);
  // Lambda has the specified env vars
  template.hasResourceProperties("AWS::Lambda::Function", {
    Environment: Match.objectLike({
      Variables: {
        DISCORD_WEBHOOK: webhookUrl,
        ESPN_S2_COOKIE: cookieValue,
        FH_LEAGUE_ID: leagueId,
        FH_SEASON: season,
      },
    }),
  });
});

test("Test custom SSM environment variables", () => {
  const stack = new Stack(undefined, undefined, {
    env: { account: "123456789012", region: "us-east-1" },
  });
  const webhookUrl = "/path/to/webhookUrl";
  const cookieValue = "/path/to/cookie";
  const leagueId = "/path/to/leagueId";
  const season = "/path/to/season";
  new FantasyHockeyNotifier(stack, "test-fh-notifier", {
    ssmPaths: {
      discordWebhook: webhookUrl,
      espnS2Cookie: cookieValue,
      fhLeagueId: leagueId,
      fhSeason: season,
    },
  });
  const template = Template.fromStack(stack);
  // Lambda has the specified SSM env vars
  template.hasResourceProperties("AWS::Lambda::Function", {
    Environment: Match.objectLike({
      Variables: {
        DISCORD_WEBHOOK_SSM: webhookUrl,
        ESPN_S2_COOKIE_SSM: cookieValue,
        FH_LEAGUE_ID_SSM: leagueId,
        FH_SEASON_SSM: season,
      },
    }),
  });
});

test("Test custom SNS topic", () => {
  const stack = new Stack(undefined, undefined, {
    env: { account: "123456789012", region: "us-east-1" },
  });
  const topicArn = "arn:aws:sns:us-east-1:123456789012:MyTopic";
  new FantasyHockeyNotifier(stack, "test-fh-notifier", {
    snsTopic: sns.Topic.fromTopicArn(stack, "topic", topicArn),
    envVarValues: {
      discordWebhook: "https://discordapp.com/api/webhooks/123456/ABC123",
      espnS2Cookie: "abc123456",
      fhLeagueId: "1234",
      fhSeason: "2022",
    },
  });
  const template = Template.fromStack(stack);

  // Lambda function has permission to publish to the topic
  template.hasResourceProperties("AWS::IAM::Policy", {
    PolicyDocument: {
      Statement: Match.arrayWith([
        {
          Action: "sns:Publish",
          Effect: "Allow",
          Resource: topicArn,
        },
      ]),
    },
  });

  // Lambda function has an environment variable that references the topic
  template.hasResourceProperties("AWS::Lambda::Function", {
    Environment: Match.objectLike({
      Variables: {
        AWS_SNS_TOPIC_ARN: topicArn,
      },
    }),
  });
});

test("Test custom KMS key without SSM parameters", () => {
  const stack = new Stack(undefined, undefined, {
    env: { account: "123456789012", region: "us-east-1" },
  });
  const keyArn =
    "arn:aws:kms:us-east-1:123456789012:key/abc133xy-1234-5def-xyz0-6789abcdef12";
  const key = kms.Key.fromKeyArn(stack, "key", keyArn);
  new FantasyHockeyNotifier(stack, "test-fh-notifier", {
    kmsKeys: [key],
    envVarValues: {
      discordWebhook: "https://discordapp.com/api/webhooks/123456/ABC123",
      espnS2Cookie: "abc123456",
      fhLeagueId: "1234",
      fhSeason: "2022",
    },
  });

  const template = Template.fromStack(stack);
  // A statement was NOT added to the IAM policy to allow kms:Decrypt
  template.hasResourceProperties("AWS::IAM::Policy", {
    PolicyDocument: {
      Statement: Match.not(
        Match.arrayWith([
          {
            Action: "kms:Decrypt",
            Effect: "Allow",
            Resource: keyArn,
          },
        ])
      ),
    },
  });
});

test("Test custom KMS key with SSM parameters", () => {
  const stack = new Stack(undefined, undefined, {
    env: { account: "123456789012", region: "us-east-1" },
  });
  const keyArn =
    "arn:aws:kms:us-east-1:123456789012:key/abc133xy-1234-5def-xyz0-6789abcdef12";
  const key = kms.Key.fromKeyArn(stack, "key", keyArn);
  const webhookUrl = "/path/to/webhookUrl";
  const cookieValue = "/path/to/cookie";
  const leagueId = "/path/to/leagueId";
  const season = "/path/to/season";
  new FantasyHockeyNotifier(stack, "test-fh-notifier", {
    kmsKeys: [key],
    ssmPaths: {
      discordWebhook: webhookUrl,
      espnS2Cookie: cookieValue,
      fhLeagueId: leagueId,
      fhSeason: season,
    },
  });

  const template = Template.fromStack(stack);
  // A statement was added to the IAM policy to allow kms:Decrypt
  template.hasResourceProperties("AWS::IAM::Policy", {
    PolicyDocument: {
      Statement: Match.arrayWith([
        {
          Action: "kms:Decrypt",
          Effect: "Allow",
          Resource: keyArn,
        },
      ]),
    },
  });
});

test("Test custom KMS key with existing DynamoDB table", () => {
  const stack = new Stack(undefined, undefined, {
    env: { account: "123456789012", region: "us-east-1" },
  });
  const keyArn =
    "arn:aws:kms:us-east-1:123456789012:key/abc133xy-1234-5def-xyz0-6789abcdef12";
  const key = kms.Key.fromKeyArn(stack, "key", keyArn);
  const tableName = "MyTable";

  new FantasyHockeyNotifier(stack, "test-fh-notifier", {
    kmsKeys: [key],
    dynamoTable: dynamo.Table.fromTableName(stack, "table", tableName),
    envVarValues: {
      discordWebhook: "https://discordapp.com/api/webhooks/123456/ABC123",
      espnS2Cookie: "abc123456",
      fhLeagueId: "1234",
      fhSeason: "2022",
    },
  });

  const template = Template.fromStack(stack);
  // A statement was added to the IAM policy to allow kms:Decrypt
  template.hasResourceProperties("AWS::IAM::Policy", {
    PolicyDocument: {
      Statement: Match.arrayWith([
        {
          Action: "kms:Decrypt",
          Effect: "Allow",
          Resource: keyArn,
        },
      ]),
    },
  });
});

test("Test multiple custom KMS keys", () => {
  const stack = new Stack(undefined, undefined, {
    env: { account: "123456789012", region: "us-east-1" },
  });
  const keyArn1 =
    "arn:aws:kms:us-east-1:123456789012:key/abc133xy-1234-5def-xyz0-6789abcdef12";
  const key1 = kms.Key.fromKeyArn(stack, "key1", keyArn1);

  const keyArn2 =
    "arn:aws:kms:us-east-1:123456789012:key/def133xy-1234-5def-xyz0-6789abcdef12";
  const key2 = kms.Key.fromKeyArn(stack, "key2", keyArn2);

  const tableName = "MyTable";

  new FantasyHockeyNotifier(stack, "test-fh-notifier", {
    kmsKeys: [key1, key2],
    dynamoTable: dynamo.Table.fromTableName(stack, "table", tableName),
    envVarValues: {
      discordWebhook: "https://discordapp.com/api/webhooks/123456/ABC123",
      espnS2Cookie: "abc123456",
      fhLeagueId: "1234",
      fhSeason: "2022",
    },
  });

  const template = Template.fromStack(stack);
  // A statement was added to the IAM policy to allow kms:Decrypt for the first key
  template.hasResourceProperties("AWS::IAM::Policy", {
    PolicyDocument: {
      Statement: Match.arrayWith([
        {
          Action: "kms:Decrypt",
          Effect: "Allow",
          Resource: keyArn1,
        },
      ]),
    },
  });

  // A statement was added to the IAM policy to allow kms:Decrypt for the second key
  template.hasResourceProperties("AWS::IAM::Policy", {
    PolicyDocument: {
      Statement: Match.arrayWith([
        {
          Action: "kms:Decrypt",
          Effect: "Allow",
          Resource: keyArn2,
        },
      ]),
    },
  });
});

test("Test error is thrown if FH_SEASON is missing", () => {
  const stack = new Stack(undefined, undefined, {
    env: { account: "123456789012", region: "us-east-1" },
  });
  const app = () => {
    new FantasyHockeyNotifier(stack, "test-fh-notifier", {
      envVarValues: { espnS2Cookie: "abc123456", fhLeagueId: "1234" },
    });
  };
  expect(app).toThrowError(
    "At least one of FH_SEASON, FH_LEAGUE_ID, and ESPN_S2_COOKIE not defined"
  );
});

test("Test error is thrown if FH_LEAGUE_ID is missing", () => {
  const stack = new Stack(undefined, undefined, {
    env: { account: "123456789012", region: "us-east-1" },
  });
  const app = () => {
    new FantasyHockeyNotifier(stack, "test-fh-notifier", {
      envVarValues: { espnS2Cookie: "abc123456", fhSeason: "2022" },
    });
  };
  expect(app).toThrowError(
    "At least one of FH_SEASON, FH_LEAGUE_ID, and ESPN_S2_COOKIE not defined"
  );
});

test("Test error is thrown if ESPN_S2_COOKIE is missing", () => {
  const stack = new Stack(undefined, undefined, {
    env: { account: "123456789012", region: "us-east-1" },
  });
  const app = () => {
    new FantasyHockeyNotifier(stack, "test-fh-notifier", {
      envVarValues: { fhLeagueId: "1234", fhSeason: "2022" },
    });
  };
  expect(app).toThrowError(
    "At least one of FH_SEASON, FH_LEAGUE_ID, and ESPN_S2_COOKIE not defined"
  );
});
