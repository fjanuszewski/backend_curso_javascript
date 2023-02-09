//@ts-check
const responseFactory = require('../../utils/response');
const log = require('lambda-log');
const lodash = require('lodash');

const AWSXRay = require('aws-xray-sdk');

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const dynamoDbClient = new DynamoDBClient({});
AWSXRay.captureAWSv3Client(dynamoDbClient);
const dynamodbDocumentClient = DynamoDBDocumentClient.from(dynamoDbClient);
AWSXRay.captureAWSv3Client(dynamodbDocumentClient);

const putAccount = async (account) => {
  try {
    const result = await dynamodbDocumentClient.send(
      new PutCommand({
        TableName: process.env.USERS_TABLE,
        Item: account,
        ConditionExpression: 'attribute_not_exists(accountId)',
      })
    );
    return result;
  } catch (error) {
    log.error(error);
    if (error.$metadata.httpStatusCode < 500) return error;
    throw error;
  }
};

exports.Handler = async (event, context) => {
  log.options.debug = process.env.DEBUG == 'true';
  log.info('START', event);
  try {
    if (lodash.isEmpty(event) || lodash.isEmpty(event.body)) {
      return responseFactory.error('emptyParams');
    }
    const body = JSON.parse(event.body);

    // AWSXRay.captureFunc('annotations', function(subsegment) {
    //   subsegment.addAnnotation('AccountId', body.accountId);
    // });

    const resultDynamoDB = await putAccount(body);
    if (resultDynamoDB.$metadata.httpStatusCode == 400) {
      return responseFactory.error('accountAlreadyExist');
    }
    return responseFactory.response(resultDynamoDB);
  } catch (error) {
    log.error(error);
    return responseFactory.error(error);
  }
};
