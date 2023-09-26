import * as cdk from "aws-cdk-lib";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as ecsPatterns from "aws-cdk-lib/aws-ecs-patterns";
import { Construct } from "constructs";

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Stack parameters
    const hostedZoneId = new cdk.CfnParameter(this, "HostedZoneId", {
      type: "String",
      description: "Hosted zone ID",
    });
    const hostedZoneName = new cdk.CfnParameter(this, "HostedZoneName", {
      type: "String",
      description: "Hosted zone name e.g. example.org",
    });
    const hostedName = new cdk.CfnParameter(this, "HostedName", {
      type: "String",
      description: "Hosted name e.g. www.example.org",
    });

    // Load our existing Route53 zone
    const route53Zone = route53.HostedZone.fromHostedZoneAttributes(
      this,
      "HostedZone",
      {
        hostedZoneId: hostedZoneId.valueAsString,
        zoneName: hostedZoneName.valueAsString,
      }
    );

    // Create a new certificate to be used by the ALB listener
    const certificate = new acm.Certificate(this, "Certificate", {
      domainName: hostedName.valueAsString,
      validation: acm.CertificateValidation.fromDns(route53Zone),
    });

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
        certificate: certificate,
        redirectHTTP: true,
      });

    loadBalancedFargateService.targetGroup.configureHealthCheck({
      path: "/api/hello",
      healthyHttpCodes: "200",
      timeout: cdk.Duration.seconds(5),
      healthyThresholdCount: 2,
      unhealthyThresholdCount: 2,
      interval: cdk.Duration.seconds(10),
    });
  }
}
