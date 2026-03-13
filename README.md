# 🏢 SRA Monitor — Mumbai Slum Rehabilitation Authority Dashboard

> **DBMS Course Project** · A full-stack data-driven application for monitoring Mumbai's Slum Rehabilitation Authority system.

[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)](https://www.docker.com/)

---

## 📸 Overview

A production-grade monitoring dashboard for the SRA (Slum Rehabilitation Authority) that tracks:

- **Beneficiary management** — register and manage slum dwellers eligible for rehabilitation
- **Flat allotments** — assign rehabilitation flats with enforced 10-year lock-in periods
- **Violation detection** — auto-flagged illegal sales, lock-in breaches, unauthorized rentals
- **Slum & building data** — 30 Mumbai slum zones, rehabilitation buildings across all wards
- **Live analytics** — 8 chart types showing trends, distributions, and ward-wise breakdowns

---

## 🏗️ Architecture

```
┌─────────────────┐     REST API      ┌──────────────────┐     SQL      ┌──────────────┐
│   React + Vite  │ ────────────────▶ │   FastAPI (Py)   │ ──────────▶ │  PostgreSQL  │
│   Recharts UI   │ ◀──────────────── │  Pydantic Models │ ◀────────── │   16 (OLTP)  │
│   Tailwind CSS  │   JSON responses  │  HTTP Basic Auth │  async pg   │  9 tables    │
└─────────────────┘                   └──────────────────┘             └──────────────┘
```

**Database choice justification:** PostgreSQL (OLTP) — the SRA system is transactional by nature: allotments have strict uniqueness constraints (one active allotment per family, per flat), ACID guarantees protect against double-allotment race conditions, and foreign key enforcement ensures data integrity across all 9 related tables.

---

## 🗄️ Database Schema

| Table | Purpose |
|---|---|
| `Slum_Survey` | Origin slum zones (30 Mumbai locations) |
| `Beneficiary` | Registered individuals with Aadhar |
| `Building` | SRA rehabilitation projects |
| `Flat` | Individual housing units |
| `Allotment` | Family ↔ Flat assignment (core enforcement) |
| `Ownership_History` | Transfer records, lock-in breach detection |
| `Rental_Agreement` | Subletting records |
| `Rental_Approval` | SRA approval for authorized subletting |
| `Violation_Log` | Auto-populated via DB triggers |

**Key constraints enforced at DB level:**
- One active allotment per family (partial unique index)
- One active allotment per flat (partial unique index)
- 12-digit Aadhar validation via CHECK constraint
- Lock-in date auto-set via `BEFORE INSERT` trigger (+10 years)
- Lock-in breach auto-logged via `BEFORE INSERT` trigger on `Ownership_History`

---

## 🔌 API Endpoints

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/dashboard/kpis` | All KPI counts for overview |
| `GET` | `/api/dashboard/charts` | Aggregated chart data (8 datasets) |
| `GET` | `/api/search/beneficiary?q=` | Live search by name or Aadhar |
| `GET` | `/api/violations` | Paginated violations with filters |
| `PATCH` | `/api/violations/{id}` | Update violation status |
| `GET` | `/api/beneficiaries` | List with eligibility filter |
| `GET` | `/api/beneficiaries/{id}` | Single record |
| `POST` | `/api/beneficiaries` | Create new beneficiary |
| `PATCH` | `/api/beneficiaries/{id}` | Update fields |
| `DELETE` | `/api/beneficiaries/{id}` | Delete record |
| `GET` | `/api/allotments` | List with status filter |
| `POST` | `/api/allotments` | Create new allotment |
| `GET` | `/api/slums` | All slum survey records |
| `GET` | `/api/buildings` | Buildings with occupancy stats |
| `GET` | `/api/rentals` | Approved rental agreements |
| `GET` | `/health` | API health check |

All endpoints require **HTTP Basic Auth**. Auto-documented at `/docs`.

---

## 🚀 Running Locally

### Option A: Docker (Recommended — one command)

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/sra-dashboard.git
cd sra-dashboard

# 2. Add your SQL files to db/
mkdir db
cp path/to/sra_schema_v2.sql db/
cp path/to/sra_seed_data.sql db/

# 3. Start everything
docker-compose up --build

# Dashboard → http://localhost:5173
# API Docs  → http://localhost:8000/docs
```

### Option B: Manual Setup

**Backend:**
```bash
cd backend
python -m venv venv && source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Set up PostgreSQL and run schema + seed files
psql -U postgres -c "CREATE DATABASE sra_db;"
psql -U postgres -d sra_db -f ../db/sra_schema_v2.sql
psql -U postgres -d sra_db -f ../db/sra_seed_data.sql

# Start API
uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

### Login Credentials
| Username | Password | Role |
|---|---|---|
| `admin` | `sra2024` | Full access (CRUD) |
| `viewer` | `readonly` | Read-only |

---

## ☁️ Free Deployment

### Deploy Backend → [Railway](https://railway.app) (Free tier)
1. Create account at railway.app
2. New Project → Deploy from GitHub → select `backend/` folder
3. Add **PostgreSQL** plugin → Railway auto-sets `DATABASE_URL`
4. Run SQL files via Railway's DB console
5. Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Deploy Frontend → [Vercel](https://vercel.com) (Free tier)
1. Create account at vercel.com
2. Import your GitHub repo → set **Root Directory** to `frontend`
3. Add env var: `VITE_API_URL=https://your-railway-backend.up.railway.app`
4. Deploy → get a live URL instantly

### Alternative: [Render](https://render.com) (Free tier)
- Backend: Web Service → Python → use `render.yaml` config
- Frontend: Static Site → build command `npm run build`, publish `dist/`

---

## 📊 Dashboard Refresh Strategy

The dashboard auto-refreshes every **30 seconds** using `setInterval`. Justification:
- SRA data is semi-static: allotments and violations change daily, not per-second
- 30s balances freshness vs. server load
- Violations page re-fetches on filter change for immediate feedback
- Live search uses 400ms debounce to avoid excessive API calls

---

## 📁 Project Structure

```
sra-dashboard/
├── backend/
│   ├── main.py              # FastAPI app (all endpoints)
│   ├── requirements.txt
│   ├── Dockerfile
│   └── render.yaml
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx    # Overview + 8 charts
│   │   │   ├── Violations.jsx   # Filter + update
│   │   │   ├── Beneficiaries.jsx # Search + CRUD
│   │   │   ├── Allotments.jsx   # List + create
│   │   │   ├── Slums.jsx        # Slums/buildings/rentals
│   │   │   └── Login.jsx
│   │   ├── components/
│   │   │   ├── Layout.jsx       # Sidebar + header
│   │   │   └── KPICard.jsx      # Animated stat cards
│   │   ├── api.js               # Axios API client
│   │   ├── App.jsx
│   │   └── index.css
│   ├── Dockerfile
│   └── nginx.conf
├── db/                          # Add your SQL files here
│   ├── sra_schema_v2.sql
│   └── sra_seed_data.sql
├── docker-compose.yml
└── README.md
```

---

## 🧠 Key SQL Queries Used

```sql
-- Active allotments with lock-in status
SELECT a.allotment_id, b.name, f.flat_number, bl.project_name,
  CASE WHEN CURRENT_DATE < a.lock_in_end_date THEN 'In Lock-In'
       ELSE 'Lock-In Expired' END AS lock_in_status
FROM Allotment a
JOIN Beneficiary b ON a.beneficiary_id = b.beneficiary_id
JOIN Flat f ON a.flat_id = f.flat_id
JOIN Building bl ON f.building_id = bl.building_id
WHERE a.allotment_status = 'active';

-- Violation count by type
SELECT violation_type, COUNT(*) FROM Violation_Log GROUP BY violation_type;

-- Ward-wise active allotments
SELECT b.ward_number, COUNT(*) AS allotments
FROM Allotment a JOIN Flat f ON a.flat_id = f.flat_id
JOIN Building b ON f.building_id = b.building_id
WHERE a.allotment_status = 'active'
GROUP BY b.ward_number ORDER BY allotments DESC;
```

---

## 👥 Team

Built for DBMS Course Project · Data Science Program

---

## 📄 License

MIT
