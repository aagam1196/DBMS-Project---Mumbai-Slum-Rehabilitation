"""
SRA Dashboard — FastAPI Backend
Slum Rehabilitation Authority Monitoring System
"""

from fastapi import FastAPI, HTTPException, Depends, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from pydantic import BaseModel, Field
from typing import Optional, List
import databases
import sqlalchemy
from sqlalchemy import text
import os, secrets
from datetime import date, datetime

# ─────────────────────────────────────────────
# DATABASE
# ─────────────────────────────────────────────
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/sra_db")
database = databases.Database(DATABASE_URL)
metadata = sqlalchemy.MetaData()
engine = sqlalchemy.create_engine(DATABASE_URL)

# ─────────────────────────────────────────────
# APP
# ─────────────────────────────────────────────
app = FastAPI(
    title="SRA Monitoring System API",
    description="Slum Rehabilitation Authority — Mumbai | DBMS Course Project",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────
# BASIC AUTH
# ─────────────────────────────────────────────
security = HTTPBasic()
USERS = {
    "admin": "sra2024",
    "viewer": "readonly",
}

def get_current_user(credentials: HTTPBasicCredentials = Depends(security)):
    correct_password = USERS.get(credentials.username)
    if not correct_password or not secrets.compare_digest(credentials.password, correct_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username

# ─────────────────────────────────────────────
# PYDANTIC MODELS
# ─────────────────────────────────────────────

class BeneficiaryCreate(BaseModel):
    family_id: int
    aadhar_number: str = Field(..., min_length=12, max_length=12, pattern=r'^\d{12}$')
    name: str
    dob: date
    gender: str = Field(..., pattern=r'^(male|female|other)$')
    contact: Optional[str] = None
    slum_id: int
    is_head_of_family: bool = False
    eligibility_status: str = "under_review"

class BeneficiaryUpdate(BaseModel):
    name: Optional[str] = None
    contact: Optional[str] = None
    eligibility_status: Optional[str] = None
    is_head_of_family: Optional[bool] = None

class ViolationUpdate(BaseModel):
    status: str = Field(..., pattern=r'^(open|under_investigation|resolved|dismissed)$')
    description: Optional[str] = None

class AllotmentCreate(BaseModel):
    flat_id: int
    family_id: int
    beneficiary_id: int
    allotment_date: date

# ─────────────────────────────────────────────
# LIFECYCLE
# ─────────────────────────────────────────────

@app.on_event("startup")
async def startup():
    await database.connect()

@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()

# ─────────────────────────────────────────────
# ── DASHBOARD KPI ENDPOINT (UI Query 1) ──────
# ─────────────────────────────────────────────

@app.get("/api/dashboard/kpis", tags=["Dashboard"])
async def get_dashboard_kpis(user=Depends(get_current_user)):
    """Returns all KPI stats for the overview dashboard."""
    q = """
        SELECT
          (SELECT COUNT(*) FROM Beneficiary)                                         AS total_beneficiaries,
          (SELECT COUNT(*) FROM Allotment WHERE allotment_status = 'active')         AS active_allotments,
          (SELECT COUNT(*) FROM Violation_Log WHERE status IN ('open','under_investigation')) AS open_violations,
          (SELECT COUNT(*) FROM Flat WHERE flat_status = 'vacant')                   AS vacant_flats,
          (SELECT COUNT(*) FROM Building WHERE status = 'occupied')                  AS occupied_buildings,
          (SELECT COUNT(*) FROM Slum_Survey WHERE status = 'rehabilitated')          AS rehabilitated_slums,
          (SELECT COUNT(*) FROM Rental_Agreement WHERE is_authorized = FALSE)        AS unauthorized_rentals,
          (SELECT COUNT(*) FROM Beneficiary WHERE eligibility_status = 'under_review') AS pending_review
    """
    row = await database.fetch_one(text(q))
    return dict(row._mapping)


# ─────────────────────────────────────────────
# ── CHARTS ENDPOINT (UI Query 2) ─────────────
# ─────────────────────────────────────────────

@app.get("/api/dashboard/charts", tags=["Dashboard"])
async def get_chart_data(user=Depends(get_current_user)):
    """Returns aggregated data for all dashboard charts."""

    # 1. Violations by type
    viol_q = """
        SELECT violation_type, COUNT(*) AS count
        FROM Violation_Log GROUP BY violation_type ORDER BY count DESC
    """
    violations = await database.fetch_all(text(viol_q))

    # 2. Slum status breakdown
    slum_q = """
        SELECT status, COUNT(*) AS count FROM Slum_Survey GROUP BY status
    """
    slum_status = await database.fetch_all(text(slum_q))

    # 3. Allotments over years (trend)
    allot_trend_q = """
        SELECT EXTRACT(YEAR FROM allotment_date)::int AS year, COUNT(*) AS count
        FROM Allotment GROUP BY year ORDER BY year
    """
    allotment_trend = await database.fetch_all(text(allot_trend_q))

    # 4. Flat status distribution
    flat_q = """
        SELECT flat_status, COUNT(*) AS count FROM Flat GROUP BY flat_status
    """
    flat_status = await database.fetch_all(text(flat_q))

    # 5. Violations over months (last 24 months)
    viol_trend_q = """
        SELECT TO_CHAR(detected_date, 'YYYY-MM') AS month, COUNT(*) AS count
        FROM Violation_Log
        WHERE detected_date >= CURRENT_DATE - INTERVAL '24 months'
        GROUP BY month ORDER BY month
    """
    violation_trend = await database.fetch_all(text(viol_trend_q))

    # 6. Top 10 buildings by flat count
    bldg_q = """
        SELECT b.project_name, COUNT(f.flat_id) AS flat_count, b.status
        FROM Building b JOIN Flat f ON b.building_id = f.building_id
        GROUP BY b.building_id, b.project_name, b.status
        ORDER BY flat_count DESC LIMIT 10
    """
    buildings = await database.fetch_all(text(bldg_q))

    # 7. Eligibility breakdown
    elig_q = """
        SELECT eligibility_status, COUNT(*) AS count
        FROM Beneficiary GROUP BY eligibility_status
    """
    eligibility = await database.fetch_all(text(elig_q))

    # 8. Ward-wise allotment counts
    ward_q = """
        SELECT b.ward_number, COUNT(a.allotment_id) AS allotments
        FROM Allotment a
        JOIN Flat f ON a.flat_id = f.flat_id
        JOIN Building b ON f.building_id = b.building_id
        WHERE a.allotment_status = 'active'
        GROUP BY b.ward_number ORDER BY allotments DESC LIMIT 15
    """
    ward_allotments = await database.fetch_all(text(ward_q))

    return {
        "violations_by_type": [dict(r._mapping) for r in violations],
        "slum_status": [dict(r._mapping) for r in slum_status],
        "allotment_trend": [dict(r._mapping) for r in allotment_trend],
        "flat_status": [dict(r._mapping) for r in flat_status],
        "violation_trend": [dict(r._mapping) for r in violation_trend],
        "buildings": [dict(r._mapping) for r in buildings],
        "eligibility": [dict(r._mapping) for r in eligibility],
        "ward_allotments": [dict(r._mapping) for r in ward_allotments],
    }


# ─────────────────────────────────────────────
# ── SEARCH ENDPOINT (UI Query 3) ─────────────
# ─────────────────────────────────────────────

@app.get("/api/search/beneficiary", tags=["Dashboard"])
async def search_beneficiary(
    q: str = Query(..., min_length=2, description="Name or Aadhar number"),
    user=Depends(get_current_user)
):
    """Live search for beneficiaries by name or Aadhar."""
    query = text("""
        SELECT b.beneficiary_id, b.name, b.aadhar_number, b.family_id,
               b.gender, b.eligibility_status, b.contact, b.is_head_of_family,
               s.slum_name,
               a.allotment_id, a.allotment_status, a.allotment_date, a.lock_in_end_date,
               f.flat_number, bl.project_name
        FROM Beneficiary b
        JOIN Slum_Survey s ON b.slum_id = s.slum_id
        LEFT JOIN Allotment a ON b.beneficiary_id = a.beneficiary_id AND a.allotment_status = 'active'
        LEFT JOIN Flat f ON a.flat_id = f.flat_id
        LEFT JOIN Building bl ON f.building_id = bl.building_id
        WHERE b.name ILIKE :q OR b.aadhar_number LIKE :aadhar
        LIMIT 20
    """)
    rows = await database.fetch_all(query, {"q": f"%{q}%", "aadhar": f"%{q}%"})
    return [dict(r._mapping) for r in rows]


# ─────────────────────────────────────────────
# ── VIOLATIONS FILTER (UI Query 4) ───────────
# ─────────────────────────────────────────────

@app.get("/api/violations", tags=["Dashboard"])
async def get_violations(
    status_filter: Optional[str] = Query(None),
    type_filter: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    user=Depends(get_current_user)
):
    """Paginated violations with optional filters."""
    conditions = []
    params = {"limit": limit, "offset": offset}
    if status_filter:
        conditions.append("vl.status = :status_filter")
        params["status_filter"] = status_filter
    if type_filter:
        conditions.append("vl.violation_type = :type_filter")
        params["type_filter"] = type_filter

    where = ("WHERE " + " AND ".join(conditions)) if conditions else ""
    q = text(f"""
        SELECT vl.violation_id, vl.violation_type, vl.detected_date,
               vl.status, vl.description, vl.reported_by,
               b.name AS beneficiary_name, b.aadhar_number,
               f.flat_number, bl.project_name
        FROM Violation_Log vl
        JOIN Beneficiary b ON vl.beneficiary_id = b.beneficiary_id
        JOIN Flat f ON vl.flat_id = f.flat_id
        JOIN Building bl ON f.building_id = bl.building_id
        {where}
        ORDER BY vl.detected_date DESC
        LIMIT :limit OFFSET :offset
    """)
    rows = await database.fetch_all(q, params)
    return [dict(r._mapping) for r in rows]


# ─────────────────────────────────────────────
# ── CRUD: BENEFICIARIES ───────────────────────
# ─────────────────────────────────────────────

@app.get("/api/beneficiaries", tags=["Beneficiaries"])
async def list_beneficiaries(
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    eligibility: Optional[str] = Query(None),
    user=Depends(get_current_user)
):
    cond = "WHERE b.eligibility_status = :elig" if eligibility else ""
    params = {"limit": limit, "offset": offset}
    if eligibility:
        params["elig"] = eligibility
    q = text(f"""
        SELECT b.*, s.slum_name FROM Beneficiary b
        JOIN Slum_Survey s ON b.slum_id = s.slum_id
        {cond}
        ORDER BY b.beneficiary_id DESC
        LIMIT :limit OFFSET :offset
    """)
    rows = await database.fetch_all(q, params)
    return [dict(r._mapping) for r in rows]


@app.get("/api/beneficiaries/{beneficiary_id}", tags=["Beneficiaries"])
async def get_beneficiary(beneficiary_id: int, user=Depends(get_current_user)):
    q = text("""
        SELECT b.*, s.slum_name FROM Beneficiary b
        JOIN Slum_Survey s ON b.slum_id = s.slum_id
        WHERE b.beneficiary_id = :id
    """)
    row = await database.fetch_one(q, {"id": beneficiary_id})
    if not row:
        raise HTTPException(404, "Beneficiary not found")
    return dict(row._mapping)


@app.post("/api/beneficiaries", tags=["Beneficiaries"], status_code=201)
async def create_beneficiary(data: BeneficiaryCreate, user=Depends(get_current_user)):
    q = text("""
        INSERT INTO Beneficiary (family_id, aadhar_number, name, dob, gender,
            contact, slum_id, is_head_of_family, eligibility_status)
        VALUES (:family_id, :aadhar_number, :name, :dob, :gender,
            :contact, :slum_id, :is_head_of_family, :eligibility_status)
        RETURNING beneficiary_id
    """)
    try:
        row = await database.fetch_one(q, data.dict())
        return {"beneficiary_id": row["beneficiary_id"], "message": "Created successfully"}
    except Exception as e:
        raise HTTPException(400, str(e))


@app.patch("/api/beneficiaries/{beneficiary_id}", tags=["Beneficiaries"])
async def update_beneficiary(beneficiary_id: int, data: BeneficiaryUpdate, user=Depends(get_current_user)):
    updates = {k: v for k, v in data.dict().items() if v is not None}
    if not updates:
        raise HTTPException(400, "No fields to update")
    set_clause = ", ".join(f"{k} = :{k}" for k in updates)
    updates["id"] = beneficiary_id
    q = text(f"UPDATE Beneficiary SET {set_clause} WHERE beneficiary_id = :id RETURNING beneficiary_id")
    row = await database.fetch_one(q, updates)
    if not row:
        raise HTTPException(404, "Not found")
    return {"message": "Updated"}


@app.delete("/api/beneficiaries/{beneficiary_id}", tags=["Beneficiaries"])
async def delete_beneficiary(beneficiary_id: int, user=Depends(get_current_user)):
    q = text("DELETE FROM Beneficiary WHERE beneficiary_id = :id RETURNING beneficiary_id")
    row = await database.fetch_one(q, {"id": beneficiary_id})
    if not row:
        raise HTTPException(404, "Not found")
    return {"message": "Deleted"}


# ─────────────────────────────────────────────
# ── CRUD: VIOLATIONS ──────────────────────────
# ─────────────────────────────────────────────

@app.patch("/api/violations/{violation_id}", tags=["Violations"])
async def update_violation(violation_id: int, data: ViolationUpdate, user=Depends(get_current_user)):
    q = text("""
        UPDATE Violation_Log SET status = :status, description = COALESCE(:desc, description)
        WHERE violation_id = :id RETURNING violation_id
    """)
    row = await database.fetch_one(q, {"status": data.status, "desc": data.description, "id": violation_id})
    if not row:
        raise HTTPException(404, "Not found")
    return {"message": "Updated"}


# ─────────────────────────────────────────────
# ── CRUD: ALLOTMENTS ─────────────────────────
# ─────────────────────────────────────────────

@app.get("/api/allotments", tags=["Allotments"])
async def list_allotments(
    status_filter: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    user=Depends(get_current_user)
):
    cond = "WHERE a.allotment_status = :s" if status_filter else ""
    params = {"limit": limit, "offset": offset}
    if status_filter:
        params["s"] = status_filter
    q = text(f"""
        SELECT a.*, b.name AS beneficiary_name, f.flat_number, bl.project_name
        FROM Allotment a
        JOIN Beneficiary b ON a.beneficiary_id = b.beneficiary_id
        JOIN Flat f ON a.flat_id = f.flat_id
        JOIN Building bl ON f.building_id = bl.building_id
        {cond}
        ORDER BY a.allotment_date DESC
        LIMIT :limit OFFSET :offset
    """)
    rows = await database.fetch_all(q, params)
    return [dict(r._mapping) for r in rows]


@app.post("/api/allotments", tags=["Allotments"], status_code=201)
async def create_allotment(data: AllotmentCreate, user=Depends(get_current_user)):
    q = text("""
        INSERT INTO Allotment (flat_id, family_id, beneficiary_id, allotment_date, lock_in_end_date)
        VALUES (:flat_id, :family_id, :beneficiary_id, :allotment_date,
                :allotment_date + INTERVAL '10 years')
        RETURNING allotment_id
    """)
    try:
        row = await database.fetch_one(q, data.dict())
        return {"allotment_id": row["allotment_id"], "message": "Allotment created"}
    except Exception as e:
        raise HTTPException(400, str(e))


# ─────────────────────────────────────────────
# ── SLUMS & BUILDINGS ─────────────────────────
# ─────────────────────────────────────────────

@app.get("/api/slums", tags=["Slums"])
async def list_slums(user=Depends(get_current_user)):
    rows = await database.fetch_all(text("SELECT * FROM Slum_Survey ORDER BY slum_id"))
    return [dict(r._mapping) for r in rows]


@app.get("/api/buildings", tags=["Buildings"])
async def list_buildings(user=Depends(get_current_user)):
    q = text("""
        SELECT b.*, s.slum_name,
               COUNT(f.flat_id) AS total_flats_actual,
               COUNT(f.flat_id) FILTER (WHERE f.flat_status = 'vacant') AS vacant_count
        FROM Building b
        JOIN Slum_Survey s ON b.slum_id = s.slum_id
        LEFT JOIN Flat f ON b.building_id = f.building_id
        GROUP BY b.building_id, s.slum_name
        ORDER BY b.building_id
    """)
    rows = await database.fetch_all(q)
    return [dict(r._mapping) for r in rows]


@app.get("/api/rentals", tags=["Rentals"])
async def list_rentals(user=Depends(get_current_user)):
    rows = await database.fetch_all(text("SELECT * FROM v_approved_rentals LIMIT 100"))
    return [dict(r._mapping) for r in rows]


@app.get("/health", tags=["System"])
async def health():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}
