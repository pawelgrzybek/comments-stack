#!/usr/bin/env node
import "source-map-support/register";
import { App, DefaultStackSynthesizer } from "aws-cdk-lib";
import { CommentsStack } from "../lib/comments-stack";

const app = new App();
new CommentsStack(app, "CommentsStack", {
  synthesizer: new DefaultStackSynthesizer({
    fileAssetsBucketName: "pawelgrzybek-cdk",
  }),
});
