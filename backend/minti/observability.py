import json
import logging
import time
import uuid
from datetime import datetime, timezone


class JsonFormatter(logging.Formatter):
    def format(self, record):
        data = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "outcome": record.getMessage(),
        }
        for key in (
            "request_id",
            "event_id",
            "message_id",
            "attempt",
            "error_type",
            "alerts_created",
            "status",
            "duration_ms",
        ):
            if hasattr(record, key):
                data[key] = getattr(record, key)
        return json.dumps(data)


class RequestLogMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.request_id = str(uuid.uuid4())
        start = time.monotonic()
        response = self.get_response(request)
        response["X-Request-ID"] = request.request_id
        logging.getLogger("minti.http").info(
            "request_completed",
            extra={
                "request_id": request.request_id,
                "status": response.status_code,
                "duration_ms": round((time.monotonic() - start) * 1000, 2),
            },
        )
        return response
