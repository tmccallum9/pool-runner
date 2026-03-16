# Complete Deployment Guide for Pool Runner

## Stack Overview
- **Backend**: Django 5.0 + GraphQL (Graphene) on Render
- **Frontend**: Next.js 16 on Vercel
- **Database**: PostgreSQL (Supabase - already configured)

---

## Part 1: Backend Deployment (Render)

### Prerequisites
1. GitHub account with your repository
2. Render account (free tier available at render.com)

### Step 1: Prepare Backend for Production

#### 1.1 Update requirements.txt
Add production dependencies:
```bash
cd backend
pip install gunicorn whitenoise
pip freeze > requirements.txt
```

#### 1.2 Update settings.py
Ensure these settings are configured for production:

```python
# In backend/pool_runner/settings.py

import os
from pathlib import Path

# Security Settings
DEBUG = os.getenv('DEBUG', 'False') == 'True'
SECRET_KEY = os.getenv('SECRET_KEY')
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '').split(',')

# Static files (for production)
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Middleware - add WhiteNoise after SecurityMiddleware
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # Add this line
    # ... rest of middleware
]
```

#### 1.3 Create build script
Create `backend/build.sh`:
```bash
#!/usr/bin/env bash
set -o errexit

pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate
```

Make it executable:
```bash
chmod +x backend/build.sh
```

### Step 2: Deploy to Render

1. **Go to Render Dashboard** (render.com)
2. **Click "New +" → "Web Service"**
3. **Connect your GitHub repository**
4. **Configure the service:**

   - **Name**: `pool-runner-backend`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `./build.sh`
   - **Start Command**: `gunicorn pool_runner.wsgi:application --bind 0.0.0.0:$PORT`
   - **Instance Type**: Free (or paid as needed)

5. **Add Environment Variables** (click "Advanced" → "Add Environment Variable"):

```
SECRET_KEY=your-generated-secret-key-here
DEBUG=False
ALLOWED_HOSTS=pool-runner-backend.onrender.com,yourapp.vercel.app
DATABASE_URL=your-supabase-database-url
DB_HOST=your-supabase-host
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your-database-password
DB_PORT=5432
JWT_SECRET_KEY=your-generated-jwt-secret-key-here
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24
MAGIC_LINK_EXPIRATION_MINUTES=15
SENDGRID_API_KEY=your-sendgrid-api-key
FROM_EMAIL=tyler.mccallum9@gmail.com
```

**IMPORTANT**: Update these after deployment:
- `ALLOWED_HOSTS`: Add your actual Render URL after deployment
- `CORS_ALLOWED_ORIGINS`: Add your Vercel frontend URL (see Part 2)
- `FRONTEND_URL`: Add your Vercel frontend URL

6. **Click "Create Web Service"**
7. **Wait for deployment** (5-10 minutes)
8. **Copy your backend URL**: `https://pool-runner-backend.onrender.com`

### Step 3: Update CORS Settings

After deployment, go back to Render Environment Variables and add:
```
CORS_ALLOWED_ORIGINS=https://yourapp.vercel.app,https://yourapp-preview.vercel.app
FRONTEND_URL=https://yourapp.vercel.app
```

Update `ALLOWED_HOSTS`:
```
ALLOWED_HOSTS=pool-runner-backend.onrender.com,yourapp.vercel.app
```

---

## Part 2: Frontend Deployment (Vercel)

### Step 1: Prepare Frontend for Production

#### 1.1 Check frontend environment variables
In `frontend/mad-pool/.env.local`, you should have:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

For production, this will be set in Vercel dashboard.

#### 1.2 Verify your Apollo Client configuration
Make sure it uses the environment variable:
```typescript
// Should use process.env.NEXT_PUBLIC_API_URL
const client = new ApolloClient({
  uri: `${process.env.NEXT_PUBLIC_API_URL}/graphql`,
  // ... rest of config
});
```

### Step 2: Deploy to Vercel

1. **Go to Vercel** (vercel.com)
2. **Click "Add New" → "Project"**
3. **Import your GitHub repository**
4. **Configure the project:**

   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `frontend/mad-pool`
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)

5. **Add Environment Variables**:

   Click "Environment Variables" and add:
   ```
   NEXT_PUBLIC_API_URL=https://pool-runner-backend.onrender.com
   ```

6. **Click "Deploy"**
7. **Wait for deployment** (2-5 minutes)
8. **Copy your frontend URL**: `https://yourapp.vercel.app`

