import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as cloudfront_origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as ecsPatterns from "aws-cdk-lib/aws-ecs-patterns";
import {Construct} from "constructs";

interface NextJSStackProps extends cdk.StackProps {
  hostedZoneId: string;
  hostedZoneName: string;
  hostedName: string;
  certificate: acm.Certificate;
}

export class NextJSStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: NextJSStackProps) {
    super(scope, id, props);

    const containerImage = new cdk.CfnParameter(this, "containerImage", {
      type: "String",
      description: "Container image, e.g. ghcr.io/karelbemelmans/nextjs-docker:main",
      default: "ghcr.io/karelbemelmans/nextjs-docker:main"
    });

    // Load our existing Route53 zone
    const route53Zone = route53.HostedZone.fromHostedZoneAttributes(this, "HostedZone", {
      hostedZoneId: props.hostedZoneId,
      zoneName: props.hostedZoneName
    });

    // Create a new certificate to be used by the ALB listener
    const certificate = new acm.Certificate(this, "Certificate", {
      domainName: props.hostedName + "." + props.hostedZoneName,
      validation: acm.CertificateValidation.fromDns(route53Zone)
    });

    // We create a custom VPC to make sure we have some control over it, in our case only that we want 2 AZ's max
    const vpc = new ec2.Vpc(this, "MyVpc", {maxAzs: 2});
    const cluster = new ecs.Cluster(this, "Cluster", {vpc});

    // This will create an ALB listening on HTTPS only
    const loadBalancedFargateService = new ecsPatterns.ApplicationLoadBalancedFargateService(this, "Service", {
      cluster,
      publicLoadBalancer: true,
      memoryLimitMiB: 512,
      cpu: 256,
      healthCheckGracePeriod: cdk.Duration.seconds(5),
      taskImageOptions: {
        image: ecs.ContainerImage.fromRegistry(containerImage.valueAsString),
        containerPort: 3000
      },
      certificate,

      // Providing the DNS name and zone here will create the A ALIAS record in Route53
      domainName: props.hostedName + "." + props.hostedZoneName,
      domainZone: route53Zone
    });

    loadBalancedFargateService.targetGroup.configureHealthCheck({
      path: "/api/hello",
      healthyHttpCodes: "200",
      timeout: cdk.Duration.seconds(5),
      healthyThresholdCount: 2,
      unhealthyThresholdCount: 2,
      interval: cdk.Duration.seconds(10)
    });

    const cloudFront = new cloudfront.Distribution(this, "CloudFrontDistribution", {
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100, // Let's keep things cheap for now
      defaultBehavior: {
        // We need to talk to our HTTP listener on the ALB
        origin: new cloudfront_origins.LoadBalancerV2Origin(loadBalancedFargateService.loadBalancer, {
          protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY
        }),

        // Should be good enough for our case
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,

        // Sane policies
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
        originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
        responseHeadersPolicy: cloudfront.ResponseHeadersPolicy.SECURITY_HEADERS
      },

      domainNames: [props.hostedName + "." + props.hostedZoneName],
      certificate: props.certificate
    });
  }
}
