"""
Custom GraphQL view with enhanced error handling and CORS support.
"""
import json
import logging
from graphene_django.views import GraphQLView
from django.http import JsonResponse
from apps.exceptions import PoolRunnerException

logger = logging.getLogger(__name__)


class CustomGraphQLView(GraphQLView):
    """
    Custom GraphQL view that handles PoolRunnerException errors
    and formats them with error codes for the frontend.
    """

    @staticmethod
    def format_error(error):
        """
        Format GraphQL errors to include structured error codes.

        Transforms PoolRunnerException errors into a structured format:
        {
            "message": "Human-readable message",
            "extensions": {
                "code": "ERROR_CODE",
                "exception": {
                    "code": "ERROR_CODE"
                }
            }
        }
        """
        formatted_error = GraphQLView.format_error(error)

        # Check if the original error is a PoolRunnerException
        if hasattr(error, 'original_error'):
            original_error = error.original_error
            if isinstance(original_error, PoolRunnerException):
                # Add structured error code to extensions
                formatted_error['extensions'] = {
                    'code': original_error.code,
                    'exception': {
                        'code': original_error.code,
                        'message': original_error.message
                    }
                }
                # Use the clean message without the [CODE] prefix
                formatted_error['message'] = original_error.message

                # Log the error for monitoring
                logger.warning(
                    f"GraphQL Error [{original_error.code}]: {original_error.message}",
                    extra={'error_code': original_error.code}
                )

        return formatted_error

    def execute_graphql_request(self, request, data, query, variables, operation_name, show_graphiql=False):
        """
        Override to add custom error handling and logging.
        """
        try:
            return super().execute_graphql_request(
                request, data, query, variables, operation_name, show_graphiql
            )
        except Exception as e:
            logger.error(f"GraphQL execution error: {str(e)}", exc_info=True)
            raise


def health_check(request):
    """
    Simple health check endpoint to verify the API is running.

    Returns:
        JSON response with status and available endpoints
    """
    return JsonResponse({
        'status': 'healthy',
        'service': 'Pool Runner API',
        'version': '1.0.0',
        'endpoints': {
            'graphql': '/graphql/',
            'graphiql': '/graphql/ (GET request)',
            'admin': '/admin/',
            'health': '/health/'
        }
    })
