import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

interface DatabaseStackProps extends cdk.StackProps {
}

export class DatabaseStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    // Provision a PostgreSQL database

    // Store the username and password in secrets manager

  }
}
