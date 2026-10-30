# Minti v2 implementation plan

Baseline: `4b1479e`, cloned into the user-provided empty directory on 2026-10-30. This is the current repository baseline, not a claim about the exact hackathon submission. Annotated tag `v1.0.0-precloud`; branch `feature/minti-cloud-v2`.

## Scope and budget (student hours)

| Workstream | Hours | Deliverable |
|---|---:|---|
| Audit/security | 2 | migrations, validation, OAuth state/nonce, chat trust boundary |
| Deployment | 5 | CDK EC2 + Compose + SQS, private SSM access |
| Alerts | 4 | post-commit publish, worker, unique alerts, notification panel |
| Testing/CI | 4 | PostgreSQL pytest, Playwright, CI and manual deployment |
| Operations | 3 | JSON logs, DLQ alarm, injected failure investigation |
| Evidence | 2 | seeded benchmarks, raw results, handoff |

Reuse React pages, Django models, GPT-4o-mini and PostgreSQL. No RDS, NAT gateway, Kubernetes, paid LLM tests, new agent framework, or frontend redesign. Optional AI explanation omitted to preserve time.

## Architecture decisions

One EC2 t3.small, encrypted EBS, no inbound security-group rules; SSM port forwarding to loopback HTTP. Public subnet supplies outbound internet without a NAT gateway; public application access is disabled. Compose runs PostgreSQL, web, and one SQS consumer. SQS standard queue, 60-second visibility, three receives then DLQ; seven-day logs and DLQ alarm.

Alerts use existing Budget and category names, UTC calendar periods (daily, Monday-based weekly, monthly, yearly), clipped to budget start/end. No category means all expenses. Worker recomputes authoritative spending and uses Decimal(str(value)) rounded to cents; legacy FloatFields remain. Alert identity: user, budget, period start, threshold. Processed event UUID committed atomically with alerts. Publication occurs after database commit; failed publication is logged and manually replayable (no outbox).

## Audit findings and risks

- No initial migrations committed; fresh deployments cannot reliably migrate.
- Budget UI lacks authorization headers; writes bypass serializer validation.
- Google login uses fixed nonce and no state; backend exposes verification exceptions.
- Chat accepts arbitrary message roles and streams raw provider exceptions.
- Financial fields are floats; avoid a broad migration, normalize individual values before sums.
- Docker daemon initially unavailable; use isolated native PostgreSQL for tests.
- AWS CLI absent; credential availability still to inspect without printing secrets.
- Existing goal/bill/event endpoints need targeted validation while preserving behavior.

## Milestones

1. Preserve baseline, audit, establish reproducible local environment.
2. Implement and test alerts and essential security fixes.
3. Synthesize infrastructure; run CI-equivalent checks and browser workflow. Provision only after explicit approval.
4. Run sequential/concurrent duplicate, latency and failure benchmarks; record all failures and reruns; prepare commits and PR.
