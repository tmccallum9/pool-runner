# Pool Runner GraphQL API Documentation

## Base URL
```
http://localhost:8000/graphql/  (Development)
https://your-domain.com/graphql/  (Production)
```

## Authentication

All queries and mutations require JWT authentication except:
- `sendMagicLink`
- `signIn`

Include the JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Authentication Flow

### 1. Request Magic Link
```graphql
mutation SendMagicLink {
  sendMagicLink(email: "user@example.com") {
    success
  }
}
```

### 2. Sign In with Token
```graphql
mutation SignIn {
  signIn(token: "magic-link-token-from-email") {
    user {
      id
      email
      createdAt
    }
    authToken
  }
}
```

**Response:**
```json
{
  "data": {
    "signIn": {
      "user": {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "email": "user@example.com",
        "createdAt": "2024-03-01T10:00:00Z"
      },
      "authToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

---

## User Queries

### Get Current User
```graphql
query Me {
  me {
    id
    email
    createdAt
    updatedAt
  }
}
```

### Get User by ID
```graphql
query GetUser {
  getUser(id: "123e4567-e89b-12d3-a456-426614174000") {
    id
    email
    createdAt
  }
}
```

---

## Pool Management

### Create Pool
```graphql
mutation CreatePool {
  createPool(name: "March Madness 2025", password: "secretpass123") {
    pool {
      id
      name
      urlSlug
      draftStatus
      maxMembers
      owner {
        id
        email
      }
      createdAt
    }
  }
}
```

### Get Pool
```graphql
query GetPool {
  getPool(urlSlug: "march-madness-2025-abc123") {
    id
    name
    urlSlug
    draftStatus
    maxMembers
    owner {
      id
      email
    }
    members {
      id
      user {
        id
        email
      }
      draftPosition
      totalPoints
    }
  }
}
```

### Get Pool Members
```graphql
query GetPoolMembers {
  getPoolMembers(poolId: "123e4567-e89b-12d3-a456-426614174000") {
    id
    user {
      id
      email
    }
    draftPosition
    totalPoints
    createdAt
  }
}
```

### Get User's Pools
```graphql
query GetUserPools {
  getUserPools(userId: "123e4567-e89b-12d3-a456-426614174000") {
    id
    name
    urlSlug
    draftStatus
    owner {
      id
      email
    }
  }
}
```

### Get Pool Standings (Leaderboard)
```graphql
query GetPoolStandings {
  getPoolStandings(poolId: "123e4567-e89b-12d3-a456-426614174000") {
    id
    user {
      id
      email
    }
    draftPosition
    totalPoints
    picks {
      id
      team {
        name
        seedRank
      }
      draftRound
    }
  }
}
```

### Get Invite URL
```graphql
query GetInviteUrl {
  getInviteUrl(poolId: "123e4567-e89b-12d3-a456-426614174000")
}
```

**Response:**
```json
{
  "data": {
    "getInviteUrl": "http://localhost:3000/pools/join/march-madness-2025-abc123"
  }
}
```

### Join Pool
```graphql
mutation JoinPool {
  joinPool(urlSlug: "march-madness-2025-abc123", password: "secretpass123") {
    membership {
      id
      pool {
        id
        name
      }
      user {
        id
        email
      }
      draftPosition
      totalPoints
    }
  }
}
```

---

## Draft Management

### Randomize Draft Order (Owner Only)
```graphql
mutation RandomizeDraftOrder {
  randomizeDraftOrder(poolId: "123e4567-e89b-12d3-a456-426614174000") {
    memberships {
      id
      user {
        email
      }
      draftPosition
    }
  }
}
```

### Start Draft (Owner Only)
```graphql
mutation StartDraft {
  startDraft(poolId: "123e4567-e89b-12d3-a456-426614174000") {
    pool {
      id
      name
      draftStatus
    }
  }
}
```

### Complete Draft (Owner Only)
```graphql
mutation CompleteDraft {
  completeDraft(poolId: "123e4567-e89b-12d3-a456-426614174000") {
    pool {
      id
      name
      draftStatus
    }
  }
}
```

---

## Team Management

### Create Team
```graphql
mutation CreateTeam {
  createTeam(
    poolId: "123e4567-e89b-12d3-a456-426614174000"
    name: "Duke Blue Devils"
    seedRank: 1
    region: "East"
  ) {
    team {
      id
      name
      seedRank
      region
      createdAt
    }
  }
}
```

### Bulk Create Teams
```graphql
mutation BulkCreateTeams {
  bulkCreateTeams(
    poolId: "123e4567-e89b-12d3-a456-426614174000"
    teams: [
      { name: "Duke Blue Devils", seedRank: 1, region: "East" }
      { name: "Kansas Jayhawks", seedRank: 2, region: "West" }
      { name: "North Carolina", seedRank: 3, region: "South" }
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

### Get Available Teams
```graphql
query GetAvailableTeams {
  getAvailableTeams(poolId: "123e4567-e89b-12d3-a456-426614174000") {
    id
    name
    seedRank
    region
    isEliminated
    eliminationRound
    tournamentStatus {
      isEliminated
      eliminationRound
      statusText
    }
  }
}
```

### Get Active Teams (Not Eliminated)
```graphql
query GetActiveTeams {
  getActiveTeams(poolId: "123e4567-e89b-12d3-a456-426614174000") {
    id
    name
    seedRank
    region
    isEliminated
    tournamentStatus {
      statusText
    }
  }
}
```

### Get Eliminated Teams
```graphql
query GetEliminatedTeams {
  getEliminatedTeams(poolId: "123e4567-e89b-12d3-a456-426614174000") {
    id
    name
    seedRank
    region
    isEliminated
    eliminationRound
    tournamentStatus {
      eliminationRound
      statusText
    }
  }
}
```

---

## Draft Picks

### Make Draft Pick
```graphql
mutation MakeDraftPick {
  makeDraftPick(
    poolId: "123e4567-e89b-12d3-a456-426614174000"
    teamId: "456e7890-e89b-12d3-a456-426614174111"
  ) {
    draftPick {
      id
      team {
        name
        seedRank
      }
      user {
        email
      }
      draftRound
      pickOrder
      createdAt
    }
  }
}
```

### Get All Draft Picks
```graphql
query GetDraftPicks {
  getDraftPicks(poolId: "123e4567-e89b-12d3-a456-426614174000") {
    id
    team {
      name
      seedRank
    }
    user {
      email
    }
    draftRound
    pickOrder
    createdAt
  }
}
```

### Get User's Draft Picks
```graphql
query GetUserDraftPicks {
  getUserDraftPicks(
    poolId: "123e4567-e89b-12d3-a456-426614174000"
    userId: "789e0123-e89b-12d3-a456-426614174222"
  ) {
    id
    team {
      name
      seedRank
    }
    draftRound
    pickOrder
  }
}
```

### Get Current Draft Turn
```graphql
query GetCurrentDraftTurn {
  getCurrentDraftTurn(poolId: "123e4567-e89b-12d3-a456-426614174000") {
    id
    user {
      id
      email
    }
    draftPosition
  }
}
```

---

## Tournament Results

### Update Team Result (Owner Only)
```graphql
mutation UpdateTeamResult {
  updateTeamResult(
    poolId: "123e4567-e89b-12d3-a456-426614174000"
    teamId: "456e7890-e89b-12d3-a456-426614174111"
    tournamentRound: 1
    result: WON
  ) {
    teamResult {
      id
      team {
        name
        seedRank
      }
      tournamentRound
      result
      pointsAwarded
      updatedAt
    }
  }
}
```

**Tournament Rounds:**
- `1` - Round of 64
- `2` - Round of 32
- `3` - Sweet 16
- `4` - Elite 8
- `5` - Final Four
- `6` - Championship

**Result Enum:**
- `WON`
- `LOST`
- `NOT_PLAYED`

### Get Team Results
```graphql
query GetTeamResults {
  getTeamResults(
    poolId: "123e4567-e89b-12d3-a456-426614174000"
    teamId: "456e7890-e89b-12d3-a456-426614174111"
  ) {
    id
    team {
      name
      seedRank
    }
    tournamentRound
    result
    pointsAwarded
    updatedAt
  }
}
```

---

## Error Handling

All errors include structured error codes in the `extensions` field:

```json
{
  "errors": [
    {
      "message": "Pool not found",
      "extensions": {
        "code": "POOL_NOT_FOUND",
        "exception": {
          "code": "POOL_NOT_FOUND",
          "message": "Pool not found"
        }
      }
    }
  ]
}
```

### Error Codes

**Authentication:**
- `NOT_AUTHENTICATED` - User not authenticated
- `LINK_EXPIRED` - Magic link has expired
- `LINK_ALREADY_USED` - Magic link already used
- `INVALID_TOKEN` - Invalid token

**Pool Management:**
- `POOL_NOT_FOUND` - Pool does not exist
- `POOL_NAME_TAKEN` - Pool name already exists
- `INVALID_PASSWORD` - Incorrect pool password
- `POOL_FULL` - Pool has reached maximum capacity
- `ALREADY_MEMBER` - User already a member
- `OWNER_ONLY` - Action requires pool owner
- `DRAFT_ORDER_NOT_SET` - Draft order not randomized
- `DRAFT_INCOMPLETE` - Not all picks made

**Draft & Teams:**
- `TEAM_NOT_FOUND` - Team does not exist
- `TEAM_NAME_EXISTS` - Team name already exists
- `INVALID_SEED_RANK` - Seed rank not between 1-16
- `DRAFT_NOT_STARTED` - Draft not in progress
- `DRAFT_LOCKED` - Draft already completed
- `TEAM_ALREADY_PICKED` - Team already drafted
- `PICK_LIMIT_EXCEEDED` - User made 5 picks already
- `NOT_YOUR_TURN` - Not user's turn to pick
- `INVALID_SEED_GROUP` - Already picked from seed group
- `NOT_POOL_MEMBER` - User not a pool member

**Tournament:**
- `INVALID_ROUND` - Round not between 1-6
- `TEAM_ELIMINATED` - Team already lost

---

## GraphQL Types

### Enums

**DraftStatus:**
```graphql
enum DraftStatus {
  NOT_STARTED
  IN_PROGRESS
  COMPLETED
}
```

**ResultEnum:**
```graphql
enum ResultEnum {
  WON
  LOST
  NOT_PLAYED
}
```

---

## Team Elimination Tracking

Teams are automatically tracked for elimination status based on tournament results:

### Automatic Status Updates
- When a team **loses** a game, they are automatically marked as `isEliminated: true`
- The `eliminationRound` is set to the round where they lost
- **Eliminated teams cannot accumulate more points**
- Status updates happen automatically when tournament results are recorded

### Team Status Fields

**isEliminated** (Boolean)
- `false` - Team is still active in the tournament
- `true` - Team has been eliminated

**eliminationRound** (Integer, nullable)
- `null` - Team is still active
- `1-6` - The round in which the team was eliminated

**tournamentStatus** (Object)
- `isEliminated` - Boolean status
- `eliminationRound` - Round of elimination (null if active)
- `statusText` - Human-readable status like "Active" or "Eliminated in Sweet 16"

### Example Status Queries

**Check if a specific team is eliminated:**
```graphql
query {
  getAvailableTeams(poolId: "...") {
    name
    isEliminated
    tournamentStatus {
      statusText
    }
  }
}
```

**Get only active teams:**
```graphql
query {
  getActiveTeams(poolId: "...") {
    name
    seedRank
  }
}
```

**View all eliminations:**
```graphql
query {
  getEliminatedTeams(poolId: "...") {
    name
    eliminationRound
    tournamentStatus {
      statusText
    }
  }
}
```

---

## Points Calculation

Points awarded for a win:
```
points = team_seed_rank + tournament_round
```

**Important:** Eliminated teams cannot earn additional points, even if you drafted them.

**Examples:**
- Seed 1 team wins Round 1 (Rd64): 1 + 1 = 2 points
- Seed 8 team wins Round 3 (Sweet 16): 8 + 3 = 11 points
- Seed 16 team wins Round 6 (Championship): 16 + 6 = 22 points
- Seed 5 team loses Round 2: Team eliminated, no more points possible

---

## Development Tools

### GraphiQL Interface
When `DEBUG=True`, access the interactive GraphiQL interface:
```
http://localhost:8000/graphql/
```

### Health Check
```bash
curl http://localhost:8000/health/
```

**Response:**
```json
{
  "status": "healthy",
  "service": "Pool Runner API",
  "version": "1.0.0",
  "endpoints": {
    "graphql": "/graphql/",
    "graphiql": "/graphql/ (GET request)",
    "admin": "/admin/",
    "health": "/health/"
  }
}
```

---

## Example: Complete Pool Setup Flow

```graphql
# 1. Create pool
mutation {
  createPool(name: "March Madness 2025", password: "secret123") {
    pool { id urlSlug }
  }
}

# 2. Bulk create teams
mutation {
  bulkCreateTeams(poolId: "...", teams: [...]) {
    teams { id name seedRank }
  }
}

# 3. Share invite URL with others
query {
  getInviteUrl(poolId: "...")
}

# 4. Others join pool
mutation {
  joinPool(urlSlug: "...", password: "secret123") {
    membership { id }
  }
}

# 5. Owner randomizes draft order
mutation {
  randomizeDraftOrder(poolId: "...") {
    memberships { user { email } draftPosition }
  }
}

# 6. Owner starts draft
mutation {
  startDraft(poolId: "...") {
    pool { draftStatus }
  }
}

# 7. Members make picks in order
mutation {
  makeDraftPick(poolId: "...", teamId: "...") {
    draftPick { team { name } pickOrder }
  }
}

# 8. Owner completes draft
mutation {
  completeDraft(poolId: "...") {
    pool { draftStatus }
  }
}

# 9. Owner records tournament results
mutation {
  updateTeamResult(poolId: "...", teamId: "...", tournamentRound: 1, result: WON) {
    teamResult { pointsAwarded }
  }
}

# 10. View leaderboard
query {
  getPoolStandings(poolId: "...") {
    user { email }
    totalPoints
  }
}
```
