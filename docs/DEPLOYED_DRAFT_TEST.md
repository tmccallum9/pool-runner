# Deployed Draft Test

Use this when the frontend is running on Vercel and the backend is running on Render.

## What it tests

The script:

- uses real JWTs from the deployed frontend
- creates a pool
- joins additional users
- seeds 16 draft teams
- randomizes draft order
- starts the draft
- makes draft picks for each user across 5 rounds by default

It hits the deployed GraphQL API directly, then prints the pool URLs so you can inspect the result in the Vercel UI.

## Prerequisites

1. Backend deployed on Render and reachable at `/graphql/`
2. Frontend deployed on Vercel
3. Database migrations applied
4. At least 2 signed-in users in the deployed frontend

## Get JWT tokens from the Vercel app

For each test user:

1. Sign in on the deployed frontend
2. Open browser devtools
3. Run:

```js
localStorage.getItem("authToken");
```

Copy one token for the pool owner and at least one additional token for pool members.

## Run the live test

From the repo root:

```bash
GRAPHQL_URL=https://pool-runner.onrender.com/graphql/ \
FRONTEND_URL=https://pool-runner.vercel.app \
OWNER_TOKEN='owner-jwt' \
MEMBER_TOKENS='member-jwt-1,member-jwt-2' \
python backend/test/live_deployment_draft_test.py
```

Optional variables:

```bash
POOL_PASSWORD=testpass123
POOL_NAME_PREFIX='Render Draft Test'
DRAFT_ROUNDS=5
```

## Expected output

The script prints:

- resolved user emails
- the created pool ID and join slug
- the Vercel invite URL
- draft order
- every draft pick in sequence

If it completes, open the printed pool URL in the Vercel app and verify:

- the pool exists
- members are present
- draft order is visible
- drafted teams appear under each user

## Notes

- `MEMBER_TOKENS` must contain raw JWTs separated by commas
- use only one backend config path at a time in Render (`DATABASE_URL` or `DB_*`)
- if you are still using temporary SQLite on Render, the data is only for smoke testing
