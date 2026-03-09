"""
Custom exception classes with structured error codes for GraphQL API.
"""


class PoolRunnerException(Exception):
    """Base exception class for Pool Runner application."""

    def __init__(self, code, message):
        self.code = code
        self.message = message
        super().__init__(f"[{code}] {message}")


# Authentication Errors
class NotAuthenticatedError(PoolRunnerException):
    def __init__(self, message="Not authenticated"):
        super().__init__("NOT_AUTHENTICATED", message)


class LinkExpiredError(PoolRunnerException):
    def __init__(self, message="Magic link has expired"):
        super().__init__("LINK_EXPIRED", message)


class LinkAlreadyUsedError(PoolRunnerException):
    def __init__(self, message="Magic link has already been used"):
        super().__init__("LINK_ALREADY_USED", message)


class InvalidTokenError(PoolRunnerException):
    def __init__(self, message="Invalid token"):
        super().__init__("INVALID_TOKEN", message)


# Pool Errors
class PoolNotFoundError(PoolRunnerException):
    def __init__(self, message="Pool not found"):
        super().__init__("POOL_NOT_FOUND", message)


class PoolNameTakenError(PoolRunnerException):
    def __init__(self, message="Pool name already taken"):
        super().__init__("POOL_NAME_TAKEN", message)


class InvalidPasswordError(PoolRunnerException):
    def __init__(self, message="Invalid password"):
        super().__init__("INVALID_PASSWORD", message)


class PoolFullError(PoolRunnerException):
    def __init__(self, message="Pool is full"):
        super().__init__("POOL_FULL", message)


class AlreadyMemberError(PoolRunnerException):
    def __init__(self, message="You are already a member of this pool"):
        super().__init__("ALREADY_MEMBER", message)


class OwnerOnlyError(PoolRunnerException):
    def __init__(self, message="Only the pool owner can perform this action"):
        super().__init__("OWNER_ONLY", message)


class DraftOrderNotSetError(PoolRunnerException):
    def __init__(self, message="Draft order must be randomized before starting"):
        super().__init__("DRAFT_ORDER_NOT_SET", message)


class DraftIncompleteError(PoolRunnerException):
    def __init__(self, message="Draft is not complete", missing_picks=None):
        if missing_picks:
            message = f"{message}: {missing_picks} picks remaining"
        super().__init__("DRAFT_INCOMPLETE", message)


# Draft & Team Errors
class TeamNotFoundError(PoolRunnerException):
    def __init__(self, message="Team not found"):
        super().__init__("TEAM_NOT_FOUND", message)


class TeamNameExistsError(PoolRunnerException):
    def __init__(self, message="Team name already exists in this pool"):
        super().__init__("TEAM_NAME_EXISTS", message)


class InvalidSeedRankError(PoolRunnerException):
    def __init__(self, message="Seed rank must be between 1 and 16"):
        super().__init__("INVALID_SEED_RANK", message)


class DraftNotStartedError(PoolRunnerException):
    def __init__(self, message="Draft is not in progress"):
        super().__init__("DRAFT_NOT_STARTED", message)


class DraftLockedError(PoolRunnerException):
    def __init__(self, message="Draft has been completed and is locked"):
        super().__init__("DRAFT_LOCKED", message)


class TeamAlreadyPickedError(PoolRunnerException):
    def __init__(self, message="Team already drafted"):
        super().__init__("TEAM_ALREADY_PICKED", message)


class PickLimitExceededError(PoolRunnerException):
    def __init__(self, message="You have already made 5 picks"):
        super().__init__("PICK_LIMIT_EXCEEDED", message)


class NotYourTurnError(PoolRunnerException):
    def __init__(self, message="It's not your turn to pick"):
        super().__init__("NOT_YOUR_TURN", message)


class InvalidSeedGroupError(PoolRunnerException):
    def __init__(self, message="Invalid seed group selection", seed_group=None):
        if seed_group:
            message = f"You have already picked a team from seed group {seed_group}"
        super().__init__("INVALID_SEED_GROUP", message)


class NotPoolMemberError(PoolRunnerException):
    def __init__(self, message="You are not a member of this pool"):
        super().__init__("NOT_POOL_MEMBER", message)


# Tournament Errors
class InvalidRoundError(PoolRunnerException):
    def __init__(self, message="Tournament round must be between 1 and 6"):
        super().__init__("INVALID_ROUND", message)


class TeamEliminatedError(PoolRunnerException):
    def __init__(self, message="Team has already been eliminated in a previous round"):
        super().__init__("TEAM_ELIMINATED", message)


# Generic Errors
class ForbiddenError(PoolRunnerException):
    def __init__(self, message="You do not have permission to perform this action"):
        super().__init__("FORBIDDEN", message)


class UserNotFoundError(PoolRunnerException):
    def __init__(self, message="User not found"):
        super().__init__("USER_NOT_FOUND", message)


class ServiceUnavailableError(PoolRunnerException):
    def __init__(self, message="Service temporarily unavailable"):
        super().__init__("SERVICE_UNAVAILABLE", message)
