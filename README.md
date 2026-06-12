# JobPilot AI

Autonomous job discovery & auto-apply agent.

## Quick start

```bash
# 1. Clone & configure env
cp .env.example .env
# Fill in CLERK_*, OPENAI_API_KEY, etc.

# 2. Spin up all services
docker compose up --build

# 3. Run migrations (first time only)
docker compose exec api alembic upgrade head

# 4. Install Playwright browsers (first time only)
docker compose exec api playwright install chromium

# 5. Start frontend
cd frontend && npm install && npm run dev
```

## Services

| Service  | URL                          |
|----------|------------------------------|
| API      | http://localhost:8000/docs   |
| Frontend | http://localhost:3000        |
| Flower   | http://localhost:5555        |
| Postgres | localhost:5432               |
| Redis    | localhost:6379               |

## Trigger a manual scrape

```bash
docker compose exec api python -c "
from app.worker.tasks.scrape import run_daily_scrape
run_daily_scrape.delay()
"
```

## Project structure

```
jobpilot-ai/
├── frontend/               Next.js 14 + Tailwind + Clerk
│   ├── app/
│   │   ├── (auth)/         Sign-in / sign-up pages
│   │   └── (dashboard)/    Protected app routes
│   ├── components/         UI, job cards, layout
│   └── lib/                API client, utilities
├── backend/
│   ├── app/
│   │   ├── api/routes/     FastAPI routers
│   │   ├── core/           Config, DB, auth
│   │   ├── models/         SQLAlchemy ORM
│   │   ├── schemas/        Pydantic schemas
│   │   ├── services/
│   │   │   ├── scraper/    Wellfound, LinkedIn
│   │   │   ├── ai/         Resume parser, scorer, cover letter
│   │   │   └── automation/ Playwright apply agent
│   │   └── worker/         Celery tasks + beat schedule
│   └── alembic/            DB migrations
└── docker-compose.yml
```
