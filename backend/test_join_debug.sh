#!/bin/bash

TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiOGM2ODlmMjQtOTBjNy00ZTAxLWE1NGEtOTE4ZmY4MmEyMDJjIiwiZW1haWwiOiJ1c2VyQGV4YW1wbGUuY29tIiwiZXhwIjoxNzczMjczODcwLCJpYXQiOjE3NzMxODc0NzB9.uejJti490aYJrHErFfbF-YnoyGgYpaH5K2F-Pde2Vfw"

echo "Testing JOIN_POOL mutation..."
echo ""
echo "User: user@example.com"
echo "Pool: march-madness-2025-vLGtwryUrAU"
echo "Password: testpass"
echo ""

curl -X POST http://localhost:8000/graphql/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"query":"mutation{joinPool(urlSlug:\"march-madness-2025-vLGtwryUrAU\",password:\"testpass\"){membership{id user{email}pool{id name}}}}"}' \
  -w "\n\nHTTP Status: %{http_code}\n"
