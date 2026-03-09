"""
GraphQL types, queries, and mutations for users and authentication.
"""
import graphene
from graphene_django import DjangoObjectType
from django.db import transaction
from apps.users.models import User, MagicLink
from apps.users.service import (
    create_jwt_token,
    send_magic_link_email,
    authenticate_request
)
from apps.exceptions import (
    NotAuthenticatedError,
    UserNotFoundError,
    InvalidTokenError,
    LinkExpiredError,
    LinkAlreadyUsedError,
)


# Types
class UserType(DjangoObjectType):
    class Meta:
        model = User
        fields = ('id', 'email', 'created_at', 'updated_at')


class AuthPayloadType(graphene.ObjectType):
    user = graphene.Field(UserType)
    auth_token = graphene.String()


# Queries
class UserQueries(graphene.ObjectType):
    me = graphene.Field(UserType)
    get_user = graphene.Field(UserType, id=graphene.UUID(required=True))

    def resolve_me(self, info):
        """Get currently authenticated user."""
        user = authenticate_request(info)
        if not user:
            raise NotAuthenticatedError()
        return user

    def resolve_get_user(self, info, id):
        """Get user by ID."""
        user = authenticate_request(info)
        if not user:
            raise NotAuthenticatedError()

        try:
            return User.objects.get(id=id)
        except User.DoesNotExist:
            raise UserNotFoundError()


# Mutations
class SendMagicLink(graphene.Mutation):
    class Arguments:
        email = graphene.String(required=True)

    success = graphene.Boolean()

    def mutate(self, info, email):
        """Send magic link to email address."""
        # Create magic link
        magic_link = MagicLink.create_for_email(email)

        # Send email
        success = send_magic_link_email(email, magic_link.token)

        return SendMagicLink(success=success)


class SignIn(graphene.Mutation):
    class Arguments:
        token = graphene.String(required=True)

    user = graphene.Field(UserType)
    auth_token = graphene.String()

    @transaction.atomic
    def mutate(self, info, token):
        """Sign in using magic link token."""
        try:
            magic_link = MagicLink.objects.get(token=token)
        except MagicLink.DoesNotExist:
            raise InvalidTokenError("Invalid or expired magic link")

        # Validate magic link
        if not magic_link.is_valid():
            from datetime import datetime, timezone
            if magic_link.used:
                raise LinkAlreadyUsedError()
            elif magic_link.expires_at < datetime.now(timezone.utc):
                raise LinkExpiredError()
            else:
                raise InvalidTokenError()

        # Get or create user
        user, created = User.objects.get_or_create(email=magic_link.email)

        # Mark magic link as used
        magic_link.used = True
        magic_link.save()

        # Create JWT token
        auth_token = create_jwt_token(user)

        return SignIn(user=user, auth_token=auth_token)


class UserMutations(graphene.ObjectType):
    send_magic_link = SendMagicLink.Field()
    sign_in = SignIn.Field()
