# Resume evidence — draft, supported by measured project results

## Implemented features

Added asynchronous 80%/100% budget alerts to the existing React/Django financial planner, with post-commit publication, stable event identities, PostgreSQL uniqueness, retries/DLQ handling and authenticated notifications. Hardened OAuth state/nonce, financial/API validation, user isolation and GPT-4o-mini chat role/error boundaries. Added PostgreSQL tests, browser workflow, reproducible benchmark harness, container packaging, CDK infrastructure and CI.

## Technologies genuinely used

Executed locally: React 19, TypeScript, Vite, Django 5, Django REST Framework, PostgreSQL 17, Python 3.12, pytest, Playwright/Chromium, Docker Compose, boto3 and Moto's SQS emulator, AWS CDK TypeScript synthesis/assertions, CloudFormation schema lint. GitHub Actions CI also completed successfully (run 41148044609). Workflow status and final test counts are recorded in results/quality_summary.json.

AWS-hosted services: **none deployed**. EC2/SQS/DLQ/IAM/CloudWatch definitions exist and synthesize; no claim of AWS-hosted operation, AWS latency, alarm delivery, uptime or scale. GPT-4o-mini is preserved in code and deterministically mocked in tests; no paid model calls were executed.

## Verified numerical results

- 200 logical synthetic events across two independent correctness modes; 300 submitted processor deliveries; 250 expected/actual unique alerts; 0 duplicate alerts, 0 missing alerts, 0 processing failures. Each mode individually: 100 events, 150 deliveries, 125 alerts.
- Database rejected an independently attempted duplicate row in both modes.
- 150 qualifying latency observations (3 × 50): trial p50 14.64 / 12.91 / 14.34 ms; p95 28.93 / 15.49 / 30.84 ms; maximum 55.35 / 17.40 / 67.08 ms. Local PostgreSQL + emulated SQS; no cloud inference.
- Poison message: 3 attempts, 1 emulator DLQ message. Transient failure: success on attempt 2. Healthy message: success on attempt 1. Recovery/replay: 0 duplicate alerts.
- 54 backend tests and 1 Playwright transaction-to-alert workflow passed; container health/SPA/static/auth smoke passed; 9 infrastructure assertions passed. Final backend count and GitHub CI result: see quality_summary.json.

## Three draft resume bullets supported by project evidence

- Engineered asynchronous budget alerts in Django, React and PostgreSQL; processed 300 synthetic deliveries across sequential/concurrent trials with zero duplicate or missing alerts.
- Built a reproducible SQS-emulation benchmark and retry/DLQ workflow, measuring 150 local alert latencies and verifying recovery on the second attempt without duplicate alerts.
- Hardened OAuth and AI-chat request boundaries, added 54 PostgreSQL backend tests and a passing Playwright workflow, and defined EC2/SQS/CloudWatch infrastructure with AWS CDK and 9 passing infrastructure assertions.

These bullets intentionally avoid AWS-deployed, production-scale, peer-reviewed or uptime claims. No human peer review occurred. Exact commands, raw results, environment, earlier failures and limitations are in V2_BENCHMARKS.md and V2_OPERATIONS.md.
