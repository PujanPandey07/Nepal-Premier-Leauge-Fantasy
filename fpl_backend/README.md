# NPL Fantasy Cricket API 🏏

A full-featured fantasy cricket backend API for the Nepal Premier League (NPL), built as a learning project to master Django REST Framework, JWT authentication, and real-world API design patterns.

## Project Overview

This API powers a fantasy cricket platform where users can:

- Create fantasy teams for NPL matches
- Pick 11 players within a budget cap
- Join public or private leagues using invite codes
- Earn points based on real player performances
- Compete in leagues for prize pools

## Tech Stack

- **Backend:** Django 5.2 + Django REST Framework
- **Database:** PostgreSQL
- **Authentication:** JWT (djangorestframework-simplejwt)
- **Payment:** Khalti Payment Gateway
- **Documentation:** drf-spectacular (Swagger UI)
- **Testing:** Django TestCase + DRF APITestCase

## Features

### Authentication

- Custom User model with email-based login
- JWT access + refresh tokens
- Token blacklisting on logout
- Role-based permissions (user, admin, moderator)

### Fantasy Team System

- Create fantasy teams per match
- Pick exactly 11 players
- Maximum 7 players from one cricket team
- Budget cap enforcement (100 credits default)
- Captain (2x points) and Vice-Captain (1.5x points)
- Role composition validation (min 4 batsmen, 4 bowlers, 2 all-rounders, 1 wicket-keeper)
- Match deadline enforcement (locked 30 minutes before match)
- One team per user per match

### Scoring System

- Automatic fantasy points calculation via Django signals
- Points for runs, wickets, catches, stumpings, run-outs
- Bonus points for milestones (50s, 100s, 3-wicket hauls, 5-wicket hauls)
- Strike rate and economy rate bonuses
- Captain/Vice-Captain multipliers applied automatically

### League System

- Create public or private leagues
- Auto-generated invite codes
- Entry fee support (wallet deduction on joining)
- Automatic league rankings after each match
- Prize pool distribution to winner

### Payment Integration

- Khalti Payment Gateway integration
- Wallet top-up flow (initiate → pay → verify)
- Transaction history
- Server-side payment verification (never trust the client)

### API Features

- Pagination (PageNumber style, 10 items per page)
- Search on players, leagues, tournaments
- Filtering on players (role, nationality, price range)
- Ordering on players, leagues, tournaments
- Swagger UI documentation at `/api/docs/`

## Architecture Decisions

### Why Django Signals for Scoring?

Fantasy points and league rankings update automatically when match data is saved — no manual triggers needed. This keeps views clean and business logic centralized.

### Why Custom Permissions?

Standard DRF permissions don't handle object-level ownership (e.g. "only the team owner can edit their team"). Custom `IsOwnerOrAdmin` and `IsLeagueOwnerOrAdmin` permissions handle this cleanly.

### Why APIView over ViewSets?

This branch uses `APIView` for explicit control and learning purposes. A `feature/viewsets` branch refactors to `ModelViewSet` with `django-filter` for cleaner, more production-ready code.

### Why JWT over Session Auth?

The app is designed for Flutter mobile and React web frontends — stateless JWT tokens work across platforms without cookie/session complexity.

## Setup & Installation

### Prerequisites

- Python 3.11+
- PostgreSQL
- pip

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd fpl_backend

# Create virtual environment
python -m venv env
env\Scripts\activate  # Windows
source env/bin/activate  # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Fill in your database credentials and secret key

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run server
python manage.py runserver
```

### Environment Variables

```
SECRET_KEY=your-secret-key
DB_NAME=npl_fantasy
DB_USER=your-db-user
DB_PASSWORD=your-db-password
KHALTI_SECRET_KEY=your-khalti-key
```

## API Documentation

Start the server and visit:

```
http://localhost:8000/api/docs/
```

### Key Endpoints

| Endpoint                           | Method | Description                  |
| ---------------------------------- | ------ | ---------------------------- |
| `/api/auth/register/`              | POST   | Register new user            |
| `/api/token/`                      | POST   | Login, get JWT tokens        |
| `/api/token/refresh/`              | POST   | Refresh access token         |
| `/api/tournaments/`                | GET    | List all tournaments         |
| `/api/tournaments/{id}/players/`   | GET    | List players with filters    |
| `/api/fantasy-teams/`              | POST   | Create fantasy team          |
| `/api/fantasy-teams/{id}/players/` | POST   | Add player to team           |
| `/api/leagues/`                    | POST   | Create league                |
| `/api/leagues/join/`               | POST   | Join league with invite code |
| `/api/payments/initiate/`          | POST   | Initiate wallet top-up       |
| `/api/payments/verify/`            | GET    | Verify payment callback      |

## Testing

```bash
python manage.py test core
```

Current test coverage:

- User registration and login
- Admin permissions
- Fantasy team creation
- Player validation rules (7-player limit, budget cap, deadline)
- League joining (duplicate check, full league check)

## Project Structure

```
fpl_backend/
├── core/
│   ├── models.py          # 13 models
│   ├── serializers.py     # Validation logic
│   ├── views.py           # API endpoints
│   ├── urls.py            # URL routing
│   ├── permissions.py     # Custom permissions
│   ├── signals.py         # Auto scoring + rankings
│   ├── pagination.py      # Standard pagination
│   ├── khalti.py          # Payment integration
│   └── tests.py           # Test suite
├── fpl_backend/
│   ├── settings.py
│   └── urls.py
└── requirements.txt
```

## Branches

- `backend` — APIView implementation (this branch)
- `feature/viewsets` — ModelViewSet refactor with django-filter, Redis caching, Celery
- `frontend` — React web application (coming soon)

## What I Learned

Building this project taught me:

- Designing relational database schemas for complex domains
- JWT authentication flow and token management
- Django signals for automatic business logic
- Complex ORM queries across multiple related models
- Custom DRF permissions for object-level security
- Payment gateway integration patterns
- API design best practices
- Test-driven thinking

## Author

Built by [Your Name] as a learning project to master Django REST Framework and backend development.

Nepal 🇳🇵 | 2026
