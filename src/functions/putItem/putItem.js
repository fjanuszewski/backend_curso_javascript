//@ts-check
const {
  DynamoDBClient
} = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  PutCommand
} = require('@aws-sdk/lib-dynamodb');

const responseFactory = require('../../utils/response');
const log = require('lambda-log');
const lodash = require('lodash');
const {
  schemaItemId
} = require('../../utils/schemas/item');
const AWSXRay = require('aws-xray-sdk');

const putItem = async (item) => {
  try {
    const dynamoDbClient = new DynamoDBClient({});
    AWSXRay.captureAWSv3Client(dynamoDbClient);
    const dynamodbDocumentClient = DynamoDBDocumentClient.from(dynamoDbClient);
    AWSXRay.captureAWSv3Client(dynamodbDocumentClient);
    log.info('PARAMS DYNAMODB', item)
    const result = await dynamodbDocumentClient.send(
      new PutCommand({
        TableName: process.env.ITEMS_TABLE,
        Item: item,
        ConditionExpression: 'attribute_exists(itemId)',
      })
    );
    log.info('RESPUESTA DYNAMODB', result)
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
    const resultDynamoDB = await putItem(data);
    if (resultDynamoDB.$metadata.httpStatusCode == 400) {
      return responseFactory.error('itemNotFound');
    }
    return responseFactory.response(resultDynamoDB);
  } catch (error) {
    log.error(error);
    return responseFactory.error(error);
  }
};