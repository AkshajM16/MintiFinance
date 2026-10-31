import json
import logging
import boto3
from botocore.config import Config
from django.conf import settings
from django.db import close_old_connections
from .service import process_event

log = logging.getLogger("minti.alerts")


def client():
    return boto3.client(
        "sqs",
        region_name=settings.AWS_REGION,
        endpoint_url=settings.SQS_ENDPOINT_URL or None,
        config=Config(connect_timeout=3, read_timeout=25, retries={"max_attempts": 3}),
    )


def publish(event):
    """Best effort after commit: log stable ID for replay without failing an already saved transaction."""
    try:
        if not settings.SQS_QUEUE_URL:
            raise RuntimeError("SQS queue not configured")
        client().send_message(
            QueueUrl=settings.SQS_QUEUE_URL, MessageBody=json.dumps(event)
        )
        log.info(
            "event_published",
            extra={
                "event_id": event["event_id"],
                "request_id": event.get("request_id"),
            },
        )
    except Exception as exc:
        log.error(
            "event_publish_failed",
            extra={
                "event_id": event["event_id"],
                "error_type": type(exc).__name__,
                "request_id": event.get("request_id"),
            },
        )
        return False
    return True


def handle_message(sqs, queue_url, message, processor=process_event):
    event_id = None
    try:
        close_old_connections()
        event = json.loads(message["Body"])
        if isinstance(event, dict):
            # Only log validated UUIDs; don't echo arbitrary queue content.
            import uuid

            event_id = str(uuid.UUID(event.get("event_id", "")))
        processor(event)
        sqs.delete_message(QueueUrl=queue_url, ReceiptHandle=message["ReceiptHandle"])
        return True
    except Exception as exc:
        log.error(
            "event_processing_failed",
            extra={
                "event_id": event_id,
                "message_id": message.get("MessageId"),
                "attempt": message.get("Attributes", {}).get("ApproximateReceiveCount"),
                "error_type": type(exc).__name__,
            },
        )
        # No acknowledgement: visibility timeout and queue redrive policy own retries/DLQ.
        return False
    finally:
        close_old_connections()
