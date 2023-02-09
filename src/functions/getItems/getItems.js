//@ts-check
const {
  DynamoDBClient
} = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  QueryCommand
} = require('@aws-sdk/lib-dynamodb');
const AWSXRay = require('aws-xray-sdk');

const responseFactory = require('../../utils/response');
const log = require('lambda-log');
const lodash = require('lodash');

const getItem = async (student, limit, LastEvaluatedKey) => {
  const dynamoDbClient = new DynamoDBClient({});
  AWSXRay.captureAWSv3Client(dynamoDbClient);
  const dynamodbDocumentClient = DynamoDBDocumentClient.from(dynamoDbClient);
  AWSXRay.captureAWSv3Client(dynamodbDocumentClient);

  try {

    let params = {
      TableName: process.env.ITEMS_TABLE,
      IndexName: "student",
      KeyConditionExpression: "#stud = :v_student",
      ExpressionAttributeNames: {
        "#stud": "student"
      },
      ExpressionAttributeValues: {
        ":v_student": student
      },
      Limit: limit ? limit : 100
    }
    LastEvaluatedKey ? (params.ExclusiveStartKey = LastEvaluatedKey ): LastEvaluatedKey

    log.info('PARAMS', params)
    const result = await dynamodbDocumentClient.send(
      new QueryCommand(params)
    );

    return result;
  } catch (error) {
    log.error(error)
    throw error;
  }
};

exports.Handler = async (event, context) => {
  log.options.debug = process.env.DEBUG == 'true';
  log.info('START', event);
  log.info('CONTEXT', context);
  try {
    if (lodash.isEmpty(event) || lodash.isEmpty(event.queryStringParameters)) {
      return responseFactory.error('emptyParams');
    }
    const {
      student,
      limit,
      itemId
    } = event.queryStringParameters;
    let LastEvaluatedKey = {
      student: student,
      itemId: itemId
    }
    const resultDynamoDB = await getItem(student, Number(limit), LastEvaluatedKey.itemId ? LastEvaluatedKey : undefined);

    return resultDynamoDB ?  responseFactory.response({items: resultDynamoDB?.Items, LastEvaluatedKey: resultDynamoDB?.LastEvaluatedKey }) : responseFactory.error('itemNotFound')

  } catch (error) {
    log.error(error);
    return responseFactory.error(error);
  }
};