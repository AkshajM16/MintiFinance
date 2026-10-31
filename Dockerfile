FROM node:22-alpine AS frontend-builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json vite.config.ts postcss.config.js index.html ./
COPY src ./src
COPY public ./public
ARG VITE_GOOGLE_CLIENT_ID=""
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
RUN npm run build

FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app
COPY requirements.lock ./
RUN pip install --no-cache-dir -r requirements.lock
COPY backend ./backend
COPY --from=frontend-builder /app/dist/assets ./backend/static/assets
COPY --from=frontend-builder /app/dist/index.html ./backend/templates/index.html
COPY --from=frontend-builder /app/dist/favicon.ico ./backend/static/favicon.ico
WORKDIR /app/backend
RUN DEBUG=True python manage.py collectstatic --noinput && useradd --uid 10001 --no-create-home app
USER 10001
EXPOSE 8000
CMD ["gunicorn", "minti.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "2", "--timeout", "60", "--access-logfile", "/dev/null"]
