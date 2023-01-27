ENVIRONMENT=develop
CI_PROJECT_NAME=test
STACK=$ENVIRONMENT-$CI_PROJECT_NAME
BUCKET=$STACK-deploy
REGION_1=us-east-1

echo "================== Create Bucket =================="
aws s3api create-bucket --bucket $BUCKET

echo "================== Build =================="
sam build -p

echo "================== Deploy =================="
sam deploy --no-confirm-changeset --s3-bucket $BUCKET --region $REGION_1 --stack-name $STACK --capabilities CAPABILITY_NAMED_IAM --parameter-overrides Environment=$ENVIRONMENT
