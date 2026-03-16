"""
GraphQL types, queries, and mutations for tournament results.
"""
import graphene
from graphene_django import DjangoObjectType
from django.db import transaction
from apps.tournaments.models import TeamGameResult, GameResult
from apps.teams.models import Team
from apps.pools.models import Pool
from apps.users.service import authenticate_request
from apps.pools.utils import check_pool_owner
from apps.tournaments.service import validate_result_update
from apps.exceptions import (
    NotAuthenticatedError,
    PoolNotFoundError,
    TeamNotFoundError,
    OwnerOnlyError,
    InvalidRoundError,
    TeamEliminatedError,
)


# Types
class ResultEnum(graphene.Enum):
    WON = 'WON'
    LOST = 'LOST'
    NOT_PLAYED = 'NOT_PLAYED'


class TeamGameResultType(DjangoObjectType):
    result = graphene.Field(ResultEnum)

    class Meta:
        model = TeamGameResult
        fields = ('id', 'pool', 'team', 'tournament_round', 'result', 'points_awarded', 'updated_at')


# Queries
class TournamentQueries(graphene.ObjectType):
    get_team_results = graphene.List(
        TeamGameResultType,
        pool_id=graphene.UUID(required=True),
        team_id=graphene.UUID(required=True)
    )
    get_pool_results = graphene.List(
        TeamGameResultType,
        pool_id=graphene.UUID(required=True)
    )

    def resolve_get_team_results(self, info, pool_id, team_id):
        """Get all tournament results for a specific team."""
        user = authenticate_request(info)
        if not user:
            raise NotAuthenticatedError()

        return TeamGameResult.objects.filter(
            pool_id=pool_id,
            team_id=team_id
        ).order_by('tournament_round')

    def resolve_get_pool_results(self, info, pool_id):
        """Get all tournament results for a pool."""
        user = authenticate_request(info)
        if not user:
            raise NotAuthenticatedError()

        # Verify pool exists
        try:
            Pool.objects.get(id=pool_id)
        except Pool.DoesNotExist:
            raise PoolNotFoundError()

        return TeamGameResult.objects.filter(
            pool_id=pool_id
        ).select_related('team').order_by('team__name', 'tournament_round')


# Mutations
class UpdateTeamResult(graphene.Mutation):
    class Arguments:
        pool_id = graphene.UUID(required=True)
        team_id = graphene.UUID(required=True)
        tournament_round = graphene.Int(required=True)
        result = ResultEnum(required=True)

    team_result = graphene.Field(TeamGameResultType)

    @transaction.atomic
    def mutate(self, info, pool_id, team_id, tournament_round, result):
        """Update tournament result for a team."""
        user = authenticate_request(info)
        if not user:
            raise NotAuthenticatedError()

        # Get pool and team
        try:
            pool = Pool.objects.get(id=pool_id)
            team = Team.objects.get(id=team_id, pool=pool)
        except Pool.DoesNotExist:
            raise PoolNotFoundError()
        except Team.DoesNotExist:
            raise TeamNotFoundError()

        # Check if user is pool owner
        if not check_pool_owner(user, pool):
            raise OwnerOnlyError("Only the pool owner can update tournament results")

        # Validate tournament round
        if not (1 <= tournament_round <= 6):
            raise InvalidRoundError()

        # Validate result update (check if team already eliminated)
        if result == 'WON':
            is_valid, error_message = validate_result_update(pool, team, tournament_round)
            if not is_valid:
                raise TeamEliminatedError(error_message)

        # Create or update team game result
        team_result, created = TeamGameResult.objects.update_or_create(
            pool=pool,
            team=team,
            tournament_round=tournament_round,
            defaults={'result': result}
        )

        return UpdateTeamResult(team_result=team_result)


class TournamentMutations(graphene.ObjectType):
    update_team_result = UpdateTeamResult.Field()
