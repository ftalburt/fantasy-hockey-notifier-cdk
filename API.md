# API Reference <a name="API Reference" id="api-reference"></a>

## Constructs <a name="Constructs" id="Constructs"></a>

### FantasyHockeyNotifier <a name="FantasyHockeyNotifier" id="fantasy-hockey-notifier-cdk.FantasyHockeyNotifier"></a>

A Lambda function to send notifications for transactions in an ESPN Fantasy Hockey league.

#### Initializers <a name="Initializers" id="fantasy-hockey-notifier-cdk.FantasyHockeyNotifier.Initializer"></a>

```typescript
import { FantasyHockeyNotifier } from 'fantasy-hockey-notifier-cdk'

new FantasyHockeyNotifier(scope: Construct, id: string, props: FantasyHockeyNotifierProps)
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#fantasy-hockey-notifier-cdk.FantasyHockeyNotifier.Initializer.parameter.scope">scope</a></code> | <code>constructs.Construct</code> | Scope. |
| <code><a href="#fantasy-hockey-notifier-cdk.FantasyHockeyNotifier.Initializer.parameter.id">id</a></code> | <code>string</code> | ID. |
| <code><a href="#fantasy-hockey-notifier-cdk.FantasyHockeyNotifier.Initializer.parameter.props">props</a></code> | <code><a href="#fantasy-hockey-notifier-cdk.FantasyHockeyNotifierProps">FantasyHockeyNotifierProps</a></code> | Construct Properties. |

---

##### `scope`<sup>Required</sup> <a name="scope" id="fantasy-hockey-notifier-cdk.FantasyHockeyNotifier.Initializer.parameter.scope"></a>

- *Type:* constructs.Construct

Scope.

---

##### `id`<sup>Required</sup> <a name="id" id="fantasy-hockey-notifier-cdk.FantasyHockeyNotifier.Initializer.parameter.id"></a>

- *Type:* string

ID.

---

##### `props`<sup>Required</sup> <a name="props" id="fantasy-hockey-notifier-cdk.FantasyHockeyNotifier.Initializer.parameter.props"></a>

- *Type:* <a href="#fantasy-hockey-notifier-cdk.FantasyHockeyNotifierProps">FantasyHockeyNotifierProps</a>

Construct Properties.

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#fantasy-hockey-notifier-cdk.FantasyHockeyNotifier.toString">toString</a></code> | Returns a string representation of this construct. |

---

##### `toString` <a name="toString" id="fantasy-hockey-notifier-cdk.FantasyHockeyNotifier.toString"></a>

```typescript
public toString(): string
```

Returns a string representation of this construct.

#### Static Functions <a name="Static Functions" id="Static Functions"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#fantasy-hockey-notifier-cdk.FantasyHockeyNotifier.isConstruct">isConstruct</a></code> | Checks if `x` is a construct. |

---

##### ~~`isConstruct`~~ <a name="isConstruct" id="fantasy-hockey-notifier-cdk.FantasyHockeyNotifier.isConstruct"></a>

```typescript
import { FantasyHockeyNotifier } from 'fantasy-hockey-notifier-cdk'

