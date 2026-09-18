# 🏥 PUPBC CareLink — Complete Setup Guide

> Para sa mga kagrupo: sundin lang ang steps. Lahat ng config blocks sa guide na ito ay **paste-ready** — kopyahin lang!

**Repo:** https://github.com/centy29/PUP-carelink-testing
**Live deployment (Render):** https://pup-carelink-testing-frontend.onrender.com · API: https://pup-carelink-testing-backend.onrender.com

---

## 📋 Requirements

| Software | Version | Download |
|----------|---------|----------|
| PHP | **8.1+** (kasama na sa WAMP/Laragon) | https://windows.php.net/ |
| Composer | latest | https://getcomposer.org/ |
| Node.js | 18+ (20 recommended) | https://nodejs.org/ |
| Git | latest | https://git-scm.com/ |
| **WAMP Server** *(Option A)* | MySQL 9.1 | https://www.wampserver.com/ |
| **Laragon** *(Option B)* | MySQL 8.4 | https://laragon.org/ |
| Supabase account *(Option C — production DB)* | free tier | https://supabase.com/ |

> 💡 **WAMP at Laragon ay magkatumbas** — piliin ang isa. Pareho nito may kasamang MySQL + PHP. Ang Supabase ay para sa shared/remote database (ito ang ginagamit ng live Render deployment).

---

## 📥 Step 1 — Clone the Project

```bash
git clone https://github.com/centy29/PUP-carelink-testing.git
cd PUP-carelink-testing
```
*(O i-download ang ZIP mula sa GitHub tapos i-extract)*

---

## 🗄️ Step 2 — Database Setup (pumili ng ISA: A, B, o C)

### ⭐ Option A — WAMP Server (local MySQL — fastest)

1. Start WAMP Server (icon turns **green**)
2. WAMP icon (taskbar) → **phpMyAdmin**
3. **Import** tab → Choose file → **`database/carelink_mysql_local.sql`** → Go
   - Paste-ready ito: kasama na ang `CREATE DATABASE pupbc_carelink_v3`, lahat ng 16 tables, at demo data
4. Tapos! Skip to **Step 3**.

> Kung ayaw gumana ang import: sa SQL tab patakbuhin muna ang `CREATE DATABASE pupbc_carelink_v3;` tapos i-import ulit.

### Option B — Laragon (local MySQL)

1. Start Laragon → **Start All** (MySQL auto-runs sa port 3306, user `root`, walang password)
2. Import ang dump — alinman sa:
   - Laragon Menu → **MySQL** → HeidiSQL → connect (`127.0.0.1`, `root`, blank password) → **File → Run SQL file** → `database/carelink_mysql_local.sql`
   - O phpMyAdmin: http://localhost/phpmyadmin → **Import** → `database/carelink_mysql_local.sql`
3. Tapos! Skip to **Step 3**.

### Option C — Supabase (remote/shared production DB)

Ito ang DB na ginagamit ng live Render deployment. Para gumawa ng sariling Supabase setup:

1. Create project sa https://supabase.com (free)
2. **Project Settings → Database → Connection pooling** — kunin ang: Host, Port (6543), Username (`postgres.<project-ref>`), Password
3. **Shortcut:** `copy backend\.env.example backend\.env` — kumpleto na ang format! I-edit lang ang `DB_PASSWORD` (ang password ng Supabase project mo)
4. Create the schema (PostgreSQL ito — **huwag mag-import ng MySQL dump dito!**):
   ```bash
   cd backend
   php artisan migrate --seed
   ```
<!-- PART1-END -->

---

## ⚙️ Step 3 — Backend Setup (Laravel API)

```bash
cd backend
composer install
copy .env.example .env      # Windows  (Mac/Linux: cp .env.example .env)
```

### 🔑 Para sa LOCAL MySQL (WAMP/Laragon) — PASTE this into `backend/.env`

> ⚠️ **Mahalaga:** ang `.env.example` ay naka-set na para sa **Render/Supabase production** (para gumana ang deployment nang walang extra setup). Kaya para sa local development, **palitan ang DB block** ng nasa ibaba (at i-adjust ang APP_* lines):

```env
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=pupbc_carelink_v3
DB_USERNAME=root
DB_PASSWORD=
```

Tapos:

```bash
php artisan key:generate
php artisan migrate --seed     # creates all tables + demo accounts
php artisan serve              # → http://localhost:8000
```

> 💡 Idempotent ang `--seed` (updateOrCreate) — kahit ilang beses patakbuhin, okay lang. Kung nag-import ka na ng SQL dump (Option A/B), pwede mo pa ring patakbuhin ito para masiguro na updated ang demo accounts.

> 🗄️ Gumagamit ka ba ng Supabase (Option C)? Keep `.env` as-is (production config na ito) — **wag** i-paste ang MySQL block. Diretso na sa `php artisan migrate --seed`.
<!-- PART2-END -->

---

## 🎨 Step 4 — Frontend Setup (React 19 + Vite)

```bash
cd frontend
npm install
npm run dev                   # → http://localhost:3000
```

> 💡 **Walang kailangang i-setup na `VITE_API_URL` sa local dev** — awtomatikong malulutas ng `src/services/api.js` ang backend sa `http://localhost:8000/api`. (Ang production build ay gumagamit ng `frontend/.env.production` na nakatutok sa live Render backend.)

---

## 📱 Step 5 — Portals & Test Accounts

| Portal | URL | Login |
|--------|-----|-------|
| Landing page | http://localhost:3000/ | — |
| **Student** | http://localhost:3000/login | student ID + birthday + password |
| **Nurse/Admin** *(hidden by design)* | http://localhost:3000/carelink-portal | email + password |
| **Kiosk check-in** *(public, for clinic tablet)* | http://localhost:3000/kiosk | — |

