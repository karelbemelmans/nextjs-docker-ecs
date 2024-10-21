#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import "source-map-support/register";
import { GlobalStack } from "../global-stack";
import { NextJSStack } from "../nextjs-stack";

const app = new cdk.App();

// DNS and ACM configuration properties
const hostedZoneId = "Z07782082FEGGHHXXD077";
const hostedZoneName = "dev.karelbemelmans.com";
const hostedName = "nextjs";

const region = "eu-north-1";

// Resources we need to create in US-EAST-1
const globalStack = new GlobalStack(app, "GlobalStack", {
  env: {region: "us-east-1"},
  crossRegionReferences: true,
  hostedZoneId,
  hostedZoneName,
  hostedName
});

// Our actual NextJS workload stack
new NextJSStack(app, "NextJsStack", {
  env: {region},
  crossRegionReferences: true,
  hostedZoneId,
  hostedZoneName,
  hostedName,
  certificate: globalStack.certificate
});
