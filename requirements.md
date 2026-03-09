# Requirements for Pool Running Application

## A. MVP Requirements

The goal of this application is to build a website that will allow users to create pools for the March Madness NCAA basketball tournament. The following requirements should be fulfilled:

- Users should be able to sign up using their email, which will send them a magic link to sign in
- Users should be create a Pool by setting a Pool Name and Password; Designated as Pool Owner
- Users should be able to invite others to join their pool using a unqiue link
- Users should be able to join pools created by others using the Pool Name and Password; Designated as Pool Member
- Pool owners will have the same functionality that Pool members have in game play
- Pool members should be displayed in a leaderboard in descending order based on points earned
- Pool owners will select 'Start Draft' when they are ready to start the draft
- Pool owners will select 'Complete Draft' when the draft is complete, at this point, teams will be locked and cannot be changed

# B. Game Rules

- Pools have a maximum of 11 Pool Members and 1 Pool Owner
- Pool Owners will be able to create a randomized draft order from 1-12 for each User in the pool, including all members and the owner
- Pool members will select teams in order based on their draft order and will select March Madness teams in any of the following groups of ranking in NCAA March Madness:
  - Group 1: 1 Team ranked from 1-4
  - Group 2: 1 Team ranked from 5-8
  - Group 3: 1 Team Ranked from 9-12
  - Group 4: 1 Team ranked from 13-16
  - Group 5: 1 wildcard team (any ranking)
- The draft will be done in a snake format whereby the player who drafts first in round 1 will select twelfth in round 2
- No team can be selected twice and Pool members must select teams to fill all groups
- Pool members can pick teams from any group in the first four rounds of drafting (eg. a team in group 4 can be selected in round 1)
- Wildcard teams must be selected in round 5
- For each win in the March Madness tournament, users will recieve the number of points for that team's ranking, plus the round number that they won (eg. if a team is ranked 4 and wins their first round game, they will award 5 points)
- Once a team loses their March Madness game, a Pool Member cannot earn points from having selected that team

## C. Tech Stack

- Frontend UI: Next.js (App Router), Typescript
- Backend: GraphQL via Django
- Supabase (PostgreSQL)

**State Flow (High-Level)**

1. User interacts with the Pool UI (view pool status, select teams during the draft)
2. UI issues GraphQL queries or mutations to the API server.
3. UI may apply optimistic updates for mutations.
4. API server validates requests and applies business rules.
5. API server reads from or writes to the database.
6. API server returns canonical state to the UI.
7. UI reconciles server responses with local state.

**State Ownership**

- UI: Temporary UI state (loading, optimistic updates).
- Server: Request orchestration, validation, and mutation logic.
- Database: Source of truth for points

## C. Data Model

### User Schema
```
User {
  id: UUID (PK)
  email: String (unique, indexed)
  created_at: Timestamp
  updated_at: Timestamp
}
```

### Pool Schema
```
Pool {
  id: UUID (PK)
  name: String (unique, indexed)
  password: String (hashed)
  url_slug: String (unique, indexed) - for unique pool URLs
  owner_id: UUID (FK -> User.id)
  draft_status: Enum ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']
  max_members: Integer (default: 12)
  created_at: Timestamp
  updated_at: Timestamp
}
```

### PoolMembership Schema
```
PoolMembership {
  id: UUID (PK)
  pool_id: UUID (FK -> Pool.id)
  user_id: UUID (FK -> User.id)
  draft_position: Integer (1-12, null until randomized)
  total_points: Integer (calculated/cached, default: 0)
  created_at: Timestamp

  UNIQUE constraint on (pool_id, user_id)
  UNIQUE constraint on (pool_id, draft_position) when not null
}
```

### Team Schema
```
Team {
  id: UUID (PK)
  pool_id: UUID (FK -> Pool.id) - teams are pool-specific
  name: String
  seed_rank: Integer (1-16)
  region: String (optional: 'East', 'West', 'South', 'Midwest')
  created_at: Timestamp

  UNIQUE constraint on (pool_id, name)
}
```