### 🔑 Demo Accounts (ginagawa ng `php artisan db:seed`)

| Role | Credentials |
|------|-------------|
| **Student** | Student ID: `2021-00001-BN-0` · Birthday: `2002-05-15` · Password: `student` |
| **Nurse** | Email: `nurse@pupbc.edu.ph` · Password: `nurse` |

### 📝 Account Registration (`/register`)

- Kailangan ng **PUP webmail** (`@iskolarngbayan.pup.edu.ph`) + OTP verification (6-digit, 5-min validity, ipinapadala sa **alternate email**)
- ⚠️ Hanggang walang `MAIL_PASSWORD` (Gmail App Password ng `pupbccarelink@gmail.com`), hindi ma-dedeliver ang OTP email — pero **naka-log ang OTP**: tingnan sa `backend/storage/logs/laravel.log` (hanapin ang `OTP for`) o sa Render → backend → **Logs** (hanapin ang `OTP for`)
- Ang mga bagong account ay naka-save sa database na may **hashed password** + awtomatikong nabubuo ang QR code — at maaari nang ulit-uliting gamitin sa pag-log in

---

## 🚀 Render Deployment (live na — walang kailangang i-setup)

- Kapag may `git push` sa `main` branch, awtomatikong magre-redeploy ang backend + frontend sa Render (gumagamit ng `render.yaml` + mga Dockerfile)
- Ang production config ay naka-bake sa `backend/.env.example` (Supabase pooler DB + live URLs) at `frontend/.env.production` — kaya gumagana ito kahit walang env vars sa dashboard
- Health check: https://pup-carelink-testing-backend.onrender.com/api/health (`"database": "connected"` = OK)
<!-- PART3-END -->

---

## 🆘 Common Issues

| Problem | Fix |
|---------|-----|
| `php` not recognized | Gamitin ang PHP ng WAMP: `C:\wamp64\bin\php\php8.x.x\php.exe` (Laragon: Menu → Tools → Path → Add Laragon to PATH) |
| `could not find driver` | I-enable ang `pdo_mysql` (local) o `pdo_pgsql` (Supabase) sa `php.ini` |
| MySQL connection refused / `SQLSTATE[HY000] [2002]` | Hindi pa start ang WAMP/Laragon o mali ang DB port |
| Port 8000 already in use | `php artisan serve --port=8001` |
| Port 3000 already in use | `npm run dev -- --port 3001` |
| Composer errors (missing ext) | I-enable sa `php.ini`: `curl`, `gd`, `mbstring`, `zip`, `openssl` tapos restart ang WAMP/Laragon |
| Blank page sa frontend | Check ng browser console (F12) — siguradong tumatakbo ang backend (`php artisan serve`) |
| CORS error sa local | Siguradong `FRONTEND_URL=http://localhost:3000` ang `.env` ng backend |
| Login "Cannot connect to server" | Tumatakbo ba ang backend? Test: http://localhost:8000/api/health |

---

## 📁 Project Structure

```
PUP-carelink-testing/
├── backend/                        # Laravel 8 API (PHP 8.1)
│   ├── app/
│   │   ├── Http/Controllers/Api/   # Auth, Student, Nurse, Kiosk controllers
│   │   ├── Models/                 # User, Appointment, HealthProfile, ...
│   │   └── Services/               # AuthService (register/login/OTP logic)
│   ├── config/cors.php             # Allowed origins (frontend URLs)
│   ├── database/
│   │   ├── migrations/             # Complete schema (lahat ng tables)
│   │   └── seeders/                # CareLinkSeeder (demo accounts, idempotent)
│   ├── routes/api.php              # All API endpoints
│   ├── Dockerfile                  # Render deployment (PHP 8.1)
│   └── .env.example                # ⭐ Production config (baked) — local dev: paste local block mula Step 3
├── frontend/                       # React 19 + Vite
│   ├── src/pages/
│   │   ├── Student/                # Login, Register, Dashboard, Appointments, QR, ...
│   │   ├── Admin/                  # Nurse portal (login, dashboard, students, ...)
│   │   └── Kiosk/                  # Self-service check-in
│   ├── src/services/api.js         # Axios (auto-resolve backend URL)
│   ├── src/App.jsx                 # Routing (lahat ng portals)
│   ├── Dockerfile                  # Render deployment (Node 20)
│   └── .env.production             # Production VITE_API_URL
├── database/
│   ├── carelink_mysql_local.sql    # ⭐ Paste-ready full DB dump (schema + demo data)
│   ├── backup.bat                  # Windows backup script
│   └── backup.sh                   # Linux/Mac backup script
├── docs/                           # Documentation
├── render.yaml                     # Render Blueprint (backend + frontend services)
└── SETUP.md                        # 📖 This guide
```

---

## 🗄️ Database Stack Reference

| Environment | Database | Engine | Notes |
|-------------|----------|--------|-------|
| **Local (WAMP)** | `pupbc_carelink_v3` @ 127.0.0.1:3306 | MySQL 9.1 | root, walang password — import `database/carelink_mysql_local.sql` |
| **Local (Laragon)** | `pupbc_carelink_v3` @ 127.0.0.1:3306 | MySQL 8.4 | root, walang password — same dump, same import |
| **Production (Render)** | `postgres` @ Supabase pooler (port 6543) | PostgreSQL | config baked sa `backend/.env.example`; schema via `php artisan migrate` |

> 💡 Parehong Laravel migrations ang gumagawa ng schema sa MySQL at PostgreSQL — kaya **walang pagkakaiba sa tables** between local at production. Ang `database/carelink_mysql_local.sql` ay para lang sa mabilisang local import (may demo data na kasama).
<!-- SETUP-END -->



