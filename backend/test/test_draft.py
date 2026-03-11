#!/usr/bin/env python
"""
Quick test script for draft process.
Run with: python test_draft.py
"""
import os
import sys
import django
import requests
import json

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pool_runner.settings')
django.setup()

from apps.users.models import User
from apps.users.service import create_jwt_token

# Configuration
GRAPHQL_URL = "http://localhost:8000/graphql/"
TEST_USERS = [
    "user1@test.com",
    "user2@test.com",
    "user3@test.com",
]

def generate_tokens():
    """Generate JWT tokens for test users."""
    print("=" * 60)
    print("GENERATING JWT TOKENS")
    print("=" * 60)

    tokens = {}
    for email in TEST_USERS:
        user, created = User.objects.get_or_create(email=email)
        token = create_jwt_token(user)
        tokens[email] = {
            'token': token,
            'user_id': str(user.id),
            'created': created
        }

        status = "CREATED" if created else "EXISTS"
        print(f"\n[{status}] {email}")
        print(f"User ID: {user.id}")
        print(f"Token: {token[:50]}...")

    return tokens

def make_graphql_request(query, token=None, variables=None):
    """Make a GraphQL request."""
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'

    payload = {'query': query}
    if variables:
        payload['variables'] = variables

    response = requests.post(GRAPHQL_URL, json=payload, headers=headers)
    return response.json()

def print_response(title, response):
    """Pretty print GraphQL response."""
    print(f"\n{'=' * 60}")
    print(title)
    print('=' * 60)
    print(json.dumps(response, indent=2))

def test_create_pool(token):
    """Test pool creation."""
    query = """
    mutation CreatePool {
      createPool(name: "Test March Madness Pool", password: "testpass123") {
        pool {
          id
          name
          urlSlug
          draftStatus
          owner {
            email
          }
        }
      }
    }
    """
    response = make_graphql_request(query, token)
    print_response("CREATE POOL", response)

    if 'data' in response and response['data']['createPool']:
        return response['data']['createPool']['pool']
    return None

def test_bulk_create_teams(pool_id, token):
    """Test bulk team creation."""
    query = """
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

    variables = {
        "poolId": pool_id,
        "teams": [
            {"name": "Duke", "seedRank": 1, "region": "East"},
            {"name": "Gonzaga", "seedRank": 2, "region": "West"},
            {"name": "Kansas", "seedRank": 3, "region": "South"},
            {"name": "Purdue", "seedRank": 4, "region": "Midwest"},
            {"name": "Tennessee", "seedRank": 5, "region": "East"},
            {"name": "Auburn", "seedRank": 6, "region": "West"},
            {"name": "Houston", "seedRank": 7, "region": "South"},
            {"name": "Arizona", "seedRank": 8, "region": "Midwest"},
            {"name": "Texas", "seedRank": 9, "region": "East"},
            {"name": "Marquette", "seedRank": 10, "region": "West"},
            {"name": "UConn", "seedRank": 11, "region": "South"},
            {"name": "Alabama", "seedRank": 12, "region": "Midwest"},
            {"name": "Kentucky", "seedRank": 13, "region": "East"},
            {"name": "Creighton", "seedRank": 14, "region": "West"},
            {"name": "Baylor", "seedRank": 15, "region": "South"},
            {"name": "Illinois", "seedRank": 16, "region": "Midwest"},
        ]
    }

    response = make_graphql_request(query, token, variables)
    print_response("BULK CREATE TEAMS", response)

    if 'data' in response and response['data']['bulkCreateTeams']:
        return response['data']['bulkCreateTeams']['teams']
    return None

def test_join_pool(url_slug, token):
    """Test joining a pool."""
    query = """
    mutation JoinPool($urlSlug: String!, $password: String!) {
      joinPool(urlSlug: $urlSlug, password: $password) {
        membership {
          id
          user {
            email
          }
          draftPosition
        }
      }
    }
    """

    variables = {
        "urlSlug": url_slug,
        "password": "testpass123"
    }

    response = make_graphql_request(query, token, variables)
    print_response("JOIN POOL", response)
    return response

def main():
    """Run the test sequence."""
    print("\n" + "=" * 60)
    print("POOL RUNNER - DRAFT TESTING SCRIPT")
    print("=" * 60)
    print("\nThis script will:")
    print("1. Generate JWT tokens for 3 test users")
    print("2. Create a test pool")
    print("3. Add teams to the pool")
    print("4. Have users join the pool")
    print("\nMake sure your Django server is running on http://localhost:8000")
    print("\nPress Enter to continue or Ctrl+C to cancel...")
    input()

    # Step 1: Generate tokens
    tokens = generate_tokens()
    owner_email = TEST_USERS[0]
    owner_token = tokens[owner_email]['token']

    # Step 2: Create pool
    pool = test_create_pool(owner_token)
    if not pool:
        print("\nERROR: Failed to create pool")
        return

    pool_id = pool['id']
    url_slug = pool['urlSlug']

    # Step 3: Create teams
    teams = test_bulk_create_teams(pool_id, owner_token)
    if not teams:
        print("\nERROR: Failed to create teams")
        return

    # Step 4: Have other users join
    for email in TEST_USERS[1:]:
        test_join_pool(url_slug, tokens[email]['token'])

    # Summary
    print("\n" + "=" * 60)
    print("SETUP COMPLETE!")
    print("=" * 60)
    print(f"\nPool ID: {pool_id}")
    print(f"URL Slug: {url_slug}")
    print(f"Invite URL: http://localhost:3000/pools/join/{url_slug}")
    print("\nNext steps:")
    print("1. Randomize draft order (as owner)")
    print("2. Start draft (as owner)")
    print("3. Make picks in order")
    print("\nUser tokens:")
    for email, data in tokens.items():
        print(f"\n{email}:")
        print(f"  Token: {data['token'][:60]}...")

    print("\n" + "=" * 60)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nTest cancelled by user")
        sys.exit(0)
    except Exception as e:
        print(f"\n\nERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
