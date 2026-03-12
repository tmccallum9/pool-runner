# Environment Variables Quick Reference

## Backend (Render)

Copy these environment variables into Render Dashboard:

### Security
```
SECRET_KEY=your-generated-secret-key-here
DEBUG=False
```

### Server Configuration (Update after first deployment)
```
ALLOWED_HOSTS=your-app.onrender.com
```

### Database (Supabase)
```
DATABASE_URL=your-supabase-database-url
DB_HOST=your-supabase-host
DB_HOSTADDR=optional-ipv4-address
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your-database-password
DB_PORT=5432
USE_SQLITE=False
```

`DATABASE_URL` is the preferred production setting. Use `DB_HOSTADDR` only if your database hostname resolves to IPv6 in your runtime and you need to force an IPv4 address.

### JWT Authentication
```
JWT_SECRET_KEY=your-generated-jwt-secret-key-here
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24
```

### Magic Link Settings
```
MAGIC_LINK_EXPIRATION_MINUTES=15
FRONTEND_URL=https://your-app.vercel.app
```

### Email (SendGrid)
```
SENDGRID_API_KEY=your-sendgrid-api-key
FROM_EMAIL=noreply@poolrunner.com
```

### CORS (Update after frontend deployment)
```
CORS_ALLOWED_ORIGINS=https://your-app.vercel.app
```

---

## Frontend (Vercel)

Copy this environment variable into Vercel Dashboard:

### API Configuration (Update after backend deployment)
```
NEXT_PUBLIC_GRAPHQL_ENDPOINT=https://your-app.onrender.com/graphql/
```

---

## Deployment Steps Checklist

### Step 1: Deploy Backend First
- [ ] Create Render Web Service
- [ ] Add all backend environment variables
- [ ] Use temporary values for ALLOWED_HOSTS, CORS_ALLOWED_ORIGINS, FRONTEND_URL
- [ ] Deploy and wait for completion
- [ ] **Copy the Render URL** (e.g., `https://pool-runner-backend.onrender.com`)

### Step 2: Deploy Frontend
- [ ] Create Vercel Project
- [ ] Add `NEXT_PUBLIC_GRAPHQL_ENDPOINT` with your Render URL
- [ ] Deploy and wait for completion
- [ ] **Copy the Vercel URL** (e.g., `https://pool-runner.vercel.app`)

### Step 3: Update Backend with Frontend URL
- [ ] Go back to Render Environment Variables
- [ ] Update `ALLOWED_HOSTS` to include Vercel URL
- [ ] Update `CORS_ALLOWED_ORIGINS` with Vercel URL
- [ ] Update `FRONTEND_URL` with Vercel URL
- [ ] Save changes (triggers automatic redeploy)

### Step 4: Test Everything
- [ ] Visit backend GraphQL endpoint: `https://your-backend.onrender.com/graphql`
- [ ] Visit frontend: `https://your-frontend.vercel.app`
- [ ] Test authentication flow
- [ ] Test magic link emails
- [ ] Verify CORS is working (check browser console)

---

## Important Notes

### First Deployment URLs
After initial deployment, replace these placeholders:

**In Render:**
- Replace `your-app.onrender.com` with actual Render URL
- Replace `https://your-app.vercel.app` with actual Vercel URL

**In Vercel:**
- Replace `https://your-app.onrender.com` with actual Render URL

### Security Considerations

1. **Your generated keys are cryptographically secure** - keep them safe!

2. **If credentials were committed to git:**
   - Rotate SendGrid API key: https://app.sendgrid.com/settings/api_keys
   - Consider rotating Supabase database password

3. **.gitignore is already configured** - verified that `.env` files won't be committed

4. **Two different secret keys:**
   - `SECRET_KEY` - Django framework security
   - `JWT_SECRET_KEY` - Authentication tokens
   - Both are unique and secure

### Render Free Tier Notes

- Services sleep after 15 minutes of inactivity
- First request after sleep takes 30-60 seconds
- 750 hours/month free (enough for 1 service)
- For always-on service, upgrade to paid plan ($7/month)

### Vercel Free Tier Notes

- 100 GB bandwidth/month
- Unlimited deployments
- Automatic preview deployments for PRs
- Always-on, no cold starts

---

## Troubleshooting

### Backend won't start
Check Render logs for:
- Missing environment variables
- Database connection errors
- Import errors

### Frontend can't connect to backend
Verify:
- `NEXT_PUBLIC_GRAPHQL_ENDPOINT` is correct (with `/graphql/` at end)
- `CORS_ALLOWED_ORIGINS` includes your Vercel URL
- Browser console for CORS errors

### Authentication not working
Check:
- JWT tokens in browser localStorage
- `JWT_SECRET_KEY` is set
- Authorization header in network tab
- Backend logs for auth errors

---

## After Deployment

### Monitor Your Services

**Render:**
- Dashboard → Logs (real-time)
- Dashboard → Metrics (CPU, memory)

**Vercel:**
- Dashboard → Analytics
- Dashboard → Deployment logs

### Update Your Local .env

After deployment succeeds, you may want to test against production:

```bash
# In frontend/mad-pool/.env.local (for testing against production)
NEXT_PUBLIC_GRAPHQL_ENDPOINT=https://your-actual-backend.onrender.com/graphql/
```

Remember to change it back to `http://localhost:8000/graphql/` for local development!
