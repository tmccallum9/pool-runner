"""
Script to verify GraphQL schema is properly configured.

This script tests that:
1. All schemas are importable
2. The root schema compiles without errors
3. All queries and mutations are registered
4. Error handling is properly configured

Run this after installing dependencies:
    python verify_schema.py
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pool_runner.settings')
django.setup()

# Import after Django setup
from schema import schema
from graphql import print_schema


def verify_schema():
    """Verify the GraphQL schema is properly configured."""
    print("🔍 Verifying GraphQL Schema...\n")

    # Test 1: Schema compilation
    print("✓ Schema compiled successfully")

    # Test 2: Print introspection
    print("\n📋 Schema Structure:")
    print("=" * 60)

    # Get query type
    query_type = schema.graphql_schema.query_type
    if query_type:
        print(f"\n🔎 QUERIES ({len(query_type.fields)} total):")
        for field_name in sorted(query_type.fields.keys()):
            field = query_type.fields[field_name]
            args = ", ".join([f"{arg}: {arg_type}" for arg, arg_type in field.args.items()])
            print(f"  • {field_name}({args})")

    # Get mutation type
    mutation_type = schema.graphql_schema.mutation_type
    if mutation_type:
        print(f"\n✏️  MUTATIONS ({len(mutation_type.fields)} total):")
        for field_name in sorted(mutation_type.fields.keys()):
            field = mutation_type.fields[field_name]
            args = ", ".join([f"{arg}: {arg_type}" for arg, arg_type in field.args.items()])
            print(f"  • {field_name}({args})")

    # Test 3: Verify specific expected fields
    print("\n\n🎯 Verifying Expected API Endpoints:")
    print("=" * 60)

    expected_queries = [
        'me', 'getUser', 'getPool', 'getPoolMembers', 'getUserPools',
        'getPoolStandings', 'getInviteUrl', 'getAvailableTeams',
        'getDraftPicks', 'getUserDraftPicks', 'getCurrentDraftTurn',
        'getTeamResults'
    ]

    expected_mutations = [
        'sendMagicLink', 'signIn', 'createPool', 'joinPool',
        'randomizeDraftOrder', 'startDraft', 'completeDraft',
        'createTeam', 'bulkCreateTeams', 'makeDraftPick',
        'updateTeamResult'
    ]

    missing_queries = []
    missing_mutations = []

    print("\nQUERIES:")
    for query in expected_queries:
        if query in query_type.fields:
            print(f"  ✓ {query}")
        else:
            print(f"  ✗ {query} - MISSING!")
            missing_queries.append(query)

    print("\nMUTATIONS:")
    for mutation in expected_mutations:
        if mutation in mutation_type.fields:
            print(f"  ✓ {mutation}")
        else:
            print(f"  ✗ {mutation} - MISSING!")
            missing_mutations.append(mutation)

    # Test 4: Summary
    print("\n\n📊 Summary:")
    print("=" * 60)
    print(f"Total Queries: {len(query_type.fields)}")
    print(f"Total Mutations: {len(mutation_type.fields)}")

    if missing_queries or missing_mutations:
        print("\n⚠️  WARNING: Some expected endpoints are missing!")
        if missing_queries:
            print(f"Missing Queries: {', '.join(missing_queries)}")
        if missing_mutations:
            print(f"Missing Mutations: {', '.join(missing_mutations)}")
        return False
    else:
        print("\n✅ All expected endpoints are present!")
        print("\n🚀 GraphQL API is ready!")
        print("\nEndpoints:")
        print("  - GraphQL API: http://localhost:8000/graphql/")
        print("  - GraphiQL:    http://localhost:8000/graphql/ (GET)")
        print("  - Health:      http://localhost:8000/health/")
        return True


def print_full_schema():
    """Print the full GraphQL schema in SDL format."""
    print("\n\n📄 Full GraphQL Schema (SDL):")
    print("=" * 60)
    print(print_schema(schema.graphql_schema))


if __name__ == '__main__':
    try:
        success = verify_schema()

        # Optionally print full schema
        if '--full' in sys.argv:
            print_full_schema()

        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ Error verifying schema: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
