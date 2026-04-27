# ─── Stage 1: Build Vite SPA ─────────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
# Build outputs to /app/dist
RUN npm run build

# ─── Stage 2: Django + Gunicorn ──────────────────────────────────────────────
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# System deps for psycopg2 and general build tooling
RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Django source
COPY backend/ ./backend/

# Copy compiled Vite SPA into Django's static root so whitenoise can serve it
COPY --from=frontend-builder /app/dist ./backend/staticfiles/

WORKDIR /app/backend

# Collect static files (including the Vite build)
RUN python manage.py collectstatic --noinput || true

EXPOSE 8000

CMD ["gunicorn", "minti.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "4", "--timeout", "120"]
