import { Duration, RemovalPolicy, Aws } from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as events from "aws-cdk-lib/aws-events";
import * as eventsTargets from "aws-cdk-lib/aws-events-targets";
import * as kms from "aws-cdk-lib/aws-kms";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as sns from "aws-cdk-lib/aws-sns";
import * as statement from "cdk-iam-floyd";
import { Construct } from "constructs";

/** Environment variables for the Lambda function */
export interface FantasyHockeyEnvVars {
  /**
   * Value for FH_LEAGUE_ID
   *
   * This is a required parameter and must be set via SSM or
   * clear text env vars
   */
  readonly fhLeagueId?: string;
  /**
   * Value for FH_SEASON
   *
   * This is a required parameter and must be set via SSM or
   * clear text env vars
   */
  readonly fhSeason?: string;
  /**
   * Value for ESPN_S2_COOKIE
   *
   * This is a required parameter and must be set via SSM or
   * clear text env vars
   */
  readonly espnS2Cookie?: string;
  /** Value for DISCORD_WEBHOOK */
  readonly discordWebhook?: string;
}

/** Properties for a FantasyHockeyNotifier */
export interface FantasyHockeyNotifierProps {
  /**
   * An existing DynamoDB Table to use
   *
   * @default - a new Table will be created
   */
  readonly dynamoTable?: dynamodb.ITable;
  /**
   * The removal policy for the DynamoDB table
   *
   * @default RemovalPolicy.RETAIN
   */
  readonly dynamoTableRemovalPolicy?: RemovalPolicy;
  /**
   * The schedule to use for the Lambda function
   *
   * @default Schedule.rate(Duration.minutes(1))
   */
  readonly lambdaSchedule?: events.Schedule;
  /**
   * The system architecture to use for the lambda function
   *
   * @default Architecture.ARM_64
   */
  readonly lambdaArchitecture?: lambda.Architecture;
  /**
   * The amount of memory, in MB, to allocate to the Lambda function
   *
   * @default 128
   */
  readonly memorySize?: number;
  /**
   * The function execution time after which Lambda terminates the function
   *
   * @default Duration.seconds(10)
   */
  readonly timeout?: Duration;
  /**
   * Paths for existing SSM parmeters with values for the env vars
   *
   * If a value is specifed here and in `envVarValues`, this value takes prescedence
   */
  readonly ssmPaths?: FantasyHockeyEnvVars;
  /**
   * Values for the env vars
   *
   * If a value is specifed here and in `ssmPaths`, the value in `ssmPaths` takes prescedence
   */
  readonly envVarValues?: FantasyHockeyEnvVars;
  /**
   * Existing KMS keys that are used to encrypt the SSM parameters
   *
   * This must be specified to allow Lambda to read SecureString SSM parameteers
   */
  readonly kmsKeys?: kms.IKey[];
  /**
   * An existing SNS topic to send league event notifications to
   */
  readonly snsTopic?: sns.ITopic;
}

/** A Lambda function to send notifications for transactions in an ESPN Fantasy Hockey league */
export class FantasyHockeyNotifier extends Construct {
  /** The DynamoDB Table used for storing state */
  public readonly dynamoTable: dynamodb.ITable;
  /** The event rule for the Lambda function */
  public readonly eventRule: events.Rule;
  /** The Lambda function */
  public readonly lambdaFunction: NodejsFunction;
  /** The system architecture for the Lambda function */
  public readonly lambdaArchitecture: lambda.Architecture;
  /** The removal policy for the DynamoDB table */
  public readonly dynamoTableRemovalPolicy: RemovalPolicy;
  /** The SNS topic that recieves notifications about league events */
  public readonly snsTopic?: sns.ITopic;

