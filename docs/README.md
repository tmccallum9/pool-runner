# Backend Setup

This is the minimum setup needed to start the Django GraphQL backend locally.

For JWT generation and pool create/join testing, use `LOCAL_TESTING_GUIDE.md`.

## Prerequisites

- Python 3.10+
- A virtual environment tool
- Either SQLite for local development or PostgreSQL credentials

## 1. Install dependencies

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## 2. Create `.env`

Create `backend/.env` with values for local development:

```env
SECRET_KEY=replace-me
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

USE_SQLITE=True

JWT_SECRET_KEY=replace-me
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

MAGIC_LINK_EXPIRATION_MINUTES=15
FRONTEND_URL=http://localhost:3000
MAGIC_LINK_BASE_URL=http://localhost:3000

SENDGRID_API_KEY=
FROM_EMAIL=tyler.mccallum9@gmail.com

CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

If you want PostgreSQL instead of SQLite, set `USE_SQLITE=False` and provide the `DB_*` values expected by `pool_runner/settings.py`.

## 3. Run migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

## 4. Optional backend checks

```bash
python manage.py check
python test/verify_schema.py
```

Expected local endpoints:

- GraphQL: `http://localhost:8000/graphql/`
- GraphiQL: `http://localhost:8000/graphql/`
- Health: `http://localhost:8000/health/`

## 5. Start the backend

```bash
python manage.py runserver
```

## Minimal smoke test

Open GraphiQL at `http://localhost:8000/graphql/` and run:

```graphql
query {
  __typename
}
```

If that works, continue with `LOCAL_TESTING_GUIDE.md` for JWT creation and pool testing.
