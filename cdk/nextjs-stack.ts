import * as cdk from "aws-cdk-lib";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as cloudfront_origins from "aws-cdk-lib/aws-cloudfront-origins"
import * as ecsPatterns from "aws-cdk-lib/aws-ecs-patterns";
import { Construct } from "constructs";

export class NextJSStack extends cdk.Stack {
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
      description: "Hosted name e.g. www",
    });

    // Load our existing Route53 zone
    const route53Zone = route53.HostedZone.fromHostedZoneAttributes(this, "HostedZone", {
      hostedZoneId: hostedZoneId.valueAsString,
      zoneName: hostedZoneName.valueAsString,
    });

    // Create a new certificate to be used by the ALB listener
    const certificate = new acm.Certificate(this, "Certificate", {
      domainName: hostedName.valueAsString + "." + hostedZoneName.valueAsString,
      validation: acm.CertificateValidation.fromDns(route53Zone),
    });

    // This will create an ALB listening on HTTP only
    const loadBalancedFargateService = new ecsPatterns.ApplicationLoadBalancedFargateService(this, "Service", {
      publicLoadBalancer: true,
      memoryLimitMiB: 512,
      cpu: 256,
      healthCheckGracePeriod: cdk.Duration.seconds(5),
      taskImageOptions: {
        image: ecs.ContainerImage.fromRegistry("ghcr.io/karelbemelmans/nextjs-docker:main"),
        containerPort: 3000,
      },
    });

    loadBalancedFargateService.targetGroup.configureHealthCheck({
      path: "/api/hello",
      healthyHttpCodes: "200",
      timeout: cdk.Duration.seconds(5),
      healthyThresholdCount: 2,
      unhealthyThresholdCount: 2,
      interval: cdk.Duration.seconds(10),
    });

    const cloudFront = new cloudfront.Distribution(this, "CloudFrontDistribution", {
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100, // Let's keep things cheap for now
      defaultBehavior: {

        // We need to talk to our HTTP listener on the ALB
        origin: new cloudfront_origins.LoadBalancerV2Origin(loadBalancedFargateService.loadBalancer, {
          protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
        }),

        // Should be good enough for our case
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,

        // Sane policies
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
        originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
        responseHeadersPolicy:cloudfront.ResponseHeadersPolicy.SECURITY_HEADERS,
      },

    // TODO: Pass in the certificate in US-EAST-1 from the other stack so we have our own domain name
      // domainNames: [hostedName.valueAsString + "." + hostedZoneName.valueAsString,],
      // certificate: certificate
    });
  }
}
