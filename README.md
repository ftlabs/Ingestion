# Ingestion
An app to expose select content to our 3rd-party partners.

⚠️⚠️⚠️ **This project has been shut down and is no longer supported by FT Labs** ⚠️⚠️⚠️

## Installation

1. Clone this repo
2. `cd` into the repo
3. Run `npm i`

The app, and all of its dependencies will now have been installed.

## Running

To run the app, config the environment values (see below), run `npm run start` from your CLI. The app will now be accessible at [localhost:3000](http://localhost:3000), where 3000 is the default which can be overridden by specifying the environment value PORT.

## Aspects
This app performs a number of functions. It

1. Surfaces FT content to 3rd-party partners (that are otherwise inaccessible) through an RSS feed.
2. Allows FT staff members to control which articles are visible
3. Checks for, and downloads, any content exposed in an RSS feed that our partners have created for us.

## Configuration

### Environment Variables
Aspects of Ingestion can be configured with environment variables. These can be included using a [dotenv file](https://www.npmjs.com/package/dotenv), or as normal system variables.

***Note**: A .env file is not required to run the app, but some of the variables are.*

### Required Variables

##### CAPI_KEY
An FT Content API key to enable access to FT Articles. If you don't have an API key, you should be able to get one by talking to someone on the UPP team.

##### SERVER_ROOT
This is the url of the server that the app is running on. This address is used when generating the links for the RSS feed that is exposed to the 3rd partys. 

##### AWS_ACCESS_KEY_ID
An AWS access key ID with permissions for S3 and DynamoDB

##### AWS_SECRET_ACCESS_KEY
The key for the ID stored as AWS_ACCESS_KEY_ID

##### AWS_DATA_TABLE
The name of the DynamoDB database where the UUIDs of exposed articles are stored

##### AWS_AUDIT_TABLE
The name of the DynamoDB database where the logs of actions and access to Ingestion and its content is stored

### Optional Variables

##### BASIC_AUTH_USER
The RSS feed can be restricted with basic authentication. This value is the username that a user will have to enter to access the service.

##### BASIC_AUTH_PASS
This is the password that a user will have to enter (along with the username) to access the RSS feed, if basic authentication is enabled

##### DEBUG
A comma-seperated list of values that determine which logs to output and which to not.

##### ENVIRONMENT
If 'dev', Ingestion will not force HTTPS, otherwise all HTTP connections will be switched over to HTTPS

##### AUDIO_RSS_ENDPOINT
The URL for the RSS feed that exposes audio content we can consume from our partners

##### AWS_AUDIO_BUCKET
The name of the AWS S3 bucket that audio files acquired from our partners will be saved to.

##### SL_MEDIA_FORMAT
The file format of the 3rd party audio files that we absorb

##### AWS_REGION
The region of the AWS services that we're using. Defaults to 'us-west-2' if no option is passed.

##### SENTRY_DSN
The DSN for Sentry (for alerts when things go wrong)

##### ADMIN_URL
The url of the Admin page listing all the selected pages.

##### MAIL_RECIPIENTS
CSV of recipients' email addresses

##### MAIL_POST_AUTH_TOKEN

##### MAIL_FROM_SUBDOMAIN
the permitted subdomain for the 'from' email, ties in with auth token

##### MAIL_FROM_PREFIX
=audio-article-ingestion

##### MAIL_FROM_NAME
=Audio Article Ingestion
