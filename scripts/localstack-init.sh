#!/bin/sh
set -eu

awslocal sqs create-queue --queue-name execution-commands >/dev/null
awslocal sqs create-queue --queue-name billing-commands >/dev/null
awslocal sqs create-queue --queue-name os-events >/dev/null

TOPIC_ARN="$(awslocal sns create-topic --name saga-events --query TopicArn --output text)"
EVENTS_ARN="$(awslocal sqs get-queue-attributes --queue-url http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/os-events --attribute-names QueueArn --query Attributes.QueueArn --output text)"
awslocal sns subscribe --topic-arn "$TOPIC_ARN" --protocol sqs --notification-endpoint "$EVENTS_ARN" --attributes RawMessageDelivery=true >/dev/null

awslocal dynamodb create-table \
  --table-name billing \
  --attribute-definitions AttributeName=PK,AttributeType=S AttributeName=SK,AttributeType=S AttributeName=GSI1PK,AttributeType=S \
  --key-schema AttributeName=PK,KeyType=HASH AttributeName=SK,KeyType=RANGE \
  --global-secondary-indexes 'IndexName=GSI1,KeySchema=[{AttributeName=GSI1PK,KeyType=HASH}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=1,WriteCapacityUnits=1}' \
  --provisioned-throughput ReadCapacityUnits=1,WriteCapacityUnits=1 >/dev/null

awslocal dynamodb create-table \
  --table-name execution \
  --attribute-definitions AttributeName=pk,AttributeType=S AttributeName=sk,AttributeType=S \
  --key-schema AttributeName=pk,KeyType=HASH AttributeName=sk,KeyType=RANGE \
  --provisioned-throughput ReadCapacityUnits=1,WriteCapacityUnits=1 >/dev/null
