import * as cdk from "@aws-cdk/core";
import * as lambda from "@aws-cdk/aws-lambda";
import * as lambdaNodejs from "@aws-cdk/aws-lambda-nodejs";
import * as apigateway from "@aws-cdk/aws-apigateway";
import * as dynamodb from "@aws-cdk/aws-dynamodb";
import * as s3 from "@aws-cdk/aws-s3";
import * as iam from "@aws-cdk/aws-iam";
import * as path from "path";
import * as sns from "@aws-cdk/aws-sns";
import * as snsSubscriptions from "@aws-cdk/aws-sns-subscriptions";
import * as cloudwatch from "@aws-cdk/aws-cloudwatch";
import * as cloudwatchActions from "@aws-cdk/aws-cloudwatch-actions";
import * as ssm from "@aws-cdk/aws-ssm";

const RESOURCE_ID = {
  SSM_PARAMETER_EMAIL_ALERTS: "SsmParameterEmailAlerts",
  SSM_PARAMETER_EMAIL_NOTIFICATIONS: "SsmParameterEmailNotifications",
  SSM_PARAMETER_NETLIFY_BUILD_HOOK: "SsmParameterNetlifyBuildHook",
  SSM_PARAMETER_ACCESS_TOKEN: "SsmParameterAccessToken",
  SNS_TOPIC_ALERTS: "SnsTopicAlerts",
  DYNAMODB_TABLE_COMMENTS: "DynamoDbTableComments",
  S3_BUCKET: "S3Bucket",
  API: "Api",
  LAMBDA_COMMENTS_GET: "LambdaCommentsGet",
  LAMBDA_COMMENTS_POST: "LambdaCommentsPost",
  LAMBDA_COMMENTS_DELETE: "LambdaCommentsDelete",
  LAMBDA_COMMENTS_GET_ALARM: "LambdaCommentsGetAlarm",
  LAMBDA_COMMENTS_POST_ALARM: "LambdaCommentsPostAlarm",
  LAMBDA_COMMENTS_DELETE_ALARM: "LambdaCommentsDeleteAlarm",
};

