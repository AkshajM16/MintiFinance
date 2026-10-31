#!/usr/bin/env python3
"""Synthetic PostgreSQL benchmark. SQS is emulated with Moto, never AWS."""

import argparse
from concurrent.futures import ThreadPoolExecutor
import csv
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import platform
import random
import sys
import threading
import time
import uuid

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "minti.settings")
import django

django.setup()
import boto3
from moto import mock_aws
from django.conf import settings
from django.db import connection, connections, IntegrityError, transaction
from apps.users.models import User
from apps.budgets.models import Budget
from apps.transactions.models import Transaction
from apps.alerts.models import BudgetAlert
from apps.alerts.service import event_for, process_event
from apps.alerts.queue import handle_message


def guard():
    if not settings.DEBUG or os.environ.get("ALLOW_SYNTHETIC_TESTS") != "1":
        raise SystemExit(
            "Requires DEBUG=True and ALLOW_SYNTHETIC_TESTS=1 with an isolated PostgreSQL database"
        )
    if connection.vendor != "postgresql":
        raise SystemExit("PostgreSQL is required")


def fixture(run_id, label, index, amount=100):
    now = datetime.now(timezone.utc)
    user = User.objects.create_user(
        email=f"{run_id}-{label}-{index}@example.test", name="Synthetic benchmark"
    )
    budget = Budget.objects.create(
        user=user,
        name="Synthetic budget",
        amount=100,
        period="MONTHLY",
        start_date=now.replace(day=1, hour=0, minute=0, second=0, microsecond=0),
    )
    return user, budget, amount


def expense(user, amount):
    return Transaction.objects.create(
        user=user,
        amount=amount,
        type="EXPENSE",
        description="Synthetic benchmark",
        date=datetime.now(timezone.utc),
    )


def percentile(values, p):
    values = sorted(values)
    import math

    return values[max(0, math.ceil(p * len(values)) - 1)]


