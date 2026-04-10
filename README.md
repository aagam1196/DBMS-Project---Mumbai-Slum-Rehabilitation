# SRA Monitor — Mumbai Slum Rehabilitation Authority Dashboard

A full-stack monitoring dashboard for the Slum Rehabilitation Authority (SRA) that tracks beneficiary management, flat allotments, violation detection, and rehabilitation progress across Mumbai slum zones.

Built as a DBMS course project using FastAPI, React, and PostgreSQL.

---

## Tech Stack

- **Backend:** FastAPI (Python 3.12), asyncpg, SQLAlchemy, Pydantic
- **Frontend:** React 18, Vite, Tailwind CSS, Recharts, Axios
- **Database:** PostgreSQL 16
- **Infrastructure:** Docker Compose, Nginx

---

## Architecture

```
React + Vite  -->  FastAPI (Python)  -->  PostgreSQL 16
Tailwind CSS  <--  Pydantic Models   <--  9 tables (OLTP)
              JSON / HTTP Basic Auth      async pg driver
```

PostgreSQL was chosen for its ACID guarantees, which protect against double-allotment race conditions, and for its foreign key enforcement across all 9 related tables.

---

## Database Schema

| Table | Purpose |
|---|---|
| `Slum_Survey` | Origin slum zones (30 Mumbai locations) |
| `Beneficiary` | Registered individuals with Aadhar |
| `Building` | SRA rehabilitation projects |
| `Flat` | Individual housing units |
| `Allotment` | Family to flat assignment (core enforcement) |
| `Ownership_History` | Transfer records, lock-in breach detection |
| `Rental_Agreement` | Subletting records |
| `Rental_Approval` | SRA approval for authorized subletting |
| `Violation_Log` | Auto-populated via DB triggers |

**Constraints enforced at the database level:**
- One active allotment per family (partial unique index)
- One active allotment per flat (partial unique index)
- 12-digit Aadhar validation via CHECK constraint
- Lock-in date auto-set via BEFORE INSERT trigger (+10 years)
- Lock-in breach auto-logged via BEFORE INSERT trigger on `Ownership_History`

---

## API Endpoints

All endpoints require HTTP Basic Auth. Auto-documented at `/docs`.

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

---

## Running Locally

### Option A: Docker (Recommended)

```bash
git clone https://github.com/YOUR_USERNAME/sra-dashboard.git
cd sra-dashboard
docker-compose up --build
```

- Dashboard: http://localhost:5173
- API Docs: http://localhost:8000/docs

The schema and seed data are automatically loaded from the `db/` folder on first run.

### Option B: Manual Setup

**Backend:**
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt

psql -U postgres -c "CREATE DATABASE sra_db;"
psql -U postgres -d sra_db -f ../db/sra_schema_v2.sql
psql -U postgres -d sra_db -f ../db/sra_seed_data.sql

uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### Login Credentials

| Username | Password | Role |
|---|---|---|
| `admin` | `sra2024` | Full access (CRUD) |
| `viewer` | `readonly` | Read-only |

---

## Environment Variables

Copy `.env.example` to `.env` and fill in values as needed. For local development, the defaults work out of the box.

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sra_db
VITE_API_URL=http://localhost:8000
```

---

## Deployment

### Railway (Backend)
1. Create a new project at railway.app and deploy from GitHub, selecting the `backend/` folder.
2. Add the PostgreSQL plugin — Railway sets `DATABASE_URL` automatically.
3. Run the SQL files via Railway's database console.
4. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

Alternatively, use the included `render.yaml` to deploy the backend on Render as a web service with a managed PostgreSQL database.

### Vercel (Frontend)
1. Import the repo at vercel.com and set the root directory to `frontend`.
2. Add the environment variable: `VITE_API_URL=https://your-backend-url`
3. Deploy.

---

## Dashboard Behavior

- KPIs and charts auto-refresh every 30 seconds.
- The violations page re-fetches immediately on filter change.
- Live beneficiary search uses a 400ms debounce.

---

## Project Structure

```
sra-dashboard/
├── backend/
│   ├── main.py              # FastAPI app — all endpoints and auth
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── render.yaml          # Render deployment config
│   └── railway.toml         # Railway deployment notes
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx      # Overview + 8 charts
│   │   │   ├── Violations.jsx     # Filter + update violations
│   │   │   ├── Beneficiaries.jsx  # Search + CRUD
│   │   │   ├── Allotments.jsx     # List + create allotments
│   │   │   ├── Slums.jsx          # Slums, buildings, rentals
│   │   │   └── Login.jsx          # Auth screen
│   │   ├── components/
│   │   │   ├── Layout.jsx         # Sidebar + header shell
│   │   │   └── KPICard.jsx        # Animated stat cards
│   │   ├── api.js                 # Axios client + auth helpers
│   │   ├── App.jsx                # Route definitions + auth state
│   │   └── index.css
│   ├── Dockerfile
│   ├── nginx.conf
│   └── vite.config.js
├── db/
│   ├── sra_schema_v2.sql    # Table definitions, constraints, triggers
│   └── sra_seed_data.sql    # 30 slum zones + sample data
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## License

MIT
