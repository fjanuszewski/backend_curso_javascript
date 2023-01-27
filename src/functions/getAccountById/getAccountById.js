//@ts-check
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');

const responseFactory = require('../../utils/response');
const log = require('lambda-log');
const lodash = require('lodash');
const { schemaAccountId } = require('../../utils/schemas/account');

const getAccount = async (accountId) => {
  const dynamoDbClient = new DynamoDBClient({});
  const dynamodbDocumentClient = DynamoDBDocumentClient.from(dynamoDbClient);

  try {
    const result = await dynamodbDocumentClient.send(
      new GetCommand({
        TableName: process.env.ACCOUNTS_TABLE,
        Key: { accountId },
      })
    );

    return result.Item;
  } catch (error) {
    throw error;
  }
};

exports.Handler = async (event) => {
  log.options.debug = process.env.DEBUG == 'true';
  log.debug('START', event);
  try {
    if (lodash.isEmpty(event) || lodash.isEmpty(event.pathParameters)) {
      return responseFactory.error('emptyParams');
    }
    const params = event.pathParameters;
    const resultJoi = schemaAccountId.validate(Number(params.accountId));
    if (resultJoi.error) {
      return responseFactory.error('invalidParams');
    }
    const resultDynamoDB = await getAccount(Number(params.accountId));
    if (!resultDynamoDB) return responseFactory.error('accountNotFound');
    return responseFactory.response(resultDynamoDB);
  } catch (error) {
    log.error(error);
    return responseFactory.error(error);
  }
};
