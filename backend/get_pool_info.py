#!/usr/bin/env python
"""
Get pool information for joining.
Usage: python get_pool_info.py [pool_name]
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pool_runner.settings')
django.setup()

from apps.pools.models import Pool

if len(sys.argv) < 2:
    print("Usage: python get_pool_info.py [pool_name]")
    print("\nAvailable pools:")
    for pool in Pool.objects.all():
        print(f"  - {pool.name}")
    sys.exit(0)

pool_name = ' '.join(sys.argv[1:])

try:
    pool = Pool.objects.get(name__iexact=pool_name)
except Pool.DoesNotExist:
    print(f"❌ Pool '{pool_name}' not found")
    print("\nAvailable pools:")
    for p in Pool.objects.all():
        print(f"  - {p.name}")
    sys.exit(1)

print("=" * 60)
print("POOL INFORMATION")
print("=" * 60)
print(f"\nPool Name: {pool.name}")
print(f"Pool ID: {pool.id}")
print(f"URL Slug: {pool.url_slug}")
print(f"Owner: {pool.owner.email}")
print(f"Draft Status: {pool.draft_status}")
print(f"Members: {pool.memberships.count()}/{pool.max_members}")

print("\n" + "=" * 60)
print("JOIN INFORMATION")
print("=" * 60)
print(f"\nFrontend Join URL:")
print(f"  http://localhost:3000/pools/join/{pool.url_slug}")

print(f"\nGraphQL Mutation:")
print(f"""  mutation {{
    joinPool(
      urlSlug: "{pool.url_slug}",
      password: "YOUR_PASSWORD_HERE"
    ) {{
      membership {{
        id
        user {{ email }}
      }}
    }}
  }}""")

print(f"\nPool Members:")
for membership in pool.memberships.all():
    print(f"  - {membership.user.email} (position: {membership.draft_position or 'not set'})")

print("\n" + "=" * 60)
