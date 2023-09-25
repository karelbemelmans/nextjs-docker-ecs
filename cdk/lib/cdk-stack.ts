import * as cdk from "aws-cdk-lib";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecsPatterns from "aws-cdk-lib/aws-ecs-patterns";
import { Construct } from "constructs";

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const loadBalancedFargateService =
      new ecsPatterns.ApplicationLoadBalancedFargateService(this, "Service", {
        publicLoadBalancer: true,
        memoryLimitMiB: 512,
        cpu: 256,
        healthCheckGracePeriod: cdk.Duration.seconds(5),
        taskImageOptions: {
          image: ecs.ContainerImage.fromRegistry(
            "ghcr.io/karelbemelmans/nextjs-docker:main"
          ),
          containerPort: 3000,
        },
      });

    loadBalancedFargateService.targetGroup.configureHealthCheck({
      path: "/api/hello",
    });
  }
}
