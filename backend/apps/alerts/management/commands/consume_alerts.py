import logging
import signal
import time
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from apps.alerts.queue import client, handle_message


class Command(BaseCommand):
    help = "Consume SQS budget events; failures remain unacknowledged for retry."

    def handle(self, *args, **options):
        if not settings.SQS_QUEUE_URL:
            raise CommandError("SQS_QUEUE_URL is required")
        running = True

        def stop(*_):
            nonlocal running
            running = False

        signal.signal(signal.SIGTERM, stop)
        signal.signal(signal.SIGINT, stop)
        sqs = client()
        while running:
            try:
                result = sqs.receive_message(
                    QueueUrl=settings.SQS_QUEUE_URL,
                    MaxNumberOfMessages=1,
                    WaitTimeSeconds=20,
                    MessageSystemAttributeNames=["ApproximateReceiveCount"],
                )
                for message in result.get("Messages", []):
                    handle_message(sqs, settings.SQS_QUEUE_URL, message)
            except Exception as exc:
                logging.getLogger("minti.alerts").error(
                    "queue_receive_failed", extra={"error_type": type(exc).__name__}
                )
                time.sleep(2)
