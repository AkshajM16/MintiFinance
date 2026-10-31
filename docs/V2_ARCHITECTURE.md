# Minti v2 architecture and tradeoffs

## Complete local workflow

React 19/TypeScript → authenticated Django REST transaction creation → PostgreSQL commit → SQS standard event → separate Django management-command consumer → PostgreSQL alert → authenticated React notification panel (3s polling).

The existing transaction, budget, savings, bill, analytics, prediction and GPT-4o-mini screens remain. Budget requests now authenticate correctly. A small global alert panel is added; no frontend redesign or AI agent framework. Chat remains read-only and has no mutation tools.

## Budget semantics

Use existing Budget, Category and Transaction models. A budget category matches transaction category case-insensitively. A null budget category means all expenses. Daily, Monday-start weekly, monthly and yearly calendar periods are evaluated in UTC and clipped to the budget's explicit start/end; intervals are start-inclusive/end-exclusive. New budgets without a start begin at the current calendar period boundary. The transaction's spending date selects the period, including backdated events. Income/transfers do not count.

Sum authoritative expense records rather than trusting client-maintained Budget.spent or queue amounts. Existing FloatFields remain to avoid a broad migration; each amount is converted via Decimal(str(value)) and rounded half-up to cents before addition. New transaction/budget inputs reject nonfinite, negative, zero, excessive and sub-cent amounts. Two independent immutable snapshots are emitted at 80% and 100%; crossing both creates both. Edits/deletes do not trigger recalculation or retract historical alerts. Budget definition changes within a period are not versioned. These are explicit student-scope limits.

## Reliability

Transaction UUID doubles as stable event UUID. Payload version and UUID identity are validated; worker loads the transaction's actual owner and financial data. A ProcessedEvent primary-key insert and alert writes share one atomic transaction. Concurrent duplicate inserts wait on PostgreSQL uniqueness; failed processing rolls the receipt back. A separate database constraint on `(user, budget, period_start, threshold)` protects different events crossing the same threshold. This is at-least-once delivery with idempotent effects, not exactly-once processing.

Publish via transaction.on_commit, with bounded SDK retries. A committed expense can lose its event if the process dies before publishing or publication fails. Log event_publish_failed with event/request IDs; operator republishes via `manage.py replay_alert UUID`. No outbox, automatic reconciliation or guarantee of publication durability. If a transaction is deleted before processing it is ignored. If processing exceeds visibility, another delivery is safe but redundant; no heartbeat extension in this small worker.

Worker acknowledges only after successful processing/commit. Crashing after commit but before delete safely replays. Failed messages remain for retry: 60s visibility, three receives, then DLQ with 14-day retention. One message per receive reduces in-flight complexity. Queue errors do not permanently terminate the worker; Compose restarts crashed processes.

## Deployment definitions (not deployed)

One t3.small EC2 instance; encrypted 30GB gp3 root volume retained on termination; PostgreSQL 17 in a persistent Compose volume. Web and worker use the same nonroot Python 3.12 image. Multi-stage build compiles the SPA and serves its assets through WhiteNoise, with Django SPA routes and a database health endpoint. PostgreSQL is not exposed on a host port; application binds to loopback port 8000.

One public subnet supplies outbound internet without NAT; security group has no inbound rules. SSM Session Manager supplies private access. No public financial HTTP traffic, no SSH. IAM role grants main-queue send/consume, designated log-group writes, one deployment asset read and AWS's SSM core policy; no embedded AWS keys. IMDSv2 required, hop limit 2 permits container credential access. All containers on this single host share the instance-role trust boundary; this is not per-container IAM isolation.

CDK creates SQS main/DLQ, log group with seven-day retention and a DLQ-visible-message alarm. Docker awslogs ships stdout. JSON logs carry request/event IDs and safe error classes, never financial payloads or credentials. No SNS notification subscription; inspect alarm state in CloudWatch.

## Security and preservation

Fail closed on missing/insecure Django secret with DEBUG=False. Google OAuth starts with random server-session state/nonce, ten-minute expiry, one-time validation, verified email and audience/signature checks. Frontend validates state and clears the URL fragment; tokens are stored only after backend verification. Existing implicit flow and localStorage bearer tokens remain a limitation; a future public production release should use authorization code/PKCE and stronger token/session lifecycle controls.

Only user/assistant roles and bounded content enter chat history; financial context is untrusted user-role data, never a second system instruction. Provider errors return generic text. A prompt cannot guarantee resistance to every prompt injection, but the assistant has no write tools. Live LLM calls require separate budget authorization.

Initial migrations preserve existing model definitions. Existing populated databases without migration history require backup and schema comparison before `migrate --fake-initial`; never blindly fake migrations. Calendar resync now validates before changes and updates existing rows, retaining transaction links. Savings contributions are validated and locked; bill booleans use DRF validation.

## Tradeoffs and exclusions

Single host/database, no HA, no RDS, no autoscaling, no production uptime target. No comprehensive load test or coverage target. Basic lint catches critical Python errors and React hook dependencies; it is not a full style cleanup. Automatic application rollout is deferred: approved CDK workflow provisions infrastructure; application updates use the documented SSM procedure. Initial bootstrap builds on the instance and may need several minutes on 2GB RAM.

References: [SQS visibility/retry](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-visibility-timeout.html), [CloudWatch CDK alarms](https://docs.aws.amazon.com/cdk/v2/guide/how-to-set-cw-alarm.html). SDK behavior was additionally checked against the installed CDK TypeScript declarations and synthesized template.
