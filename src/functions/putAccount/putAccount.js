//@ts-check
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const responseFactory = require('../../utils/response');
const log = require('lambda-log');
const lodash = require('lodash');
const { schemaAccountId } = require('../../utils/schemas/account');

const putAccount = async (account) => {
  try {
    const dynamoDbClient = new DynamoDBClient({});
    const dynamodbDocumentClient = DynamoDBDocumentClient.from(dynamoDbClient);
    const result = await dynamodbDocumentClient.send(
      new PutCommand({
        TableName: process.env.ACCOUNTS_TABLE,
        Item: account,
        ConditionExpression: 'attribute_exists(accountId)',
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
  log.debug('START', event);
  try {
    if (lodash.isEmpty(event) || lodash.isEmpty(event.body) || lodash.isEmpty(event.pathParameters)) {
      return responseFactory.error('emptyParams');
    }
    const params = event.pathParameters;
    const resultJoi = schemaAccountId.validate(Number(params.accountId));
    if (resultJoi.error) {
      return responseFactory.error('invalidParams');
    }
    const data = JSON.parse(event.body);
    data.accountId = Number(params.accountId);
    const resultDynamoDB = await putAccount(data);
    if (resultDynamoDB.$metadata.httpStatusCode == 400) {
      return responseFactory.error('accountNotFound');
    }
    return responseFactory.response(resultDynamoDB);
  } catch (error) {
    log.error(error);
    return responseFactory.error(error);
  }
};
