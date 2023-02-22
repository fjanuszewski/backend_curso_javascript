//@ts-check
const responseFactory = require('../../utils/response');
const log = require('lambda-log');
const lodash = require('lodash');
const { schemaItemId } = require('../../utils/schemas/item');
const AWSXRay = require('aws-xray-sdk');

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const deleteItem = async (itemId) => {
  const dynamoDbClient = new DynamoDBClient({});
  AWSXRay.captureAWSv3Client(dynamoDbClient);
  const dynamodbDocumentClient = DynamoDBDocumentClient.from(dynamoDbClient);
  AWSXRay.captureAWSv3Client(dynamodbDocumentClient);

  try {
    const result = await dynamodbDocumentClient.send(
      new DeleteCommand({
        TableName: process.env.ITEMS_TABLE,
        Key: { itemId },
        ConditionExpression: 'attribute_exists(itemId)',
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
    AWSXRay.captureFunc('annotations', function(subsegment) {
      subsegment?.addAnnotation('itemId', params.itemId);
    });
    const resultJoi = schemaItemId.validate(params.itemId);
    if (resultJoi.error) {
      return responseFactory.error('invalidParams');
    }
    const resultDynamoDB = await deleteItem(params.itemId);
    if (resultDynamoDB.$metadata.httpStatusCode == 400 && !resultDynamoDB.Attributes) {
      return responseFactory.error('itemNotFound');
    }
    return responseFactory.response(resultDynamoDB);
  } catch (error) {
    log.error(error);
    return responseFactory.error(error);
  }
};
