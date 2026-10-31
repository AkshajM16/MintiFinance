# Minti v2 measured engineering evidence

Measured 2026-10-30 America/Chicago. No AWS or paid LLM calls. These results are local engineering measurements, not cloud throughput, production uptime, or scalability claims.

## Environment and reproducibility

macOS 26.6.2 arm64; Python 3.12.12; Django 5.2.18; PostgreSQL 17.11 Homebrew; seed 2025. Exact runtime information is also in `results/benchmark_summary.json`. Install runtime dependencies from `requirements.lock`, test dependencies from `requirements-dev.txt`, frontend from `package-lock.json`, CDK from `infra/package-lock.json`.

Run from the repository root, using a disposable synthetic PostgreSQL database:

```bash
export DEBUG=True ALLOW_SYNTHETIC_TESTS=1
export POSTGRES_HOST=127.0.0.1 POSTGRES_PORT=55432
export POSTGRES_USER=minti_test POSTGRES_DB=minti_v2
# This session used a loopback-only initdb cluster in ignored work/pgdata.
# Alternative: provide credentials for your isolated PostgreSQL container.
.venv/bin/python backend/manage.py migrate --noinput
.venv/bin/python scripts/benchmark_alerts.py --seed 2025 \
  > results/benchmark-execution.txt 2> results/benchmark-events.jsonl
.venv/bin/python scripts/inject_failure.py \
  > results/failure-execution.txt 2> results/failure-events.jsonl
```

The scripts create new uniquely named synthetic users on each run; they never erase previous measurements or existing users. Per-run JSON files are retained and CSV rows appended. The `*_summary.json` files point to the latest run. Redirect logs to a new filename on subsequent experiments to retain previous logs too.

## A: duplicate-processing correctness

Run `20261030T235452-0dabb70e`. Each mode creates 100 logical transaction events, with 25 selected by the seed receiving two extra deliveries. Amounts cycle through $50, $80, $100, $120 against separate $100 monthly budgets. Expected alert count is 125 (zero, one, two, two for each repeated four-event group).

| Mode | Worker threads | Deliveries | Logical events | Expected / actual unique alerts | Duplicate / missing alerts | Processing failures |
|---|---:|---:|---:|---:|---:|---:|
| Sequential | 1 | 150 | 100 | 125 / 125 | 0 / 0 | 0 |
| Concurrent | 4 | 150 | 100 | 125 / 125 | 0 / 0 | 0 |

Both experiments independently attempted a duplicate database insert and observed PostgreSQL reject it with IntegrityError. This correctness experiment calls the real processor directly; it does not measure queue transport. Tests additionally cover different concurrent events targeting one shared budget.

## B: event-to-persisted-alert latency

One background consumer thread, real PostgreSQL, Moto SQS standard queue, 60-second visibility, one message at a time, 1ms idle poll. Each qualifying event creates two thresholds. The coordinator starts `perf_counter` immediately before inserting a transaction and stops after querying and seeing both committed alerts. Timing includes the INSERT, emulated send/receive, processing, commit and observation polling. It excludes user/budget fixture setup, HTTP request time, frontend polling, real AWS network latency and CloudWatch. All timers run on one host; no cross-host clock synchronization is assumed. Percentiles use nearest rank, not interpolation.

| Independent trial | Events | p50 ms | p95 ms | Maximum ms |
|---|---:|---:|---:|---:|
| 1 | 50 | 14.637292 | 28.930750 | 55.349208 |
| 2 | 50 | 12.907916 | 15.494166 | 17.399125 |
| 3 | 50 | 14.338125 | 30.842916 | 67.076458 |

Zero latency-trial processing failures. Raw full-precision observations are in `results/benchmark_runs.csv`. Do not combine these into AWS latency or claim a production p95. Synthetic budgets are intentionally small; this does not establish performance on large user histories.

## C: retry and failure recovery

Run `failure-58de7c794100413581474ae7d69eb263`, local PostgreSQL + Moto SQS. Visibility is intentionally zero to exercise retries quickly; deployment uses 60 seconds.

- Poison event `5d6a764b-5e94-4154-aac9-32083cec746e`: 3 failed attempts, 1 DLQ message.
- Transient event `029bc6bc-ea28-42c1-a4d5-37b4452fc868`: injected RuntimeError on attempt 1; success on attempt 2.
- Healthy event `0322131b-b6c0-4b5c-ba55-d063b8eb7989`: success on attempt 1.
- Expected/actual alerts after replay: 4/4; duplicates introduced: 0.

`results/failure_summary.json` includes each attempt. `results/failure-events.jsonl` is the real structured investigation log. This demonstrates application acknowledgement behavior and emulator redrive; real SQS/DLQ evidence remains blocked by AWS setup/authorization.

## D: automated quality checks

54 backend tests, 1 Playwright workflow and 9 infrastructure assertions passed locally. GitHub CI run [41148044609](https://github.com/AkshajM16/MintiFinance/actions/runs/41148044609) completed successfully for commit `981b9f84a56fb6402a9ece2bea3a1b8d84e19bf1`, including PostgreSQL tests, browser workflow and Docker build. This is an actual hosted result, not an inference from local checks. Later revisions receive their own checks on PR #1. See `results/quality_summary.json` and `results/github-ci.json` for machine-readable status. Commands:

```bash
.venv/bin/pytest -q --junitxml=results/pytest.xml
.venv/bin/ruff check backend scripts --select E9,F63,F7,F82
.venv/bin/pip-audit --no-deps --disable-pip -r requirements.lock
npm ci
npm run lint
npm run build             # includes tsc --noEmit
npm audit --audit-level=high
.venv/bin/python scripts/run_e2e.py
npm --prefix infra ci
npm --prefix infra run build
npm --prefix infra test
npm --prefix infra run synth
.venv/bin/cfn-lint infra/cdk.out/MintiV2.template.json
docker build -t minti-v2:local .
docker compose -p minti-v2-verification up -d --no-build --wait app
.venv/bin/python scripts/smoke.py
```

Playwright creates a real token via an offline fixture command, inserts it into browser storage, creates an expense through the existing modal, and checks both alert statuses and amounts. Django, the worker, the browser and PostgreSQL are real separate processes; only SQS is emulated. There is no test-login API in the production application. OAuth and LLM automated tests use deterministic mocks; live provider functionality is not claimed verified.

## Failures retained and engineering fixes

- Baseline npm ci: package manifest/lock mismatch; lock regenerated.
- Baseline frontend build: invalid PostCSS plugin array; fixed configuration. `results/baseline-build.txt` preserves the failure.
- First backend run: 43 passed / 2 failed due to worker connection cleanup inside pytest's wrapping transaction. Queue tests switched to real-commit transactional isolation. `results/pytest-initial.txt` and XML retained.
- CDK validation exposed incompatible IMDS convenience/advanced settings; use explicit `HttpTokens.REQUIRED` and hop limit 2. Nine template assertions and CloudFormation schema lint verify final shape.
- Initial npm audit found 13 issues; compatible updates plus React Router 7 removed reported issues; browser workflow and build verify the migration. Initial audit JSON retained.
- pip-audit's temporary ensurepip process crashed on the local uv Python runtime; auditing the fully pinned lock with `--disable-pip --no-deps` succeeded. No advisory was suppressed.

## E: deployment evidence boundary

Local production Docker image build/startup and loopback health/SPA/static/auth smoke checks were executed. CDK synth is not AWS provisioning. AWS deployment, AWS endpoint smoke, CloudWatch ingestion/alarm transition, live SQS retry/DLQ, and repeated cloud deployment have not been executed. No cloud/uptime claim is supported.
