# Render Deployment Guide — PUPBC CareLink

This guide walks you through deploying the PUPBC CareLink full-stack application (Laravel backend + React/Vite frontend) to [Render](https://render.com).

---

## Prerequisites

1. **Render Account** — Sign up at [render.com](https://render.com) (free tier available).
2. **GitHub Repository** — Your code must be pushed to GitHub. This project is already connected to:
   - `centy29: https://github.com/centy29/PUP-carelink-testing.git`
3. **Supabase Project** — You need your Supabase connection pooler credentials:
   - Pooler host: `aws-0-ap-northeast-1.pooler.supabase.com`
   - Pooler port: `6543`
   - Database: `postgres`
   - Username: `postgres.<project-ref>`
   - Password: (your Supabase password)
4. **JWT Secret** — Generate with:
   ```bash
   cd backend
   php artisan jwt:secret
   ```
5. **APP_KEY** — Generate with:
   ```bash
   cd backend
   php artisan key:generate --show
   ```
6. **Gmail App Password** — For the mail configuration (if email features are used).

---

## Step 1: Push `render.yaml` to GitHub

The `render.yaml` file at the project root defines both services (backend + frontend) as Infrastructure-as-Code.

```bash
git add render.yaml
git add frontend/src/services/api.js
git add backend/config/cors.php
git add backend/.env.example
git commit -m "Add Render deployment configuration"
git push centy29 main
```

> **Note:** The remote `centy29` points to `https://github.com/centy29/PUP-carelink-testing.git`.

---

## Step 2: Create a Render Web Service

1. Go to [render.com](https://render.com) and sign in.
2. Click **"New"** → **"Web Service"**.
3. Connect your GitHub account and select the repository: `centy29/PUP-carelink-testing`.
4. Render will auto-detect the `render.yaml` file and show a preview of both services:
   - `carelink-backend` (PHP/Laravel)
   - `carelink-frontend` (Node.js/React)
5. Click **"Create Web Services"**.

Render will automatically:
- Install PHP dependencies for the backend
- Install npm dependencies and build the frontend
- Run database migrations
- Start both services

### Start Commands (if creating services manually)

If you create the services manually (without `render.yaml`), use these **Start Commands**:

| Service | Start Command |
|---------|--------------|
| `carelink-backend` | `php artisan serve --host=0.0.0.0 --port=$PORT` |
| `carelink-frontend` | `npx serve -s dist -l $PORT` |

And these **Build Commands**:

| Service | Build Command |
|---------|--------------|
| `carelink-backend` | `composer install --no-dev --optimize-autoloader --no-interaction && php artisan config:cache && php artisan route:cache && php artisan event:cache && php artisan storage:link && php artisan migrate --force` |
| `carelink-frontend` | `npm install && npm run build` |

---

## Step 3: Set Sensitive Environment Variables

The `render.yaml` uses `sync: false` for sensitive variables. You must set these in the Render dashboard:

### Backend Service (`carelink-backend`)

Go to **Render Dashboard** → **carelink-backend** → **Environment** → **Environment Variables** and add:

| Key | Value | Notes |
|-----|-------|-------|
| `DB_USERNAME` | `postgres.your-project` | Supabase pooler username |
| `DB_PASSWORD` | *(your Supabase password)* | Supabase pooler password |
| `SUPABASE_KEY` | *(your Supabase key)* | Can use anon key or service_role |
| `SUPABASE_ANON_KEY` | *(your Supabase anon key)* | Supabase anon key |
| `JWT_SECRET` | *(generated secret)* | From `php artisan jwt:secret` |
| `MAIL_PASSWORD` | *(Gmail app password)* | For SMTP email |

### Frontend Service (`carelink-frontend`)

No additional secrets are needed — `VITE_API_URL` is already set in `render.yaml`.

---

## Step 4: Update URLs After First Deploy

After the first successful deploy, Render will assign each service a unique URL:

- Backend: `https://carelink-backend.onrender.com`
- Frontend: `https://carelink-frontend.onrender.com`

Go to **carelink-backend** → **Environment** and update:

| Key | Value |
|-----|-------|
| `APP_URL` | `https://carelink-backend.onrender.com` |
| `FRONTEND_URL` | `https://carelink-frontend.onrender.com` |
| `SANCTUM_STATEFUL_DOMAINS` | `carelink-frontend.onrender.com` |

Then **Redeploy** the backend service.

---

## Step 5: Verify Deployment

1. **Backend Health Check:**
   ```
   https://carelink-backend.onrender.com/api/health
   ```
   Should return:
   ```json
   {
     "success": true,
     "status": "healthy",
     "version": "1.0.0",
     "timestamp": "...",
     "environment": "production"
   }
   ```

2. **Frontend:**
   Visit `https://carelink-frontend.onrender.com` — the landing page should load.

3. **API Test:**
   ```
   https://carelink-backend.onrender.com/api/test
   ```
   Should return:
   ```json
   {
     "success": true,
     "message": "PUPBC CareLink API is working!",
     "version": "1.0.0"
   }
   ```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Render (Oregon)                       │
│                                                          │
│  ┌──────────────────────┐    ┌────────────────────────┐ │
│  │  carelink-frontend   │    │   carelink-backend     │ │
│  │  (Node.js / Vite)    │    │   (PHP / Laravel 8)      │ │
│  │  React SPA on :PORT  │◄──►│  API on :PORT            │ │
│  │  VITE_API_URL points │    │  /api/* routes           │ │
│  │  to backend          │    │  JWT auth                │ │
│  └──────────────────────┘    └────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
              ┌──────────────────────────┐
              │     Supabase (AWS)        │
              │  PostgreSQL (Pooler)      │
              │  aws-0-ap-northeast-1     │
              │  .pooler.supabase.com:6543│
              └──────────────────────────┘
```

---

## Troubleshooting

### Build Fails — "composer not found"
Render's PHP runtime includes Composer. If you see issues, ensure `composer.json` is in the `backend/` directory (it is).

### Database Connection Errors
- Verify `DB_USERNAME` and `DB_PASSWORD` are set in the Render dashboard.
- Ensure the Supabase pooler allows connections (it should by default).
- Check that `DB_SSLMODE=require` is set.

### CORS Errors
- Ensure `FRONTEND_URL` is set to the correct Render frontend URL.
- The CORS config in `backend/config/cors.php` already includes Render domains.

### Frontend Can't Reach Backend
- Verify `VITE_API_URL` is set to `https://carelink-backend.onrender.com/api`.
- Check that the backend service is running (health check endpoint).

### Migrations Fail
- Run manually via Render Shell:
  ```bash
  cd backend
  php artisan migrate --force
  ```
- Or check the Render build logs for specific migration errors.

---

## Local Development vs. Render

| Feature | Local | Render |
|---------|-------|--------|
| Backend URL | `http://127.0.0.1:8000` | `https://carelink-backend.onrender.com` |
| Frontend URL | `http://localhost:3000` | `https://carelink-frontend.onrender.com` |
| API Base | `http://127.0.0.1:8000/api` | `https://carelink-backend.onrender.com/api` |
| Database | Supabase pooler | Supabase pooler (same) |
| APP_ENV | `local` | `production` |
| APP_DEBUG | `true` | `false` |

The frontend `api.js` automatically uses `VITE_API_URL` in production and falls back to hostname-based detection in local development.
