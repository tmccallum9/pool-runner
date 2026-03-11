#!/usr/bin/env python
"""
Manage pool memberships - add, remove, or list members.
Usage:
  python manage_pool_members.py list "Pool Name"
  python manage_pool_members.py remove "Pool Name" user@email.com
  python manage_pool_members.py remove-all "Pool Name"
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pool_runner.settings')
django.setup()

from apps.users.models import User
from apps.pools.models import Pool, PoolMembership

def list_pools():
    """List all pools."""
    pools = Pool.objects.all()
    if not pools:
        print("No pools found")
        return

    print("Available pools:")
    for pool in pools:
        print(f"  - {pool.name} ({pool.memberships.count()} members)")

def list_members(pool_name):
    """List all members of a pool."""
    try:
        pool = Pool.objects.get(name__iexact=pool_name)
    except Pool.DoesNotExist:
        print(f"❌ Pool '{pool_name}' not found")
        list_pools()
        return

    print("=" * 60)
    print(f"POOL: {pool.name}")
    print("=" * 60)
    print(f"URL Slug: {pool.url_slug}")
    print(f"Owner: {pool.owner.email}")
    print(f"Draft Status: {pool.draft_status}")
    print(f"Members: {pool.memberships.count()}/{pool.max_members}")
    print()

    memberships = pool.memberships.all().order_by('draft_position')

    if not memberships:
        print("No members in this pool")
        return

    print("Members:")
    for m in memberships:
        owner_tag = " (OWNER)" if m.user == pool.owner else ""
        print(f"  - {m.user.email}{owner_tag}")
        print(f"    ID: {m.id}")
        print(f"    Draft Position: {m.draft_position or 'not set'}")
        print(f"    Total Points: {m.total_points}")

def remove_member(pool_name, user_email):
    """Remove a specific user from a pool."""
    try:
        pool = Pool.objects.get(name__iexact=pool_name)
        user = User.objects.get(email=user_email)
    except Pool.DoesNotExist:
        print(f"❌ Pool '{pool_name}' not found")
        list_pools()
        return
    except User.DoesNotExist:
        print(f"❌ User '{user_email}' not found")
        return

    if pool.owner == user:
        print(f"⚠️  Warning: {user_email} is the pool owner!")
        confirm = input("Are you sure you want to remove the owner? (yes/no): ")
        if confirm.lower() != 'yes':
            print("Cancelled")
            return

    try:
        membership = PoolMembership.objects.get(user=user, pool=pool)
        membership.delete()
        print(f"✅ Removed {user_email} from '{pool_name}'")
        print()
        list_members(pool_name)
    except PoolMembership.DoesNotExist:
        print(f"❌ {user_email} is not a member of '{pool_name}'")

def remove_all_members(pool_name):
    """Remove ALL members from a pool (except owner)."""
    try:
        pool = Pool.objects.get(name__iexact=pool_name)
    except Pool.DoesNotExist:
        print(f"❌ Pool '{pool_name}' not found")
        list_pools()
        return

    memberships = pool.memberships.exclude(user=pool.owner)
    count = memberships.count()

    if count == 0:
        print(f"No non-owner members to remove from '{pool_name}'")
        return

    print(f"⚠️  About to remove {count} member(s) from '{pool_name}':")
    for m in memberships:
        print(f"  - {m.user.email}")
    print()

    confirm = input(f"Remove all {count} members? (yes/no): ")
    if confirm.lower() != 'yes':
        print("Cancelled")
        return

    memberships.delete()
    print(f"✅ Removed {count} member(s) from '{pool_name}'")
    print()
    list_members(pool_name)

def main():
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python manage_pool_members.py list [pool_name]")
        print("  python manage_pool_members.py remove <pool_name> <user_email>")
        print("  python manage_pool_members.py remove-all <pool_name>")
        print()
        list_pools()
        sys.exit(0)

    command = sys.argv[1].lower()

    if command == 'list':
        if len(sys.argv) < 3:
            list_pools()
        else:
            pool_name = ' '.join(sys.argv[2:])
            list_members(pool_name)

    elif command == 'remove':
        if len(sys.argv) < 4:
            print("Usage: python manage_pool_members.py remove <pool_name> <user_email>")
            sys.exit(1)

        user_email = sys.argv[-1]
        pool_name = ' '.join(sys.argv[2:-1])
        remove_member(pool_name, user_email)

    elif command == 'remove-all':
        if len(sys.argv) < 3:
            print("Usage: python manage_pool_members.py remove-all <pool_name>")
            sys.exit(1)

        pool_name = ' '.join(sys.argv[2:])
        remove_all_members(pool_name)

    else:
        print(f"Unknown command: {command}")
        print("Available commands: list, remove, remove-all")
        sys.exit(1)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nCancelled by user")
        sys.exit(0)
