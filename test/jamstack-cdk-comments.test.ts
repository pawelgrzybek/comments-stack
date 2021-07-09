import {
  expect as expectCDK,
  haveResource,
  countResources,
} from "@aws-cdk/assert";
import * as cdk from "@aws-cdk/core";
import * as Comments from "../lib/pawelgrzybek-comments-stack";

describe("JAMstack CDK comments Stack", () => {
  const app = new cdk.App();
  const stack = new Comments.Stack(app, "MyTestStack", {
    allowOrigins: ["https://pawelgrzybek.com"],
  });

  it("creates DynamoDB", () => {
    expectCDK(stack).to(haveResource("AWS::DynamoDB::Table"));
  });

  it("creates S3 Bucket", () => {
    expectCDK(stack).to(haveResource("AWS::S3::Bucket"));
  });

  it("creates Rest Api", () => {
    expectCDK(stack).to(haveResource("AWS::ApiGateway::RestApi"));
  });

  it("creates Lambdas", () => {
    expectCDK(stack).to(countResources("AWS::Lambda::Function", 3));
    expectCDK(stack).to(
      haveResource("AWS::Lambda::Function", {
        Handler: "index.handler",
        Runtime: "nodejs14.x",
      })
    );
  });
});
