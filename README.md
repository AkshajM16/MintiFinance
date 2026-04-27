# Minti

**1st Place Fan Favorite — HackIllinois 2025** by Akshaj Mehta, Adya Daruka, Anvesha Saraf, and Shlok Thakkar

AI-powered personal finance planner that predicts future spending from calendar context and historical behavior.

---
## Demo Video

[![Demo Video](https://img.youtube.com/vi/Nttw3gkAuBQ/0.jpg)](https://www.youtube.com/watch?v=Nttw3gkAuBQ)

---

## What it does

Most budgeting apps are reactive — they only tell you what you already spent. Minti is proactive. It looks at your upcoming Google Calendar events alongside your transaction history to estimate what you're likely to spend before it happens, then helps you allocate budgets accordingly.

---

## Key Highlights

- Google OAuth sign-in with Calendar read access — no manual import needed
- **Events Mode**: infers spending signals from calendar events (e.g. "Dinner with team" → high dining probability)
- **Behavioral Mode**: learns day-of-week and seasonal spending habits from transaction history, flags anomalies via z-score
- Category-level budget allocation view showing spent + predicted + remaining, with editable overrides
- Larry the Llama — an AI financial advisor backed by OpenAI (`gpt-4o-mini`), streaming real-time responses with full user context injected (transactions, goals, upcoming events)
- Interactive analytics dashboard (line, pie, bar, area charts via Recharts)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS 4, Framer Motion, Radix UI |
| Backend | Django 5 + Django REST Framework |
| Database | PostgreSQL (Django ORM) |
| Auth | Google OAuth implicit flow → DRF Token |
| AI | OpenAI `gpt-4o-mini` via Python SDK, streamed with `StreamingHttpResponse` |
| Analytics | Recharts |
| Container | Docker + Gunicorn + Whitenoise |

---

## Architecture

```
backend/                        Django project (Python)
├── minti/                      Settings, root URLs, WSGI
└── apps/
    ├── users/                  Custom User model, /api/auth/google/ token exchange
    ├── transactions/           Transaction + RecurringTransaction CRUD
    ├── budgets/                Budget, Category, BudgetGoal CRUD
    ├── goals/                  SavingsGoal CRUD
    ├── bills/                  BillReminder CRUD
    ├── events/                 CalendarEvent sync (POST) + windowed listing (GET)
    ├── analysis/               SpendingAnalysisView + behavioral_model.py
    └── chat/                   Larry the Llama — streaming OpenAI chat

src/                            React SPA (TypeScript + Vite)
├── App.tsx                     Root with React Router (/google-callback + app shell)
├── GoogleCallback.tsx          Handles OAuth hash → POSTs id_token → stores DRF token
├── hooks/                      useAuth, useTransactions, useCalendar
├── services/api.ts             Typed fetch client with Authorization: Token header
├── features/                   Page components: budget, analytics, transactions, goals…
└── lib/behavioralModel.ts      TypeScript behavioral model (used client-side for predictions page)
```

**Auth flow:**
1. User clicks "Sign in with Google" → redirected to Google OAuth
2. Google redirects to `/google-callback` with `access_token` + `id_token` in URL hash
3. Callback page POSTs `id_token` to `POST /api/auth/google/`
4. Django verifies it with `google-auth`, upserts the User, returns a DRF token
5. All subsequent API calls send `Authorization: Token <token>`

---

## Running Locally

### Prerequisites

- Python 3.12+
- Node.js 20+
- Docker (for PostgreSQL)

### Backend

```bash
# 1. Start PostgreSQL
docker compose up db -d

# 2. Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate

# 3. Install Python dependencies
pip install -r requirements.txt

# 4. Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env — set DJANGO_SECRET_KEY, VITE_GOOGLE_CLIENT_ID, OPENAI_API_KEY

# 5. Run migrations and start the server
cd backend
python manage.py migrate
python manage.py runserver 8000
```

### Frontend

```bash
# In a new terminal, from the repo root

# 6. Configure frontend environment
cp .env.example .env
# Edit .env — set VITE_GOOGLE_CLIENT_ID (same value as backend)

# 7. Install and run
npm install
npm run dev
```

Open `http://localhost:5173`. The Vite dev server proxies all `/api/*` requests to Django on port 8000.

### Full stack via Docker

```bash
docker compose up --build
```

Open `http://localhost:8000`.

---

## Environment Variables

| Variable | Where | Purpose |
|---|---|---|
| `DJANGO_SECRET_KEY` | `backend/.env` | Django secret key (required in production) |
| `POSTGRES_DB` / `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_HOST` | `backend/.env` | PostgreSQL connection |
| `VITE_GOOGLE_CLIENT_ID` | `backend/.env` + `.env` | Google OAuth client ID |
| `OPENAI_API_KEY` | `backend/.env` | OpenAI API key for Larry the Llama |

---

## Roadmap

- Bank aggregation via Plaid or Capital One sandbox
- Forecast explainability ("why this prediction")
- Proactive overspending alerts and push notifications
- Gamification layer for savings goal streaks
