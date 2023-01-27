//@ts-check
const { mockClient } = require('aws-sdk-client-mock');

const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const ddbMock = mockClient(DynamoDBDocumentClient);
jest.setTimeout(30000);
let app;

describe('put Account', () => {
  beforeAll(async () => {
    app = require('../../src/functions/putAccount/putAccount');
  });

  afterEach(async () => {
    ddbMock.reset();
  });
  it('Should send a valid account ID', async function() {
    ddbMock.on(PutCommand).resolves({ Attributes: {}, $metadata: { httpStatusCode: 200 } });
    expect(app.Handler).toBeDefined();
    const result = await app.Handler({
      body: '{"accountId":"1234"}',
      pathParameters: {
        accountId: '1234',
      },
    });
    expect(result.statusCode).toBe(200);
  });
  it('Should send an invalid account ID', async function() {
    ddbMock.on(PutCommand).rejects({ $metadata: { httpStatusCode: 400 } });
    expect(app.Handler).toBeDefined();
    const result = await app.Handler({
      body: '{"accountId":"1234"}',
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
      body: '{"accountId":"12346789"}',
      pathParameters: {
        accountId: 'invalid',
      },
    });
    expect(result.statusCode).toBe(406);
  });
  it('Should throw a dynamo error', async function() {
    expect(app.Handler).toBeDefined();
    const result = await app.Handler({
      body: '{"accountId":"1234"}',
      pathParameters: {
        accountId: '123456789',
      },
    });
    expect(result.statusCode).toBe(406);
  });
  test('DynamoError', async function() {
    ddbMock.on(PutCommand).rejects({ message: 'DYNAMO ERROR', $metadata: { httpStatusCode: 500 } });

    expect(app.Handler).toBeDefined();
    const result = await app.Handler({
      body: '{"accountId":"1234"}',
      pathParameters: {
        accountId: '1234',
      },
    });
    expect(result.statusCode).toBe(500);
  });
});