FantasyHockeyNotifier.isConstruct(x: any)
```

Checks if `x` is a construct.

###### `x`<sup>Required</sup> <a name="x" id="fantasy-hockey-notifier-cdk.FantasyHockeyNotifier.isConstruct.parameter.x"></a>

- *Type:* any

Any object.

---

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#fantasy-hockey-notifier-cdk.FantasyHockeyNotifier.property.node">node</a></code> | <code>constructs.Node</code> | The tree node. |
| <code><a href="#fantasy-hockey-notifier-cdk.FantasyHockeyNotifier.property.dynamoTable">dynamoTable</a></code> | <code>aws-cdk-lib.aws_dynamodb.ITable</code> | The DynamoDB Table used for storing state. |
| <code><a href="#fantasy-hockey-notifier-cdk.FantasyHockeyNotifier.property.dynamoTableRemovalPolicy">dynamoTableRemovalPolicy</a></code> | <code>aws-cdk-lib.RemovalPolicy</code> | The removal policy for the DynamoDB table. |
| <code><a href="#fantasy-hockey-notifier-cdk.FantasyHockeyNotifier.property.eventRule">eventRule</a></code> | <code>aws-cdk-lib.aws_events.Rule</code> | The event rule for the Lambda function. |
| <code><a href="#fantasy-hockey-notifier-cdk.FantasyHockeyNotifier.property.lambdaArchitecture">lambdaArchitecture</a></code> | <code>aws-cdk-lib.aws_lambda.Architecture</code> | The system architecture for the Lambda function. |
| <code><a href="#fantasy-hockey-notifier-cdk.FantasyHockeyNotifier.property.lambdaFunction">lambdaFunction</a></code> | <code>aws-cdk-lib.aws_lambda_nodejs.NodejsFunction</code> | The Lambda function. |
| <code><a href="#fantasy-hockey-notifier-cdk.FantasyHockeyNotifier.property.snsTopic">snsTopic</a></code> | <code>aws-cdk-lib.aws_sns.ITopic</code> | The SNS topic that recieves notifications about league events. |

---

##### `node`<sup>Required</sup> <a name="node" id="fantasy-hockey-notifier-cdk.FantasyHockeyNotifier.property.node"></a>

```typescript
public readonly node: Node;
```

- *Type:* constructs.Node

The tree node.

---

##### `dynamoTable`<sup>Required</sup> <a name="dynamoTable" id="fantasy-hockey-notifier-cdk.FantasyHockeyNotifier.property.dynamoTable"></a>

```typescript
public readonly dynamoTable: ITable;
```

- *Type:* aws-cdk-lib.aws_dynamodb.ITable

The DynamoDB Table used for storing state.

---

##### `dynamoTableRemovalPolicy`<sup>Required</sup> <a name="dynamoTableRemovalPolicy" id="fantasy-hockey-notifier-cdk.FantasyHockeyNotifier.property.dynamoTableRemovalPolicy"></a>

```typescript
public readonly dynamoTableRemovalPolicy: RemovalPolicy;
```

- *Type:* aws-cdk-lib.RemovalPolicy

The removal policy for the DynamoDB table.

---

##### `eventRule`<sup>Required</sup> <a name="eventRule" id="fantasy-hockey-notifier-cdk.FantasyHockeyNotifier.property.eventRule"></a>

```typescript
public readonly eventRule: Rule;
```

- *Type:* aws-cdk-lib.aws_events.Rule

The event rule for the Lambda function.

---

##### `lambdaArchitecture`<sup>Required</sup> <a name="lambdaArchitecture" id="fantasy-hockey-notifier-cdk.FantasyHockeyNotifier.property.lambdaArchitecture"></a>

```typescript
public readonly lambdaArchitecture: Architecture;
```

- *Type:* aws-cdk-lib.aws_lambda.Architecture

The system architecture for the Lambda function.

---

##### `lambdaFunction`<sup>Required</sup> <a name="lambdaFunction" id="fantasy-hockey-notifier-cdk.FantasyHockeyNotifier.property.lambdaFunction"></a>

```typescript
public readonly lambdaFunction: NodejsFunction;
```

- *Type:* aws-cdk-lib.aws_lambda_nodejs.NodejsFunction

The Lambda function.

---

##### `snsTopic`<sup>Optional</sup> <a name="snsTopic" id="fantasy-hockey-notifier-cdk.FantasyHockeyNotifier.property.snsTopic"></a>

```typescript
public readonly snsTopic: ITopic;
```

- *Type:* aws-cdk-lib.aws_sns.ITopic

The SNS topic that recieves notifications about league events.

---


## Structs <a name="Structs" id="Structs"></a>

### FantasyHockeyEnvVars <a name="FantasyHockeyEnvVars" id="fantasy-hockey-notifier-cdk.FantasyHockeyEnvVars"></a>

Environment variables for the Lambda function.

#### Initializer <a name="Initializer" id="fantasy-hockey-notifier-cdk.FantasyHockeyEnvVars.Initializer"></a>

```typescript
import { FantasyHockeyEnvVars } from 'fantasy-hockey-notifier-cdk'

const fantasyHockeyEnvVars: FantasyHockeyEnvVars = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#fantasy-hockey-notifier-cdk.FantasyHockeyEnvVars.property.discordWebhook">discordWebhook</a></code> | <code>string</code> | Value for DISCORD_WEBHOOK. |
| <code><a href="#fantasy-hockey-notifier-cdk.FantasyHockeyEnvVars.property.espnS2Cookie">espnS2Cookie</a></code> | <code>string</code> | Value for ESPN_S2_COOKIE. |
| <code><a href="#fantasy-hockey-notifier-cdk.FantasyHockeyEnvVars.property.fhLeagueId">fhLeagueId</a></code> | <code>string</code> | Value for FH_LEAGUE_ID. |
| <code><a href="#fantasy-hockey-notifier-cdk.FantasyHockeyEnvVars.property.fhSeason">fhSeason</a></code> | <code>string</code> | Value for FH_SEASON. |

---

