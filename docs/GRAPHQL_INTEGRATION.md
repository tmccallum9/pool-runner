# GraphQL Backend Integration Guide

This document explains how the frontend is integrated with the Django GraphQL backend for the Pool Runner application.

## Overview

The application uses:
- **Apollo Client** for GraphQL data fetching
- **TypeScript** for type safety
- **Custom React Hooks** for data management
- **Next.js App Router** with React Server Components

## Project Structure

```
app/
├── lib/
│   ├── apollo-client.ts          # Apollo Client configuration
│   ├── apollo-provider.tsx       # Client-side Apollo Provider wrapper
│   ├── types.ts                  # TypeScript types matching GraphQL schema
│   ├── hooks/
│   │   ├── index.ts              # Hooks exports
│   │   ├── usePoolTeams.ts       # Hook to fetch all teams in a pool
│   │   └── useUserDraftPicks.ts  # Hook to fetch user's drafted teams
│   └── queries/
│       └── teams.ts              # GraphQL queries for team data
└── components/
    ├── atoms/
    │   └── ...                   # Basic UI components
    ├── molecules/
    │   └── team-card.tsx         # TeamCard component (presentational)
    └── organisms/
        ├── teams-list.tsx        # All teams in pool (with data fetching)
        └── user-teams.tsx        # User's drafted teams (with data fetching)
```

## Configuration

### 1. Environment Variables

Create a `.env.local` file in the root directory:

```bash
NEXT_PUBLIC_GRAPHQL_ENDPOINT=http://localhost:8000/graphql/
```

For production, update to your deployed Django backend URL.

### 2. Apollo Client Setup

Apollo Client is configured in `app/lib/apollo-client.ts` with:
- HTTP link to GraphQL endpoint
- In-memory cache
- Credential inclusion for authentication
- SSR mode detection

### 3. Provider Wrapper

The `ApolloWrapper` component wraps the app in `app/layout.tsx` to provide GraphQL capabilities throughout the application.

## Components

### TeamCard (Molecule)

**File:** `app/components/molecules/team-card.tsx`

Presentational component that displays a single team's information.

**Props:**
```typescript
interface TeamCardProps {
  name: string;          // Team name
  seedRank: number;      // Tournament seed (1-16)
  region?: string;       // Optional region (East, West, South, Midwest)
  status: 'active' | 'eliminated';  // Team status
  className?: string;    // Optional CSS classes
}
```

**Usage:**
```tsx
<TeamCard
  name="Duke Blue Devils"
  seedRank={1}
  region="East"
  status="active"
/>
```

### TeamsList (Organism)

**File:** `app/components/organisms/teams-list.tsx`

Container component that fetches and displays all teams in a pool.

**Props:**
```typescript
interface TeamsListProps {
  poolId: string;        // Pool ID to fetch teams for
  title?: string;        // Optional title (default: "All Teams")
  className?: string;    // Optional CSS classes
}
```

**Features:**
- Automatic data fetching using `usePoolTeams` hook
- Loading state with spinner
- Error handling with retry button
- Empty state message
- Responsive grid layout

**Usage:**
```tsx
<TeamsList poolId="pool-uuid-here" title="Tournament Teams" />
```

### UserTeams (Organism)

**File:** `app/components/organisms/user-teams.tsx`

Container component that fetches and displays a user's drafted teams.

**Props:**
```typescript
interface UserTeamsProps {
  poolId: string;        // Pool ID
  userId: string;        // User ID
  title?: string;        // Optional title (default: "My Teams")
  className?: string;    // Optional CSS classes
}
```

**Features:**
- Fetches user's draft picks using `useUserDraftPicks` hook
- Displays draft round badge on each team
- Sorted by draft round
- Loading, error, and empty states

**Usage:**
```tsx
<UserTeams poolId="pool-uuid" userId="user-uuid" title="My Drafted Teams" />
```

## Custom Hooks

### usePoolTeams

Fetches all teams in a pool.

```typescript
const { teams, poolName, loading, error, refetch } = usePoolTeams(poolId);
```

**Returns:**
- `teams`: Array of Team objects
- `poolName`: Name of the pool
- `loading`: Boolean loading state
- `error`: Error object if request fails
- `refetch`: Function to manually refetch data

### useUserDraftPicks

Fetches a user's draft picks in a pool.

```typescript
const { draftPicks, loading, error, refetch } = useUserDraftPicks(poolId, userId);
```

