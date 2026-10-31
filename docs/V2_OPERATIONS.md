# Operations, deployment and recovery

## Current status / prerequisites

No AWS resources have been provisioned. Credential inspection found no credentials, region or ~/.aws/config, and AWS CLI is absent. All verified results are local. No live Google OAuth or paid LLM calls were made. Before provisioning, obtain explicit owner approval for the resource/cost plan below; `cdk bootstrap` also creates resources and is inside this approval boundary.

Install AWS CLI v2 and Session Manager plugin from AWS's official installers. Authenticate locally with `aws configure sso` then `aws sso login --profile minti`; do not paste keys in chat. Return only whether `aws sts get-caller-identity --profile minti` succeeds, selected region, and authorization/cost ceiling. Account IDs need not be posted publicly.

## Resource and cost plan (estimate, not spend)

Default region us-east-1. One t3.small (2 vCPU / 2GB), 30GB encrypted gp3, one public IPv4 for outbound connectivity, no NAT or load balancer; SQS queue/DLQ; one seven-day log group and one standard alarm; S3 deployment assets/CDK bootstrap resources. No public inbound ports. Application access is through SSM.

Budget roughly **$22–30/month** for a lightly used demo, excluding unusually high traffic, CPU credits, snapshots and optional OpenAI usage. EC2 is roughly $0.021/hour (~$15.30/730h); IPv4 $0.005/hour (~$3.65); gp3 roughly $0.08/GB-month (~$2.40 for 30GB). Logs, alarm, SQS, S3 and transfer are usage-based; these are planning estimates, not a guarantee or verified bill. T3 Unlimited CPU-credit charges can apply during builds/load. A short one-day demo is roughly $1 plus storage/usage. Do not assume free-tier eligibility. Prices must be reconfirmed for the chosen region/account before approval.

