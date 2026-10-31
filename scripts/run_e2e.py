#!/usr/bin/env python3
"""Real browser + Django + PostgreSQL + separate worker; ONLY SQS is emulated."""

import json
import os
from pathlib import Path
import socket
import subprocess
import sys
import time
import uuid

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "minti.settings")
import django

django.setup()
from django.conf import settings
from django.utils import timezone
from apps.users.models import User
from apps.users.serializers import UserSerializer
from apps.budgets.models import Budget
from rest_framework.authtoken.models import Token
import boto3


def wait_port(port):
    for _ in range(100):
        try:
            with socket.create_connection(("127.0.0.1", port), timeout=0.2):
                return
        except OSError:
            time.sleep(0.1)
    raise RuntimeError(f"Port {port} did not start")


def main():
    if not settings.DEBUG or os.environ.get("ALLOW_SYNTHETIC_TESTS") != "1":
        raise SystemExit(
            "Requires DEBUG=True and ALLOW_SYNTHETIC_TESTS=1 in an isolated test database"
        )
    (ROOT / "work").mkdir(exist_ok=True)
    processes, handles = [], []
    user = None
    env = dict(
        os.environ,
        AWS_ACCESS_KEY_ID="testing",
        AWS_SECRET_ACCESS_KEY="testing",
        AWS_REGION="us-east-1",
        SQS_ENDPOINT_URL="http://127.0.0.1:5001",
    )

    def start(command, name):
        handle = open(ROOT / f"work/e2e-{name}.log", "w")
        handles.append(handle)
        processes.append(
            subprocess.Popen(
                command, cwd=ROOT, env=env, stdout=handle, stderr=subprocess.STDOUT
            )
        )

    try:
        start(
            [
                str(Path(sys.executable).parent / "moto_server"),
                "-H",
                "127.0.0.1",
                "-p",
                "5001",
            ],
            "queue",
        )
        wait_port(5001)
        sqs = boto3.client(
            "sqs",
            region_name="us-east-1",
            endpoint_url=env["SQS_ENDPOINT_URL"],
            aws_access_key_id="testing",
            aws_secret_access_key="testing",
        )
        env["SQS_QUEUE_URL"] = sqs.create_queue(QueueName=f"e2e-{uuid.uuid4().hex}")[
            "QueueUrl"
        ]
        user = User.objects.create_user(
            email=f"e2e-{uuid.uuid4().hex}@example.test", name="Synthetic E2E"
        )
        Budget.objects.create(
            user=user,
            name="E2E groceries",
            amount=100,
            period="MONTHLY",
            start_date=timezone.now().replace(
                day=1, hour=0, minute=0, second=0, microsecond=0
            ),
        )
        auth_file = ROOT / "work/e2e-auth.json"
        auth_file.write_text(
            json.dumps(
                {
                    "token": Token.objects.create(user=user).key,
                    "user": UserSerializer(user).data,
                }
            )
        )
        auth_file.chmod(0o600)
        start(
            [
                sys.executable,
                "backend/manage.py",
                "runserver",
                "127.0.0.1:8000",
                "--noreload",
            ],
            "backend",
        )
        start([sys.executable, "backend/manage.py", "consume_alerts"], "worker")
        start(
            ["npm", "run", "dev", "--", "--host", "127.0.0.1", "--strictPort"],
            "frontend",
        )
        wait_port(8000)
        wait_port(5173)
        result = subprocess.run(["npx", "playwright", "test"], cwd=ROOT, env=env)
        return result.returncode
    finally:
        for p in reversed(processes):
            p.terminate()
        for p in processes:
            try:
                p.wait(timeout=5)
            except subprocess.TimeoutExpired:
                p.kill()
                p.wait()
        for h in handles:
            h.close()
        (ROOT / "work/e2e-auth.json").unlink(missing_ok=True)
        if user:
            user.delete()


if __name__ == "__main__":
    sys.exit(main())
