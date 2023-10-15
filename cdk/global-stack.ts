import * as cdk from "aws-cdk-lib";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as route53 from "aws-cdk-lib/aws-route53";
import {Construct} from "constructs";

interface GlobalStackProps extends cdk.StackProps {
  hostedZoneId: string;
  hostedZoneName: string;
  hostedName: string;
}

export class GlobalStack extends cdk.Stack {
  certificate: acm.Certificate;

  constructor(scope: Construct, id: string, props: GlobalStackProps) {
    super(scope, id, props);

    // Load our existing Route53 zone
    const route53Zone = route53.HostedZone.fromHostedZoneAttributes(this, "HostedZone", {
      hostedZoneId: props.hostedZoneId,
      zoneName: props.hostedZoneName
    });

    // Create a new certificate to be used by the ALB listener
    this.certificate = new acm.Certificate(this, "Certificate", {
      domainName: props.hostedName + "." + props.hostedZoneName,
      validation: acm.CertificateValidation.fromDns(route53Zone)
    });
  }
}
