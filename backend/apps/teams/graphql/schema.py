"""
GraphQL types, queries, and mutations for teams and draft picks.
"""
import graphene
from graphene_django import DjangoObjectType
from django.db import transaction
from apps.teams.models import Team, DraftPick
from apps.pools.models import Pool
from apps.users.service import authenticate_request
from apps.teams.service import (
    validate_draft_pick,
    get_available_teams,
    validate_seed_group_constraint
)
from apps.exceptions import (
    NotAuthenticatedError,
    PoolNotFoundError,
    TeamNotFoundError,
    TeamNameExistsError,
    InvalidSeedRankError,
    NotPoolMemberError,
)


# Types
class TeamStatusType(graphene.ObjectType):
    """Team tournament status information."""
    is_eliminated = graphene.Boolean()
    elimination_round = graphene.Int()
    status_text = graphene.String()


class TeamType(DjangoObjectType):
    tournament_status = graphene.Field(TeamStatusType)
    results = graphene.List('apps.tournaments.graphql.schema.TeamGameResultType')

    class Meta:
        model = Team
        name = 'Team'
        fields = ('id', 'pool', 'name', 'seed_rank', 'region', 'is_eliminated', 'elimination_round', 'created_at', 'updated_at')

    def resolve_tournament_status(self, info):
        """Get the team's tournament status as a structured object."""
        return self.get_tournament_status()

    def resolve_results(self, info):
        return self.game_results.all().order_by('tournament_round')


class DraftPickType(DjangoObjectType):
    class Meta:
        model = DraftPick
        fields = ('id', 'pool', 'user', 'team', 'draft_round', 'pick_order', 'created_at')


# Queries
class TeamQueries(graphene.ObjectType):
    get_available_teams = graphene.List(
        TeamType,
        pool_id=graphene.UUID(required=True)
    )
    get_active_teams = graphene.List(
        TeamType,
        pool_id=graphene.UUID(required=True),
        description="Get all teams that are still active (not eliminated) in a pool"
    )
    get_eliminated_teams = graphene.List(
        TeamType,
        pool_id=graphene.UUID(required=True),
        description="Get all teams that have been eliminated from a pool"
    )
    get_draft_picks = graphene.List(
        DraftPickType,
        pool_id=graphene.UUID(required=True)
    )
    get_user_draft_picks = graphene.List(
        DraftPickType,
        pool_id=graphene.UUID(required=True),
        user_id=graphene.UUID(required=True)
    )
    get_current_draft_turn = graphene.Field(
        'apps.pools.graphql.schema.PoolMembershipType',
        pool_id=graphene.UUID(required=True)
    )

    def resolve_get_available_teams(self, info, pool_id):
        """Get teams not yet drafted in a pool."""
        user = authenticate_request(info)
        if not user:
            raise NotAuthenticatedError()

        try:
            pool = Pool.objects.get(id=pool_id)
            return get_available_teams(pool)
        except Pool.DoesNotExist:
            raise PoolNotFoundError()

    def resolve_get_active_teams(self, info, pool_id):
        """Get all teams that are still active (not eliminated) in a pool."""
        user = authenticate_request(info)
        if not user:
            raise NotAuthenticatedError()

        try:
            pool = Pool.objects.get(id=pool_id)
            return Team.objects.filter(pool=pool, is_eliminated=False).order_by('seed_rank')
        except Pool.DoesNotExist:
            raise PoolNotFoundError()

    def resolve_get_eliminated_teams(self, info, pool_id):
        """Get all teams that have been eliminated from a pool."""
        user = authenticate_request(info)
        if not user:
            raise NotAuthenticatedError()

        try:
            pool = Pool.objects.get(id=pool_id)
            return Team.objects.filter(pool=pool, is_eliminated=True).order_by('elimination_round', 'seed_rank')
        except Pool.DoesNotExist:
            raise PoolNotFoundError()

    def resolve_get_draft_picks(self, info, pool_id):
        """Get all draft picks for a pool."""
        user = authenticate_request(info)
        if not user:
            raise NotAuthenticatedError()

        return DraftPick.objects.filter(pool_id=pool_id).order_by('pick_order')

    def resolve_get_user_draft_picks(self, info, pool_id, user_id):
        """Get a specific user's draft picks in a pool."""
        user = authenticate_request(info)
        if not user:
            raise NotAuthenticatedError()

        return DraftPick.objects.filter(
            pool_id=pool_id,
            user_id=user_id
        ).order_by('draft_round')

    def resolve_get_current_draft_turn(self, info, pool_id):
        """Calculate whose turn it is in the draft."""
        user = authenticate_request(info)
        if not user:
            raise NotAuthenticatedError()

        try:
            pool = Pool.objects.get(id=pool_id)
            return DraftPick.get_current_turn(pool)
        except Pool.DoesNotExist:
            raise PoolNotFoundError()


