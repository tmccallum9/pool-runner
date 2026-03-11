# Render Deployment - Quick Start

## Yes, Deploy as Two Separate Services

Your application requires **two separate web services** within one Render project:

```
pool-runner (Project)
├── PostgreSQL Database
├── pool-runner-backend (Web Service)
│   └── Root: backend/
└── pool-runner-frontend (Web Service)
    └── Root: frontend/mad-pool/
```

---

## Why Two Services?

1. **Different runtimes**: Django (Python) vs Next.js (Node)
2. **Independent scaling**: Scale frontend and backend separately
3. **Separate deployments**: Update one without affecting the other
4. **Clear architecture**: API and UI are logically separated

---

## Quick Setup Steps

### 1. Create PostgreSQL Database
- New → PostgreSQL
- Name: `pool-runner-db`
- Save the Internal Database URL

### 2. Deploy Backend
- New → Web Service
- **Root Directory**: `backend`
- **Build**: `pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate`
- **Start**: `gunicorn pool_runner.wsgi:application --bind 0.0.0.0:$PORT`
- Add env vars (see full guide)

### 3. Deploy Frontend
- New → Web Service
- **Root Directory**: `frontend/mad-pool`
- **Build**: `npm install && npm run build`
- **Start**: `npm start`
- Add env vars (see full guide)

### 4. Connect Services
Update backend `CORS_ALLOWED_ORIGINS` with frontend URL
Update frontend `NEXT_PUBLIC_GRAPHQL_ENDPOINT` with backend URL

---

## Key Environment Variables

### Backend:
```bash
DATABASE_URL=<from-render-postgresql>
USE_SQLITE=False
SECRET_KEY=<random-50-chars>
DEBUG=False
CORS_ALLOWED_ORIGINS=https://your-frontend.onrender.com
FRONTEND_URL=https://your-frontend.onrender.com
```

### Frontend:
```bash
NEXT_PUBLIC_GRAPHQL_ENDPOINT=https://your-backend.onrender.com/graphql/
NODE_ENV=production
```

---

## Testing After Deploy

1. **Backend**: Visit `https://your-backend.onrender.com/graphql/`
2. **Frontend**: Visit `https://your-frontend.onrender.com/`
3. **Create token**: Use backend shell to run `python manage.py generate_jwt test@example.com`
4. **Test auth**: Set token in frontend localStorage and reload

---

## Common Issues

**CORS Error**: Check `CORS_ALLOWED_ORIGINS` includes frontend URL with `https://`

**Database Error**: Use Internal Database URL, not External

**Static Files Not Loading**: Verify `collectstatic` runs in build command

**Build Fails**: Check root directory is set correctly for each service

---

See `RENDER_DEPLOYMENT.md` for complete step-by-step guide.
