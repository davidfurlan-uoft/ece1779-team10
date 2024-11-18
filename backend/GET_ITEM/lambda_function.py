import boto3
import json
from decimal import Decimal

def decimal_to_float(item):
    """Convert all Decimal types in the item to float or int for JSON serialization."""
    if isinstance(item, list):
        return [decimal_to_float(i) for i in item]
    elif isinstance(item, dict):
        return {k: decimal_to_float(v) for k, v in item.items()}
    elif isinstance(item, Decimal):
        return int(item) if item % 1 == 0 else float(item)
    else:
        return item

def lambda_handler(event, context):
    # Extract the UserID from Cognito identity
    user_id = event['requestContext']['authorizer']['claims']['sub']
    
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table('UserCart')
    
    try:
        # Retrieve the user's cart items
        response = table.get_item(Key={'UserID': user_id})
        cart_row = response.get('Item', {})
        
        cart_items = {}
        if "CartItems" in cart_row:
            #return items in cart, removing 0 qty item
            for pid, qty in cart_row["CartItems"].items():
                if int(qty) > 0:
                    cart_items[pid] = qty

        # Convert Decimal types to JSON-serializable types
        cart_items = decimal_to_float(cart_items)
        
        return {
            'statusCode': 200,
            'body': json.dumps(cart_items),
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'message': str(e)}),
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        }
