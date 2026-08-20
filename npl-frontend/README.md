# NPL Fantasy Frontend 🏏

A blazing-fast Single Page Application (SPA) built with **React** and **Vite** for the Nepal Premier League Fantasy Cricket platform. 

## 📌 Overview

This highly interactive React application provides the user interface for drafting fantasy teams, challenging friends in private leagues, tracking live leaderboards, and managing wallet transactions.

- **State Management:** Custom React Contexts (`AuthContext` and `TeamContext`) handle session lifecycles and draft validation (like budgets and role caps) locally.
- **Draft & Submit Architecture:** The team builder UI acts as an in-memory draft board, sending changes to the database in a single atomic transaction only upon saving.
- **Security-First Requests:** Automated Axios interceptors handle silent token refreshing (via HttpOnly cookies) on `401 Unauthorized` responses seamlessly in the background.
- **Responsive Design:** Completely mobile-optimized UI tailored with **TailwindCSS**.

## 🛠️ Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
If your backend is running on a port other than `http://localhost:8000`, or if you are preparing for production, configure the `baseURL` within your Axios config, or set up a `.env` file accordingly.

### 3. Run Development Server
```bash
npm run dev
```
The application will be available at `http://localhost:5173`.

### 4. Build for Production
```bash
npm run build
```
*The `dist/` folder will contain the optimized, minified bundle ready to be served by Nginx or deployed to Vercel/Netlify.*
