//@ts-check
const responseFactory = require('../../utils/response');
const log = require('lambda-log');
const lodash = require('lodash');
const { schemaAccountId } = require('../../utils/schemas/account');

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const deleteAccount = async (accountId) => {
  const dynamoDbClient = new DynamoDBClient({});
  const dynamodbDocumentClient = DynamoDBDocumentClient.from(dynamoDbClient);

  try {
    const result = await dynamodbDocumentClient.send(
      new DeleteCommand({
        TableName: process.env.USERS_TABLE,
        Key: { accountId },
        ConditionExpression: 'attribute_exists(accountId)',
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
    const resultJoi = schemaAccountId.validate(Number(params.accountId));
    if (resultJoi.error) {
      return responseFactory.error('invalidParams');
    }
    const resultDynamoDB = await deleteAccount(Number(params.accountId));
    if (resultDynamoDB.$metadata.httpStatusCode == 400 && !resultDynamoDB.Attributes) {
      return responseFactory.error('accountNotFound');
    }
    return responseFactory.response(resultDynamoDB);
  } catch (error) {
    log.error(error);
    return responseFactory.error(error);
  }
};
