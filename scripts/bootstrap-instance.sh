#!/usr/bin/env bash
# Run only on the authorized EC2 instance. Do not enable shell tracing.
set -euo pipefail
umask 077
if [ ! -f .env ]; then
  python3 - <<'PY'
import os, secrets
from pathlib import Path
values = {'DJANGO_SECRET_KEY': secrets.token_urlsafe(48), 'POSTGRES_PASSWORD': secrets.token_urlsafe(32),
          'POSTGRES_USER': 'minti', 'POSTGRES_DB': 'minti', 'DEBUG': 'False',
          'ALLOWED_HOSTS': 'localhost 127.0.0.1', 'VITE_GOOGLE_CLIENT_ID': '', 'OPENAI_API_KEY': ''}
for name in ('AWS_REGION', 'SQS_QUEUE_URL', 'CLOUDWATCH_LOG_GROUP'): values[name] = os.environ[name]
Path('.env').write_text('\n'.join(f'{k}="{v}"' for k,v in values.items()) + '\n')
PY
fi
docker compose -f docker-compose.yml -f docker-compose.aws.yml up -d --build --wait
curl --fail --silent http://127.0.0.1:8000/api/health