##### `discordWebhook`<sup>Optional</sup> <a name="discordWebhook" id="fantasy-hockey-notifier-cdk.FantasyHockeyEnvVars.property.discordWebhook"></a>

```typescript
public readonly discordWebhook: string;
```

- *Type:* string

Value for DISCORD_WEBHOOK.

---

##### `espnS2Cookie`<sup>Optional</sup> <a name="espnS2Cookie" id="fantasy-hockey-notifier-cdk.FantasyHockeyEnvVars.property.espnS2Cookie"></a>

```typescript
public readonly espnS2Cookie: string;
```

- *Type:* string

Value for ESPN_S2_COOKIE.

This is a required parameter and must be set via SSM or clear text env vars

---

##### `fhLeagueId`<sup>Optional</sup> <a name="fhLeagueId" id="fantasy-hockey-notifier-cdk.FantasyHockeyEnvVars.property.fhLeagueId"></a>

```typescript
public readonly fhLeagueId: string;
```

- *Type:* string

Value for FH_LEAGUE_ID.

This is a required parameter and must be set via SSM or clear text env vars

---

##### `fhSeason`<sup>Optional</sup> <a name="fhSeason" id="fantasy-hockey-notifier-cdk.FantasyHockeyEnvVars.property.fhSeason"></a>

```typescript
public readonly fhSeason: string;
```

- *Type:* string

Value for FH_SEASON.

This is a required parameter and must be set via SSM or clear text env vars

---

### FantasyHockeyNotifierProps <a name="FantasyHockeyNotifierProps" id="fantasy-hockey-notifier-cdk.FantasyHockeyNotifierProps"></a>

Properties for a FantasyHockeyNotifier.

#### Initializer <a name="Initializer" id="fantasy-hockey-notifier-cdk.FantasyHockeyNotifierProps.Initializer"></a>