# Mutations
class CreateTeam(graphene.Mutation):
    class Arguments:
        pool_id = graphene.UUID(required=True)
        name = graphene.String(required=True)
        seed_rank = graphene.Int(required=True)
        region = graphene.String()

    team = graphene.Field(TeamType)

    def mutate(self, info, pool_id, name, seed_rank, region=None):
        """Create a new team in a pool."""
        user = authenticate_request(info)
        if not user:
            raise NotAuthenticatedError()

        # Get pool
        try:
            pool = Pool.objects.get(id=pool_id)
        except Pool.DoesNotExist:
            raise PoolNotFoundError()

        # Validate seed rank
        if not (1 <= seed_rank <= 16):
            raise InvalidSeedRankError()

        # Check if team name already exists in pool
        if Team.objects.filter(pool=pool, name=name).exists():
            raise TeamNameExistsError()

        # Create team
        team = Team.objects.create(
            pool=pool,
            name=name,
            seed_rank=seed_rank,
            region=region
        )

        return CreateTeam(team=team)


class TeamInput(graphene.InputObjectType):
    name = graphene.String(required=True)
    seed_rank = graphene.Int(required=True)
    region = graphene.String()


class BulkCreateTeams(graphene.Mutation):
    class Arguments:
        pool_id = graphene.UUID(required=True)
        teams = graphene.List(TeamInput, required=True)

    teams = graphene.List(TeamType)

    @transaction.atomic
    def mutate(self, info, pool_id, teams):
        """Create multiple teams at once."""
        user = authenticate_request(info)
        if not user:
            raise NotAuthenticatedError()

        # Get pool
        try:
            pool = Pool.objects.get(id=pool_id)
        except Pool.DoesNotExist:
            raise PoolNotFoundError()

        created_teams = []
        for team_data in teams:
            # Validate seed rank
            if not (1 <= team_data.seed_rank <= 16):
                raise InvalidSeedRankError(f"Invalid seed rank for {team_data.name}: must be between 1 and 16")

            # Check if team name already exists
            if Team.objects.filter(pool=pool, name=team_data.name).exists():
                raise TeamNameExistsError(f"Team name already exists: {team_data.name}")

            # Create team
            team = Team.objects.create(
                pool=pool,
                name=team_data.name,
                seed_rank=team_data.seed_rank,
                region=team_data.region if hasattr(team_data, 'region') else None
            )
            created_teams.append(team)

        return BulkCreateTeams(teams=created_teams)


class MakeDraftPick(graphene.Mutation):
    class Arguments:
        pool_id = graphene.UUID(required=True)
        team_id = graphene.UUID(required=True)

    draft_pick = graphene.Field(DraftPickType)

    @transaction.atomic
    def mutate(self, info, pool_id, team_id):
        """Make a draft pick."""
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

        # Validate draft pick
        is_valid, error_message = validate_draft_pick(pool, user, team)
        if not is_valid:
            # Import specific exceptions based on error message
            from apps.exceptions import (
                DraftNotStartedError,
                TeamAlreadyPickedError,
                PickLimitExceededError,
                NotYourTurnError
            )
            if "not in progress" in error_message.lower():
                raise DraftNotStartedError(error_message)
            elif "already drafted" in error_message.lower():
                raise TeamAlreadyPickedError(error_message)
            elif "5 picks" in error_message.lower():
                raise PickLimitExceededError(error_message)
            elif "not your turn" in error_message.lower():
                raise NotYourTurnError(error_message)
            else:
                raise Exception(error_message)

        # Get user's existing picks
        user_picks = DraftPick.objects.filter(pool=pool, user=user)
        draft_round = user_picks.count() + 1

        # Validate seed group constraint
        is_valid, error_message = validate_seed_group_constraint(user_picks, team, draft_round)
        if not is_valid:
            from apps.exceptions import InvalidSeedGroupError
            raise InvalidSeedGroupError(error_message)

        # Get user's draft position
        from apps.pools.models import PoolMembership
        try:
            membership = PoolMembership.objects.get(pool=pool, user=user)
        except PoolMembership.DoesNotExist:
            raise NotPoolMemberError()

        # Calculate pick order
        pick_order = DraftPick.calculate_pick_order(
            membership.draft_position,
            draft_round,
            pool.memberships.count()
        )

        # Create draft pick
        draft_pick = DraftPick.objects.create(
            pool=pool,
            user=user,
            team=team,
            draft_round=draft_round,
            pick_order=pick_order
        )

        return MakeDraftPick(draft_pick=draft_pick)


class TeamMutations(graphene.ObjectType):
    create_team = CreateTeam.Field()
    bulk_create_teams = BulkCreateTeams.Field()
    make_draft_pick = MakeDraftPick.Field()
