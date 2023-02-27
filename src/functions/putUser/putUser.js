//@ts-check
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const responseFactory = require('../../utils/response');
const log = require('lambda-log');
const lodash = require('lodash');
const { schemaUserId } = require('../../utils/schemas/user');

const putUser = async (user) => {
  try {
    const dynamoDbClient = new DynamoDBClient({});
    const dynamodbDocumentClient = DynamoDBDocumentClient.from(dynamoDbClient);
    const result = await dynamodbDocumentClient.send(
      new PutCommand({
        TableName: process.env.USERS_TABLE,
        Item: user,
        ConditionExpression: 'attribute_exists(userId)',
      })
    );
    return result;
  } catch (error) {
    if (error.$metadata.httpStatusCode < 500) return error;
    throw error;
  }
};

exports.Handler = async (event) => {
  log.options.debug = process.env.DEBUG == 'true';
  log.info('START', event);
  try {
    if (lodash.isEmpty(event) || lodash.isEmpty(event.body)) {
      return responseFactory.error('emptyParams');
    }
    const data = JSON.parse(event.body);
    const resultDynamoDB = await putUser(data);
    if (resultDynamoDB.$metadata.httpStatusCode == 400) {
      return responseFactory.error('userNotFound');
    }
    return responseFactory.response(resultDynamoDB);
  } catch (error) {
    log.error(error);
    return responseFactory.error(error);
  }
};
