# Minti v2 progress / resume point

## 2026-10-30 — baseline and audit

- User-provided directory was empty. Cloned https://github.com/AkshajM16/MintiFinance with full history.
- Clean baseline main at 4b1479e; no existing tags. Created annotated v1.0.0-precloud and feature/minti-cloud-v2.
- Read settings, models/serializers/views for users, transactions, budgets, chat, goals, bills, events; reviewed frontend API/auth/budget/application shell, feature inventory, Docker, dependencies and README.
- See V2_PLAN.md for findings, design and fixed 20-hour allocation.
- Actual user intervention: none. No cloud resources or paid LLM calls.
- Local setup in progress: Python 3.12 virtualenv; npm baseline install/build; Docker daemon stopped, native PostgreSQL tools available.
- Estimated audit/security effort: 2h of 20h (estimate, not measured human labor).

## Local implementation milestone

- Added post-commit events, SQS publisher/consumer/replay command, processed-event receipts, unique period/threshold alerts and authenticated paginated retrieval; polling React panel.
- Added initial migrations for all persisted apps; `manage.py migrate` succeeded against isolated PostgreSQL 17 on 127.0.0.1:55432.
- Fixed budget authorization/validation, cross-user event references, amount validation, OAuth state/nonce/verified email, and chat role/size validation + generic provider errors.
- Baseline `npm ci` failed: stale lockfile. After regenerating lockfile, build failed: invalid PostCSS plugin config. Both fixed; build subsequently passed. Raw initial build failure retained.
- Initial backend run: 43 passed, 2 failed. Worker connection cleanup cannot run inside pytest's wrapping transaction; queue integration tests corrected to transactional tests (real commits), preserving production cleanup. Failure log retained in results/pytest-initial.txt.
- Credential inspection via boto3: no credentials, no region, no ~/.aws/config. No provisioning attempted. AWS deployment/live CloudWatch blocked on account setup and explicit authorization.
- Estimated feature effort: 4h; security/audit allocation 2h. Actual user intervention: none.

## Measurement / deployment-definition milestone

- Local sequential and 4-thread experiments: each 150 deliveries / 100 events / 125 expected and actual alerts; 0 duplicates, 0 missing, 0 processing failures. Independent PostgreSQL duplicate insert rejected in both.
- Three 50-event latency trials recorded in benchmark_summary.json and 450-row benchmark_runs.csv; p95 28.930750 / 15.494166 / 30.842916 ms (local PostgreSQL + emulated SQS only).
- Injected poison: 3 attempts → 1 emulator DLQ message; transient: 2 attempts → success; healthy: 1 success; 4 expected/actual alerts and no replay duplicates. JSON logs investigated by stable event IDs.
- Browser E2E passed against real Django + separate worker + PostgreSQL, emulated queue. Production Docker image built and health/SPA/static/auth checks passed.
- Nine CDK assertions and CloudFormation schema lint passed after fixing IMDS configuration; synthesized without provisioning.
- CI and gated manual OIDC infrastructure workflow added. Existing-instance app updates deliberately use documented SSM procedure; account-specific OIDC roles are pending setup.
- Additional regression fixes: calendar sync validation/preserved links, savings amount validation/row locking, bill boolean parsing, malformed date/query validation, unreadable input background.
- Estimated workstream allocation remains 2h audit/security + 5h deployment + 4h alerts + 4h testing/CI + 3h operations + 2h evidence = 20h. This is a scope estimate, not measured human completion time. Actual user intervention so far: none.

## Release preparation

- Final local backend suite: 54 passed; browser workflow: 1 passed; infrastructure assertions: 9 passed. TypeScript/build, frontend lint, critical Python lint, migration drift, CloudFormation schema lint, dependency audits and production Docker smoke passed.
- Zero reported npm/runtime Python advisories at audit time; no advisory suppression. Audits are point-in-time checks, not guarantees of security.
- Commits: a0b06aa plan; d0afb81 feature/security/migrations; e772544 tests/benchmark harness/container/CDK/CI.
- Draft PR and GitHub CI status to be recorded after push. Cloud acceptance remains explicitly blocked by credentials and cost approval; optional AI alert explanation and automatic existing-instance app rollout omitted within scope.
- No human peer review; implementation reviewed by the coding agent and verified through executed automated tests. No further user input required for completed local work.
