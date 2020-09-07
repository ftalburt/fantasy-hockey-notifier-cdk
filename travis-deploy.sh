#!/bin/sh

if [ "$TRAVIS_BRANCH" = "dev" ]; then
  SERVERLESS_STAGE=dev
fi

if [ "$TRAVIS_BRANCH" = "master" ]; then
  SERVERLESS_STAGE=prod
fi

if [ "$SERVERLESS_STAGE" ]; then
  echo "Running $SERVERLESS_STAGE deploy"
  npm run deploy-$SERVERLESS_STAGE
else
  echo "No deploy stage set"
  exit 1
fi
