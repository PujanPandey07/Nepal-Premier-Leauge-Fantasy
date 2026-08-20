# Nepal Premier League (NPL) Fantasy Cricket 🏏

A full-stack, production-ready Fantasy Cricket application built for the Nepal Premier League. Users can create teams, join leagues (free or paid), and compete for prize pools based on real-world player performances, integrated directly via the Cricbuzz API.

## 🚀 Key Features
- **Live Match Ingestion:** Automatic sync of real-world performances via Cricbuzz API using Celery workers.
- **Dynamic Team Building:** Build your 11-man squad with strict constraints (budget caps, role requirements, max players per team).
- **Leagues & Prize Pools:** Create or join public/private leagues with wallet-based entry fees and automatic payout distributions.
- **Wallet & Transactions:** Secure integrated wallet for Khalti gateway top-ups.
- **Seamless Authentication:** Custom JWT implementation with HttpOnly cookie refreshers and Google OAuth integration.

## 📁 Repository Structure

This is a decoupled monorepo structured into two primary services:

- **`/fpl_backend/`** - Django REST Framework API. Contains the core logic, Redis caching, Celery tasks, and PostgreSQL models. *(See backend README for details)*
- **`/npl-frontend/`** - React.js frontend powered by Vite and TailwindCSS. Handles the interactive draft building and dashboard experiences. *(See frontend README for details)*

## 🛠️ Tech Stack
- **Backend:** Django, Django REST Framework, Celery, Redis
- **Frontend:** React.js (Vite), Context API, Axios, Tailwind CSS
- **Database:** PostgreSQL
- **Integrations:** Khalti Digital Wallet, RapidAPI Cricbuzz

## ⚙️ Quick Start

```bash
# Clone the repository
git clone https://github.com/PujanPandey07/Nepal-Premier-Leauge-Fantasy.git
cd Nepal-Premier-Leauge-Fantasy
```

### 1. Start the Backend
```bash
cd fpl_backend
python -m venv env
source env/bin/activate  # Or `env\Scripts\activate` on Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### 2. Start the Frontend (in a new terminal)
```bash
cd npl-frontend
npm install
npm run dev
```

Visit `http://localhost:5173` to view the application.

---
*Developed for the Nepal Premier League Fantasy community.*
