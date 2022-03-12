const { awscdk, TextFile, Task } = require("projen");
const { NodePackageManager } = require("projen/lib/javascript");
const projectName = "fantasy-hockey-notifier-cdk";
const repositoryUrl = `https://github.com/ftalburt/${projectName}.git`;

const project = new awscdk.AwsCdkConstructLibrary({
  author: "Forrest Talburt",
  cdkVersion: "2.1.0",
  defaultReleaseBranch: "main",
  name: projectName,
  majorVersion: 1,
  githubOptions: {
    pullRequestLintOptions: {
      semanticTitleOptions: { types: ["feat", "fix", "chore", "ci", "docs"] },
    },
  },
  keywords: ["lambda", "aws-lambda", "espn", "nhl", "fantasy-hockey", "cdk"],
  codeCov: true,
  releaseFailureIssue: true,
  workflowNodeVersion: "14.x",
  repositoryUrl: repositoryUrl,
  homepage: `${repositoryUrl}#readme`,
  cdkVersionPinning: false,
  prettier: true,
  autoApproveOptions: {
    allowedUsernames: ["ftalburt"],
  },
  depsUpgrade: true,
  depsUpgradeOptions: {
    ignoreProjen: false,
    workflowOptions: {
      labels: ["auto-approve"],
    },
  },
  autoApproveUpgrades: true,
  autoApproveProjenUpgrades: true,
  disableTsconfig: false,
  license: "MIT",
  // Required by Superagent
  minNodeVersion: "14.0.0",
  bundledDeps: [
    "@aws-sdk/client-dynamodb",
    "@aws-sdk/client-sns",
    "@aws-sdk/client-ssm",
    "dotenv",
    "source-map-support",
    "superagent",
  ],
  devDeps: ["@types/superagent", "ts-node", "esbuild"],
  deps: ["cdk-iam-floyd"],
  packageManager: NodePackageManager.NPM,
  description:
    "AWS CDK construct to send notifications for adds, drops, and trades in an ESPN Fantasy Hockey league",
  publishToPypi: {
    distName: "fantasy-hockey-notifier-cdk",
    module: "fantasy_hockey_notifier_cdk",
  },
  // Disable Nuget publishing since not all sub-modules support it
  // publishToNuget: {
  //   dotNetNamespace: "Ftalburt.CDK",
  //   packageId: "Ftalburt.CDK.FantasyHockeyNotifierCdk",
  // },
});
project.setScript("start", "ts-node --project tsconfig.dev.json src/main.ts");
project.files.push(new TextFile(project, ".nvmrc", { lines: ["14", ""] }));
// Exclude local .env file and local file for recording last run date
project.gitignore.exclude(".env", ".lastrun");
project.npmignore.exclude(".env", ".lastrun");
project.synth();