export class CommentsStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const ssmParameterEmailAlerts =
      ssm.StringParameter.fromStringParameterAttributes(
        this,
        RESOURCE_ID.SSM_PARAMETER_EMAIL_ALERTS,
        {
          parameterName: `/${id}/EmailAlerts`,
        }
      ).stringValue;

    const ssmParameterEmailNotifications =
      ssm.StringParameter.fromStringParameterAttributes(
        this,
        RESOURCE_ID.SSM_PARAMETER_EMAIL_NOTIFICATIONS,
        {
          parameterName: `/${id}/EmailNotifications`,
        }
      ).stringValue;

    const ssmParameterNetlifyBuildHook =
      ssm.StringParameter.fromStringParameterAttributes(
        this,
        RESOURCE_ID.SSM_PARAMETER_NETLIFY_BUILD_HOOK,
        {
          parameterName: `/${id}/NetlifyBuildHook`,
        }
      ).stringValue;

    const ssmParameterAccessToken =
      ssm.StringParameter.fromStringParameterAttributes(
        this,
        RESOURCE_ID.SSM_PARAMETER_ACCESS_TOKEN,
        {
          parameterName: `/${id}/AccessToken`,
        }
      ).stringValue;

    const snsTopicAlerts = new sns.Topic(this, RESOURCE_ID.SNS_TOPIC_ALERTS, {
      topicName: `${id}-${RESOURCE_ID.SNS_TOPIC_ALERTS}`,
    });
    snsTopicAlerts.addSubscription(
      new snsSubscriptions.EmailSubscription(ssmParameterEmailAlerts)
    );

    const dynamoDbTableComments = new dynamodb.Table(
      this,
      RESOURCE_ID.DYNAMODB_TABLE_COMMENTS,
      {
        tableName: `${id}-${RESOURCE_ID.DYNAMODB_TABLE_COMMENTS}`,
        partitionKey: {
          name: "id",
          type: dynamodb.AttributeType.STRING,
        },
      }
    );

    const s3Bucket = new s3.Bucket(this, RESOURCE_ID.S3_BUCKET, {
      bucketName: "pawelgrzybek-comments",
    });

    const api = new apigateway.RestApi(this, RESOURCE_ID.API, {
      restApiName: `${id}-${RESOURCE_ID.API}`,
      defaultCorsPreflightOptions: {
        allowHeaders: ["Content-Type"],
        allowOrigins: ["https://pawelgrzybek.com"],
        allowMethods: ["GET", "POST"],
      },
      deployOptions: {
        throttlingRateLimit: 1,
        throttlingBurstLimit: 1,
      },
    });

    const lambdaCommentsGet = new lambdaNodejs.NodejsFunction(
      this,
      RESOURCE_ID.LAMBDA_COMMENTS_GET,
      {
        functionName: `${id}-${RESOURCE_ID.LAMBDA_COMMENTS_GET}`,
        entry: path.join(__dirname, "..", "src", "lambdas", "commentsGet.ts"),
        memorySize: 256,
        architecture: lambda.Architecture.ARM_64,
        tracing: lambda.Tracing.ACTIVE,
        environment: {
          ACCESS_TOKEN: ssmParameterAccessToken,
          TABLE_NAME: dynamoDbTableComments.tableName,
          BUCKET_NAME: s3Bucket.bucketName,
        },
      }
    );

    const lambdaCommentsPost = new lambdaNodejs.NodejsFunction(
      this,
      RESOURCE_ID.LAMBDA_COMMENTS_POST,
      {
        functionName: `${id}-${RESOURCE_ID.LAMBDA_COMMENTS_POST}`,
        entry: path.join(__dirname, "..", "src", "lambdas", "commentsPost.ts"),
        memorySize: 256,
        architecture: lambda.Architecture.ARM_64,
        tracing: lambda.Tracing.ACTIVE,
        environment: {
          TABLE_NAME: dynamoDbTableComments.tableName,
          ACCESS_TOKEN: ssmParameterAccessToken,
          NETLIFY_BUILD_HOOK: ssmParameterNetlifyBuildHook,
          EMAIL_NOTIFICATIONS: ssmParameterEmailNotifications,
        },
      }
    );

    const lambdaCommentsDelete = new lambdaNodejs.NodejsFunction(
      this,
      RESOURCE_ID.LAMBDA_COMMENTS_DELETE,
      {
        functionName: `${id}-${RESOURCE_ID.LAMBDA_COMMENTS_DELETE}`,
        entry: path.join(
          __dirname,
          "..",
          "src",
          "lambdas",
          "commentsDelete.ts"
        ),
        memorySize: 256,
        architecture: lambda.Architecture.ARM_64,
        tracing: lambda.Tracing.ACTIVE,
        environment: {
          ACCESS_TOKEN: ssmParameterAccessToken,
          TABLE_NAME: dynamoDbTableComments.tableName,
        },
      }
    );

    const lambdaCommentsGetAlarm = new cloudwatch.Alarm(
      this,
      RESOURCE_ID.LAMBDA_COMMENTS_GET_ALARM,
      {
        alarmName: `${id}-Errors-${RESOURCE_ID.LAMBDA_COMMENTS_GET_ALARM}`,
        metric: lambdaCommentsGet.metricErrors({
          period: cdk.Duration.hours(1),
          statistic: "max",
        }),
        threshold: 0,
        evaluationPeriods: 1,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    const lambdaCommentsPostAlarm = new cloudwatch.Alarm(
      this,
      RESOURCE_ID.LAMBDA_COMMENTS_POST_ALARM,
      {
        alarmName: `${id}-Errors-${RESOURCE_ID.LAMBDA_COMMENTS_POST_ALARM}`,
        metric: lambdaCommentsPost.metricErrors({
          period: cdk.Duration.hours(1),
          statistic: "max",
        }),
        threshold: 0,
        evaluationPeriods: 1,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    const lambdaCommentsDeleteAlarm = new cloudwatch.Alarm(
      this,
      RESOURCE_ID.LAMBDA_COMMENTS_DELETE_ALARM,
      {
        alarmName: `${id}-Errors-${RESOURCE_ID.LAMBDA_COMMENTS_DELETE_ALARM}`,
        metric: lambdaCommentsDelete.metricErrors({
          period: cdk.Duration.hours(1),
          statistic: "max",
        }),
        threshold: 0,
        evaluationPeriods: 1,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    [
      lambdaCommentsGetAlarm,
      lambdaCommentsPostAlarm,
      lambdaCommentsDeleteAlarm,
    ].forEach((alarm) => {
      alarm.addAlarmAction(new cloudwatchActions.SnsAction(snsTopicAlerts));
      alarm.addInsufficientDataAction(
        new cloudwatchActions.SnsAction(snsTopicAlerts)
      );
      alarm.addOkAction(new cloudwatchActions.SnsAction(snsTopicAlerts));
    });

    s3Bucket.grantPut(lambdaCommentsGet);

    dynamoDbTableComments.grantReadData(lambdaCommentsGet);
    dynamoDbTableComments.grantReadWriteData(lambdaCommentsPost);
    dynamoDbTableComments.grantWriteData(lambdaCommentsDelete);

    api.root.addMethod(
      "GET",
      new apigateway.LambdaIntegration(lambdaCommentsGet)
    );
    api.root.addMethod(
      "POST",
      new apigateway.LambdaIntegration(lambdaCommentsPost)
    );
    api.root
      .addResource("delete")
      .addMethod("GET", new apigateway.LambdaIntegration(lambdaCommentsDelete));

    lambdaCommentsPost.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["ses:SendEmail"],
        resources: ["*"],
        effect: iam.Effect.ALLOW,
      })
    );
  }
}
