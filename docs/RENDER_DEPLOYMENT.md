# Render Deployment Guide

This guide walks through deploying the Pool Runner application to Render as two separate services within one project.

## Architecture Overview

```
Render Project: pool-runner
├── PostgreSQL Database
├── Backend Service (Django API)
│   └── Root: /backend
└── Frontend Service (Next.js)
    └── Root: /frontend/mad-pool
```

---

## Step 1: Create PostgreSQL Database

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **New +** → **PostgreSQL**
3. Configure:
   - **Name**: `pool-runner-db`
   - **Database**: `pool_runner`
   - **User**: (auto-generated)
   - **Region**: Same region as your services
   - **Plan**: Free (or paid as needed)
4. Click **Create Database**
5. **Save the connection details** (Internal Database URL)

---

## Step 2: Deploy Backend Service (Django)

### Create Service:
1. Click **New +** → **Web Service**
2. Connect your GitHub repository
3. Configure:

#### Basic Settings:
- **Name**: `pool-runner-backend`
- **Root Directory**: `backend`
- **Environment**: `Python 3`
- **Region**: Same as database
- **Branch**: `main`

#### Build & Start:
- **Build Command**:
  ```bash
  pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate
  ```
- **Start Command**:
  ```bash
  gunicorn pool_runner.wsgi:application --bind 0.0.0.0:$PORT
  ```

#### Plan:
- **Instance Type**: Free (or paid as needed)

### Environment Variables:

Click **Advanced** → **Add Environment Variable** and add these:

```bash
# Django Core
SECRET_KEY=<generate-random-50-char-string>
DEBUG=False
ALLOWED_HOSTS=<your-backend-url>.onrender.com

# Database (from Step 1)
USE_SQLITE=False
DATABASE_URL=<your-internal-database-url>

# Or individual fields:
DB_NAME=pool_runner
DB_USER=<from-render-db>
DB_PASSWORD=<from-render-db>
DB_HOST=<from-render-db>.render.com
DB_HOSTADDR=<optional-ipv4-address>
DB_PORT=5432

# JWT Authentication
JWT_SECRET_KEY=<generate-random-50-char-string>
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# CORS - ADD AFTER FRONTEND DEPLOYED
CORS_ALLOWED_ORIGINS=https://<your-frontend-url>.onrender.com

# Frontend URL - ADD AFTER FRONTEND DEPLOYED
FRONTEND_URL=https://<your-frontend-url>.onrender.com

# Email (Optional - for magic link authentication)
SENDGRID_API_KEY=<your-sendgrid-api-key>
FROM_EMAIL=noreply@poolrunner.com

# Python
PYTHON_VERSION=3.10.12
```

**Generate SECRET_KEY**:
```bash
python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
```

### Important Notes:
- Wait for backend to deploy successfully before proceeding
- Copy the backend service URL (e.g., `https://pool-runner-backend.onrender.com`)
- You'll need this URL for the frontend

---

## Step 3: Deploy Frontend Service (Next.js)

### Create Service:
1. Click **New +** → **Web Service**
2. Connect the same GitHub repository
3. Configure:

#### Basic Settings:
- **Name**: `pool-runner-frontend` (or custom domain)
- **Root Directory**: `frontend/mad-pool`
- **Environment**: `Node`
- **Region**: Same as backend
- **Branch**: `main`

#### Build & Start:
- **Build Command**:
  ```bash
  npm install && npm run build
  ```
- **Start Command**:
  ```bash
  npm start
  ```

#### Plan:
- **Instance Type**: Free (or paid as needed)

### Environment Variables:

```bash
# Backend API (from Step 2)
NEXT_PUBLIC_GRAPHQL_ENDPOINT=https://<your-backend-url>.onrender.com/graphql/

# Node Environment
NODE_ENV=production
```

---

## Step 4: Update Backend CORS Settings

After frontend is deployed:

1. Go back to **Backend Service** → **Environment**
2. Update `CORS_ALLOWED_ORIGINS` with your frontend URL:
   ```bash
   CORS_ALLOWED_ORIGINS=https://<your-frontend-url>.onrender.com
   ```
3. Update `FRONTEND_URL`:
   ```bash
   FRONTEND_URL=https://<your-frontend-url>.onrender.com
   ```
4. Click **Save Changes** (this will trigger a redeploy)

---

## Step 5: Initialize Database with Teams

After both services are deployed, you need to add March Madness teams to the database.

### Option A: Using Render Shell
1. Go to **Backend Service** → **Shell** tab
2. Run:
   ```bash
   python manage.py shell
   ```
3. Add teams manually or run a seed script

### Option B: Create a Management Command
Create `backend/apps/teams/management/commands/seed_teams.py`:

```python
from django.core.management.base import BaseCommand
from apps.teams.models import Team

class Command(BaseCommand):
    help = 'Seed database with March Madness teams'

    def handle(self, *args, **options):
        teams = [
            {'name': 'Duke', 'seed_rank': 1, 'region': 'East'},
            {'name': 'Kansas', 'seed_rank': 1, 'region': 'West'},
            # Add all 64 teams...
        ]

        for team_data in teams:
            Team.objects.get_or_create(
                name=team_data['name'],
                defaults={
                    'seed_rank': team_data['seed_rank'],
                    'region': team_data.get('region', '')
                }
            )

        self.stdout.write(self.style.SUCCESS(f'Successfully seeded {len(teams)} teams'))
```

Then run via Render Shell:
```bash
python manage.py seed_teams
```

---

