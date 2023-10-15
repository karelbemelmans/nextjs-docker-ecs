# CDK

This folder contains the AWS CDK definition of the infrastructure to host this project on AWS ECS.

It aims to be:

- a manual process run from your development machine
- deploys several environments at the same time
- have an opinion on which AWS accounts are going to be use for whiche environment

When your `.aws/config` has been configured with proper AWS profiles it should be as simply to run a `cdk deploy` to release changes to the infrastructure.
