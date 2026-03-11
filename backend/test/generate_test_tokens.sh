#!/bin/bash
# Quick script to generate JWT tokens for test users

# Activate virtual environment
source venv/bin/activate

echo "=================================================="
echo "GENERATING JWT TOKENS FOR TEST USERS"
echo "=================================================="
echo ""

echo "User 1 (Pool Owner):"
echo "--------------------------------------------------"
python manage.py generate_jwt user1@test.com
echo ""

echo "User 2:"
echo "--------------------------------------------------"
python manage.py generate_jwt user2@test.com
echo ""

echo "User 3:"
echo "--------------------------------------------------"
python manage.py generate_jwt user3@test.com
echo ""

echo "=================================================="
echo "Copy these tokens and add them to your GraphQL"
echo "client as: Authorization: Bearer <token>"
echo "=================================================="
