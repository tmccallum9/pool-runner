#!/bin/bash
# Test joining pool with JWT authentication

TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNDg4MTU2MmQtYTljNC00NmRlLWI3MDctOTE3YzhiMjVkZGI1IiwiZW1haWwiOiJ0ZXN0am9pbkBleGFtcGxlLmNvbSIsImV4cCI6MTc3MzI3MzA4MSwiaWF0IjoxNzczMTg2NjgxfQ.djRAC5yCWprCvI9-luyVtPy47gcHu12RErt7MW572f4"
URL_SLUG="march-madness-2025-vLGtwryUrAU"
PASSWORD="testpass"

echo "Testing JoinPool mutation..."
echo ""

curl -X POST http://localhost:8000/graphql/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"query\": \"mutation { joinPool(urlSlug: \\\"$URL_SLUG\\\", password: \\\"$PASSWORD\\\") { membership { id user { email } pool { name } } } }\"
  }" | python -m json.tool

echo ""
echo "If you see a membership object above, join succeeded!"