**Returns:**
- `draftPicks`: Array of DraftPick objects
- `loading`: Boolean loading state
- `error`: Error object if request fails
- `refetch`: Function to manually refetch data

## GraphQL Queries

### GET_POOL_TEAMS

Fetches all teams in a pool with their tournament results.

```graphql
query GetPoolTeams($poolId: UUID!) {
  getPool(id: $poolId) {
    id
    name
    teams {
      id
      name
      seedRank
      region
      createdAt
      results {
        id
        tournamentRound
        result
        pointsAwarded
        updatedAt
      }
    }
  }
}
```

### GET_USER_DRAFT_PICKS

Fetches a user's draft picks with team details.

```graphql
query GetUserDraftPicks($poolId: UUID!, $userId: UUID!) {
  getUserDraftPicks(poolId: $poolId, userId: $userId) {
    id
    team {
      id
      name
      seedRank
      region
      results {
        id
        tournamentRound
        result
        pointsAwarded
      }
    }
    draftRound
    pickOrder
    createdAt
  }
}
```

## TypeScript Types

All GraphQL types are defined in `app/lib/types.ts` matching the backend schema:

- `User`
- `Pool`
- `PoolMembership`
- `Team`
- `DraftPick`
- `TeamGameResult`
- `DraftStatus` (enum)
- `ResultEnum` (enum)

### Helper Functions

**getTeamStatus**

Determines if a team is active or eliminated based on tournament results.

```typescript
import { getTeamStatus } from '@/app/lib/types';

const status = getTeamStatus(team.results);
// Returns 'active' | 'eliminated'
```

## Example: Creating a Pool Page

```tsx
'use client';

import { TeamsList } from '@/app/components/organisms/teams-list';
import { UserTeams } from '@/app/components/organisms/user-teams';

export default function PoolPage({ params }: { params: { poolId: string } }) {
  const userId = 'current-user-id'; // Get from auth context

  return (
    <div className="container mx-auto p-6">
      <h1 className="mb-8 text-4xl font-bold">My Pool</h1>

      {/* Display user's drafted teams */}
      <UserTeams
        poolId={params.poolId}
        userId={userId}
        className="mb-12"
      />

      {/* Display all teams in pool */}
      <TeamsList
        poolId={params.poolId}
        title="All Tournament Teams"
      />
    </div>
  );
}
```

## Data Flow

1. **Component renders** → Hook is called
2. **Hook executes GraphQL query** → Apollo Client fetches data
3. **Apollo Client checks cache** → Returns cached data if available
4. **Apollo Client fetches from network** → Contacts Django backend
5. **Backend validates & queries database** → Returns data
6. **Apollo Client caches response** → Updates component state
7. **Component re-renders** → Displays data

## Caching Strategy

Apollo Client uses `cache-and-network` fetch policy:
- Returns cached data immediately (fast UI)
- Fetches from network in background (fresh data)
- Updates UI when network response arrives

## Error Handling

All data-fetching components include:
- **Loading state**: Spinner with message
- **Error state**: Error message with retry button
- **Empty state**: Friendly message when no data exists

## Authentication

The Apollo Client is configured with `credentials: 'include'` to send cookies with each request for authentication. Ensure your Django backend:
1. Accepts credentials in CORS settings
2. Validates authentication tokens
3. Returns appropriate errors for unauthorized requests

## Next Steps

1. **Set up Django backend** with GraphQL endpoint at the configured URL
2. **Implement authentication** to provide userId
3. **Create additional queries** for pools, draft picks, leaderboard, etc.
4. **Add mutations** for creating pools, making draft picks, etc.
5. **Implement real-time updates** using GraphQL subscriptions or polling

## Troubleshooting

### CORS Errors

Update Django settings to allow requests from your Next.js frontend:

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
]
CORS_ALLOW_CREDENTIALS = True
```

### GraphQL Endpoint Not Found

Verify:
1. `.env.local` file exists with correct endpoint
2. Django GraphQL server is running
3. Endpoint URL is correct

### Type Errors

Ensure TypeScript types in `app/lib/types.ts` match your GraphQL schema exactly.

## Resources

- [Apollo Client Documentation](https://www.apollographql.com/docs/react/)
- [Next.js App Router](https://nextjs.org/docs/app)
- [GraphQL Best Practices](https://graphql.org/learn/best-practices/)
