import json
import boto3
from boto3.dynamodb.conditions import Key, Attr

def lambda_handler(event, context):
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table('Products')
    
    try:
        response = table.scan()
        items = []

        #Decimal to string for JSON
        for item in response["Items"]:
            item["stock"] = str(item["stock"])
            item["price"] = str(item["price"])
            items.append(item)
                
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(items)
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps('Error fetching products: {}'.format(str(e)))
        }
