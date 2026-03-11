# Local Testing Guide

This guide covers only the local testing flow needed to:

- create JWT tokens
- verify authentication
- create a pool
- add teams
- join the pool with additional users

Before starting, complete the setup in `README.md` and make sure `python manage.py runserver` is running from `backend/`.

## Option A: fastest setup

Use the helper script if you want the backend to create test users, a pool, and teams for you:

```bash
cd backend
source venv/bin/activate
python test/test_draft.py
```

That script will:

- generate JWT tokens for `user1@test.com`, `user2@test.com`, and `user3@test.com`
- create a pool
- add 16 teams
- join users 2 and 3 to the pool

If you want to test the flow manually, use the steps below.

## 1. Generate a JWT token

```bash
cd backend
source venv/bin/activate
python manage.py generate_jwt owner@example.com
```

Save the token from the output and use it as:

```text
Authorization: Bearer <jwt_token>
```

To create more test users:

```bash
python manage.py generate_jwt user2@example.com
python manage.py generate_jwt user3@example.com
```

## 2. Verify the token works

Run this in GraphiQL at `http://localhost:8000/graphql/` or any GraphQL client with the `Authorization` header set:

```graphql
query Me {
  me {
    id
    email
  }
}
```

If the token is valid, the response returns the user you created with `generate_jwt`.

## 3. Create a pool

Run this as the owner:

```graphql
mutation CreatePool {
  createPool(name: "March Madness Test Pool", password: "testpass123") {
    pool {
      id
      name
      urlSlug
      draftStatus
      owner {
        email
      }
    }
  }
}
```

Save:

- `pool.id`
- `pool.urlSlug`

## 4. Add teams to the pool

Run this as the owner, replacing `POOL_ID`:

```graphql
mutation BulkCreateTeams {
  bulkCreateTeams(
    poolId: "POOL_ID"
    teams: [
      { name: "Duke", seedRank: 1, region: "East" }
      { name: "Gonzaga", seedRank: 2, region: "West" }
      { name: "Kansas", seedRank: 3, region: "South" }
      { name: "Purdue", seedRank: 4, region: "Midwest" }
      { name: "Tennessee", seedRank: 5, region: "East" }
      { name: "Auburn", seedRank: 6, region: "West" }
      { name: "Houston", seedRank: 7, region: "South" }
      { name: "Arizona", seedRank: 8, region: "Midwest" }
      { name: "Texas", seedRank: 9, region: "East" }
      { name: "Marquette", seedRank: 10, region: "West" }
      { name: "UConn", seedRank: 11, region: "South" }
      { name: "Alabama", seedRank: 12, region: "Midwest" }
      { name: "Kentucky", seedRank: 13, region: "East" }
      { name: "Creighton", seedRank: 14, region: "West" }
      { name: "Baylor", seedRank: 15, region: "South" }
      { name: "Illinois", seedRank: 16, region: "Midwest" }
    ]
  ) {
    teams {
      id
      name
      seedRank
      region
    }
  }
}
```

## 5. Join the pool with another JWT user

Generate a second user token if you have not already, switch your `Authorization` header to that token, then run:

```graphql
mutation JoinPool {
  joinPool(urlSlug: "POOL_URL_SLUG", password: "testpass123") {
    membership {
      id
      user {
        email
      }
      pool {
        id
        name
      }
      draftPosition
    }
  }
}
```

Run the same mutation with a third user token if you want a third member.

## 6. Confirm the pool state

As any authenticated member:

```graphql
query PoolDetails {
  getPool(urlSlug: "POOL_URL_SLUG") {
    id
    name
    urlSlug
    draftStatus
    owner {
      email
    }
  }
}
```

```graphql
query PoolMembers {
  getPoolMembers(poolId: "POOL_ID") {
    id
    user {
      email
    }
    draftPosition
    totalPoints
  }
}
```

## Useful local endpoints

- GraphQL: `http://localhost:8000/graphql/`
- Health: `http://localhost:8000/health/`

## Common issues

`NOT_AUTHENTICATED`

- The `Authorization` header is missing.
- The header must be `Bearer <token>`.
- The token may be expired; generate a fresh one.

`POOL_NOT_FOUND`

- The `urlSlug` is wrong.
- Confirm the slug with the `createPool` response or `getPool`.

`INVALID_PASSWORD`

- The password passed to `joinPool` does not match the one used in `createPool`.