### DraftPick Schema
```
DraftPick {
  id: UUID (PK)
  pool_id: UUID (FK -> Pool.id)
  user_id: UUID (FK -> User.id)
  team_id: UUID (FK -> Team.id)
  draft_round: Integer (1-5)
  pick_order: Integer (1-60, overall pick number in draft)
  created_at: Timestamp

  UNIQUE constraint on (pool_id, team_id) - each team drafted once per pool
  UNIQUE constraint on (pool_id, pick_order)
}
```

### TeamGameResult Schema
```
TeamGameResult {
  id: UUID (PK)
  pool_id: UUID (FK -> Pool.id)
  team_id: UUID (FK -> Team.id)
  tournament_round: Integer (1-6: Rd64, Rd32, Rd16, Rd8, Rd4, Championship)
  result: Enum ['WON', 'LOST', 'NOT_PLAYED']
  points_awarded: Integer (calculated: seed_rank + tournament_round if WON, else 0)
  updated_at: Timestamp

  UNIQUE constraint on (pool_id, team_id, tournament_round)
}
```

### MagicLink Schema
```
MagicLink {
  id: UUID (PK)
  email: String
  token: String (unique, indexed)
  expires_at: Timestamp
  used: Boolean (default: false)
  created_at: Timestamp
}
```

## D. GraphQL API

### Queries

**Authentication & User**
```graphql
me: User
  # Returns currently authenticated user

getUser(id: UUID!): User
  # Get user by ID
```

**Pool Management**
```graphql
getPool(id: UUID, urlSlug: String): Pool
  # Get pool by ID or URL slug
  # Returns: Pool with owner, members, draft_status

getPoolMembers(poolId: UUID!): [PoolMembership!]!
  # Get all pool members with their draft positions and points
  # Ordered by total_points DESC for leaderboard

getUserPools(userId: UUID!): [Pool!]!
  # Get all pools a user is a member of or owns
```

**Draft & Teams**
```graphql
getAvailableTeams(poolId: UUID!): [Team!]!
  # Get teams not yet drafted in this pool
  # Used during draft to show available options

getDraftPicks(poolId: UUID!): [DraftPick!]!
  # Get all draft picks for a pool, ordered by pick_order
  # Includes team and user details

getUserDraftPicks(poolId: UUID!, userId: UUID!): [DraftPick!]!
  # Get a specific user's draft picks in a pool
  # Ordered by draft_round

getCurrentDraftTurn(poolId: UUID!): PoolMembership
  # Calculate whose turn it is based on draft_position and existing picks
  # Uses snake draft logic
```

**Tournament Results**
```graphql
getTeamResults(poolId: UUID!, teamId: UUID!): [TeamGameResult!]!
  # Get all tournament results for a specific team in a pool

getPoolStandings(poolId: UUID!): [PoolMembership!]!
  # Get leaderboard with calculated points for all members
  # Ordered by total_points DESC
```

### Mutations

**Authentication**
```graphql
sendMagicLink(email: String!): Boolean!
  # Creates MagicLink record and sends email
  # Returns: true if email sent successfully

signIn(token: String!): AuthPayload!
  # Validates magic link token
  # Returns: { user: User!, authToken: String! }
```

**Pool Management**
```graphql
createPool(name: String!, password: String!): Pool!
  # Creates pool with unique url_slug
  # Sets creator as owner
  # Creates PoolMembership for owner
  # Validation: name must be unique, password min length

joinPool(urlSlug: String!, password: String!): PoolMembership!
  # Validates password, checks capacity (max 12)
  # Creates PoolMembership for user
  # Validation: correct password, pool not full, user not already member

randomizeDraftOrder(poolId: UUID!): [PoolMembership!]!
  # Owner only: assigns random draft_position (1-12) to all members
  # Returns: updated PoolMemberships with positions

startDraft(poolId: UUID!): Pool!
  # Owner only: sets draft_status = 'IN_PROGRESS'
  # Validation: draft order must be randomized first

completeDraft(poolId: UUID!): Pool!
  # Owner only: sets draft_status = 'COMPLETED'
  # Validation: all members must have 5 picks (60 total picks)
  # Locks all teams from further changes
```