Sources checked 2026-10-30: [EC2 T3 prices](https://aws.amazon.com/ec2/instance-types/t3/), [IPv4 pricing](https://aws.amazon.com/vpc/pricing/), [EBS pricing](https://aws.amazon.com/ebs/pricing/). No paid LLM budget is included.

## Local verification setup

```bash
uv venv --python 3.12 .venv
uv pip install --python .venv/bin/python -r requirements.lock -r requirements-dev.txt
npm ci
npm --prefix infra ci
mkdir -p work
# If using Homebrew PostgreSQL tools; choose unused port and fresh directory.
initdb -D work/pgdata -A trust -U minti_test
pg_ctl -D work/pgdata -l work/postgres.log -o '-h 127.0.0.1 -p 55432 -k /tmp' start
createdb -h 127.0.0.1 -p 55432 -U minti_test minti_v2
export DEBUG=True ALLOW_SYNTHETIC_TESTS=1
export POSTGRES_HOST=127.0.0.1 POSTGRES_PORT=55432
export POSTGRES_USER=minti_test POSTGRES_DB=minti_v2
.venv/bin/python backend/manage.py migrate
.venv/bin/pytest -q
npx playwright install chromium
.venv/bin/python scripts/run_e2e.py
```

Trust authentication above is only for an isolated loopback synthetic cluster on your workstation. Do not reuse it for EC2. E2E needs free ports 5001, 8000, 5173; it starts/stops its own emulator/web/worker/Vite processes, deletes only its generated fixture user, and removes its temporary token file. Stop an existing Compose app first if port 8000 is occupied. No production test-login endpoint exists.

Local production image: copy `.env.example` to `.env`, generate DJANGO_SECRET_KEY and POSTGRES_PASSWORD locally with Python secrets, and protect `.env` with chmod 600. `docker compose up -d --build --wait app` runs web/database. Worker needs a configured SQS queue; use `scripts/run_e2e.py` for the fully local queue demo. `scripts/smoke.py` checks health, SPA, static JS and 401 on alerts. Do not print resolved `docker compose config` with real secrets; use `docker compose config --quiet`.

## Authorized initial AWS deployment

After explicit approval and local checks:

```bash
export AWS_PROFILE=minti AWS_REGION=us-east-1
export CDK_DEFAULT_REGION="$AWS_REGION"
export CDK_DEFAULT_ACCOUNT="$(aws sts get-caller-identity --query Account --output text)"
cd infra
npm ci
npm run build && npm test && npm run synth
npx cdk diff
# BILLABLE: run only after approval. Bootstrap creates S3/IAM resources.
npx cdk bootstrap "aws://$CDK_DEFAULT_ACCOUNT/$AWS_REGION"
npx cdk deploy --outputs-file ../deployment-outputs.json
cd ..
```

Instance bootstrap installs Docker/Compose, verifies the downloaded Compose checksum, downloads the exact CDK source asset, creates random secrets on disk without echoing them, builds the image, migrates and starts services. The source asset excludes .env files, node_modules, virtualenv, .git, work and results. Startup is not declared successful merely because CloudFormation succeeds: inspect `/var/log/cloud-init-output.log` via SSM and wait for Compose health checks.

Retrieve outputs locally:

```bash
export MINTI_INSTANCE_ID="$(aws cloudformation describe-stacks --stack-name MintiV2 --query 'Stacks[0].Outputs[?OutputKey==`InstanceId`].OutputValue' --output text)"
aws ssm start-session --target "$MINTI_INSTANCE_ID"
```

On the instance, `sudo -i`, `cd /opt/minti`, then `docker compose -f docker-compose.yml -f docker-compose.aws.yml ps`. Configure VITE_GOOGLE_CLIENT_ID and optional OPENAI_API_KEY with `sudoedit /opt/minti/.env` without pasting secrets into terminal commands/logs. Google client ID is public configuration; OpenAI key is secret. Register `http://localhost:8000/google-callback` in your Google OAuth application for the private forwarded demo, with the localhost origin. Rebuild after changing VITE_GOOGLE_CLIENT_ID (it is a frontend build argument). Recreate web/worker after backend secret changes. Do not enable paid LLM calls without an explicit limit.

From your laptop:

```bash
aws ssm start-session --target "$MINTI_INSTANCE_ID" \
  --document-name AWS-StartPortForwardingSession \
  --parameters '{"portNumber":["8000"],"localPortNumber":["8000"]}'
# In another terminal while forwarding is active:
.venv/bin/python scripts/smoke.py http://localhost:8000
```

Open localhost:8000. Do not add security-group HTTP ingress to make the demo public. Public hosting requires separate HTTPS/reverse-proxy/host/cookie configuration and is outside this implemented deployment.

## CI, OIDC and repeatable updates

`ci.yml` runs PostgreSQL pytest, critical Python lint, dependency audit, npm lint/type/build/audit, Playwright, CDK tests/synth and Docker build. `deploy.yml` is a manual infrastructure workflow restricted to main, protected environment `aws-demo`, and a successful CI run for the exact commit. No permanent AWS keys are used. It intentionally does not claim application code rollout on an existing instance: EC2 user-data is initial bootstrap only.

Before enabling deployment, in GitHub Settings → Environments create `aws-demo`, restrict deployment branches to main, require an owner reviewer, and define environment variables AWS_REGION and AWS_DEPLOY_ROLE_ARN. Create the GitHub OIDC provider in the AWS account. The deploy role's trust must require both:

```json
{
  "StringEquals": {
    "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
    "token.actions.githubusercontent.com:sub": "repo:AkshajM16/MintiFinance:environment:aws-demo"
  }
}
```

Allow this role to assume only this account/region's CDK bootstrap deployment, file-publishing and lookup roles; do not grant administrator access directly to the GitHub role. CDK's CloudFormation execution role also needs a reviewed permission boundary/policy for this stack's EC2/VPC, IAM instance role, SQS, CloudWatch Logs and alarm resources. Account-specific OIDC/bootstrap setup is **not provisioned or verified** by this repository. Manual CDK deployment is the supported fallback until that setup is reviewed. Environment approval is the cost authorization gate for dispatches; do not remove it.

Repeatable application update after `cdk deploy` publishes the new asset: record previous image ID and back up DB; read SourceUri from deployment outputs; on the instance download that S3 URI with its instance role, unzip into `/opt/minti` (asset excludes .env), then run `docker compose -f docker-compose.yml -f docker-compose.aws.yml up -d --build --wait`. Run the forwarded smoke check and synthetic alert workflow. Do not remove volumes. Initial migrations are tested; future destructive schema changes require a separate rollback plan. This manual rollout path is documented but not AWS-executed.

## Logs, alarm and real injected-failure investigation

Application logs are JSON with request_id, event_id, outcome and error_type. The web response carries X-Request-ID; publisher logs link it to event_id. Search `event_publish_failed` for lost post-commit publication. Worker logs include event/message IDs and receive attempt for failures. Error messages and financial payloads are not logged by this instrumentation.

Local executed scenario:

```bash
# Export synthetic DB variables from local setup first.
.venv/bin/python scripts/inject_failure.py
rg '5d6a764b-5e94-4154-aac9-32083cec746e' results/failure-events.jsonl
```

The poison message contains an invalid transaction UUID: three ValueError outcomes with attempts 1/2/3 and a stable event ID; the emulator moves it to DLQ. The transient injected RuntimeError appears once, followed by event_processed for the same ID; healthy processing also succeeds. See V2_BENCHMARKS.md for measured counts. This is a real injected local failure, not fabricated CloudWatch evidence.

After AWS authorization/deployment, read LogGroup output and use CloudWatch Logs Insights:

```text
fields @timestamp, outcome, event_id, message_id, attempt, error_type
| filter outcome in ["event_processing_failed", "event_publish_failed", "event_processed"]
| sort @timestamp desc
| limit 100
```

For a specific incident add `| filter event_id = "UUID"`. The alarm fires when DLQ ApproximateNumberOfMessagesVisible >= 1 for one minute. No SNS notification is configured. For a synthetic cloud fault, send a deliberately malformed body to the main queue using an authorized operator session, wait for 3 receives plus redrive, and record the message ID, logs, DLQ count and alarm state. This test remains pending; do not run it on real financial data.

After fixing a publication problem: on the instance run `docker compose exec app python manage.py replay_alert TRANSACTION_UUID`. After fixing processing: review DLQ content with an operator role, validate event identity, and republish specific recoverable events. Never blindly redrive poison messages or delete evidence. The worker role deliberately lacks DLQ receive/redrive permissions.

## Backup, recovery and teardown

On the instance, protect backup permissions:

```bash
cd /opt/minti
umask 077
docker compose exec -T db pg_dump -U minti -d minti > minti-backup.sql
```

Store a copy securely off-instance before teardown. For a recovery drill, restore into a fresh isolated database using `psql -v ON_ERROR_STOP=1`, verify counts, then test a synthetic workflow. Backup restore is documented, **not yet exercised**. Root volume persistence is not a backup. Existing installations without migration history must compare schema and back up before considering `migrate --fake-initial`.

`docker compose down` stops containers and preserves PostgreSQL volumes; never use `down -v` unless explicitly authorizing data deletion. `pg_ctl -D work/pgdata stop` stops the local synthetic cluster without deleting it.

Cloud teardown, after saving needed evidence/backups and obtaining deletion authorization:

```bash
cd infra
npx cdk destroy MintiV2
```

Root EBS is intentionally retained on instance termination and continues billing. Locate the recorded instance's volumes, verify backup, then explicitly delete retained volumes/snapshots if desired. CDK bootstrap S3 assets, bootstrap stack/roles and any manually configured OIDC role/provider are not removed with MintiV2; remove only if not shared with other projects. Log group is destroyed with this stack, so export required evidence first. Confirm EC2, EBS, IPv4, SQS and CloudWatch billing/resources after cleanup.
