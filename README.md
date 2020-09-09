# Fantasy Hockey Notifier

> Send notifications for adds/drops in an ESPN Fantasy Hockey league; designed to be used with AWS Lambda

This application checks for and sends notifications about adds/drops in an ESPN Fantasy Hockey league. All ESPN APIs used are unofficial and undocumented, thus this application may break at some point in the future if ESPN changes the response schema for any of the endpoints. The codebase supports local execution, along with deployment to AWS using [Serverless Framework](https://www.serverless.com/).

## Local Execution

### Prerequisites for Local Execution

* Node.js 12 or later
* See the [Environment Variables](#environment-variables) section for a list of required and optional variables that should be exported in the shell or set in the .env file
* If using any of the environment variables starting with `AWS_`, you must configure AWS credentials via a local credentials file or environment variables. See the [AWS documentation](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html) for details.

### Shell Commands for Local Execution

```sh
npm ci
npm start
```

## AWS Deployment

### Prerequisites for AWS Deployment

* Node.js 12 or later
* You must configure AWS credentials via a local credentials file or environment variables. See the [AWS documentation](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html) for details.
* The AWS account used for deployment must have all permissions specified by [aws-permissions.json](aws-permissions.json)
* You must configure AWS SSM parameters for all [required environment variables](#required-variables). You should also set `DISCORD_WEBHOOK` for any environment that should send discord notifications. The expected path for the SSM parameters is `/fantasy-hockey-notifier/<env>/<env-var-name>`. All parameters except `FH_SEASON` should be configured as SecureStrings. See the [AWS SSM Parameter Store documentation](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html) for more details.

### Shell Commands for AWS Deployment

Deploy to dev environment:

```sh
npm ci
npm run deploy-dev
```

Deploy to prod environment:

```sh
npm ci
npm run deploy-prod
```

## Environment Variables

### Required Variables

`FH_SEASON`: The year of the fantasy hockey season (i.e. `2020` for the 2019-2020 season)

`FH_LEAGUE_ID`: The ID of the ESPN fantasy hockey league (this is displayed in the URL when you go to the `My Team` page)

`ESPN_S2_COOKIE`: The value of your `espn_s2` cookie to be used for authentication (you can find this by examining stored cookies for espn.com using the Chrome or Firefox developer tools)

### Optional Variables

`AWS_SNS_TOPIC_ARN`: The ARN of an existing AWS SNS topic

`AWS_DYNAMO_DB_TABLE_NAME`: The name of an existing Dynamo DB table to use for storing last run dates (takes priority over `LAST_RUN_FILE_PATH` if both are set)

`DISCORD_WEBHOOK`: A Discord webhook URL

`LAST_RUN_FILE_PATH`: A local file path to use for storing last run dates (defaults to `.lastrun`)

`EARLIEST_DATE`: A unix timestamp in milliseconds to use as the earliest date when looking up transactions

`LATEST_DATE`: A unix timestamp in milliseconds to use as the latest date when looking up transactions

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details
