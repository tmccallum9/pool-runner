#!/usr/bin/env python3
"""
Run a live draft smoke test against the deployed Render GraphQL API.

Required environment variables:
  GRAPHQL_URL            Deployed GraphQL endpoint, e.g. https://pool-runner.onrender.com/graphql/
  OWNER_TOKEN            JWT token copied from the Vercel app's localStorage authToken
  MEMBER_TOKENS          Comma-separated JWT tokens for additional users

Optional environment variables:
  FRONTEND_URL           Deployed frontend URL for invite links
  POOL_PASSWORD          Pool password to create/join with (default: testpass123)
  POOL_NAME_PREFIX       Prefix for the created pool name (default: Render Draft Test)
  DRAFT_ROUNDS           Number of rounds to execute (1-5, default: 5)

Example:
  GRAPHQL_URL=https://pool-runner.onrender.com/graphql/ \\
  FRONTEND_URL=https://pool-runner.vercel.app \\
  OWNER_TOKEN=... \\
  MEMBER_TOKENS=token2,token3 \\
  python backend/test/live_deployment_draft_test.py
"""

from __future__ import annotations

import json
import os
import sys
import time
import uuid
from dataclasses import dataclass
from typing import Dict, List, Optional
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


TEAM_FIXTURES = [
    {"name": "Duke", "seedRank": 1, "region": "East"},
    {"name": "Florida", "seedRank": 2, "region": "West"},
    {"name": "Houston", "seedRank": 3, "region": "South"},
    {"name": "Auburn", "seedRank": 4, "region": "Midwest"},
    {"name": "Tennessee", "seedRank": 5, "region": "East"},
    {"name": "Alabama", "seedRank": 6, "region": "West"},
    {"name": "Iowa State", "seedRank": 7, "region": "South"},
    {"name": "Arizona", "seedRank": 8, "region": "Midwest"},
    {"name": "Texas A&M", "seedRank": 9, "region": "East"},
    {"name": "Marquette", "seedRank": 10, "region": "West"},
    {"name": "Missouri", "seedRank": 11, "region": "South"},
    {"name": "Colorado State", "seedRank": 12, "region": "Midwest"},
    {"name": "Yale", "seedRank": 13, "region": "East"},
    {"name": "Akron", "seedRank": 14, "region": "West"},
    {"name": "Montana", "seedRank": 15, "region": "South"},
    {"name": "SIU Edwardsville", "seedRank": 16, "region": "Midwest"},
]


ME_QUERY = """
query Me {
  me {
    id
    email
  }
}
"""

CREATE_POOL_MUTATION = """
mutation CreatePool($name: String!, $password: String!) {
  createPool(name: $name, password: $password) {
    pool {
      id
      name
      urlSlug
      draftStatus
    }
  }
}
"""

JOIN_POOL_MUTATION = """
mutation JoinPool($urlSlug: String!, $password: String!) {
  joinPool(urlSlug: $urlSlug, password: $password) {
    membership {
      id
      user {
        id
        email
      }
    }
  }
}
"""

BULK_CREATE_TEAMS_MUTATION = """
mutation BulkCreateTeams($poolId: UUID!, $teams: [TeamInput!]!) {
  bulkCreateTeams(poolId: $poolId, teams: $teams) {
    teams {
      id
      name
      seedRank
      region
    }
  }
}
"""

RANDOMIZE_DRAFT_ORDER_MUTATION = """
mutation RandomizeDraftOrder($poolId: UUID!) {
  randomizeDraftOrder(poolId: $poolId) {
    memberships {
      user {
        id
        email
      }
      draftPosition
    }
  }
}
"""

START_DRAFT_MUTATION = """
mutation StartDraft($poolId: UUID!) {
  startDraft(poolId: $poolId) {
    pool {
      id
      draftStatus
    }
  }
}
"""

GET_CURRENT_TURN_QUERY = """
query CurrentTurn($poolId: UUID!) {
  getCurrentDraftTurn(poolId: $poolId) {
    user {
      id
      email
    }
    draftPosition
  }
}
"""

