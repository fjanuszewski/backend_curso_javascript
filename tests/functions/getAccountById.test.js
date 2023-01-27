//@ts-check
const { mockClient } = require('aws-sdk-client-mock');

const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');
const ddbMock = mockClient(DynamoDBDocumentClient);
jest.setTimeout(30000);
let app;

describe('get AccountById', () => {
  beforeAll(async () => {
    app = require('../../src/functions/getAccountById/getAccountById');
  });

  afterEach(async () => {
    ddbMock.reset();
  });
  it('Should send a valid account ID', async function() {
    ddbMock.on(GetCommand).resolves({
      Item: {
        accountId: '1234',
      },
    });
    expect(app.Handler).toBeDefined();
    const result = await app.Handler({
      pathParameters: {
        accountId: '1234',
      },
    });
    expect(result.statusCode).toBe(200);
  });
  it('Should send a invalid account ID', async function() {
    ddbMock.on(GetCommand).resolves({
      Item: undefined,
      $metadata: { httpStatusCode: 200 },
    });
    expect(app.Handler).toBeDefined();
    const result = await app.Handler({
      pathParameters: {
        accountId: '1234',
      },
    });
    expect(result.statusCode).toBe(400);
  });
  it('Should send a empty event', async function() {
    expect(app.Handler).toBeDefined();
    const result = await app.Handler();
    expect(result.statusCode).toBe(406);
  });
  it('Should send invalid params', async function() {
    expect(app.Handler).toBeDefined();
    const result = await app.Handler({
      pathParameters: {
        accountId: '123456789',
      },
    });
    expect(result.statusCode).toBe(406);
  });

  it('Should throw a dynamo error with status 500', async function() {
    ddbMock.on(GetCommand).rejects({ message: 'MOCK DYNAMO ERROR' });
    expect(app.Handler).toBeDefined();
    const result = await app.Handler({
      pathParameters: {
        accountId: '1234',
      },
    });
    expect(result.statusCode).toBe(500);
  });
});
