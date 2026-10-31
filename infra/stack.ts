import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_ec2 as ec2, aws_sqs as sqs, aws_iam as iam, aws_logs as logs, aws_cloudwatch as cw, aws_s3_assets as assets } from 'aws-cdk-lib';
import * as path from 'node:path';

export class MintiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const vpc = new ec2.Vpc(this, 'Vpc', { maxAzs: 1, natGateways: 0,
      subnetConfiguration: [{ name: 'outbound', subnetType: ec2.SubnetType.PUBLIC, cidrMask: 24 }] });
    const sg = new ec2.SecurityGroup(this, 'PrivateAccess', { vpc, description: 'No inbound access. Use SSM port forwarding.', allowAllOutbound: true });
    const dlq = new sqs.Queue(this, 'DeadLetters', { encryption: sqs.QueueEncryption.SQS_MANAGED, enforceSSL: true,
      retentionPeriod: cdk.Duration.days(14) });
    const queue = new sqs.Queue(this, 'BudgetEvents', { encryption: sqs.QueueEncryption.SQS_MANAGED, enforceSSL: true,
      visibilityTimeout: cdk.Duration.seconds(60), receiveMessageWaitTime: cdk.Duration.seconds(20),
      retentionPeriod: cdk.Duration.days(4), deadLetterQueue: { queue: dlq, maxReceiveCount: 3 } });
    const logGroup = new logs.LogGroup(this, 'ApplicationLogs', { retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY });
    new cw.Alarm(this, 'DeadLetterAlarm', { metric: dlq.metricApproximateNumberOfMessagesVisible({ period: cdk.Duration.minutes(1), statistic: 'Maximum' }),
      threshold: 1, evaluationPeriods: 1, treatMissingData: cw.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Budget event exhausted retries. Inspect event_processing_failed logs and DLQ; repair before replay.' });
    const role = new iam.Role(this, 'InstanceRole', { assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore')] });
    queue.grantSendMessages(role); queue.grantConsumeMessages(role);
    logGroup.grantWrite(role);
    const source = new assets.Asset(this, 'ApplicationSource', { path: path.join(__dirname, '..'),
      exclude: ['.git', '.venv', 'node_modules', 'infra/node_modules', 'infra/cdk.out', 'work', 'results',
        'test-results', 'playwright-report', '.env', '**/.env', '**/.env.*', '**/__pycache__', '.pytest_cache', 'dist'] });
    source.grantRead(role);
    const instance = new ec2.Instance(this, 'Application', { vpc, securityGroup: sg, role,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      instanceType: new ec2.InstanceType('t3.small'),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(), httpTokens: ec2.HttpTokens.REQUIRED, httpPutResponseHopLimit: 2,
      blockDevices: [{ deviceName: '/dev/xvda', volume: ec2.BlockDeviceVolume.ebs(30, {
        encrypted: true, volumeType: ec2.EbsDeviceVolumeType.GP3, deleteOnTermination: false }) }],
    });
    instance.addUserData(
      'set -eu', 'dnf install -y docker unzip', 'systemctl enable --now docker',
      'mkdir -p /usr/local/lib/docker/cli-plugins /opt/minti',
      'cd /tmp',
      'curl -fsSLO https://github.com/docker/compose/releases/download/v2.39.4/docker-compose-linux-x86_64',
      'curl -fsSL https://github.com/docker/compose/releases/download/v2.39.4/checksums.txt -o compose-checksums.txt',
      "grep ' docker-compose-linux-x86_64$' compose-checksums.txt | sha256sum -c -",
      'install -m 755 docker-compose-linux-x86_64 /usr/local/lib/docker/cli-plugins/docker-compose',
      `aws s3 cp s3://${source.s3BucketName}/${source.s3ObjectKey} /tmp/minti.zip --region ${this.region}`,
      'unzip -o /tmp/minti.zip -d /opt/minti', 'cd /opt/minti',
      `export AWS_REGION='${this.region}' SQS_QUEUE_URL='${queue.queueUrl}' CLOUDWATCH_LOG_GROUP='${logGroup.logGroupName}'`,
      'bash scripts/bootstrap-instance.sh'
    );
    new cdk.CfnOutput(this, 'InstanceId', { value: instance.instanceId });
    new cdk.CfnOutput(this, 'QueueUrl', { value: queue.queueUrl });
    new cdk.CfnOutput(this, 'DeadLetterUrl', { value: dlq.queueUrl });
    new cdk.CfnOutput(this, 'LogGroup', { value: logGroup.logGroupName });
    new cdk.CfnOutput(this, 'SourceUri', { value: `s3://${source.s3BucketName}/${source.s3ObjectKey}` });
    cdk.Tags.of(this).add('Project', 'Minti-v2');
  }
}
