const { awscdk, TextFile, Task } = require("projen");
const { NodePackageManager } = require("projen/lib/javascript");
const projectName = "fantasy-hockey-notifier-cdk";
const repositoryUrl = `https://github.com/ftalburt/${projectName}.git`;

const project = new awscdk.AwsCdkConstructLibrary({
  author: "Forrest Talburt",
  cdkVersion: "2.251.0",
  constructsVersion: "10.5.0",
  projenVersion: "0.99.52",
  defaultReleaseBranch: "main",
  name: projectName,
  githubOptions: {
    pullRequestLintOptions: {
      semanticTitleOptions: { types: ["feat", "fix", "chore", "ci", "docs"] },
    },
  },
  keywords: ["lambda", "aws-lambda", "espn", "nhl", "fantasy-hockey", "cdk"],
  codeCov: true,
  releaseFailureIssue: true,
  workflowNodeVersion: "22.x",
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
  minNodeVersion: "20.0.0",
  bundledDeps: [
    "@aws-sdk/client-dynamodb",
    "@aws-sdk/client-sns",
    "@aws-sdk/client-ssm",
    "cdk-iam-floyd",
    "dotenv",
    "source-map-support",
    "superagent",
  ],
  devDeps: ["@types/superagent", "ts-node", "esbuild"],
  deps: [],
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
project.files.push(new TextFile(project, ".nvmrc", { lines: ["22", ""] }));
// Workaround for npm bug with bundledDependencies + nested bundles in
// aws-cdk-lib (>=2.238.0) that breaks `npm ci`/`npm install` otherwise.
project.files.push(
  new TextFile(project, ".npmrc", { lines: ["legacy-peer-deps=true", ""] })
);
// Exclude local .env file and local file for recording last run date
project.gitignore.exclude(".env", ".lastrun");
project.npmignore.exclude(".env", ".lastrun");
project.synth();