  /**
   * Constructor for FantasyHockeyNotifier
   * @param scope Scope
   * @param id ID
   * @param props Construct Properties
   */
  constructor(scope: Construct, id: string, props: FantasyHockeyNotifierProps) {
    super(scope, id);

    // Validate that required env vars are passed to function
    if (
      !(props.envVarValues?.fhSeason || props.ssmPaths?.fhSeason) ||
      !(props.envVarValues?.fhLeagueId || props.ssmPaths?.fhLeagueId) ||
      !(props.envVarValues?.espnS2Cookie || props.ssmPaths?.espnS2Cookie)
    ) {
      throw new Error(
        "At least one of FH_SEASON, FH_LEAGUE_ID, and ESPN_S2_COOKIE not defined"
      );
    }

    this.dynamoTableRemovalPolicy =
      props.dynamoTableRemovalPolicy ?? RemovalPolicy.RETAIN;
    this.dynamoTable =
      props.dynamoTable ??
      new dynamodb.Table(this, "table", {
        removalPolicy: this.dynamoTableRemovalPolicy,
        partitionKey: {
          name: "keyName",
          type: dynamodb.AttributeType.STRING,
        },
        billingMode: dynamodb.BillingMode.PROVISIONED,
        readCapacity: 1,
        writeCapacity: 1,
      });
    this.eventRule = new events.Rule(this, "schedule", {
      schedule:
        props.lambdaSchedule ?? events.Schedule.rate(Duration.minutes(1)),
    });
    this.snsTopic = props.snsTopic;
    const envVars: { [key: string]: string | undefined } = {
      FH_LEAGUE_ID: props.envVarValues?.fhLeagueId,
      FH_SEASON: props.envVarValues?.fhSeason,
      ESPN_S2_COOKIE: props.envVarValues?.espnS2Cookie,
      DISCORD_WEBHOOK: props.envVarValues?.discordWebhook,
      FH_LEAGUE_ID_SSM: props.ssmPaths?.fhLeagueId,
      FH_SEASON_SSM: props.ssmPaths?.fhSeason,
      ESPN_S2_COOKIE_SSM: props.ssmPaths?.espnS2Cookie,
      DISCORD_WEBHOOK_SSM: props.ssmPaths?.discordWebhook,
      AWS_DYNAMO_DB_TABLE_NAME: this.dynamoTable.tableName,
      AWS_SNS_TOPIC_ARN: this.snsTopic?.topicArn,
    };
    this.lambdaArchitecture =
      props.lambdaArchitecture ?? lambda.Architecture.ARM_64;
    this.lambdaFunction = new NodejsFunction(this, "api", {
      runtime: lambda.Runtime.NODEJS_14_X,
      memorySize: props.memorySize ?? 128,
      timeout: props.timeout ?? Duration.seconds(10),
      architecture: this.lambdaArchitecture,
      handler: "main",
      // entry: "src/fantasy-hockey-notifier.ts",
      bundling: {
        sourceMap: true,
      },
    });
    // Add env vars to Lambda function
    for (const key in envVars) {
      const value = envVars[key];
      if (value !== undefined) this.lambdaFunction.addEnvironment(key, value);
    }

    this.dynamoTable.grantReadWriteData(this.lambdaFunction);
    this.eventRule.addTarget(
      new eventsTargets.LambdaFunction(this.lambdaFunction)
    );

    if (props.ssmPaths) {
      for (const key in props.ssmPaths) {
        const value = props.ssmPaths[key as keyof FantasyHockeyEnvVars];
        if (value !== undefined) {
          this.lambdaFunction.addToRolePolicy(
            new statement.Ssm()
              .toDescribeParameters()
              .toGetParameters()
              .toGetParameter()
              .toGetParameterHistory()
              .onParameter(
                value.substring(1),
                Aws.ACCOUNT_ID,
                Aws.REGION,
                Aws.PARTITION
              )
          );
        }
      }
    }
    // Grant decrypt permission to Lambda for the KMS keys used for
    // encrypting the SSM parameters and/or Dynamo DB table
    if ((props.ssmPaths || props.dynamoTable) && props.kmsKeys) {
      props.kmsKeys.forEach((key) => key.grantDecrypt(this.lambdaFunction));
    }

    if (this.snsTopic) {
      this.snsTopic.grantPublish(this.lambdaFunction);
    }
  }
}
