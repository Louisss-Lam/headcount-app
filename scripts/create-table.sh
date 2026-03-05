#!/usr/bin/env bash
# Create the HeadcountApp DynamoDB table in eu-west-1
set -euo pipefail

TABLE_NAME="${1:-HeadcountApp}"
REGION="${2:-eu-west-1}"

echo "Creating DynamoDB table '$TABLE_NAME' in $REGION..."

aws dynamodb create-table \
  --table-name "$TABLE_NAME" \
  --attribute-definitions \
    AttributeName=PK,AttributeType=S \
    AttributeName=SK,AttributeType=S \
  --key-schema \
    AttributeName=PK,KeyType=HASH \
    AttributeName=SK,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region "$REGION"

echo "Table '$TABLE_NAME' created successfully."
