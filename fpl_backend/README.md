# 🏏 NPL Fantasy Cricket API

A production-ready **Fantasy Cricket REST API** for the Nepal Premier League, built with Django REST Framework. Create fantasy teams, compete in leagues, and track real-time player performance.

---

## 🚀 Features

- 🔐 **JWT Authentication** — secure login, token refresh, token blacklisting
- ✉️ **Email Verification** — mandatory email verification via django-allauth
- 🏏 **Fantasy Team Management** — 11-player teams with captain/vice-captain multipliers
- 💰 **Wallet & Payments** — Khalti payment gateway integration
- 🏆 **League System** — create/join leagues with entry fees and prize pools
- ⚡ **Redis Caching** — fast response times with cache invalidation
- 📬 **Celery Tasks** — background email notifications and match reminders
- 🔍 **Advanced Filtering** — search, filter, and order all endpoints
- 📄 **Pagination** — standardized pagination across all list endpoints
- 📚 **Swagger Docs** — interactive API documentation

---

## 🛠️ Tech Stack

| Layer          | Technology                        |
| -------------- | --------------------------------- |
| Backend        | Django 5.2, Django REST Framework |
| Database       | PostgreSQL                        |
| Authentication | JWT (SimpleJWT) + django-allauth  |
| Caching        | Redis (Upstash) + django-redis    |
| Task Queue     | Celery + Celery Beat              |
| Payments       | Khalti Payment Gateway            |
| Filtering      | django-filter                     |
| Docs           | drf-spectacular (Swagger)         |

---

## 📁 Project Structure

```
fpl_backend/
├── core/
│   ├── models.py          # 13 relational models
│   ├── serializers.py     # Validation logic
│   ├── views.py           # ModelViewSet endpoints
│   ├── urls.py            # Router + manual URLs
│   ├── permissions.py     # Custom permission classes
│   ├── signals.py         # Auto scoring + rankings
│   ├── tasks.py           # Celery background tasks
│   ├── filters.py         # django-filter FilterSets
│   ├── caching.py         # CacheInvalidateMixin
│   ├── pagination.py      # StandardPagination
│   ├── khalti.py          # Payment integration
│   └── tests.py           # Test suite
├── fpl_backend/
│   ├── settings.py
│   ├── celery.py
│   └── urls.py
└── requirements.txt
```

---

## ⚙️ Setup & Installation

### Prerequisites

- Python 3.11+
- PostgreSQL
- Redis (or Upstash account)

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/npl-fantasy-api.git
cd npl-fantasy-api/fpl_backend
```

### 2. Create virtual environment

```bash
python -m venv env
env\Scripts\activate      # Windows
source env/bin/activate   # Mac/Linux
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure environment variables

Create a `.env` file in the root directory:

```env
SECRET_KEY=your-secret-key
DB_NAME=npl_fantasy
DB_USER=your-db-user
DB_PASSWORD=your-db-password
REDIS_URL=rediss://default:password@your-upstash-url:6379
KHALTI_PUBLIC_KEY=your-khalti-public-key
KHALTI_SECRET_KEY=your-khalti-secret-key
```

### 5. Run migrations

```bash
python manage.py migrate
```

### 6. Create superuser

```bash
python manage.py createsuperuser
```

### 7. Run the server

```bash
python manage.py runserver
```

### 8. Start Celery worker (separate terminal)

```bash
celery -A fpl_backend worker --loglevel=info
```

---

## 📡 API Endpoints

### Authentication

| Method | Endpoint                               | Description            |
| ------ | -------------------------------------- | ---------------------- |
| POST   | `/api/auth/registration/`              | Register new user      |
| POST   | `/api/auth/registration/verify-email/` | Verify email           |
| POST   | `/api/token/`                          | Login (get JWT tokens) |
| POST   | `/api/token/refresh/`                  | Refresh access token   |
| POST   | `/api/auth/password/reset/`            | Request password reset |
| POST   | `/api/auth/password/reset/confirm/`    | Confirm password reset |
| POST   | `/api/auth/password/change/`           | Change password        |

