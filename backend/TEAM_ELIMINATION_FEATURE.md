# Team Elimination Tracking Feature

## Overview

The Team model now includes automatic elimination tracking that monitors when teams are knocked out of the tournament. This provides better UI visibility and ensures eliminated teams cannot accumulate additional points.

---

## What Changed

### 1. **New Team Model Fields**

**`is_eliminated`** (Boolean, default: False)
- Tracks whether a team has been eliminated from the tournament
- Updated automatically when tournament results are recorded
- Can be queried efficiently for UI filtering

**`elimination_round`** (Integer, nullable, 1-6)
- Records the tournament round where the team was eliminated
- `null` for active teams
- Set automatically when a loss is recorded

**`updated_at`** (DateTime, auto)
- Tracks when the team record was last modified
- Useful for cache invalidation and change tracking

### 2. **New Team Methods**

**`mark_eliminated(tournament_round)`**
- Marks team as eliminated in a specific round
- Updates `is_eliminated` and `elimination_round` fields
- Called automatically by `TeamGameResult.save()`

**`mark_active()`**
- Marks team as active (removes elimination status)
- Used when correcting tournament results
- Resets `is_eliminated` to False and `elimination_round` to None

**`update_elimination_status()`**
- Recalculates elimination status based on all tournament results
- Returns True if status changed, False otherwise
- Handles result corrections automatically

**`get_tournament_status()`**
- Returns structured status information:
  ```python
  {
      'is_eliminated': False,
      'elimination_round': None,
      'status_text': 'Active'
  }
  # OR
  {
      'is_eliminated': True,
      'elimination_round': 3,
      'status_text': 'Eliminated in Sweet 16'
  }
  ```

### 3. **Automatic Status Updates**

**`TeamGameResult.save()` Enhancement**
- When a team **loses** (`result=LOST`):
  - Team automatically marked as eliminated
  - `elimination_round` set to the loss round
  - Status update happens in the same transaction

- When a team **wins** or result is **NOT_PLAYED**:
  - Team status recalculated from all results
  - Handles result corrections automatically
  - Ensures data consistency

### 4. **New GraphQL Queries**

**`getActiveTeams(poolId)`**
```graphql
query {
  getActiveTeams(poolId: "uuid") {
    id
    name
    seedRank
    isEliminated
    tournamentStatus {
      statusText
    }
  }
}
```
Returns only teams that haven't been eliminated. Perfect for showing which teams can still earn points.

**`getEliminatedTeams(poolId)`**
```graphql
query {
  getEliminatedTeams(poolId: "uuid") {
    id
    name
    eliminationRound
    tournamentStatus {
      eliminationRound
      statusText
    }
  }
}
```
Returns only eliminated teams, ordered by elimination round. Useful for showing tournament bracket history.

### 5. **Enhanced GraphQL Types**

**`TeamType` - New Fields:**
```graphql
type Team {
  id: UUID!
  name: String!
  seedRank: Int!
  region: String
  isEliminated: Boolean!        # NEW
  eliminationRound: Int          # NEW
  tournamentStatus: TeamStatus!  # NEW
  createdAt: String!
  updatedAt: String!             # NEW
}
```

**`TeamStatusType` - New Object:**
```graphql
type TeamStatus {
  isEliminated: Boolean!
  eliminationRound: Int
  statusText: String!  # e.g., "Active" or "Eliminated in Elite 8"
}
```

---

## Database Migration

**Migration File:** `apps/teams/migrations/0002_add_team_elimination_tracking.py`

**Changes:**
- Added `is_eliminated` boolean field (default: False)
- Added `elimination_round` integer field (nullable)
- Added `updated_at` timestamp field (auto_now)
- Added check constraint for `elimination_round` (1-6 or null)

**To Apply:**
```bash
python manage.py migrate teams
```

---

## Usage Examples

### Frontend UI Use Cases

#### 1. **Show Active vs Eliminated Teams in Draft Picks**
```graphql
query GetUserPicks {
  getUserDraftPicks(poolId: "...", userId: "...") {
    team {
      name
      seedRank
      isEliminated
      tournamentStatus {
        statusText
      }
    }
    draftRound
  }
}
```

**UI Display:**
```
Your Picks:
✓ Duke Blue Devils (Seed 1) - Active
✓ Kansas Jayhawks (Seed 2) - Active
✗ Michigan State (Seed 7) - Eliminated in Round of 32
✓ Gonzaga Bulldogs (Seed 3) - Active
✗ UCLA Bruins (Seed 11) - Eliminated in Round of 64
```

#### 2. **Filter Leaderboard by Active Teams Only**
```graphql
query GetStandingsWithActiveTeams {
  getPoolStandings(poolId: "...") {
    user { email }
    totalPoints
    picks {
      team {
        name
        isEliminated
      }
    }
  }
}
```

#### 3. **Show Tournament Bracket with Elimination Status**
```graphql
query GetAllTeamsWithStatus {
  getActiveTeams(poolId: "...") {
    name
    seedRank
    region
  }
  getEliminatedTeams(poolId: "...") {
    name
    seedRank
    region
    eliminationRound
    tournamentStatus {
      statusText
    }
  }
}
```

**UI Display:**
```
East Region:
✓ Duke (1) - Active
✗ Michigan St (7) - Eliminated Rd32
✓ Texas Tech (3) - Active
✗ Auburn (9) - Eliminated Rd64
```

#### 4. **Prevent Points from Eliminated Teams**
The backend automatically handles this - eliminated teams' wins after elimination won't add points. But you can show this in the UI:

```graphql
query GetTeamWithAllResults {
  getTeamResults(poolId: "...", teamId: "...") {
    tournamentRound
    result
    pointsAwarded
  }
  # Also get team status
  getAvailableTeams(poolId: "...") {
    id
    name
    isEliminated
    eliminationRound
  }
}
```