### Step 3: Update Backend CORS Settings

1. **Go back to Render Dashboard**
2. **Open your backend service**
3. **Go to Environment tab**
4. **Update these variables** with your actual Vercel URL:
   ```
   CORS_ALLOWED_ORIGINS=https://yourapp.vercel.app
   FRONTEND_URL=https://yourapp.vercel.app
   ALLOWED_HOSTS=pool-runner-backend.onrender.com,yourapp.vercel.app
   ```
5. **Save changes** (this will redeploy your backend)

---

## Part 3: Testing Your Deployment

### 3.1 Test Backend
Visit: `https://pool-runner-backend.onrender.com/graphql`
- You should see the GraphiQL interface

### 3.2 Test Frontend
Visit: `https://yourapp.vercel.app`
- Your app should load and connect to the backend

### 3.3 Test Full Authentication Flow
1. Try logging in / signing up
2. Check that JWT tokens are working
3. Test magic link emails (SendGrid)

---

## Part 4: Continuous Deployment

Both platforms auto-deploy on git push:

- **Render**: Deploys backend on push to `main` branch
- **Vercel**: Deploys frontend on push to any branch
  - `main` branch → Production
  - Other branches → Preview deployments

---

## Part 5: Important Security Notes

### 5.1 Rotate Sensitive Credentials
If these have been committed to git history:
- Generate new SendGrid API key at sendgrid.com
- Consider rotating database password in Supabase

### 5.2 Verify .gitignore
Ensure `.env` files are NOT committed:
```
# In backend/.gitignore
.env
*.env

# In frontend/mad-pool/.gitignore
.env.local
.env.production
```

### 5.3 Production Checklist
- [ ] DEBUG=False in production
- [ ] Secure SECRET_KEY and JWT_SECRET_KEY (different values)
- [ ] ALLOWED_HOSTS configured correctly
- [ ] CORS_ALLOWED_ORIGINS configured correctly
- [ ] SSL/HTTPS enabled (automatic on Render/Vercel)
- [ ] Database backups enabled (Supabase handles this)

---

## Part 6: Common Issues & Solutions

### Backend won't start
- Check Render logs: Dashboard → Your Service → Logs
- Common issues:
  - Missing environment variables
  - Database connection errors
  - Static files not collected

### Frontend can't connect to backend
- Check CORS settings in backend
- Verify `NEXT_PUBLIC_API_URL` in Vercel environment variables
- Check browser console for errors

### GraphQL queries failing
- Verify JWT tokens are being sent correctly
- Check backend authentication middleware
- Test GraphQL endpoint directly with GraphiQL

---

## Part 7: Monitoring & Logs

### Render Logs
Dashboard → Your Service → Logs
- Real-time application logs
- Error tracking

### Vercel Logs
Dashboard → Your Project → Deployments → View Function Logs
- Build logs
- Runtime logs
- Edge function logs

---

## Part 8: Custom Domains (Optional)

### Add Custom Domain to Vercel
1. Go to Project Settings → Domains
2. Add your domain (e.g., `poolrunner.com`)
3. Configure DNS as instructed

### Add Custom Domain to Render
1. Go to Service → Settings → Custom Domain
2. Add your domain (e.g., `api.poolrunner.com`)
3. Configure DNS as instructed
4. Update `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS`

---

## Quick Reference

### Generate Your Secure Keys
Use this command to generate new secure keys:
```bash
python -c "import secrets; print('SECRET_KEY=' + secrets.token_urlsafe(64)); print('JWT_SECRET_KEY=' + secrets.token_urlsafe(64))"
```

### Deployment Commands
```bash
# Generate new secure keys (if needed)
python -c "import secrets; print(secrets.token_urlsafe(64))"

# Test backend locally
cd backend
python manage.py runserver

# Test frontend locally
cd frontend/mad-pool
npm run dev

# Build frontend locally (test before deploying)
npm run build
npm run start
```

---

## Support Resources

- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **Django Deployment**: https://docs.djangoproject.com/en/5.0/howto/deployment/

---

## Estimated Costs (Free Tier)

- **Render Free Tier**:
  - 750 hours/month
  - Services sleep after 15 min inactivity
  - First request after sleep ~30-60 seconds

- **Vercel Free Tier**:
  - 100 GB bandwidth/month
  - 100 serverless function invocations/day
  - Unlimited preview deployments

**For production traffic**, consider upgrading to paid plans.
