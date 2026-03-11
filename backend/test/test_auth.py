#!/usr/bin/env python
"""
Quick script to test JWT token authentication.
Run with: python test_auth.py <your_jwt_token>
"""
import os
import sys
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pool_runner.settings')
django.setup()

from apps.users.service import decode_jwt_token, get_user_from_token

if len(sys.argv) < 2:
    print("Usage: python test_auth.py <jwt_token>")
    sys.exit(1)

token = sys.argv[1]

print("=" * 60)
print("JWT TOKEN VALIDATION TEST")
print("=" * 60)

# Test decode
print("\n1. Decoding token...")
payload = decode_jwt_token(token)

if payload:
    print("✓ Token is valid and not expired")
    print(f"\nPayload:")
    print(f"  User ID: {payload.get('user_id')}")
    print(f"  Email: {payload.get('email')}")
    import datetime
    exp_timestamp = payload.get('exp')
    if exp_timestamp:
        exp_date = datetime.datetime.fromtimestamp(exp_timestamp)
        print(f"  Expires: {exp_date}")
else:
    print("✗ Token is invalid or expired")
    sys.exit(1)

# Test get user
print("\n2. Getting user from token...")
user = get_user_from_token(token)

if user:
    print("✓ User found in database")
    print(f"\nUser Details:")
    print(f"  ID: {user.id}")
    print(f"  Email: {user.email}")
    print(f"  Created: {user.created_at}")
else:
    print("✗ User not found in database")
    sys.exit(1)

print("\n" + "=" * 60)
print("TOKEN IS VALID - Ready to use!")
print("=" * 60)
print("\nAdd this to GraphiQL headers:")
print(f'Authorization: Bearer {token}')
