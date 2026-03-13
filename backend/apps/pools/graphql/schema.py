"""
GraphQL types, queries, and mutations for pools.
"""
import graphene
from graphene_django import DjangoObjectType
from django.db import transaction
from apps.pools.models import Pool, PoolMembership, DraftStatus
from apps.users.models import User
from apps.users.service import authenticate_request
from apps.pools.service import (
    randomize_draft_order,
    check_pool_owner,
    validate_draft_complete
)
from apps.exceptions import (
    NotAuthenticatedError,
    PoolNotFoundError,
    PoolNameTakenError,
    InvalidPasswordError,
    PoolFullError,
    AlreadyMemberError,
    OwnerOnlyError,
    DraftOrderNotSetError,
    DraftIncompleteError,
)


# Types
class DraftStatusEnum(graphene.Enum):
    NOT_STARTED = 'NOT_STARTED'
    IN_PROGRESS = 'IN_PROGRESS'
    COMPLETED = 'COMPLETED'


class PoolType(DjangoObjectType):
    # Expose camelCase versions for GraphQL
    urlSlug = graphene.String()
    draftStatus = graphene.Field(DraftStatusEnum)
    maxMembers = graphene.Int()
    memberCount = graphene.Int()
    teams = graphene.List('apps.teams.graphql.schema.TeamType')
    createdAt = graphene.DateTime()
    updatedAt = graphene.DateTime()

    class Meta:
        model = Pool
        fields = ('id', 'name', 'owner')

    def resolve_urlSlug(self, info):
        return self.url_slug

    def resolve_draftStatus(self, info):
        return getattr(self.draft_status, 'value', self.draft_status)

    def resolve_maxMembers(self, info):
        return self.max_members

    def resolve_memberCount(self, info):
        return self.memberships.count()

    def resolve_teams(self, info):
        return self.teams.all().order_by('seed_rank', 'name')

    def resolve_createdAt(self, info):
        return self.created_at

    def resolve_updatedAt(self, info):
        return self.updated_at


class PoolMembershipType(DjangoObjectType):
    # Expose camelCase versions for GraphQL
    draftPosition = graphene.Int()
    totalPoints = graphene.Int()
    picks = graphene.List('apps.teams.graphql.schema.DraftPickType')
    createdAt = graphene.DateTime()

    class Meta:
        model = PoolMembership
        fields = ('id', 'pool', 'user')

    def resolve_draftPosition(self, info):
        return self.draft_position

    def resolve_totalPoints(self, info):
        return self.total_points

    def resolve_picks(self, info):
        return self.user.draft_picks.filter(pool=self.pool).order_by('draft_round')

    def resolve_createdAt(self, info):
        return self.created_at


# Queries
class PoolQueries(graphene.ObjectType):
    get_pool = graphene.Field(
        PoolType,
        id=graphene.UUID(),
        urlSlug=graphene.String()
    )
    get_pool_members = graphene.List(
        PoolMembershipType,
        poolId=graphene.UUID(required=True)
    )
    get_user_pools = graphene.List(
        PoolType,
        userId=graphene.UUID(required=True)
    )
    get_pool_standings = graphene.List(
        PoolMembershipType,
        poolId=graphene.UUID(required=True)
    )
    get_invite_url = graphene.String(
        poolId=graphene.UUID(required=True)
    )

    def resolve_get_pool(self, info, id=None, urlSlug=None):
        """Get pool by ID or URL slug."""
        user = authenticate_request(info)
        if not user:
            raise NotAuthenticatedError()

        if id:
            try:
                return Pool.objects.get(id=id)
            except Pool.DoesNotExist:
                raise PoolNotFoundError()
        elif urlSlug:
            # Convert camelCase to snake_case for Django ORM
            url_slug = urlSlug
            try:
                return Pool.objects.get(url_slug=url_slug)
            except Pool.DoesNotExist:
                raise PoolNotFoundError()
        else:
            raise PoolNotFoundError("Must provide either id or urlSlug")

    def resolve_get_pool_members(self, info, poolId):
        """Get all members of a pool."""
        user = authenticate_request(info)
        if not user:
            raise NotAuthenticatedError()

        # Convert camelCase to snake_case for Django ORM
        pool_id = poolId
        return PoolMembership.objects.filter(pool_id=pool_id).order_by('-total_points')

    def resolve_get_user_pools(self, info, userId):
        """Get all pools a user is a member of or owns."""
        user = authenticate_request(info)
        if not user:
            raise NotAuthenticatedError()

        # Convert camelCase to snake_case for Django ORM
        user_id = userId
        memberships = PoolMembership.objects.filter(user_id=user_id)
        pool_ids = memberships.values_list('pool_id', flat=True)
        return Pool.objects.filter(id__in=pool_ids)

    def resolve_get_pool_standings(self, info, poolId):
        """Get leaderboard standings for a pool."""
        user = authenticate_request(info)
        if not user:
            raise NotAuthenticatedError()

        # Convert camelCase to snake_case for Django ORM
        pool_id = poolId
        return PoolMembership.objects.filter(pool_id=pool_id).order_by('-total_points')

    def resolve_get_invite_url(self, info, poolId):
        """Get the full invite URL for a pool."""
        from django.conf import settings
        user = authenticate_request(info)
        if not user:
            raise NotAuthenticatedError()

        # Convert camelCase to snake_case for Django ORM
        pool_id = poolId
        try:
            pool = Pool.objects.get(id=pool_id)
        except Pool.DoesNotExist:
            raise PoolNotFoundError()

        # Construct the full invite URL
        frontend_url = settings.FRONTEND_URL.rstrip('/')
        invite_url = f"{frontend_url}/pools/join/{pool.url_slug}"
        return invite_url