GET_AVAILABLE_TEAMS_QUERY = """
query AvailableTeams($poolId: UUID!) {
  getAvailableTeams(poolId: $poolId) {
    id
    name
    seedRank
    region
  }
}
"""

GET_USER_DRAFT_PICKS_QUERY = """
query UserDraftPicks($poolId: UUID!, $userId: UUID!) {
  getUserDraftPicks(poolId: $poolId, userId: $userId) {
    id
    draftRound
    team {
      id
      name
      seedRank
    }
  }
}
"""

GET_DRAFT_PICKS_QUERY = """
query DraftPicks($poolId: UUID!) {
  getDraftPicks(poolId: $poolId) {
    pickOrder
    draftRound
    user {
      email
    }
    team {
      name
      seedRank
    }
  }
}
"""

MAKE_DRAFT_PICK_MUTATION = """
mutation MakeDraftPick($poolId: UUID!, $teamId: UUID!) {
  makeDraftPick(poolId: $poolId, teamId: $teamId) {
    draftPick {
      pickOrder
      draftRound
      user {
        email
      }
      team {
        name
        seedRank
      }
    }
  }
}
"""


@dataclass
class Session:
    token: str
    user_id: str
    email: str


class GraphQLError(RuntimeError):
    pass


def require_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise SystemExit(f"Missing required environment variable: {name}")
    return value


def post_graphql(url: str, query: str, token: str, variables: Optional[Dict] = None) -> Dict:
    payload = json.dumps({"query": query, "variables": variables or {}}).encode("utf-8")
    request = Request(
        url,
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}",
        },
        method="POST",
    )

    try:
        with urlopen(request, timeout=30) as response:
            body = response.read().decode("utf-8")
    except HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise GraphQLError(f"HTTP {exc.code}: {body}") from exc
    except URLError as exc:
        raise GraphQLError(f"Network error calling GraphQL endpoint: {exc}") from exc

    decoded = json.loads(body)
    if decoded.get("errors"):
        raise GraphQLError(json.dumps(decoded["errors"], indent=2))
    return decoded["data"]


def get_session(graphql_url: str, token: str) -> Session:
    data = post_graphql(graphql_url, ME_QUERY, token)
    me = data["me"]
    return Session(token=token, user_id=me["id"], email=me["email"])


