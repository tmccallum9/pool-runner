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
    draft_status = graphene.Field(DraftStatusEnum)

    class Meta:
        model = Pool
        fields = ('id', 'name', 'url_slug', 'owner', 'draft_status', 'max_members', 'created_at', 'updated_at')


class PoolMembershipType(DjangoObjectType):
    class Meta:
        model = PoolMembership
        fields = ('id', 'pool', 'user', 'draft_position', 'total_points', 'created_at')


# Queries
class PoolQueries(graphene.ObjectType):
    get_pool = graphene.Field(
        PoolType,
        id=graphene.UUID(),
        url_slug=graphene.String()
    )
    get_pool_members = graphene.List(
        PoolMembershipType,
        pool_id=graphene.UUID(required=True)
    )
    get_user_pools = graphene.List(
        PoolType,
        user_id=graphene.UUID(required=True)
    )
    get_pool_standings = graphene.List(
        PoolMembershipType,
        pool_id=graphene.UUID(required=True)
    )
    get_invite_url = graphene.String(
        pool_id=graphene.UUID(required=True)
    )

    def resolve_get_pool(self, info, id=None, url_slug=None):
        """Get pool by ID or URL slug."""
        user = authenticate_request(info)
        if not user:
            raise NotAuthenticatedError()

        if id:
            try:
                return Pool.objects.get(id=id)
            except Pool.DoesNotExist:
                raise PoolNotFoundError()
        elif url_slug:
            try:
                return Pool.objects.get(url_slug=url_slug)
            except Pool.DoesNotExist:
                raise PoolNotFoundError()
        else:
            raise PoolNotFoundError("Must provide either id or url_slug")

    def resolve_get_pool_members(self, info, pool_id):
        """Get all members of a pool."""
        user = authenticate_request(info)
        if not user:
            raise NotAuthenticatedError()

        return PoolMembership.objects.filter(pool_id=pool_id).order_by('-total_points')

    def resolve_get_user_pools(self, info, user_id):
        """Get all pools a user is a member of or owns."""
        user = authenticate_request(info)
        if not user:
            raise NotAuthenticatedError()

        memberships = PoolMembership.objects.filter(user_id=user_id)
        pool_ids = memberships.values_list('pool_id', flat=True)
        return Pool.objects.filter(id__in=pool_ids)

    def resolve_get_pool_standings(self, info, pool_id):
        """Get leaderboard standings for a pool."""
        user = authenticate_request(info)
        if not user:
            raise NotAuthenticatedError()

        return PoolMembership.objects.filter(pool_id=pool_id).order_by('-total_points')

    def resolve_get_invite_url(self, info, pool_id):
        """Get the full invite URL for a pool."""
        from django.conf import settings
        user = authenticate_request(info)
        if not user:
            raise NotAuthenticatedError()

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
        url_slug = graphene.String(required=True)
        password = graphene.String(required=True)

    membership = graphene.Field(PoolMembershipType)

    @transaction.atomic
    def mutate(self, info, url_slug, password):
        """Join an existing pool."""
        user = authenticate_request(info)
        if not user:
            raise NotAuthenticatedError()

        # Get pool
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
        pool_id = graphene.UUID(required=True)

    memberships = graphene.List(PoolMembershipType)

    @transaction.atomic
    def mutate(self, info, pool_id):
        """Randomize draft order for all pool members."""
        user = authenticate_request(info)
        if not user:
            raise NotAuthenticatedError()

        # Get pool
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
        pool_id = graphene.UUID(required=True)

    pool = graphene.Field(PoolType)

    def mutate(self, info, pool_id):
        """Start the draft for a pool."""
        user = authenticate_request(info)
        if not user:
            raise NotAuthenticatedError()

        # Get pool
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
        pool_id = graphene.UUID(required=True)

    pool = graphene.Field(PoolType)

    def mutate(self, info, pool_id):
        """Complete the draft for a pool."""
        user = authenticate_request(info)
        if not user:
            raise NotAuthenticatedError()

        # Get pool
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