**Team Management**
```graphql
createTeam(poolId: UUID!, name: String!, seedRank: Int!, region: String): Team!
  # Creates a team in a pool
  # Validation: seedRank between 1-16, unique name per pool

bulkCreateTeams(poolId: UUID!, teams: [TeamInput!]!): [Team!]!
  # Create multiple teams at once for efficiency
  # Input: { name: String!, seedRank: Int!, region: String }
```

**Draft**
```graphql
makeDraftPick(poolId: UUID!, teamId: UUID!): DraftPick!
  # User makes a draft pick
  # Validation:
  #   - draft_status = 'IN_PROGRESS'
  #   - it's user's turn (based on draft position & snake logic)
  #   - team not already picked
  #   - user hasn't exceeded 5 picks
  #   - pick satisfies group constraints (rounds 1-4: any group, round 5: wildcard)
  # Auto-calculates pick_order and draft_round
```

**Tournament Results**
```graphql
updateTeamResult(
  poolId: UUID!,
  teamId: UUID!,
  tournamentRound: Int!,
  result: ResultEnum!
): TeamGameResult!
  # Owner only: manually records win/loss for a team in a round
  # Auto-calculates points_awarded (seed_rank + tournament_round if WON)
  # Triggers recalculation of affected users' total_points
  # Validation: tournamentRound 1-6, result in ['WON', 'LOST', 'NOT_PLAYED']
```

### Types

```graphql
type User {
  id: UUID!
  email: String!
  createdAt: String!
  pools: [Pool!]!
}

type Pool {
  id: UUID!
  name: String!
  urlSlug: String!
  owner: User!
  draftStatus: DraftStatus!
  maxMembers: Int!
  members: [PoolMembership!]!
  teams: [Team!]!
  createdAt: String!
}

type PoolMembership {
  id: UUID!
  pool: Pool!
  user: User!
  draftPosition: Int
  totalPoints: Int!
  picks: [DraftPick!]!
  createdAt: String!
}

type Team {
  id: UUID!
  name: String!
  seedRank: Int!
  region: String
  results: [TeamGameResult!]!
  createdAt: String!
}

type DraftPick {
  id: UUID!
  pool: Pool!
  user: User!
  team: Team!
  draftRound: Int!
  pickOrder: Int!
  createdAt: String!
}

type TeamGameResult {
  id: UUID!
  team: Team!
  tournamentRound: Int!
  result: ResultEnum!
  pointsAwarded: Int!
  updatedAt: String!
}

type AuthPayload {
  user: User!
  authToken: String!
}

enum DraftStatus {
  NOT_STARTED
  IN_PROGRESS
  COMPLETED
}

enum ResultEnum {
  WON
  LOST
  NOT_PLAYED
}
```

## E. State Boundaries

### UI Layer (Next.js Frontend)

**Responsibilities:**
- Render current pool state, draft board, leaderboard
- Handle user interactions (button clicks, form submissions)
- Apply optimistic updates for better UX
- Display loading, error, and success states
- Cache GraphQL query results (Apollo Client or similar)
- Validate form inputs before submission
- Handle real-time updates (polling or subscriptions for draft picks)

**State Stored:**
- Temporary UI state (modals open/closed, form validation errors)
- Optimistic updates (predicted state before server confirms)
- Cached query results with TTL
- Current authenticated user session

**Boundaries:**
- UI -> Server: GraphQL queries/mutations with variables
- Server -> UI: JSON responses (data, errors, loading states)
- UI handles stale data by timestamp comparison
- UI never directly calculates points or validates business rules

### Server Layer (Django GraphQL API)

**Responsibilities:**
- Authenticate requests (validate JWT tokens from magic links)
- Authorize actions (verify pool ownership, draft turn, etc.)
- Enforce business rules:
  - Draft turn validation (snake draft logic)
  - Group constraints (1 team per seed group, wildcard in round 5)
  - Pool capacity limits (max 12 members)
  - Draft status transitions (NOT_STARTED -> IN_PROGRESS -> COMPLETED)
