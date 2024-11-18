import boto3
import json
from decimal import Decimal

def lambda_handler(event, context):
    # Extract the UserID from Cognito identity
    user_id = event['requestContext']['authorizer']['claims']['sub']
    
    dynamodb = boto3.resource('dynamodb')
    roles_table = dynamodb.Table('Roles')
    products_table = dynamodb.Table('Products')
    
    # Check if the user is an admin
    role_response = roles_table.get_item(Key={'UserID': user_id})
    user_role = role_response.get('Item', {}).get('Role', 'user')
    
    if user_role != 'admin':
        return {
            'statusCode': 403,
            'body': json.dumps({'message': 'Access denied - Admins only'}),
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        }
    
    # Parse the request body
    body = json.loads(event['body'], parse_float=Decimal)
    operation = body.get('operation')
    product_info = body.get('ProductInfo', {})
    product_id = product_info.get('productID')
    
    try:
        if operation == 'add':
            # Add a new product
            add_okay = True
            if not product_id:
                add_okay = False
                message = "Error: Missing Product ID"

            req_fields = ["name", "image", "price", "stock"]
            if add_okay:
                for field in req_fields:
                    if (field not in product_info) or (not product_info[field]):
                        add_okay = False
                        message = "Error: Missing " + field

            if add_okay:
                try:
                    products_table.put_item(
                        Item=product_info,
                        ConditionExpression="attribute_not_exists(productID)"
                    )
                    message = 'Product added successfully.'
                except:
                    message = "Error: Ensure productID is unique"
            
        elif operation == 'update':
            # Update existing product
            update_okay = True
            if not product_id:
                update_okay = False
                message = "Error: Missing Product ID"

            if update_okay:
                update_expression = 'SET '
                expression_attribute_values = {}
                expression_attribute_names = {}
                for key, value in product_info.items():
                    if key != 'productID':                                      
                        update_expression += f'#{key} = :{key}, '
                        expression_attribute_names[f'#{key}'] = key
                        expression_attribute_values[f':{key}'] = value                    
                update_expression = update_expression.rstrip(', ')
                try:
                    products_table.update_item(
                        Key={'productID': product_id},
                        UpdateExpression=update_expression,
                        ExpressionAttributeNames=expression_attribute_names,
                        ExpressionAttributeValues=expression_attribute_values
                    )
                    message = 'Product updated successfully.'
                except Exception as e:
                    message = str(e)
            
        elif operation == 'delete':
            # Delete a product
            if product_id:
                products_table.delete_item(Key={'productID': product_id})
                message = 'Product deleted successfully.'
            else:
                message = "Error: please provide product ID"
            
        else:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Invalid operation'}),
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            }
        
        return {
            'statusCode': 200,
            'body': json.dumps({'message': message}),
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)}),
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        }
