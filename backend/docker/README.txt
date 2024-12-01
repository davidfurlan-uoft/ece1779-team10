These Dockerfile and requirements.txt files can be used to build a container for any of the lambda functions.
This is not required, as AWS Lambda will virtualize the functions given only the python code.

To build a container, copy these files to a lambda directory, and use docker build.
Amazon ECR can then be used to deploy the container to Lambda.