//@ts-check
const {
  DynamoDBClient
} = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand
} = require('@aws-sdk/lib-dynamodb');

const responseFactory = require('../../utils/response');
const log = require('lambda-log');
const lodash = require('lodash');

// const { schemaUser } = require('../../utils/schemas/account');
const AWSXRay = require('aws-xray-sdk');

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

const generateToken = async (user) => {
  try {
  delete user.password
  var jwt = require('jsonwebtoken');
  var token = jwt.sign({
    exp: Math.floor(Date.now() / 1000) + (30 * 60),
    user: user
  }, `secret-${process.env?.COMISION}`);
  let session = {
    sessionId: token,
    user: user.userId,
    ttl: new Date().getTime() + (30 * 60 * 1000)
  }
  log.debug("SESSION",session)
    const dynamoDbClient = new DynamoDBClient({});
    AWSXRay.captureAWSv3Client(dynamoDbClient);
    const dynamodbDocumentClient = DynamoDBDocumentClient.from(dynamoDbClient);
    AWSXRay.captureAWSv3Client(dynamodbDocumentClient);
    const result = await dynamodbDocumentClient.send(
      new PutCommand({
        TableName: process.env.SESSIONS_TABLE,
        Item: session,
        ConditionExpression: 'attribute_not_exists(sessionId)',
      })
    );
    return session;
  } catch (error) {
    log.error(error)
    throw error;
  }
}
exports.Handler = async (event, context) => {
  log.options.debug = process.env.DEBUG == 'true';
  log.info('START', event);
  log.info('CONTEXT', context);
  try {
    if (lodash.isEmpty(event) || lodash.isEmpty(event.body)) {
      return responseFactory.error('emptyParams');
    }
    const body = JSON.parse(event.body);

    AWSXRay.captureFunc('annotations', function(subsegment) {
      subsegment?.addAnnotation('userId', body.userId);
    });

    const resultDynamoDB = await getUser(body.userId);
    if (!resultDynamoDB) {
      return responseFactory.error('userNotFound');
    }else if(resultDynamoDB?.password == body.password){
      log.info("RESULT_USERS_TABLE",resultDynamoDB)
      const session = await generateToken(body)
      log.info('RESPONSE',session)
      return responseFactory.response(session);
    }else{
      return responseFactory.error('default');
    }
  } catch (error) {
    log.error(error);
    return responseFactory.error(error);
  }
};