```typescript
import { FantasyHockeyNotifierProps } from 'fantasy-hockey-notifier-cdk'

const fantasyHockeyNotifierProps: FantasyHockeyNotifierProps = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#fantasy-hockey-notifier-cdk.FantasyHockeyNotifierProps.property.dynamoTable">dynamoTable</a></code> | <code>aws-cdk-lib.aws_dynamodb.ITable</code> | An existing DynamoDB Table to use. |
| <code><a href="#fantasy-hockey-notifier-cdk.FantasyHockeyNotifierProps.property.dynamoTableRemovalPolicy">dynamoTableRemovalPolicy</a></code> | <code>aws-cdk-lib.RemovalPolicy</code> | The removal policy for the DynamoDB table. |
| <code><a href="#fantasy-hockey-notifier-cdk.FantasyHockeyNotifierProps.property.envVarValues">envVarValues</a></code> | <code><a href="#fantasy-hockey-notifier-cdk.FantasyHockeyEnvVars">FantasyHockeyEnvVars</a></code> | Values for the env vars. |
| <code><a href="#fantasy-hockey-notifier-cdk.FantasyHockeyNotifierProps.property.kmsKeys">kmsKeys</a></code> | <code>aws-cdk-lib.aws_kms.IKey[]</code> | Existing KMS keys that are used to encrypt the SSM parameters. |
| <code><a href="#fantasy-hockey-notifier-cdk.FantasyHockeyNotifierProps.property.lambdaArchitecture">lambdaArchitecture</a></code> | <code>aws-cdk-lib.aws_lambda.Architecture</code> | The system architecture to use for the lambda function. |
| <code><a href="#fantasy-hockey-notifier-cdk.FantasyHockeyNotifierProps.property.lambdaSchedule">lambdaSchedule</a></code> | <code>aws-cdk-lib.aws_events.Schedule</code> | The schedule to use for the Lambda function. |
| <code><a href="#fantasy-hockey-notifier-cdk.FantasyHockeyNotifierProps.property.memorySize">memorySize</a></code> | <code>number</code> | The amount of memory, in MB, to allocate to the Lambda function. |
| <code><a href="#fantasy-hockey-notifier-cdk.FantasyHockeyNotifierProps.property.snsTopic">snsTopic</a></code> | <code>aws-cdk-lib.aws_sns.ITopic</code> | An existing SNS topic to send league event notifications to. |
| <code><a href="#fantasy-hockey-notifier-cdk.FantasyHockeyNotifierProps.property.ssmPaths">ssmPaths</a></code> | <code><a href="#fantasy-hockey-notifier-cdk.FantasyHockeyEnvVars">FantasyHockeyEnvVars</a></code> | Paths for existing SSM parmeters with values for the env vars. |
| <code><a href="#fantasy-hockey-notifier-cdk.FantasyHockeyNotifierProps.property.timeout">timeout</a></code> | <code>aws-cdk-lib.Duration</code> | The function execution time after which Lambda terminates the function. |

---

##### `dynamoTable`<sup>Optional</sup> <a name="dynamoTable" id="fantasy-hockey-notifier-cdk.FantasyHockeyNotifierProps.property.dynamoTable"></a>

```typescript
public readonly dynamoTable: ITable;
```

- *Type:* aws-cdk-lib.aws_dynamodb.ITable
- *Default:* a new Table will be created

An existing DynamoDB Table to use.

---

##### `dynamoTableRemovalPolicy`<sup>Optional</sup> <a name="dynamoTableRemovalPolicy" id="fantasy-hockey-notifier-cdk.FantasyHockeyNotifierProps.property.dynamoTableRemovalPolicy"></a>

```typescript
public readonly dynamoTableRemovalPolicy: RemovalPolicy;
```

- *Type:* aws-cdk-lib.RemovalPolicy
- *Default:* RemovalPolicy.RETAIN

The removal policy for the DynamoDB table.

---

##### `envVarValues`<sup>Optional</sup> <a name="envVarValues" id="fantasy-hockey-notifier-cdk.FantasyHockeyNotifierProps.property.envVarValues"></a>

```typescript
public readonly envVarValues: FantasyHockeyEnvVars;
```

- *Type:* <a href="#fantasy-hockey-notifier-cdk.FantasyHockeyEnvVars">FantasyHockeyEnvVars</a>

Values for the env vars.

If a value is specifed here and in `ssmPaths`, the value in `ssmPaths` takes prescedence

---

##### `kmsKeys`<sup>Optional</sup> <a name="kmsKeys" id="fantasy-hockey-notifier-cdk.FantasyHockeyNotifierProps.property.kmsKeys"></a>

```typescript
public readonly kmsKeys: IKey[];
```

- *Type:* aws-cdk-lib.aws_kms.IKey[]

Existing KMS keys that are used to encrypt the SSM parameters.

This must be specified to allow Lambda to read SecureString SSM parameteers

---

##### `lambdaArchitecture`<sup>Optional</sup> <a name="lambdaArchitecture" id="fantasy-hockey-notifier-cdk.FantasyHockeyNotifierProps.property.lambdaArchitecture"></a>

```typescript
public readonly lambdaArchitecture: Architecture;
```

- *Type:* aws-cdk-lib.aws_lambda.Architecture
- *Default:* Architecture.ARM_64

The system architecture to use for the lambda function.

---

##### `lambdaSchedule`<sup>Optional</sup> <a name="lambdaSchedule" id="fantasy-hockey-notifier-cdk.FantasyHockeyNotifierProps.property.lambdaSchedule"></a>

```typescript
public readonly lambdaSchedule: Schedule;
```

- *Type:* aws-cdk-lib.aws_events.Schedule
- *Default:* Schedule.rate(Duration.minutes(1))

The schedule to use for the Lambda function.

---

##### `memorySize`<sup>Optional</sup> <a name="memorySize" id="fantasy-hockey-notifier-cdk.FantasyHockeyNotifierProps.property.memorySize"></a>

```typescript
public readonly memorySize: number;
```

- *Type:* number
- *Default:* 128

The amount of memory, in MB, to allocate to the Lambda function.

---

##### `snsTopic`<sup>Optional</sup> <a name="snsTopic" id="fantasy-hockey-notifier-cdk.FantasyHockeyNotifierProps.property.snsTopic"></a>

```typescript
public readonly snsTopic: ITopic;
```

- *Type:* aws-cdk-lib.aws_sns.ITopic

An existing SNS topic to send league event notifications to.

---

##### `ssmPaths`<sup>Optional</sup> <a name="ssmPaths" id="fantasy-hockey-notifier-cdk.FantasyHockeyNotifierProps.property.ssmPaths"></a>

```typescript
public readonly ssmPaths: FantasyHockeyEnvVars;
```

- *Type:* <a href="#fantasy-hockey-notifier-cdk.FantasyHockeyEnvVars">FantasyHockeyEnvVars</a>

Paths for existing SSM parmeters with values for the env vars.

If a value is specifed here and in `envVarValues`, this value takes prescedence

---

##### `timeout`<sup>Optional</sup> <a name="timeout" id="fantasy-hockey-notifier-cdk.FantasyHockeyNotifierProps.property.timeout"></a>

```typescript
public readonly timeout: Duration;
```

- *Type:* aws-cdk-lib.Duration
- *Default:* Duration.seconds(10)

The function execution time after which Lambda terminates the function.

---