# Mutations
class CreatePool(graphene.Mutation):
    class Arguments:
        name = graphene.String(required=True)
        password = graphene.String(required=True)

    pool = graphene.Field(PoolType)

    @transaction.atomic
    def mutate(self, info, name, password):
        """Create a new pool."""
        user = authenticate_request(info)
        if not user:
            raise NotAuthenticatedError()

        # Check if pool name already exists
        if Pool.objects.filter(name=name).exists():
            raise PoolNameTakenError()

        # Create pool
        pool = Pool(name=name, owner=user)
        pool.set_password(password)
        pool.save()

        # Create membership for owner
        PoolMembership.objects.create(pool=pool, user=user)

        return CreatePool(pool=pool)


class JoinPool(graphene.Mutation):
    class Arguments:
        urlSlug = graphene.String(required=True)
        password = graphene.String(required=True)

    membership = graphene.Field(PoolMembershipType)

    @transaction.atomic
    def mutate(self, info, urlSlug, password):
        """Join an existing pool."""
        user = authenticate_request(info)
        if not user:
            raise NotAuthenticatedError()

        # Get pool (convert camelCase to snake_case for Django ORM)
        url_slug = urlSlug
        try:
            pool = Pool.objects.get(url_slug=url_slug)
        except Pool.DoesNotExist:
            raise PoolNotFoundError()

        # Validate password
        if not pool.check_password(password):
            raise InvalidPasswordError()

        # Check if pool is full
        if pool.is_full():
            raise PoolFullError()

        # Check if user is already a member
        if PoolMembership.objects.filter(pool=pool, user=user).exists():
            raise AlreadyMemberError()

        # Create membership
        membership = PoolMembership.objects.create(pool=pool, user=user)

        return JoinPool(membership=membership)


class RandomizeDraftOrder(graphene.Mutation):
    class Arguments:
        poolId = graphene.UUID(required=True)

    memberships = graphene.List(PoolMembershipType)

    @transaction.atomic
    def mutate(self, info, poolId):
        """Randomize draft order for all pool members."""
        user = authenticate_request(info)
        if not user:
            raise NotAuthenticatedError()

        # Get pool (convert camelCase to snake_case for Django ORM)
        pool_id = poolId
        try:
            pool = Pool.objects.get(id=pool_id)
        except Pool.DoesNotExist:
            raise PoolNotFoundError()

        # Check if user is owner
        if not check_pool_owner(user, pool):
            raise OwnerOnlyError("Only the pool owner can randomize draft order")

        # Randomize draft order
        memberships = randomize_draft_order(pool)

        return RandomizeDraftOrder(memberships=memberships)


class StartDraft(graphene.Mutation):
    class Arguments:
        poolId = graphene.UUID(required=True)

    pool = graphene.Field(PoolType)

    def mutate(self, info, poolId):
        """Start the draft for a pool."""
        user = authenticate_request(info)
        if not user:
            raise NotAuthenticatedError()

        # Get pool (convert camelCase to snake_case for Django ORM)
        pool_id = poolId
        try:
            pool = Pool.objects.get(id=pool_id)
        except Pool.DoesNotExist:
            raise PoolNotFoundError()

        # Check if user is owner
        if not check_pool_owner(user, pool):
            raise OwnerOnlyError("Only the pool owner can start the draft")

        # Check if draft order is set
        if pool.memberships.filter(draft_position__isnull=True).exists():
            raise DraftOrderNotSetError()

        # Update draft status
        pool.draft_status = DraftStatus.IN_PROGRESS
        pool.save()

        return StartDraft(pool=pool)


class CompleteDraft(graphene.Mutation):
    class Arguments:
        poolId = graphene.UUID(required=True)

    pool = graphene.Field(PoolType)

    def mutate(self, info, poolId):
        """Complete the draft for a pool."""
        user = authenticate_request(info)
        if not user:
            raise NotAuthenticatedError()

        # Get pool (convert camelCase to snake_case for Django ORM)
        pool_id = poolId
        try:
            pool = Pool.objects.get(id=pool_id)
        except Pool.DoesNotExist:
            raise PoolNotFoundError()

        # Check if user is owner
        if not check_pool_owner(user, pool):
            raise OwnerOnlyError("Only the pool owner can complete the draft")

        # Validate draft is complete
        is_complete, message = validate_draft_complete(pool)
        if not is_complete:
            raise DraftIncompleteError(message)

        # Update draft status
        pool.draft_status = DraftStatus.COMPLETED
        pool.save()

        return CompleteDraft(pool=pool)


class PoolMutations(graphene.ObjectType):
    create_pool = CreatePool.Field()
    join_pool = JoinPool.Field()
    randomize_draft_order = RandomizeDraftOrder.Field()
    start_draft = StartDraft.Field()
    complete_draft = CompleteDraft.Field()
