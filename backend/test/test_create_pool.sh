#!/bin/bash
# Test creating a pool with JWT authentication

TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiODYyNDU2NDItZjIxNC00ZGJlLWE1NGQtMGUyOGYxNDI3ODI5IiwiZW1haWwiOiJteWVtYWlsQGV4YW1wbGUuY29tIiwiZXhwIjoxNzczMjY4NjIxLCJpYXQiOjE3NzMxODIyMjF9.cwyp9tiPE0fqaNZg1iJFmhUJmkoGIXecMOWhcwdN40M"

echo "Testing CreatePool mutation with JWT authentication..."
echo ""

curl -X POST http://localhost:8000/graphql/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "query": "mutation { createPool(name: \"Test Pool via Curl\", password: \"testpass\") { pool { id name urlSlug draftStatus owner { email } } } }"
  }' | python -m json.tool

echo ""
echo "If you see a pool object above, authentication is working!"
