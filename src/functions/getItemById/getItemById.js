//@ts-check
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');
const AWSXRay = require('aws-xray-sdk');

const responseFactory = require('../../utils/response');
const log = require('lambda-log');
const lodash = require('lodash');
const { schemaItemId } = require('../../utils/schemas/item');

const getItem = async (itemId) => {
  const dynamoDbClient = new DynamoDBClient({});
  AWSXRay.captureAWSv3Client(dynamoDbClient);
  const dynamodbDocumentClient = DynamoDBDocumentClient.from(dynamoDbClient);
  AWSXRay.captureAWSv3Client(dynamodbDocumentClient);
  
  try {
    const result = await dynamodbDocumentClient.send(
      new GetCommand({
        TableName: process.env.ITEMS_TABLE,
        Key: { itemId },
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
    log.info("PARAMS", params);
    AWSXRay.captureFunc('annotations', function(subsegment) {
      subsegment?.addAnnotation('itemId', params.itemId);
    });
    const resultJoi = schemaItemId.validate(params.itemId);
    if (resultJoi.error) {
      return responseFactory.error('invalidParams');
    }
    const resultDynamoDB = await getItem(params.itemId);
    if (!resultDynamoDB) return responseFactory.error('itemNotFound');
    return responseFactory.response(resultDynamoDB);
  } catch (error) {
    log.error(error);
    return responseFactory.error(error);
  }
};