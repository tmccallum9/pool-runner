"""
Root GraphQL schema combining all app schemas.

This module aggregates all GraphQL queries and mutations from individual apps
and creates the root schema for the Pool Runner application.

API Structure:
--------------

QUERIES (14 total):
  Authentication & User:
    - me: Get currently authenticated user
    - getUser(id): Get user by ID

  Pool Management:
    - getPool(id, urlSlug): Get pool by ID or URL slug
    - getPoolMembers(poolId): Get all members with draft positions and points
    - getUserPools(userId): Get all pools a user belongs to
    - getPoolStandings(poolId): Get leaderboard standings
    - getInviteUrl(poolId): Get full invite URL for pool

  Draft & Teams:
    - getAvailableTeams(poolId): Get undrafted teams
    - getActiveTeams(poolId): Get teams that are still active (not eliminated)
    - getEliminatedTeams(poolId): Get teams that have been eliminated
    - getDraftPicks(poolId): Get all draft picks in order
    - getUserDraftPicks(poolId, userId): Get user's picks
    - getCurrentDraftTurn(poolId): Calculate whose turn it is

  Tournament Results:
    - getTeamResults(poolId, teamId): Get team's tournament results

MUTATIONS (11 total):
  Authentication:
    - sendMagicLink(email): Send magic link email
    - signIn(token): Sign in with magic link token

  Pool Management:
    - createPool(name, password): Create new pool
    - joinPool(urlSlug, password): Join existing pool
    - randomizeDraftOrder(poolId): Randomize draft positions (owner only)
    - startDraft(poolId): Set draft status to IN_PROGRESS (owner only)
    - completeDraft(poolId): Set draft status to COMPLETED (owner only)

  Team Management:
    - createTeam(poolId, name, seedRank, region): Create single team
    - bulkCreateTeams(poolId, teams): Create multiple teams
    - makeDraftPick(poolId, teamId): Make a draft pick

  Tournament Management:
    - updateTeamResult(poolId, teamId, tournamentRound, result): Record win/loss (owner only)
"""
import graphene
from apps.users.schema import UserQueries, UserMutations
from apps.pools.schema import PoolQueries, PoolMutations
from apps.teams.schema import TeamQueries, TeamMutations
from apps.tournaments.schema import TournamentQueries, TournamentMutations


class Query(
    UserQueries,
    PoolQueries,
    TeamQueries,
    TournamentQueries,
    graphene.ObjectType
):
    """
    Root Query combining all app queries.

    Inherits queries from:
    - UserQueries: Authentication and user management
    - PoolQueries: Pool creation, membership, and standings
    - TeamQueries: Team management and draft operations
    - TournamentQueries: Tournament results and scoring
    """
    pass


class Mutation(
    UserMutations,
    PoolMutations,
    TeamMutations,
    TournamentMutations,
    graphene.ObjectType
):
    """
    Root Mutation combining all app mutations.

    Inherits mutations from:
    - UserMutations: Magic link authentication
    - PoolMutations: Pool operations and draft control
    - TeamMutations: Team creation and draft picks
    - TournamentMutations: Tournament result recording
    """
    pass


# Root schema with all queries and mutations
schema = graphene.Schema(
    query=Query,
    mutation=Mutation,
    auto_camelcase=True  # Automatically convert snake_case to camelCase in GraphQL
)
