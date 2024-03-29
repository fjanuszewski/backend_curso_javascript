//@ts-check
const { mockClient } = require('aws-sdk-client-mock');

const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const ddbMock = mockClient(DynamoDBDocumentClient);
jest.setTimeout(30000);
let app;
describe.only('post Item', () => {
  beforeAll(async () => {
    //avoid throwing because of local testing
    process.env.AWS_XRAY_CONTEXT_MISSING = 'LOG_ERROR';
    process.env.LOCAL = 'true';
    app = require('../../src/functions/postItem/postItem');
  });
  afterAll(() => {});
  afterEach(async () => {
    ddbMock.reset();
  });
  it('Should send a valid item ID', async function() {
    ddbMock.on(PutCommand).resolves({ Attributes: {}, $metadata: { httpStatusCode: 200 } });
    expect(app.Handler).toBeDefined();

    const result = await app.Handler({ body: '{"itemId":"1234"}' }, {});
    expect(result.statusCode).toBe(200);
  });
  it('Should send a invalid item ID', async function() {
    ddbMock.on(PutCommand).rejects({ $metadata: { httpStatusCode: 400 } });
    expect(app.Handler).toBeDefined();
    const result = await app.Handler({ body: '{"itemId":"1234"}' }, {});
    expect(result.statusCode).toBe(400);
  });
  it('Should send a empty event', async function() {
    expect(app.Handler).toBeDefined();
    const result = await app.Handler();
    expect(result.statusCode).toBe(406);
  });
  it('Should throw a dynamo error', async function() {
    ddbMock.on(PutCommand).rejects({ message: 'DYNAMO ERROR', $metadata: { httpStatusCode: 500 } });
    expect(app.Handler).toBeDefined();
    const result = await app.Handler({ body: '{"itemId":"1234"}' }, {});
    expect(result.statusCode).toBe(500);
  });
});
