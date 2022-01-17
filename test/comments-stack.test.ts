import {
  expect as expectCDK,
  haveResource,
  countResources,
} from "@aws-cdk/assert";
import { App } from "aws-cdk-lib";
import { CommentsStack } from "../lib/comments-stack";

describe("Comments Stack", () => {
  const app = new App();
  const stack = new CommentsStack(app, "TestCommentsStack");

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
    expectCDK(stack).to(countResources("AWS::Lambda::Function", 4));
    expectCDK(stack).to(
      haveResource("AWS::Lambda::Function", {
        Handler: "index.handler",
        Runtime: "nodejs14.x",
      })
    );
  });
});
