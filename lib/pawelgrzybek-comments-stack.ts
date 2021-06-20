import * as cdk from "@aws-cdk/core";
import * as lambda from "@aws-cdk/aws-lambda-nodejs";
import * as apigateway from "@aws-cdk/aws-apigateway";
import * as secretsmanager from "@aws-cdk/aws-secretsmanager";
import * as dynamodb from "@aws-cdk/aws-dynamodb";
import * as s3 from "@aws-cdk/aws-s3";
import * as iam from "@aws-cdk/aws-iam";
import * as path from "path";

interface StackProps extends cdk.StackProps {
  allowOrigins: string[];
}

export class Stack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: StackProps) {
    super(scope, id, props);

    // Secret Manager
    const secrets = secretsmanager.Secret.fromSecretNameV2(
      this,
      "CommentsSecrets",
      "CommentsSecrets"
    );

    // DynamoDB
    const commentsTable = new dynamodb.Table(this, "CommentsTable", {
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
    });

    // S3
    const bucket = new s3.Bucket(this, "CommentsBucket");

    // API
    const commentsApi = new apigateway.RestApi(this, "CommentsApi", {
      defaultCorsPreflightOptions: {
        allowHeaders: ["Content-Type"],
        allowOrigins: props.allowOrigins,
        allowMethods: ["GET", "POST"],
      },
      deployOptions: {
        throttlingRateLimit: 1,
        throttlingBurstLimit: 1,
      },
    });

    // Lambdas
    const commentsGet = new lambda.NodejsFunction(this, "CommentsGet", {
      entry: path.join(__dirname, "..", "src", "lambdas", "commentsGet.ts"),
      handler: "handler",
      memorySize: 256,
      environment: {
        SECRETS: secrets.secretValue.toString(),
        TABLE_NAME: commentsTable.tableName,
        BUCKET_NAME: bucket.bucketName,
      },
    });
    const commentsPost = new lambda.NodejsFunction(this, "CommentsPost", {
      entry: path.join(__dirname, "..", "src", "lambdas", "commentsPost.ts"),
      handler: "handler",
      memorySize: 256,
      environment: {
        SECRETS: secrets.secretValue.toString(),
        TABLE_NAME: commentsTable.tableName,
        API_URL: "https://ek7pz40fr9.execute-api.eu-west-2.amazonaws.com/prod/",
      },
    });
    const commentsDelete = new lambda.NodejsFunction(this, "CommentsDelete", {
      entry: path.join(__dirname, "..", "src", "lambdas", "commentsDelete.ts"),
      handler: "handler",
      memorySize: 256,
      environment: {
        SECRETS: secrets.secretValue.toString(),
        TABLE_NAME: commentsTable.tableName,
      },
    });

    // Grant lambdas bucket access
    bucket.grantPut(commentsGet);

    // Grant lambdas database access
    commentsTable.grantReadData(commentsGet);
    commentsTable.grantReadWriteData(commentsPost);
    commentsTable.grantWriteData(commentsDelete);

    // Delegate API requests to Lambdas
    commentsApi.root.addMethod(
      "GET",
      new apigateway.LambdaIntegration(commentsGet)
    );
    commentsApi.root.addMethod(
      "POST",
      new apigateway.LambdaIntegration(commentsPost)
    );
    commentsApi.root
      .addResource("delete")
      .addMethod("GET", new apigateway.LambdaIntegration(commentsDelete));

    // Authorize lambda to send email
    commentsPost.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["ses:SendEmail"],
        resources: ["*"],
        effect: iam.Effect.ALLOW,
      })
    );
  }
}
