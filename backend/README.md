# Pool Runner Backend

Django GraphQL API backend for the Pool Running March Madness application.

## Tech Stack

- **Framework**: Django 5.0
- **API**: GraphQL (Graphene-Django)
- **Database**: PostgreSQL (Supabase)
- **Authentication**: JWT + Magic Links
- **Email**: SendGrid

## Project Structure

```
backend/
├── manage.py                 # Django management script
├── requirements.txt          # Python dependencies
├── .env.example             # Environment variables template
├── pool_runner/             # Main Django project
│   ├── settings.py          # Django settings (Supabase config)
│   ├── urls.py              # URL routing (GraphQL endpoint)
│   ├── wsgi.py              # WSGI configuration
│   └── asgi.py              # ASGI configuration
├── apps/                    # Django applications
│   ├── users/               # User authentication
│   │   ├── models.py        # User, MagicLink models
│   │   ├── schema.py        # GraphQL types, queries, mutations
│   │   └── service.py       # JWT, email utilities
│   ├── pools/               # Pool management
│   │   ├── models.py        # Pool, PoolMembership models
│   │   ├── schema.py        # GraphQL types, queries, mutations
│   │   └── service.py       # Draft order, validation utilities
│   ├── teams/               # Teams and draft picks
│   │   ├── models.py        # Team, DraftPick models
│   │   ├── schema.py        # GraphQL types, queries, mutations
│   │   └── service.py       # Draft validation utilities
│   └── tournaments/         # Tournament results
│       ├── models.py        # TeamGameResult model
│       ├── schema.py        # GraphQL types, queries, mutations
│       └── service.py       # Result validation utilities
└── schema.py                # Root GraphQL schema
```

## Setup Instructions

### 1. Prerequisites

- Python 3.11+
- PostgreSQL database (Supabase account)
- SendGrid API key (for magic link emails)

### 2. Environment Setup

Create a virtual environment and install dependencies:

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Update the following variables:
- `SECRET_KEY`: Django secret key (generate with `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`)
- `DB_HOST`, `DB_PASSWORD`: Your Supabase database credentials
- `JWT_SECRET_KEY`: Secret for JWT token generation
- `SENDGRID_API_KEY`: Your SendGrid API key
- `FRONTEND_URL`: Your Next.js frontend URL

### 4. Database Setup

Run migrations to create database tables:

```bash
python manage.py makemigrations
python manage.py migrate
```

### 5. Create Superuser (Optional)

Create an admin user to access Django admin:

```bash
python manage.py createsuperuser
```

### 6. Run Development Server

Start the Django development server:

```bash
python manage.py runserver
```

The GraphQL API will be available at:
- GraphQL Endpoint: `http://localhost:8000/graphql/`
- GraphiQL Interface: `http://localhost:8000/graphql/` (in browser)

## GraphQL API

### Authentication Flow

1. **Request Magic Link**
   ```graphql
   mutation {
     sendMagicLink(email: "user@example.com")
   }
   ```

2. **Sign In with Token**
   ```graphql
   mutation {
     signIn(token: "magic-link-token") {
       user {
         id
         email
       }
       authToken
     }
   }
   ```

3. **Use JWT Token**
   Include in request headers:
   ```
   Authorization: Bearer <jwt-token>
   ```

### Key Mutations

**Pool Management**
- `createPool(name, password)` - Create a new pool
- `joinPool(urlSlug, password)` - Join existing pool
- `randomizeDraftOrder(poolId)` - Randomize draft positions (owner only)
- `startDraft(poolId)` - Start the draft (owner only)
- `completeDraft(poolId)` - Complete the draft (owner only)

**Team Management**
- `createTeam(poolId, name, seedRank, region)` - Add a team
- `bulkCreateTeams(poolId, teams)` - Add multiple teams
- `makeDraftPick(poolId, teamId)` - Make a draft pick

**Tournament Results**
- `updateTeamResult(poolId, teamId, tournamentRound, result)` - Record win/loss (owner only)

### Key Queries

- `me` - Get current authenticated user
- `getPool(id, urlSlug)` - Get pool details
- `getPoolMembers(poolId)` - Get pool members
- `getPoolStandings(poolId)` - Get leaderboard
- `getAvailableTeams(poolId)` - Get undrafted teams
- `getDraftPicks(poolId)` - Get all draft picks
- `getCurrentDraftTurn(poolId)` - Get whose turn it is
- `getTeamResults(poolId, teamId)` - Get team's tournament results

## Data Models

See `requirements.md` in the project root for detailed data model documentation.

### Key Features

- **Snake Draft Logic**: Automatic calculation of pick order (1st in round 1 picks 12th in round 2)
- **Seed Group Validation**: Enforces 1 team per seed group (1-4, 5-8, 9-12, 13-16)
- **Automatic Point Calculation**: Points = seed_rank + tournament_round for wins
- **Concurrent Pick Protection**: Database constraints prevent duplicate team picks
- **Magic Link Authentication**: Passwordless email-based sign in with JWT tokens

## Development

### Running Tests

```bash
python manage.py test
```

### Creating New Migrations

```bash
python manage.py makemigrations
```

### Accessing Django Admin

Navigate to `http://localhost:8000/admin/` and log in with superuser credentials.

## Deployment

### Production Checklist

1. Set `DEBUG=False` in settings
2. Configure `ALLOWED_HOSTS` with your domain
3. Set strong `SECRET_KEY` and `JWT_SECRET_KEY`
4. Use environment variables for all secrets
5. Enable HTTPS/SSL
6. Configure CORS for your frontend domain
7. Set up proper database backups
8. Configure email delivery with SendGrid

### WSGI/ASGI

The project includes both WSGI and ASGI configurations for deployment:
- WSGI: `pool_runner.wsgi.application`
- ASGI: `pool_runner.asgi.application`

## Troubleshooting

### Database Connection Issues

- Verify Supabase credentials in `.env`
- Ensure SSL mode is enabled (`sslmode=require` in DATABASE settings)
- Check firewall/network access to Supabase host

### Magic Link Emails Not Sending

- Verify SendGrid API key is valid
- Check SendGrid sender verification
- Review SendGrid activity logs

### GraphQL Errors

- Check authentication token is included in headers
- Verify user has proper permissions (owner vs. member)
- Review error messages in GraphQL response

## Support

For issues and questions, refer to the main project documentation or open an issue in the repository.
