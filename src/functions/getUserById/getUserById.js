//@ts-check
const {
  DynamoDBClient
} = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  GetCommand
} = require('@aws-sdk/lib-dynamodb');

const responseFactory = require('../../utils/response');
const log = require('lambda-log');
const lodash = require('lodash');
const {
  schemaUserId
} = require('../../utils/schemas/user');

const getUser = async (userId) => {
  const dynamoDbClient = new DynamoDBClient({});
  const dynamodbDocumentClient = DynamoDBDocumentClient.from(dynamoDbClient);

  try {
    const result = await dynamodbDocumentClient.send(
      new GetCommand({
        TableName: process.env.USERS_TABLE,
        Key: {
          userId
        },
      })
    );

    return result.Item;
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
    const resultDynamoDB = await getUser(params.userId);
    if (!resultDynamoDB) return responseFactory.error('usertNotFound');
    return responseFactory.response(resultDynamoDB);
  } catch (error) {
    if (error.$metadata.httpStatusCode == 400 && !error.Attributes) {
      return responseFactory.error('userNotFound');
    }
    log.error(error);
    return responseFactory.error(error);
  }
};