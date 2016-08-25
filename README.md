# Ingestion
An app to expose select content to our 3rd-party partners.

## Installation

1. Clone this repo
2. `cd` into the repo
3. Run `npm i`

The app, and all of its dependencies will now have been installed.

## Running

To run the app, run `npm run start` from your CLI. The app will now be accessible at [localhost:3000](http://localhost:3000). The port number can be set by creating a .env file in the root folder of the project and add `PORT[NUMBER]` as an entry.

## Aspects
This app performs a number of functions. It

1. Surfaces FT content to 3rd-party partners (that are otherwise inaccessible) through an RSS feed.
2. Allows FT staff members to control which articles are visible
3. Checks for, and downloads, any content exposed in an RSS feed that our partners have created for us.

## Configuration

### Environment Variables
Aspects of Ingestion can be configured with environment variables. These can be inluded using a [dotenv file](https://www.npmjs.com/package/dotenv), or as normal system variales.

***Note**: A .env file is not required to run the app, but some of the variables are.*

#### CAPI_KEY
***required***

An FT Content API key to enable access to FT Articles. If you don't have an API key, you should be able to get one by talking to someone on the UPP team.

#### BASIC_AUTH_USER
The RSS feed can be restricted with basic authentication. This value is the username that a user will have to enter to access the service.

#### BASIC_AUTH_PASS
This is the password that a user will have to enter (along with the username) to access the RSS feed, if basic authentication is enabled

#### SERVER_ROOT
***required***

This is the url of the server that the app is running on. This address is used when generating the links for the RSS feed that is exposed to the 3rd partys. 

#### DEBUG
A comma-seperated list of values that determine which logs to output and which to not.

#### ENVIRONMENT
If 'dev', Ingestion will not force HTTPS, otherwise all HTTP connections will be switched over to HTTPS

#### AWS_ACCESS_KEY_ID
***required***

An AWS access key ID with permissions for S3 and DynamoDB

#### AWS_SECRET_ACCESS_KEY
***required***

The key for the ID stored as AWS_ACCESS_KEY_ID

#### AUDIO_RSS_ENDPOINT
The URL for the RSS feed that exposes audio content we can consume from our partners

#### AWS_AUDIO_BUCKET
The name of the AWS S3 bucket that audio files acquired from our partners will be saved to.

#### SL_MEDIA_FORMAT
The file format of the 3rd party audio files that we absorb

#### AWS_DATA_TABLE
***required***

The name of the DynamoDB database where the UUIDs of exposed articles are stored

#### AWS_REGION
***required***

The region of the AWS services that we're using.

#### AWS_AUDIT_TABLE
***required***

The name of the DynamoDB database where the logs of actions and access to Ingestion and its content is stored

#### SENTRY_DSN
The DSN for Sentry (for alerts when things go wrong)