## Step 6: Test Deployment

### Backend Health Check:
Visit: `https://<your-backend-url>.onrender.com/graphql/`

You should see the GraphiQL interface.

### Frontend Health Check:
Visit: `https://<your-frontend-url>.onrender.com/`

You should see the homepage.

### Test Authentication:
1. Generate a JWT token via backend shell:
   ```bash
   python manage.py generate_jwt test@example.com
   ```
2. Copy the token
3. Open frontend in browser
4. Open DevTools Console:
   ```javascript
   localStorage.setItem('authToken', 'YOUR_TOKEN_HERE')
   location.reload()
   ```
5. You should be authenticated

---

## Step 7: Custom Domain (Optional)

### Frontend Custom Domain:
1. Go to **Frontend Service** → **Settings** → **Custom Domain**
2. Add your domain (e.g., `poolrunner.com`)
3. Update DNS records as instructed
4. Update backend `CORS_ALLOWED_ORIGINS` and `FRONTEND_URL` to use custom domain

### Backend Custom Domain:
1. Go to **Backend Service** → **Settings** → **Custom Domain**
2. Add subdomain (e.g., `api.poolrunner.com`)
3. Update DNS records
4. Update frontend `NEXT_PUBLIC_GRAPHQL_ENDPOINT` to use custom domain

---

## Troubleshooting

### Backend Issues:

**Database Connection Errors:**
- Verify `DATABASE_URL` or individual DB variables are correct
- If logs show an unreachable IPv6 address, set `DB_HOSTADDR` to the database server's IPv4 address
- Check that database is in the same region
- Use the **Internal Database URL** (faster and free)

**Static Files Not Loading:**
- Ensure `collectstatic` runs in build command
- Check `STATIC_ROOT` is configured in settings.py

**CORS Errors:**
- Verify `CORS_ALLOWED_ORIGINS` includes frontend URL (with https://)
- Check that frontend URL matches exactly (no trailing slash)

**Migration Errors:**
- Check logs: **Backend Service** → **Logs**
- Run migrations manually via Shell:
  ```bash
  python manage.py migrate
  ```

### Frontend Issues:

**GraphQL Connection Errors:**
- Verify `NEXT_PUBLIC_GRAPHQL_ENDPOINT` is correct
- Check backend is deployed and healthy
- Ensure backend allows frontend origin in CORS

**Build Failures:**
- Check Node version compatibility
- Verify all dependencies are in `package.json`
- Check build logs for specific errors

**Authentication Not Working:**
- Verify JWT token is being stored in localStorage
- Check token format (should start with `Bearer` in Authorization header)
- Verify backend JWT_SECRET_KEY matches what was used to generate token

---

## Environment Variables Summary

### Backend Required:
- ✅ `SECRET_KEY` - Django secret
- ✅ `DEBUG` - Set to False
- ✅ `ALLOWED_HOSTS` - Backend URL
- ✅ `DATABASE_URL` or `DB_*` - PostgreSQL connection
- ✅ `USE_SQLITE` - Set to False
- ✅ `JWT_SECRET_KEY` - JWT signing key
- ✅ `CORS_ALLOWED_ORIGINS` - Frontend URL
- ✅ `FRONTEND_URL` - Frontend URL

### Frontend Required:
- ✅ `NEXT_PUBLIC_GRAPHQL_ENDPOINT` - Backend GraphQL URL
- ✅ `NODE_ENV` - Set to production

### Optional:
- `SENDGRID_API_KEY` - Email service
- `FROM_EMAIL` - Sender email

---

## Deployment Checklist

- [ ] PostgreSQL database created
- [ ] Backend service deployed with correct root directory
- [ ] Backend environment variables configured
- [ ] Backend build and start commands correct
- [ ] Backend GraphiQL accessible
- [ ] Frontend service deployed with correct root directory
- [ ] Frontend environment variables configured
- [ ] Frontend can reach backend GraphQL endpoint
- [ ] CORS configured on backend for frontend origin
- [ ] Database migrations run successfully
- [ ] Teams seeded in database
- [ ] Authentication tested with JWT token
- [ ] Pool creation tested
- [ ] Pool joining tested
- [ ] Custom domains configured (if applicable)

---

## Maintenance

### View Logs:
- **Backend**: Backend Service → Logs tab
- **Frontend**: Frontend Service → Logs tab

### Run Commands:
- Use the **Shell** tab in each service
- For backend: `python manage.py <command>`
- For frontend: `npm run <command>`

### Database Backups:
- Render automatically backs up paid PostgreSQL databases
- For free tier, export manually via Shell:
  ```bash
  pg_dump $DATABASE_URL > backup.sql
  ```

### Redeploy:
- **Manual**: Service → Manual Deploy → Deploy latest commit
- **Automatic**: Push to `main` branch (if auto-deploy enabled)

---

## Cost Estimation (Free Tier)

- PostgreSQL Database: Free (expires after 90 days)
- Backend Web Service: Free (750 hours/month)
- Frontend Web Service: Free (750 hours/month)

**Note**: Free services spin down after 15 minutes of inactivity. First request after spin-down takes 30-60 seconds.

For production, consider paid plans for:
- Always-on services (no spin-down)
- Persistent database
- Better performance
- Custom domains with SSL

---

## Next Steps

1. Set up monitoring and alerts
2. Configure SendGrid for magic link emails
3. Add tournament schedule and results updates
4. Implement real-time features (WebSockets)
5. Add analytics and error tracking
6. Set up CI/CD pipeline
7. Configure staging environment
