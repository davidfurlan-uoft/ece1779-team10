import boto3
import json
from decimal import Decimal

def decimal_default(obj):
    if isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    raise TypeError

def getProductStock(table, prodID):
    response = table.get_item(Key={'productID': prodID})
    stock = response.get('Item', {}).get('stock', 0)

    return Decimal(stock)

def updateProductStock(table, prodID, newStock):
    table.update_item(
        Key={'productID': prodID},
        UpdateExpression='SET #stock = :qty',
        ExpressionAttributeNames={'#stock': "stock"},
        ExpressionAttributeValues={':qty': Decimal(newStock)}
    )
    return

def lambda_handler(event, context):
    user_id = event['requestContext']['authorizer']['claims']['sub']
    body = json.loads(event['body'])
    operation = body.get('operation')
    product_id = body.get('productID')
    quantity = body.get('quantity', 1)

    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table('UserCart')
    prod_table = dynamodb.Table('Products')

    try:
        if operation == 'add':
            # Create cart entry for user if none exist
            try:
                table.update_item(
                    Key={'UserID': user_id},
                    UpdateExpression='SET #cart = :empty',
                    ConditionExpression='attribute_not_exists(#cart)',
                    ExpressionAttributeNames={'#cart': "CartItems"},
                    ExpressionAttributeValues={':empty': {}},
                    ReturnValues='UPDATED_NEW'
                )
            except:
                pass
            # remove product # from stock
            current_stock = getProductStock(prod_table, product_id)
            num_quantity = Decimal(quantity)
            if num_quantity > current_stock:
                message = 'Error: Not enough stock remaining!'
            else:
                # Add the product in the user's cart
                updateProductStock(prod_table, product_id, current_stock - num_quantity)
                table.update_item(
                    Key={'UserID': user_id},
                    UpdateExpression='SET CartItems.#pid = if_not_exists(CartItems.#pid, :zero) + :qty',
                    ExpressionAttributeNames={'#pid': product_id},
                    ExpressionAttributeValues={':zero': 0,':qty': num_quantity},
                    ReturnValues='UPDATED_NEW'
                )
                message = 'Cart added to successfully.'        
        elif operation == 'delete':
            # Add product back to stock
            response = table.get_item(Key={'UserID': user_id})
            cart_items = response.get('Item', {}).get('CartItems', {})            
            cart_qty = Decimal(cart_items.get(product_id, 0))
            current_stock = getProductStock(prod_table, product_id)
            updateProductStock(prod_table, product_id, current_stock + cart_qty)

            # Remove the product from the user's cart   
            table.update_item(
                Key={'UserID': user_id},
                UpdateExpression='REMOVE CartItems.#pid',
                ExpressionAttributeNames={'#pid': product_id},
                ReturnValues='UPDATED_NEW'
            )
            message = 'Product removed from cart.'
        elif operation == 'deleteall':
            # Add products back to stock
            response = table.get_item(Key={'UserID': user_id})
            cart_items = response.get('Item', {}).get('CartItems', {})
            for product_id, cart_qty in cart_items.items():
                cart_qty = Decimal(cart_qty)
                current_stock = getProductStock(prod_table, product_id)
                updateProductStock(prod_table, product_id, current_stock + cart_qty)

            # Remove all products from the user's cart
            table.update_item(
                Key={'UserID': user_id},
                UpdateExpression='SET #cart = :empty',
                ExpressionAttributeNames={'#cart': "CartItems"},
                ExpressionAttributeValues={':empty': {}},                
                ReturnValues='UPDATED_NEW'
            )

            message = 'All products removed from cart.'
        elif operation == 'checkout':
            # Remove all products from the user's cart
            table.update_item(
                Key={'UserID': user_id},
                UpdateExpression='SET #cart = :empty',
                ExpressionAttributeNames={'#cart': "CartItems"},
                ExpressionAttributeValues={':empty': {}},                
                ReturnValues='UPDATED_NEW'
            )            
            message = 'Checkout successful.'
        elif operation == 'read':
            # Read the cart for the user
            response = table.get_item(Key={'UserID': user_id})
            cart_items = response.get('Item', {}).get('CartItems', {})
            return {
                'statusCode': 200,
                'body': json.dumps(cart_items, default=decimal_default),
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            }
        else:
            return {
                'statusCode': 400,
                'body': json.dumps({'message': 'Invalid operation'}),
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
            'body': json.dumps({'message': str(e)}),
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        }
