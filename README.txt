Team 10 ECE1779 Project - Secure Serverless Computing

Deployment Instructions


Frontend:
The files under frontend/ can be copied to an Amazon S3 bucket to host the static webpage.
The empty variables near the top of app.js must be updated for deployment. These values come from Cognito, S3, and API Gateway.


Backend:
Designed to be deployed to the following AWS services.

DynamoDB 
Three tables must be created, named Products, Roles, and UserCart.

Lambda 
Four functions must be created, named GetAllProducts, GET_ITEM, MANAGE_CART, and MANAGE_PRODUCTS.
These Lambda functions will directly use the corresponding lambda_function.py code in the backend/ folders.
The docker/ folder is provided to optionally build containers for each lambda function. This is not required for deployment.

API Gateway 
Three resources must be created, /cart (GET and POST), /manage (POST), and /products (GET).
The methods will be connected to Lambda as follows:
/cart GET - GET_ITEM
/cart POST - MANAGE_CART
/manage POST - MANAGE_PRODUCTS
/products GET - GetAllProducts
Each method must be configured as a Lambda proxy. The /cart and /manage methods should be authorized with Cognito Auth.

Cognito
A user pool must be created, with a hosted UI for frontend integration.