---

## Backend Logic Flow

### When Recording a Tournament Result

```python
# Owner records that Team A lost in Round 2
mutation {
  updateTeamResult(
    poolId: "...",
    teamId: "team-a-id",
    tournamentRound: 2,
    result: LOST
  ) {
    teamResult { pointsAwarded }  # Will be 0 for a loss
  }
}
```

**What Happens Automatically:**
1. `TeamGameResult.save()` is called
2. Points calculated (0 for loss)
3. **Team.mark_eliminated(2)** called automatically
4. Team fields updated:
   - `is_eliminated = True`
   - `elimination_round = 2`
   - `updated_at = now()`
5. Member points recalculated
6. Transaction committed

### When Correcting a Result

```python
# Owner corrects: Team A actually won Round 2
mutation {
  updateTeamResult(
    poolId: "...",
    teamId: "team-a-id",
    tournamentRound: 2,
    result: WON
  ) {
    teamResult { pointsAwarded }  # Will be seed_rank + 2
  }
}
```

**What Happens Automatically:**
1. `TeamGameResult.save()` updates the result
2. Points recalculated (seed_rank + 2 for win)
3. **Team.update_elimination_status()** called
4. Checks all results for this team
5. No losses found → Team marked as active
6. Team fields updated:
   - `is_eliminated = False`
   - `elimination_round = None`
7. Member points recalculated
8. Transaction committed

---

## Query Performance

### Optimized Queries

**Get active teams only:**
```python
Team.objects.filter(pool=pool, is_eliminated=False)
```
- Uses database index on `is_eliminated`
- No need to join `TeamGameResult` table
- Fast for UI filtering

**Get elimination order:**
```python
Team.objects.filter(pool=pool, is_eliminated=True).order_by('elimination_round', 'seed_rank')
```
- Ordered by when they were eliminated
- Useful for bracket visualization

### Before This Feature

To check if a team was eliminated:
```python
# BAD - Required joining TeamGameResult
has_loss = TeamGameResult.objects.filter(
    team=team,
    result='LOST'
).exists()
```

### After This Feature

```python
# GOOD - Direct field access
if team.is_eliminated:
    print(f"Eliminated in round {team.elimination_round}")
```

---

## Testing Scenarios

### Scenario 1: Normal Elimination
1. Team loses in Round 1
2. Verify `is_eliminated=True`, `elimination_round=1`
3. Team should not earn points from future wins

### Scenario 2: Result Correction
1. Team marked as lost in Round 2 (eliminated)
2. Correction: Actually won Round 2
3. Verify `is_eliminated=False`, `elimination_round=None`
4. Team can earn points from future wins

### Scenario 3: Multiple Corrections
1. Team loses Round 1 (eliminated)
2. Correction: Won Round 1
3. Team loses Round 2 (eliminated again)
4. Verify `elimination_round=2`

### Scenario 4: Query Filtering
1. Create 10 teams
2. Eliminate 5 teams in various rounds
3. Query `getActiveTeams` → Should return 5
4. Query `getEliminatedTeams` → Should return 5 (ordered by elimination_round)

---

## Migration Steps

### For Existing Databases

If you have existing data, run this to update team statuses:

```python
# In Django shell (python manage.py shell)
from apps.teams.models import Team

# Update all teams based on their tournament results
for team in Team.objects.all():
    changed = team.update_elimination_status()
    if changed:
        print(f"Updated {team.name}: eliminated={team.is_eliminated}")
```

Or create a management command:

```python
# apps/teams/management/commands/sync_team_status.py
from django.core.management.base import BaseCommand
from apps.teams.models import Team

class Command(BaseCommand):
    help = 'Sync team elimination status with tournament results'

    def handle(self, *args, **options):
        count = 0
        for team in Team.objects.all():
            if team.update_elimination_status():
                count += 1
        self.stdout.write(
            self.style.SUCCESS(f'Updated {count} team(s)')
        )
```

Run with:
```bash
python manage.py sync_team_status
```

---

## Summary

### Benefits

1. **Better Performance**: Direct field access instead of joining tournament results
2. **Clearer UI**: Easy to show which teams are alive vs eliminated
3. **Automatic Updates**: No manual tracking needed - happens on result save
4. **Data Integrity**: Constraints ensure elimination_round is valid
5. **Flexible Querying**: New queries for filtering by status
6. **Error Correction**: Handles result corrections automatically

### Files Modified

- `apps/teams/models.py` - Added fields and methods
- `apps/teams/schema.py` - Added queries and types
- `apps/teams/migrations/0002_add_team_elimination_tracking.py` - Database migration
- `apps/tournaments/models.py` - Auto-update team status
- `schema.py` - Updated query count
- `API_DOCUMENTATION.md` - Added elimination tracking docs
- `GRAPHQL_QUICK_REFERENCE.md` - Added new queries

### API Changes

**New Queries (2):**
- `getActiveTeams(poolId)` - Filter to active teams only
- `getEliminatedTeams(poolId)` - Filter to eliminated teams only

**Enhanced Team Type:**
- Added `isEliminated` field
- Added `eliminationRound` field
- Added `tournamentStatus` object with human-readable status
- Added `updatedAt` timestamp

**Total API Queries:** 14 (was 12)

---

## Future Enhancements

Potential improvements for future iterations:

1. **Subscription/Webhook**: Real-time updates when teams are eliminated
2. **Bulk Status Update**: Admin endpoint to recalculate all team statuses
3. **Historical Tracking**: Log of all status changes for audit trail
4. **Elimination Notifications**: Email/push when user's team is eliminated
5. **UI Indicators**: Visual badges/colors for elimination status
6. **Statistics**: Show elimination rate by seed rank or region
