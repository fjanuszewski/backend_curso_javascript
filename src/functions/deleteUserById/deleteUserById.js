//@ts-check
const responseFactory = require('../../utils/response');
const log = require('lambda-log');
const lodash = require('lodash');
const { schemaUserId } = require('../../utils/schemas/user');

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const deleteUser = async (userId) => {
  const dynamoDbClient = new DynamoDBClient({});
  const dynamodbDocumentClient = DynamoDBDocumentClient.from(dynamoDbClient);

  try {
    const result = await dynamodbDocumentClient.send(
      new DeleteCommand({
        TableName: process.env.USERS_TABLE,
        Key: { userId },
        ConditionExpression: 'attribute_exists(userId)',
      })
    );
    return result;
  } catch (error) {
    throw error;
  }
};

exports.Handler = async (event) => {
  log.options.debug = process.env.DEBUG == 'true';
  log.info('START', event);
  try {
    if (lodash.isEmpty(event) || lodash.isEmpty(event.pathParameters)) {
      return responseFactory.error('emptyParams');
    }
    const params = event.pathParameters;
    const resultJoi = schemaUserId.validate(params.userId);
    if (resultJoi.error) {
      return responseFactory.error('invalidParams');
    }
    const resultDynamoDB = await deleteUser(params.userId);
    if (resultDynamoDB.$metadata.httpStatusCode == 400 && !resultDynamoDB.Attributes) {
      return responseFactory.error('userNotFound');
    }
    return responseFactory.response(resultDynamoDB);
  } catch (error) {
    if (error.$metadata.httpStatusCode == 400 && !error.Attributes) {
      return responseFactory.error('userNotFound');
    }
    log.error(error);
    return responseFactory.error(error);
  }
};
