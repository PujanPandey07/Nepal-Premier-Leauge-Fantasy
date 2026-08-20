# NPL Fantasy Backend ⚙️

Built with **Django REST Framework (DRF)**, this backend handles complex business logic, background tasks, and real-time point generation for the NPL Fantasy platform.

## 📌 Key Architectural Highlights

- **JWT Authentication:** Stateful HttpOnly refresh tokens combined with short-lived access tokens via `djangorestframework-simplejwt` to secure against XSS.
- **Background Event Ingestion:** Asynchronous task processing using **Celery** and **Redis** to fetch active match performances and trigger point signals.
- **Atomic Financial Transactions:** Bank-grade `select_for_update()` database locks to prevent race conditions during wallet debiting, league joins, and prize crediting.
- **RESTful Endpoints:** Decoupled REST structure serving Team Drafting, Paginating Leaderboards, Wallets, and Khalti payment verification.

## 🛠️ Setup Instructions

### 1. Environment & Database
Ensure your `.env` is properly populated at the root of the project containing your `DB_PASSWORD`, `SECRET_KEY`, and `Cricbuzz_API_KEY`.
You must have a PostgreSQL instance running locally or via Docker.

### 2. Install & Migrate
```bash
python -m venv env
source env/bin/activate
pip install -r requirements.txt
python manage.py makemigrations core
python manage.py migrate
```

### 3. Run Celery Workers
For live match ingestion and automated tasks, you need a Redis server running (`localhost:6379`).
Open two new terminal tabs and run:
```bash
# Terminal 1: Task worker
celery -A fpl_backend worker -l info

# Terminal 2: Beat scheduler (for cron jobs)
celery -A fpl_backend beat -l info
```

### 4. Run the API
```bash
python manage.py runserver
```

*API Documentation (Swagger UI) is available at `/api/docs/` when running in DEBUG mode.*