- Calculate derived values:
  - Current draft turn based on pick_order and draft_position
  - Points awarded (seed_rank + tournament_round)
  - Total points per user (sum of all their teams' points)
- Coordinate database transactions
- Return canonical state to UI

**State Stored:**
- Request context (current user, pool permissions)
- Transaction state (within DB transaction boundary)

**Boundaries:**
- Server -> Database: Parameterized SQL queries/commands
- Database -> Server: Raw data rows
- Server never trusts client input; all validation happens here
- Server returns errors as GraphQL errors with codes

### Database Layer (Supabase PostgreSQL)

**Responsibilities:**
- Store all persistent data (users, pools, teams, picks, results)
- Enforce data integrity via constraints:
  - UNIQUE constraints (no duplicate team picks, no duplicate emails)
  - FOREIGN KEY constraints (referential integrity)
  - CHECK constraints (seedRank 1-16, draftRound 1-5, etc.)
- Handle concurrent access via ACID transactions
- Provide atomic operations (e.g., draft pick + increment total_points)

**State Stored:**
- All persistent application state
- Audit timestamps (created_at, updated_at)

**Boundaries:**
- Database enforces schema; server cannot bypass constraints
- Database returns success/failure; server handles errors
- Database is single source of truth for all state

### State Flow Example: Making a Draft Pick

1. **UI**: User clicks "Draft Team" button
   - Apply optimistic update: Show team as drafted immediately
   - Send `makeDraftPick(poolId, teamId)` mutation

2. **Server**: Receives mutation
   - Authenticate user (validate JWT)
   - Authorize action (verify it's user's turn)
   - Validate business rules:
     - Draft status is IN_PROGRESS
     - Team not already picked
     - User hasn't exceeded 5 picks
     - Correct seed group for draft round (if round 5, any team allowed)
   - Calculate pick_order and draft_round
   - Begin database transaction

3. **Database**: Execute transaction
   - INSERT into DraftPick table
   - Check UNIQUE constraints (team not picked, pick_order unique)
   - Commit transaction or rollback on constraint violation

4. **Server**: Return response
   - On success: Return new DraftPick with all details
   - On failure: Return GraphQL error with code (TEAM_ALREADY_PICKED, NOT_YOUR_TURN, etc.)

5. **UI**: Reconcile response
   - On success: Replace optimistic update with server data
   - On failure: Rollback optimistic update, show error message

## F. Failure Modes

### Authentication & Access

**Magic Link Expiration**
- Problem: User clicks magic link after expiration (e.g., 15 min timeout)
- Solution: Server validates `expires_at`, returns `LINK_EXPIRED` error, UI prompts user to request new link

**Invalid/Used Magic Link**
- Problem: User clicks same magic link twice, or token is invalid
- Solution: Server checks `used` flag and token validity, returns error, UI shows "Request a new link" message

**Unauthorized Pool Access**
- Problem: User tries to access pool they're not a member of
- Solution: Server checks PoolMembership, returns `FORBIDDEN` error, UI redirects to pool list

**Invalid Pool Password**
- Problem: User enters wrong password when joining pool
- Solution: Server validates hashed password, returns `INVALID_PASSWORD` error, UI displays error inline with retry

### Pool Capacity & State

**Pool at Capacity**
- Problem: 13th user tries to join a pool with 12 members
- Solution: Server checks member count, returns `POOL_FULL` error, UI displays "This pool is full" message

**Duplicate Pool Name**
- Problem: User tries to create pool with name that already exists
- Solution: Database UNIQUE constraint violation, server catches and returns `POOL_NAME_TAKEN` error, UI prompts for different name

**Draft Not Started**
- Problem: User tries to make draft pick before owner clicks "Start Draft"
- Solution: Server checks `draft_status != 'IN_PROGRESS'`, returns `DRAFT_NOT_STARTED` error, UI shows "Waiting for draft to start"

**Draft Already Completed**
- Problem: User tries to make pick after owner clicks "Complete Draft"
- Solution: Server checks `draft_status == 'COMPLETED'`, returns `DRAFT_LOCKED` error, UI disables draft buttons

**Incomplete Draft**
- Problem: Owner tries to complete draft before all 60 picks are made
- Solution: Server counts DraftPicks, returns `DRAFT_INCOMPLETE` error with count of missing picks, UI shows validation message

### Concurrent Draft Picks

**Out of Turn Pick**
- Problem: User tries to pick when it's not their turn (e.g., refreshes page, jumps ahead)
- Solution: Server calculates current turn using snake draft logic, returns `NOT_YOUR_TURN` error with whose turn it is, UI updates draft board

**Race Condition - Same Team**
- Problem: Two users simultaneously try to draft the same team
- Solution: Database UNIQUE constraint on (pool_id, team_id), one transaction succeeds, other gets `TEAM_ALREADY_PICKED` error, UI refreshes available teams

**Race Condition - Same Pick Order**
- Problem: Network latency causes two picks to attempt same pick_order
- Solution: Database UNIQUE constraint on (pool_id, pick_order), one succeeds, other recalculates pick_order and retries automatically

**Stale Draft Board**
- Problem: User's draft board doesn't show recent picks from other users
- Solution: UI polls `getDraftPicks` every 3-5 seconds during IN_PROGRESS status, or uses GraphQL subscriptions for real-time updates

### Draft Validation

**Duplicate Team Pick**
- Problem: User somehow attempts to pick team already drafted (UI bug, stale cache)
- Solution: Server checks existing DraftPicks, returns `TEAM_ALREADY_PICKED` error, UI rollback optimistic update and refreshes

**Exceeding Pick Limit**
- Problem: User tries to make 6th pick (should only have 5)
- Solution: Server counts user's picks, returns `PICK_LIMIT_EXCEEDED` error, UI disables further picks for user

**Invalid Seed Group**
- Problem: User tries to pick team from invalid seed group (future enhancement for group enforcement)
- Solution: Server validates seed_rank against draft_round constraints, returns `INVALID_SEED_GROUP` error, UI filters available teams

### Tournament Management

**Unauthorized Result Update**
- Problem: Non-owner tries to update team win/loss results
- Solution: Server checks pool.owner_id == current_user.id, returns `OWNER_ONLY` error, UI hides update controls for non-owners

**Invalid Tournament Round**
- Problem: Owner enters round number < 1 or > 6
- Solution: Server validates range, returns `INVALID_ROUND` error, UI dropdown restricts to valid rounds

**Conflicting Results**
- Problem: Owner tries to mark team as WON in round 3 when they LOST in round 2
- Solution: Server checks previous rounds, returns `TEAM_ELIMINATED` error, UI shows team's last result

**Points Calculation Failure**
- Problem: Points not updating after tournament result entered
- Solution: Server recalculates all affected users' `total_points` in transaction, if fails, rolls back entire operation and returns error

### Network & State

**Slow Network**
- Problem: GraphQL request takes >5 seconds
- Solution: UI displays loading spinner, allows user to cancel request, provides retry button

**Network Timeout**
- Problem: Request times out after 30 seconds
- Solution: UI catches timeout error, shows "Connection lost" message with retry button, keeps optimistic update visible until retry

**Optimistic Update Failure**
- Problem: UI shows draft pick succeeded, but server rejects it
- Solution: UI rollbacks optimistic update, removes pick from draft board, shows error toast with reason

**Stale Response (Out of Order)**
- Problem: Slow request returns after faster subsequent request
- Solution: UI tags requests with incrementing ID, ignores responses with ID lower than latest processed

**Component Unmount Mid-Request**
- Problem: User navigates away from pool page while draft pick is in flight
- Solution: Use AbortController to cancel in-flight GraphQL requests on unmount, prevent memory leaks

### Database

**Transaction Deadlock**
- Problem: Two concurrent mutations lock same rows in different order
- Solution: Django catches deadlock exception, retries transaction up to 3 times with exponential backoff, returns error if all retries fail

**Constraint Violation**
- Problem: Foreign key, unique, or check constraint violated
- Solution: Database returns constraint violation, Django catches and translates to specific GraphQL error (INVALID_TEAM_ID, DUPLICATE_PICK, etc.)

**Database Connection Lost**
- Problem: Database unavailable during mutation
- Solution: Server returns `SERVICE_UNAVAILABLE` error, UI shows "Service temporarily unavailable" with retry button

**Database Transaction Rollback**
- Problem: Error mid-transaction (e.g., during complex mutation with multiple inserts)
- Solution: Database rolls back all changes in transaction, server returns error, UI state remains unchanged (no partial updates)

## H. Non-Goals

The following features/functionality are explictly out of scope:

- Collecting payment methods from Pool Members
