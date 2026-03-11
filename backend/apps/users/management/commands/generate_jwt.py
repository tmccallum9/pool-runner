"""
Management command to generate JWT tokens for local testing.
Usage: python manage.py generate_jwt <email>
"""
from django.core.management.base import BaseCommand, CommandError
from apps.users.models import User
from apps.users.service import create_jwt_token


class Command(BaseCommand):
    help = 'Generate a JWT token for a user (creates user if not exists)'

    def add_arguments(self, parser):
        parser.add_argument('email', type=str, help='User email address')

    def handle(self, *args, **options):
        email = options['email']

        # Get or create user
        user, created = User.objects.get_or_create(email=email)

        if created:
            self.stdout.write(self.style.SUCCESS(f'Created new user: {email}'))
        else:
            self.stdout.write(self.style.SUCCESS(f'Found existing user: {email}'))

        # Generate JWT token
        token = create_jwt_token(user)

        self.stdout.write(self.style.SUCCESS(f'\nUser ID: {user.id}'))
        self.stdout.write(self.style.SUCCESS(f'Email: {user.email}'))
        self.stdout.write(self.style.SUCCESS(f'\nJWT Token:'))
        self.stdout.write(self.style.WARNING(token))
        self.stdout.write(self.style.SUCCESS('\nAdd to Authorization header as:'))
        self.stdout.write(f'Authorization: Bearer {token}')
