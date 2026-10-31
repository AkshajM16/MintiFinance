import { App } from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { MintiStack } from './stack';
const template = Template.fromStack(new MintiStack(new App(), 'Test'));
template.resourceCountIs('AWS::EC2::Instance', 1);
template.resourceCountIs('AWS::SQS::Queue', 2);
template.resourceCountIs('AWS::CloudWatch::Alarm', 1);
template.resourceCountIs('AWS::EC2::NatGateway', 0);
template.resourceCountIs('AWS::EC2::SecurityGroupIngress', 0);
template.hasResourceProperties('AWS::EC2::SecurityGroup', { SecurityGroupIngress: Match.absent() });
template.hasResourceProperties('AWS::EC2::Instance', { MetadataOptions: Match.objectLike({ HttpTokens: 'required', HttpPutResponseHopLimit: 2 }) });
template.hasResourceProperties('AWS::EC2::Instance', {
  BlockDeviceMappings: Match.arrayWith([Match.objectLike({ Ebs: Match.objectLike({ Encrypted: true, DeleteOnTermination: false }) })]) });
template.hasResourceProperties('AWS::SQS::Queue', { VisibilityTimeout: 60, RedrivePolicy: Match.objectLike({ maxReceiveCount: 3 }) });
console.log('9 infrastructure assertions passed');