### Core Resources

| Method   | Endpoint                   | Description             |
| -------- | -------------------------- | ----------------------- |
| GET/POST | `/api/sports/`             | List/create sports      |
| GET/POST | `/api/tournaments/`        | List/create tournaments |
| GET/POST | `/api/cricket-teams/`      | List/create teams       |
| GET/POST | `/api/players/`            | List/create players     |
| GET/POST | `/api/matches/`            | List/create matches     |
| GET/POST | `/api/match-performances/` | Match performance data  |

### Fantasy

| Method   | Endpoint                     | Description           |
| -------- | ---------------------------- | --------------------- |
| GET/POST | `/api/fantasy-teams/`        | Manage fantasy teams  |
| GET/POST | `/api/fantasy-team-players/` | Manage team players   |
| GET/POST | `/api/leagues/`              | Browse/create leagues |
| POST     | `/api/leagues/join/`         | Join a league         |
| GET      | `/api/transactions/`         | View transactions     |

### Payments

| Method | Endpoint                  | Description             |
| ------ | ------------------------- | ----------------------- |
| POST   | `/api/payments/initiate/` | Initiate Khalti payment |
| GET    | `/api/payments/verify/`   | Verify payment          |

---

## 🔍 Filtering & Search

All list endpoints support filtering, searching, and ordering:

```bash
# Filter players by role and budget
GET /api/players/?role=Batsman&min_credit_value=5&max_credit_value=10

# Search tournaments by name
GET /api/tournaments/?search=NPL+2024

# Order leagues by entry fee
GET /api/leagues/?ordering=entry_fee

# Filter matches by tournament
GET /api/matches/?tournament=1&status=upcoming
```

---

## 🏏 Fantasy Team Rules

- ✅ Exactly **11 players** per team
- ✅ Maximum **7 players** from one cricket team
- ✅ **Budget cap** of 100 credits
- ✅ Role composition: 4 Batsmen, 4 Bowlers, 2 All-Rounders, 1 Wicket-Keeper
- ✅ One team per user per match
- ✅ **30-minute deadline** before match start
- ✅ Captain gets **2× points**, Vice-Captain gets **1.5× points**

---

## 🔐 Permission Classes

| Permission             | Description                        |
| ---------------------- | ---------------------------------- |
| `IsAdminOrReadOnly`    | Admins can write, others read-only |
| `IsOwnerOrAdmin`       | Only owner or admin can access     |
| `IsLeagueOwnerOrAdmin` | Only league creator or admin       |
| `IsVerified`           | Only email-verified users          |

---

## 🧪 Running Tests

```bash
python manage.py test core
```

Current test suite: **11 tests** covering authentication, fantasy team validation, and league operations.

---

## 📬 Background Tasks (Celery)

| Task                               | Trigger           | Description                      |
| ---------------------------------- | ----------------- | -------------------------------- |
| `send_welcome_email`               | User registration | Sends welcome email              |
| `send_match_reminder`              | Match creation    | Reminds users 1hr before match   |
| `send_points_updated_notification` | Match completed   | Notifies users of fantasy points |

---

## 📚 API Documentation

Interactive Swagger docs available at:

```
http://127.0.0.1:8000/api/docs/
```

---

## 🗺️ Roadmap

- [ ] React Frontend
- [ ] Google OAuth login
- [ ] Docker containerization
- [ ] Deployment (Railway/Render)
- [ ] Live match score integration

---

## 👨‍💻 Author

**Pujan** — Computer Science Graduate, Nepal

- GitHub: [@yourusername](https://github.com/yourusername)
- LinkedIn: [your-linkedin](https://linkedin.com/in/yourprofile)

---

## 📄 License

This project is licensed under the MIT License.
