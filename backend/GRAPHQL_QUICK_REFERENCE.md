# GraphQL API Quick Reference

## 🚀 Endpoint
```
POST http://localhost:8000/graphql/
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

---

## 🔐 Authentication

### Send Magic Link
```graphql
mutation { sendMagicLink(email: "user@example.com") { success } }
```

### Sign In
```graphql
mutation { signIn(token: "token") { user { id email } authToken } }
```

---

## 👤 User

### Get Current User
```graphql
query { me { id email } }
```

### Get User by ID
```graphql
query { getUser(id: "uuid") { id email } }
```

---

## 🏊 Pool Management

### Create Pool
```graphql
mutation { createPool(name: "Pool Name", password: "pass123") { pool { id urlSlug } } }
```

### Get Pool
```graphql
query { getPool(urlSlug: "pool-slug") { id name draftStatus owner { email } } }
```

### Join Pool
```graphql
mutation { joinPool(urlSlug: "pool-slug", password: "pass123") { membership { id } } }
```

### Get Pool Members
```graphql
query { getPoolMembers(poolId: "uuid") { user { email } draftPosition totalPoints } }
```

### Get Pool Standings (Leaderboard)
```graphql
query { getPoolStandings(poolId: "uuid") { user { email } totalPoints } }
```

### Get Invite URL
```graphql
query { getInviteUrl(poolId: "uuid") }
```

### Get User's Pools
```graphql
query { getUserPools(userId: "uuid") { id name urlSlug draftStatus } }
```

---

## 🎲 Draft Management (Owner Only)

### Randomize Draft Order
```graphql
mutation { randomizeDraftOrder(poolId: "uuid") { memberships { user { email } draftPosition } } }
```

### Start Draft
```graphql
mutation { startDraft(poolId: "uuid") { pool { draftStatus } } }
```

### Complete Draft
```graphql
mutation { completeDraft(poolId: "uuid") { pool { draftStatus } } }
```

---

## 🏀 Team Management

### Create Team
```graphql
mutation { createTeam(poolId: "uuid", name: "Duke", seedRank: 1, region: "East") { team { id } } }
```

### Bulk Create Teams
```graphql
mutation {
  bulkCreateTeams(poolId: "uuid", teams: [
    { name: "Duke", seedRank: 1, region: "East" }
    { name: "Kansas", seedRank: 2, region: "West" }
  ]) {
    teams { id name seedRank }
  }
}
```

### Get Available Teams
```graphql
query { getAvailableTeams(poolId: "uuid") { id name seedRank region isEliminated } }
```

### Get Active Teams (Not Eliminated)
```graphql
query { getActiveTeams(poolId: "uuid") { id name seedRank isEliminated } }
```

### Get Eliminated Teams
```graphql
query { getEliminatedTeams(poolId: "uuid") { id name eliminationRound tournamentStatus { statusText } } }
```

---

## 📝 Draft Picks

### Make Draft Pick
```graphql
mutation { makeDraftPick(poolId: "uuid", teamId: "uuid") { draftPick { team { name } pickOrder } } }
```

### Get All Draft Picks
```graphql
query { getDraftPicks(poolId: "uuid") { team { name } user { email } pickOrder } }
```

### Get User's Draft Picks
```graphql
query { getUserDraftPicks(poolId: "uuid", userId: "uuid") { team { name } draftRound } }
```

### Get Current Draft Turn
```graphql
query { getCurrentDraftTurn(poolId: "uuid") { user { email } draftPosition } }
```

---

## 🏆 Tournament Results (Owner Only)

### Update Team Result
```graphql
mutation {
  updateTeamResult(poolId: "uuid", teamId: "uuid", tournamentRound: 1, result: WON) {
    teamResult { pointsAwarded }
  }
}
```

### Get Team Results
```graphql
query { getTeamResults(poolId: "uuid", teamId: "uuid") { tournamentRound result pointsAwarded } }
```

---

## 📋 Enums

### DraftStatus
- `NOT_STARTED`
- `IN_PROGRESS`
- `COMPLETED`

### ResultEnum
- `WON`
- `LOST`
- `NOT_PLAYED`

### Tournament Rounds
- `1` - Round of 64
- `2` - Round of 32
- `3` - Sweet 16
- `4` - Elite 8
- `5` - Final Four
- `6` - Championship

---

## ❌ Error Codes

| Code | Meaning |
|------|---------|
| `NOT_AUTHENTICATED` | User not authenticated |
| `POOL_NOT_FOUND` | Pool doesn't exist |
| `INVALID_PASSWORD` | Wrong pool password |
| `POOL_FULL` | Pool at max capacity |
| `ALREADY_MEMBER` | User already in pool |
| `OWNER_ONLY` | Owner permission required |
| `TEAM_ALREADY_PICKED` | Team already drafted |
| `NOT_YOUR_TURN` | Not user's draft turn |
| `DRAFT_NOT_STARTED` | Draft not in progress |
| `DRAFT_LOCKED` | Draft completed |
| `INVALID_SEED_GROUP` | Seed group constraint violated |

**Full list in API_DOCUMENTATION.md**

---

## 💡 Points Formula
```
points = team_seed_rank + tournament_round
```

Examples:
- Seed 1 wins Rd64: 1 + 1 = **2 pts**
- Seed 8 wins Sweet 16: 8 + 3 = **11 pts**
- Seed 16 wins Championship: 16 + 6 = **22 pts**

---

## 🔧 Testing Tools

### Health Check
```bash
curl http://localhost:8000/health/
```

### GraphiQL Interface (DEBUG=True)
```
http://localhost:8000/graphql/
```

### Example Request with curl
```bash
curl -X POST http://localhost:8000/graphql/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"query": "{ me { email } }"}'
```

---

## 📚 Full Documentation
- **Complete API Guide**: `API_DOCUMENTATION.md`
- **Setup Instructions**: `SETUP.md`
- **Schema Verification**: `python verify_schema.py`
