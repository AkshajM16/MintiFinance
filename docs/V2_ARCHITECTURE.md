# Architecture

React SPA → authenticated Django REST API → PostgreSQL commit → SQS standard queue → worker → PostgreSQL alerts → authenticated polling panel.

See V2_PLAN.md for period and deduplication semantics. At-least-once delivery requires database uniqueness, not a claim of exactly-once processing. Authoritative financial data is loaded by transaction/user identity, never trusted from event amounts. Row locks serialize duplicate logical events; threshold uniqueness protects different events crossing the same threshold.

Deployment target: one EC2 instance, persistent PostgreSQL volume, app and worker Compose services, SQS/DLQ and CloudWatch. Private SSM access avoids public HTTP. Single-instance availability and disk durability are limited; backups and teardown require operator care.

References: [SQS visibility/retry semantics](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-visibility-timeout.html), [CloudWatch CDK alarms](https://docs.aws.amazon.com/cdk/v2/guide/how-to-set-cw-alarm.html).
