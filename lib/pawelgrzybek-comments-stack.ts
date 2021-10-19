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

interface StackProps extends cdk.StackProps {
  allowOrigins: string[];
}

export class Stack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: StackProps) {
    super(scope, id, props);

    const emailAlerts = ssm.StringParameter.fromStringParameterAttributes(
      this,
      "CommentsEmailAlerts",
      {
        parameterName: "/CommentsStack/EmailAlerts",
      }
    ).stringValue;

    const emailNotifications =
      ssm.StringParameter.fromStringParameterAttributes(
        this,
        "CommentsEmailNotifications",
        {
          parameterName: "/CommentsStack/EmailNotifications",
        }
      ).stringValue;

    const netlifyBuildHook = ssm.StringParameter.fromStringParameterAttributes(
      this,
      "CommentsNetlifyBuildHook",
      {
        parameterName: "/CommentsStack/NetlifyBuildHook",
      }
    ).stringValue;

    const accessToken = ssm.StringParameter.fromStringParameterAttributes(
      this,
      "CommentsAccessToken",
      {
        parameterName: "/CommentsStack/AccessToken",
      }
    ).stringValue;

    // SNS for lambda alerts
    const topicCommentsStackAlerts = new sns.Topic(this, "CommentsStackAlerts");
    topicCommentsStackAlerts.addSubscription(
      new snsSubscriptions.EmailSubscription(emailAlerts)
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
    const commentsGet = new lambdaNodejs.NodejsFunction(this, "CommentsGet", {
      entry: path.join(__dirname, "..", "src", "lambdas", "commentsGet.ts"),
      handler: "handler",
      memorySize: 256,
      tracing: lambda.Tracing.ACTIVE,
      environment: {
        ACCESS_TOKEN: accessToken,
        TABLE_NAME: commentsTable.tableName,
        BUCKET_NAME: bucket.bucketName,
      },
    });
    const commentsPost = new lambdaNodejs.NodejsFunction(this, "CommentsPost", {
      entry: path.join(__dirname, "..", "src", "lambdas", "commentsPost.ts"),
      handler: "handler",
      memorySize: 256,
      tracing: lambda.Tracing.ACTIVE,
      environment: {
        TABLE_NAME: commentsTable.tableName,
        ACCESS_TOKEN: accessToken,
        NETLIFY_BUILD_HOOK: netlifyBuildHook,
        EMAIL_NOTIFICATIONS: emailNotifications,
      },
    });
    const commentsDelete = new lambdaNodejs.NodejsFunction(
      this,
      "CommentsDelete",
      {
        entry: path.join(
          __dirname,
          "..",
          "src",
          "lambdas",
          "commentsDelete.ts"
        ),
        handler: "handler",
        memorySize: 256,
        tracing: lambda.Tracing.ACTIVE,
        environment: {
          ACCESS_TOKEN: accessToken,
          TABLE_NAME: commentsTable.tableName,
        },
      }
    );

    // Alerts for Lambdas
    const alarmCommentsGetLambda = new cloudwatch.Alarm(
      this,
      "CommentsGetLambdaAlarm",
      {
        metric: commentsGet.metricErrors({
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
    const alarmCommentsPostLambda = new cloudwatch.Alarm(
      this,
      "CommentsPostLambdaAlarm",
      {
        metric: commentsPost.metricErrors({
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
    const alarmCommentsDeleteLambda = new cloudwatch.Alarm(
      this,
      "CommentsDeleteLambdaAlarm",
      {
        metric: commentsDelete.metricErrors({
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

    // Alert subscriptions - ALARM
    alarmCommentsGetLambda.addAlarmAction(
      new cloudwatchActions.SnsAction(topicCommentsStackAlerts)
    );
    alarmCommentsPostLambda.addAlarmAction(
      new cloudwatchActions.SnsAction(topicCommentsStackAlerts)
    );
    alarmCommentsDeleteLambda.addAlarmAction(
      new cloudwatchActions.SnsAction(topicCommentsStackAlerts)
    );

    // Alert subscriptions - OK
    alarmCommentsGetLambda.addOkAction(
      new cloudwatchActions.SnsAction(topicCommentsStackAlerts)
    );
    alarmCommentsPostLambda.addOkAction(
      new cloudwatchActions.SnsAction(topicCommentsStackAlerts)
    );
    alarmCommentsDeleteLambda.addOkAction(
      new cloudwatchActions.SnsAction(topicCommentsStackAlerts)
    );

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