def seed_group(seed_rank: int) -> int:
    return ((seed_rank - 1) // 4) + 1


def choose_team(available_teams: List[Dict], existing_picks: List[Dict], draft_round: int) -> Dict:
    used_groups = {seed_group(pick["team"]["seedRank"]) for pick in existing_picks if pick["draftRound"] <= 4}

    if draft_round <= 4:
        for team in available_teams:
            if seed_group(team["seedRank"]) not in used_groups:
                return team

    return available_teams[0]


def main() -> int:
    graphql_url = require_env("GRAPHQL_URL")
    frontend_url = os.getenv("FRONTEND_URL", "").rstrip("/")
    pool_password = os.getenv("POOL_PASSWORD", "testpass123")
    pool_prefix = os.getenv("POOL_NAME_PREFIX", "Render Draft Test")
    draft_rounds = int(os.getenv("DRAFT_ROUNDS", "5"))

    if draft_rounds < 1 or draft_rounds > 5:
        raise SystemExit("DRAFT_ROUNDS must be between 1 and 5")

    owner_session = get_session(graphql_url, require_env("OWNER_TOKEN"))

    member_tokens = [token.strip() for token in require_env("MEMBER_TOKENS").split(",") if token.strip()]
    member_sessions = [get_session(graphql_url, token) for token in member_tokens]
    sessions = [owner_session] + member_sessions

    if len(sessions) < 2:
        raise SystemExit("Provide at least one member token in MEMBER_TOKENS")

    required_team_count = len(sessions) * draft_rounds
    if required_team_count > len(TEAM_FIXTURES):
        raise SystemExit(
            f"Not enough fixture teams for {len(sessions)} users across {draft_rounds} rounds"
        )

    print("Resolved sessions:")
    for session in sessions:
        print(f"  - {session.email} ({session.user_id})")

    pool_name = f"{pool_prefix} {int(time.time())}-{uuid.uuid4().hex[:6]}"
    created = post_graphql(
        graphql_url,
        CREATE_POOL_MUTATION,
        owner_session.token,
        {"name": pool_name, "password": pool_password},
    )["createPool"]["pool"]

    pool_id = created["id"]
    url_slug = created["urlSlug"]

    print(f"\nCreated pool: {created['name']}")
    print(f"Pool ID: {pool_id}")
    print(f"Join slug: {url_slug}")
    if frontend_url:
        print(f"Frontend URL: {frontend_url}/pools/{pool_id}")
        print(f"Invite URL: {frontend_url}/pools/join/{url_slug}")

    for member in member_sessions:
        joined = post_graphql(
            graphql_url,
            JOIN_POOL_MUTATION,
            member.token,
            {"urlSlug": url_slug, "password": pool_password},
        )["joinPool"]["membership"]
        print(f"Joined: {joined['user']['email']}")

    teams = post_graphql(
        graphql_url,
        BULK_CREATE_TEAMS_MUTATION,
        owner_session.token,
        {"poolId": pool_id, "teams": TEAM_FIXTURES},
    )["bulkCreateTeams"]["teams"]
    print(f"Seeded teams: {len(teams)}")

    randomized = post_graphql(
        graphql_url,
        RANDOMIZE_DRAFT_ORDER_MUTATION,
        owner_session.token,
        {"poolId": pool_id},
    )["randomizeDraftOrder"]["memberships"]
    print("\nDraft order:")
    for membership in sorted(randomized, key=lambda item: item["draftPosition"]):
        print(f"  {membership['draftPosition']}: {membership['user']['email']}")

    started = post_graphql(
        graphql_url,
        START_DRAFT_MUTATION,
        owner_session.token,
        {"poolId": pool_id},
    )["startDraft"]["pool"]
    print(f"\nDraft status: {started['draftStatus']}")

    session_by_user_id = {session.user_id: session for session in sessions}
    total_picks = len(sessions) * draft_rounds

    for pick_number in range(1, total_picks + 1):
        current_turn = post_graphql(
            graphql_url,
            GET_CURRENT_TURN_QUERY,
            owner_session.token,
            {"poolId": pool_id},
        )["getCurrentDraftTurn"]
        current_user = current_turn["user"]
        session = session_by_user_id[current_user["id"]]

        user_picks = post_graphql(
            graphql_url,
            GET_USER_DRAFT_PICKS_QUERY,
            session.token,
            {"poolId": pool_id, "userId": session.user_id},
        )["getUserDraftPicks"]
        draft_round = len(user_picks) + 1

        available_teams = post_graphql(
            graphql_url,
            GET_AVAILABLE_TEAMS_QUERY,
            session.token,
            {"poolId": pool_id},
        )["getAvailableTeams"]
        team = choose_team(available_teams, user_picks, draft_round)

        pick = post_graphql(
            graphql_url,
            MAKE_DRAFT_PICK_MUTATION,
            session.token,
            {"poolId": pool_id, "teamId": team["id"]},
        )["makeDraftPick"]["draftPick"]
        print(
            f"Pick {pick_number:02d}: {pick['user']['email']} selected "
            f"{pick['team']['name']} (seed {pick['team']['seedRank']}) in round {pick['draftRound']}"
        )

    draft_picks = post_graphql(
        graphql_url,
        GET_DRAFT_PICKS_QUERY,
        owner_session.token,
        {"poolId": pool_id},
    )["getDraftPicks"]

    print("\nDraft complete.")
    print(f"Created {len(draft_picks)} picks across {draft_rounds} rounds.")
    print(f"Open the pool in the frontend to inspect standings and rosters.")

    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except GraphQLError as exc:
        print(f"\nLive deployment test failed:\n{exc}", file=sys.stderr)
        raise SystemExit(1)
