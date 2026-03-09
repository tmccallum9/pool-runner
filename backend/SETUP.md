# Backend Setup Guide

## Prerequisites

- Python 3.10+
- PostgreSQL (for production) or SQLite (for development)
- Virtual environment tool (venv, virtualenv, or conda)

## Quick Start

### 1. Create Virtual Environment

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Create a `.env` file in the backend directory:

```bash
# Django Settings
SECRET_KEY=your-secret-key-here-change-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (SQLite for development)
USE_SQLITE=True

# Database (PostgreSQL for production)
# USE_SQLITE=False
# DB_NAME=postgres
# DB_USER=postgres
# DB_PASSWORD=your-db-password
# DB_HOST=your-supabase-host.supabase.co
# DB_PORT=5432

# JWT Authentication
JWT_SECRET_KEY=your-jwt-secret-key-here
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# Magic Link Settings
MAGIC_LINK_EXPIRATION_MINUTES=15
FRONTEND_URL=http://localhost:3000

# Email (SendGrid)
SENDGRID_API_KEY=your-sendgrid-api-key
FROM_EMAIL=noreply@poolrunner.com

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### 4. Run Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### 5. Create Superuser (Optional)

```bash
python manage.py createsuperuser
```

### 6. Verify GraphQL Schema

```bash
python verify_schema.py
```

Expected output:
```
🔍 Verifying GraphQL Schema...

✓ Schema compiled successfully

📋 Schema Structure:
============================================================

🔎 QUERIES (12 total):
  • me()
  • getUser(id: UUID!)
  • getPool(id: UUID, urlSlug: String)
  ...

✏️  MUTATIONS (11 total):
  • sendMagicLink(email: String!)
  • signIn(token: String!)
  ...

✅ All expected endpoints are present!
```

### 7. Start Development Server

```bash
python manage.py runserver
```

The server will start at `http://localhost:8000`

### 8. Access GraphiQL

Open your browser and go to:
```
http://localhost:8000/graphql/
```

You'll see the GraphiQL interactive interface where you can test queries and mutations.

## Project Structure

```
backend/
├── apps/
│   ├── users/          # User authentication and magic links
│   │   ├── models.py   # User, MagicLink models
│   │   ├── schema.py   # GraphQL queries and mutations
│   │   └── service.py  # JWT, email utilities
│   ├── pools/          # Pool management
│   │   ├── models.py   # Pool, PoolMembership models
│   │   ├── schema.py   # GraphQL queries and mutations
│   │   └── service.py  # Pool utilities
│   ├── teams/          # Team and draft management
│   │   ├── models.py   # Team, DraftPick models
│   │   ├── schema.py   # GraphQL queries and mutations
│   │   └── service.py  # Draft validation utilities
│   ├── tournaments/    # Tournament results
│   │   ├── models.py   # TeamGameResult model
│   │   ├── schema.py   # GraphQL queries and mutations
│   │   └── service.py  # Result validation utilities
│   └── exceptions.py   # Custom exception classes
├── pool_runner/
│   ├── settings.py     # Django settings
│   ├── urls.py         # URL routing
│   └── graphql_view.py # Custom GraphQL view
├── schema.py           # Root GraphQL schema
├── verify_schema.py    # Schema verification script
├── requirements.txt    # Python dependencies
├── API_DOCUMENTATION.md # Complete API documentation
└── manage.py           # Django management script
```

## Running Tests

### Check Django Configuration
```bash
python manage.py check
```

### Verify Database Migrations
```bash
python manage.py showmigrations
```

### Verify GraphQL Schema
```bash
python verify_schema.py

# View full SDL schema
python verify_schema.py --full
```

### Test API with curl
```bash
# Health check
curl http://localhost:8000/health/

# GraphQL query (requires authentication)
curl -X POST http://localhost:8000/graphql/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"query": "{ me { email } }"}'
```

## Database Setup

### SQLite (Development)

Set in `.env`:
```
USE_SQLITE=True
```

Database will be created automatically at `db.sqlite3`.

### PostgreSQL (Production - Supabase)

1. Create a Supabase project at https://supabase.com
2. Get your database connection details
3. Update `.env`:
```
USE_SQLITE=False
DB_NAME=postgres
DB_USER=postgres.xxxxx
DB_PASSWORD=your-password
DB_HOST=db.xxxxx.supabase.co
DB_PORT=5432
```

4. Run migrations:
```bash
python manage.py migrate
```

## Authentication Setup

### SendGrid Email Configuration

1. Create a SendGrid account at https://sendgrid.com
2. Generate an API key
3. Update `.env`:
```
SENDGRID_API_KEY=SG.xxxxx
FROM_EMAIL=noreply@yourdomain.com
```

### Testing Magic Link Flow

1. Send magic link:
```graphql
mutation {
  sendMagicLink(email: "test@example.com") {
    success
  }
}
```

2. Check email for magic link token
3. Sign in:
```graphql
mutation {
  signIn(token: "your-token-from-email") {
    user { email }
    authToken
  }
}
```

4. Use JWT token in subsequent requests:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

## Production Deployment

### Environment Variables

Ensure these are set in production:
- `DEBUG=False`
- `SECRET_KEY` - Generate a new secure key
- `JWT_SECRET_KEY` - Generate a new secure key
- `ALLOWED_HOSTS` - Your domain(s)
- `CORS_ALLOWED_ORIGINS` - Your frontend URL(s)
- Database credentials (PostgreSQL)
- SendGrid API key

### Security Checklist

- [ ] Set `DEBUG=False`
- [ ] Generate new `SECRET_KEY` and `JWT_SECRET_KEY`
- [ ] Configure `ALLOWED_HOSTS` with your domain
- [ ] Configure `CORS_ALLOWED_ORIGINS` with your frontend domain
- [ ] Use PostgreSQL (not SQLite)
- [ ] Enable SSL for database connection
- [ ] Set up proper email configuration
- [ ] Configure static file serving
- [ ] Set up HTTPS
- [ ] Configure proper logging

### Deployment Steps

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Collect static files:
```bash
python manage.py collectstatic --noinput
```

3. Run migrations:
```bash
python manage.py migrate
```

4. Start server (use Gunicorn, uWSGI, or similar):
```bash
gunicorn pool_runner.wsgi:application --bind 0.0.0.0:8000
```

## Troubleshooting

### Module Not Found Errors

Ensure virtual environment is activated and dependencies are installed:
```bash
source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
```

### Database Connection Errors

Check database credentials in `.env` and ensure PostgreSQL is running:
```bash
python manage.py check --database default
```

### CORS Errors

Update `CORS_ALLOWED_ORIGINS` in `.env` to include your frontend URL:
```
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

### GraphQL Schema Errors

Verify the schema compiles:
```bash
python verify_schema.py
```

### Email Not Sending

Check SendGrid configuration and test API key:
```bash
# Test in Python
import sendgrid
sg = sendgrid.SendGridAPIClient(api_key='YOUR_API_KEY')
# Should not raise an error
```

## API Documentation

Complete API documentation with examples is available in:
```
API_DOCUMENTATION.md
```

## Support

For issues or questions:
1. Check the API documentation
2. Run verification scripts
3. Check Django logs
4. Review error codes in the API response
