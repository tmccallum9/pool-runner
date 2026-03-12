"""
Utility functions for user authentication and magic links.
"""
import jwt
from datetime import datetime, timedelta
from django.conf import settings
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail


def create_jwt_token(user):
    """
    Create a JWT token for an authenticated user.

    Args:
        user: User model instance

    Returns:
        str: JWT token
    """
    payload = {
        'user_id': str(user.id),
        'email': user.email,
        'exp': datetime.utcnow() + timedelta(hours=settings.JWT_EXPIRATION_HOURS),
        'iat': datetime.utcnow(),
    }
    token = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return token


def decode_jwt_token(token):
    """
    Decode and validate a JWT token.

    Args:
        token: JWT token string

    Returns:
        dict: Decoded payload with user_id and email
        None: If token is invalid or expired
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def get_user_from_token(token):
    """
    Extract user from JWT token.

    Args:
        token: JWT token string

    Returns:
        User: User model instance
        None: If token is invalid or user doesn't exist
    """
    from apps.users.models import User

    payload = decode_jwt_token(token)
    if not payload:
        return None

    try:
        user = User.objects.get(id=payload['user_id'])
        return user
    except User.DoesNotExist:
        return None


def send_magic_link_email(email, magic_link_token):
    """
    Send magic link email to user using SendGrid.

    Args:
        email: User's email address
        magic_link_token: Magic link token string

    Returns:
        bool: True if email sent successfully, False otherwise
    """
    magic_link_url = f"{settings.FRONTEND_URL}/auth/verify?token={magic_link_token}"

    message = Mail(
        from_email=settings.FROM_EMAIL,
        to_emails=email,
        subject='Sign in to Pool Runner',
        html_content=f"""
        <html>
            <body>
                <h2>Welcome to Pool Runner!</h2>
                <p>Click the link below to sign in to your account:</p>
                <a href="{magic_link_url}" style="
                    display: inline-block;
                    padding: 10px 20px;
                    background-color: #4CAF50;
                    color: white;
                    text-decoration: none;
                    border-radius: 5px;
                ">Sign In</a>
                <p>This link will expire in {settings.MAGIC_LINK_EXPIRATION_MINUTES} minutes.</p>
                <p>If you didn't request this, you can safely ignore this email.</p>
            </body>
        </html>
        """
    )

    if not settings.SENDGRID_API_KEY:
        print(f"Magic link fallback for {email}: {magic_link_url}")
        return True

    try:
        sg = SendGridAPIClient(settings.SENDGRID_API_KEY)
        response = sg.send(message)
        return response.status_code in [200, 201, 202]
    except Exception as e:
        print(f"Error sending email: {e}")
        return False


def authenticate_request(info):
    """
    Extract and authenticate user from GraphQL request context.

    Args:
        info: GraphQL resolve info context

    Returns:
        User: Authenticated user or None
    """
    request = info.context
    auth_header = request.META.get('HTTP_AUTHORIZATION', '')

    if not auth_header.startswith('Bearer '):
        return None

    token = auth_header.replace('Bearer ', '')
    return get_user_from_token(token)