def run(seed=2025):
    guard()
    run_id = (
        datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S")
        + "-"
        + uuid.uuid4().hex[:8]
    )
    rng = random.Random(seed)
    rows, outcomes = [], []
    env = {
        "kind": "local-postgresql-emulated-sqs",
        "platform": platform.platform(),
        "machine": platform.machine(),
        "python": platform.python_version(),
        "django": django.get_version(),
        "seed": seed,
        "workers": "correctness: 1 and 4 threads; latency: 1 background consumer thread",
        "queue": "Moto SQS standard, no AWS network; latency visibility 60s; 1ms idle poll",
        "latency_definition": "perf_counter before transaction INSERT to coordinator observing committed alert rows, includes queue API and 1ms observation polling; same host clock",
    }
    with connection.cursor() as c:
        c.execute("SELECT version()")
        env["postgresql"] = c.fetchone()[0]
    for mode, workers in [("sequential", 1), ("concurrent", 4)]:
        events, user_ids = [], []
        expected = 0
        for i in range(100):
            amount = [50, 80, 100, 120][i % 4]
            user, _, _ = fixture(run_id, mode, i, amount)
            user_ids.append(user.id)
            events.append(event_for(expense(user, amount)))
            expected += int(amount >= 80) + int(amount >= 100)
        duplicates = rng.sample(range(100), 25)
        deliveries = events + [events[i] for i in duplicates for _ in range(2)]
        rng.shuffle(deliveries)

        def deliver(event):
            start = time.perf_counter()
            error = ""
            try:
                process_event(event)
            except Exception as exc:
                error = type(exc).__name__
            finally:
                connections.close_all()
            return {
                "run_id": run_id,
                "phase": mode,
                "trial": 1,
                "event_id": event["event_id"],
                "latency_ms": (time.perf_counter() - start) * 1000,
                "error": error,
            }

        with ThreadPoolExecutor(max_workers=workers) as pool:
            samples = list(pool.map(deliver, deliveries))
        rows.extend(samples)
        alerts = BudgetAlert.objects.filter(user_id__in=user_ids)
        actual = alerts.count()
        unique = (
            alerts.values("user_id", "budget_id", "period_start", "threshold")
            .distinct()
            .count()
        )
        protected = False
        a = alerts.first()
        try:
            with transaction.atomic():
                BudgetAlert.objects.create(
                    user_id=a.user_id,
                    budget_id=a.budget_id,
                    period_start=a.period_start,
                    period_end=a.period_end,
                    threshold=a.threshold,
                    spent=a.spent,
                    limit=a.limit,
                    budget_name=a.budget_name,
                    event_id=a.event_id,
                )
        except IntegrityError:
            protected = True
        outcomes.append(
            {
                "mode": mode,
                "deliveries": len(deliveries),
                "logical_events": 100,
                "expected_alerts": expected,
                "actual_unique_alerts": unique,
                "duplicate_alerts": actual - unique,
                "missing_alerts": max(0, expected - unique),
                "processing_failures": sum(bool(r["error"]) for r in samples),
                "constraint_rejected_duplicate": protected,
            }
        )
    trials = []
    with mock_aws():
        sqs = boto3.client("sqs", region_name="us-east-1")
        queue = sqs.create_queue(
            QueueName="benchmark-latency", Attributes={"VisibilityTimeout": "60"}
        )["QueueUrl"]
        stop = threading.Event()
        failures = []

        def consume():
            while not stop.is_set():
                messages = sqs.receive_message(
                    QueueUrl=queue, MaxNumberOfMessages=1
                ).get("Messages", [])
                for msg in messages:
                    if not handle_message(sqs, queue, msg):
                        failures.append(msg["MessageId"])
                if not messages:
                    time.sleep(0.001)
            connections.close_all()

        worker = threading.Thread(target=consume)
        worker.start()
        try:
            for trial in range(1, 4):
                values = []
                for i in range(50):
                    user, budget, _ = fixture(run_id, f"latency{trial}", i)
                    start = time.perf_counter()
                    tx = expense(user, 100)
                    sqs.send_message(
                        QueueUrl=queue, MessageBody=json.dumps(event_for(tx))
                    )
                    while BudgetAlert.objects.filter(budget=budget).count() < 2:
                        if time.perf_counter() - start > 10:
                            raise TimeoutError("Alert was not persisted within 10s")
                        time.sleep(0.001)
                    elapsed = (time.perf_counter() - start) * 1000
                    values.append(elapsed)
                    rows.append(
                        {
                            "run_id": run_id,
                            "phase": "latency",
                            "trial": trial,
                            "event_id": str(tx.id),
                            "latency_ms": elapsed,
                            "error": "",
                        }
                    )
                trials.append(
                    {
                        "trial": trial,
                        "observations": len(values),
                        "p50_ms": percentile(values, 0.50),
                        "p95_ms": percentile(values, 0.95),
                        "max_ms": max(values),
                    }
                )
        finally:
            stop.set()
            worker.join(timeout=30)
    summary = {
        "run_id": run_id,
        "environment": env,
        "correctness": outcomes,
        "latency_trials": trials,
        "latency_processing_failures": len(failures),
    }
    out = ROOT / "results"
    out.mkdir(exist_ok=True)
    (out / f"benchmark-{run_id}.json").write_text(json.dumps(summary, indent=2) + "\n")
    (out / "benchmark_summary.json").write_text(json.dumps(summary, indent=2) + "\n")
    csv_path = out / "benchmark_runs.csv"
    exists = csv_path.exists()
    with csv_path.open("a", newline="") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=["run_id", "phase", "trial", "event_id", "latency_ms", "error"],
        )
        if not exists:
            writer.writeheader()
        writer.writerows(rows)
    print(json.dumps(summary, indent=2))
    assert all(
        o["duplicate_alerts"] == o["missing_alerts"] == o["processing_failures"] == 0
        and o["constraint_rejected_duplicate"]
        for o in outcomes
    )
    assert not failures
    return summary


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--seed", type=int, default=2025)
    run(parser.parse_args().seed)
