"""
URL configuration for pool_runner project.

API Endpoints:
--------------
- /graphql        - GraphQL API endpoint (POST for queries/mutations, GET for GraphiQL)
- /graphql/       - GraphQL API endpoint (POST for queries/mutations, GET for GraphiQL)
- /health/        - Health check endpoint
- /admin/         - Django admin interface

GraphQL Endpoint:
    POST /graphql and POST /graphql/
        - Execute GraphQL queries and mutations
        - Requires Authorization header: Bearer <JWT_TOKEN> (except for sendMagicLink and signIn)
        - Content-Type: application/json
        - Body: {"query": "...", "variables": {...}}

    GET /graphql and GET /graphql/
        - GraphiQL interactive interface (only available in DEBUG mode)
        - Browser-based GraphQL playground for testing queries

Authentication Flow:
    1. POST /graphql/ with sendMagicLink mutation (email)
    2. User receives email with magic link token
    3. POST /graphql/ with signIn mutation (token)
    4. Receive JWT token in response
    5. Include JWT token in Authorization header for subsequent requests
       Authorization: Bearer <token>
"""
from django.contrib import admin
from django.urls import path
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from pool_runner.graphql_view import CustomGraphQLView, health_check
from schema import schema


graph_ql_view = csrf_exempt(
    CustomGraphQLView.as_view(
        graphiql=settings.DEBUG,  # Only enable GraphiQL in development
        schema=schema,
    )
)

urlpatterns = [
    # Admin interface
    path('admin/', admin.site.urls),

    # GraphQL API endpoint with custom error handling
    path('graphql', graph_ql_view, name='graphql_no_slash'),
    path('graphql/', graph_ql_view, name='graphql'),

    # Health check endpoint
    path('health/', health_check, name='health'),
]
