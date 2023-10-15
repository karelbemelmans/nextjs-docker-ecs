#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import {NextJSStack} from "../nextjs-stack";
import {GlobalStack} from "../global-stack";

const app = new cdk.App();

// Resources we need to create in US-EAST-1
new GlobalStack(app, "GlobalStack", {
  env: {region: "us-east-1"}
});

// Our actual NextJS workload stack
new NextJSStack(app, "NextJsStack", {});
