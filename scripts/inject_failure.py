#!/usr/bin/env python3
"""Local emulated-SQS fault experiment with real PostgreSQL. No production fault switch."""

import json
from pathlib import Path
import uuid
import boto3
from moto import mock_aws
from benchmark_alerts import guard, fixture, expense, event_for, BudgetAlert, ROOT
from apps.alerts.queue import handle_message
from apps.alerts.service import process_event


def run():
    guard()
    run_id = "failure-" + uuid.uuid4().hex
    attempts = []
    with mock_aws():
        sqs = boto3.client("sqs", region_name="us-east-1")
        dlq = sqs.create_queue(QueueName="fault-dlq")["QueueUrl"]
        arn = sqs.get_queue_attributes(QueueUrl=dlq, AttributeNames=["QueueArn"])[
            "Attributes"
        ]["QueueArn"]
        queue = sqs.create_queue(
            QueueName="fault-main",
            Attributes={
                "VisibilityTimeout": "0",
                "RedrivePolicy": json.dumps(
                    {"deadLetterTargetArn": arn, "maxReceiveCount": "3"}
                ),
            },
        )["QueueUrl"]
        healthy_user, _, _ = fixture(run_id, "healthy", 0)
        retry_user, _, _ = fixture(run_id, "retry", 0)
        healthy = event_for(expense(healthy_user, 100))
        retry = event_for(expense(retry_user, 100))
        poison = {
            "version": 1,
            "event_id": str(uuid.uuid4()),
            "transaction_id": "malformed",
        }
        counts = {}

        def injected(event):
            key = event["event_id"]
            counts[key] = counts.get(key, 0) + 1
            if key == retry["event_id"] and counts[key] == 1:
                raise RuntimeError("controlled transient failure")
            return process_event(event)

        for event in [poison, retry, healthy]:
            sqs.send_message(QueueUrl=queue, MessageBody=json.dumps(event))
        for _ in range(20):
            for msg in sqs.receive_message(
                QueueUrl=queue, MessageSystemAttributeNames=["ApproximateReceiveCount"]
            ).get("Messages", []):
                ok = handle_message(sqs, queue, msg, processor=injected)
                attempts.append(
                    {
                        "event_id": json.loads(msg["Body"])["event_id"],
                        "attempt": msg["Attributes"]["ApproximateReceiveCount"],
                        "success": ok,
                    }
                )
        dead = sqs.receive_message(QueueUrl=dlq).get("Messages", [])
        assert (
            len(dead) == 1
            and json.loads(dead[0]["Body"])["event_id"] == poison["event_id"]
        )
        process_event(retry)
        process_event(healthy)
        actual = BudgetAlert.objects.filter(
            user_id__in=[healthy_user.id, retry_user.id]
        ).count()
        result = {
            "run_id": run_id,
            "environment": "local PostgreSQL + Moto SQS (not AWS)",
            "visibility_seconds": 0,
            "max_receive_count": 3,
            "poison_attempts": counts[poison["event_id"]],
            "dlq_messages": len(dead),
            "transient_attempts": counts[retry["event_id"]],
            "healthy_attempts": counts[healthy["event_id"]],
            "healthy_processing_continued": counts[healthy["event_id"]] == 1,
            "expected_alerts": 4,
            "actual_alerts": actual,
            "duplicate_alerts_after_replay": max(0, actual - 4),
            "attempts": attempts,
        }
        out = ROOT / "results"
        out.mkdir(exist_ok=True)
        (out / f"{run_id}.json").write_text(json.dumps(result, indent=2) + "\n")
        (out / "failure_summary.json").write_text(json.dumps(result, indent=2) + "\n")
        print(json.dumps(result, indent=2))
        assert (
            counts[poison["event_id"]] == 3
            and counts[retry["event_id"]] == 2
            and actual == 4
        )


if __name__ == "__main__":
    run()
