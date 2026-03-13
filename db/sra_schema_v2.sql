-- ============================================================
-- Smart Slum Rehabilitation Monitoring & Ownership Control System
-- Mumbai / SRA (Slum Rehabilitation Authority)
-- Version: Final v2 (Bug fixes applied)
-- Fixes:
--   1. lock_in_end_date: replaced GENERATED ALWAYS AS with trigger
--   2. Removed redundant chk_beneficiary_not_null constraint
--   3. Guard against NULL prev_owner_id in lock-in breach trigger
--   4. approved_by made nullable to allow pending approval records
-- ============================================================

-- Drop tables in reverse dependency order (for clean re-runs)
DROP TABLE IF EXISTS Violation_Log     CASCADE;
DROP TABLE IF EXISTS Rental_Approval   CASCADE;
DROP TABLE IF EXISTS Rental_Agreement  CASCADE;
DROP TABLE IF EXISTS Ownership_History CASCADE;
DROP TABLE IF EXISTS Allotment         CASCADE;
DROP TABLE IF EXISTS Flat              CASCADE;
DROP TABLE IF EXISTS Building          CASCADE;
DROP TABLE IF EXISTS Beneficiary       CASCADE;
DROP TABLE IF EXISTS Slum_Survey       CASCADE;

-- Drop functions if they exist (for clean re-runs)
DROP FUNCTION IF EXISTS set_lock_in_date()      CASCADE;
DROP FUNCTION IF EXISTS flag_lock_in_breach()   CASCADE;
DROP FUNCTION IF EXISTS flag_unauthorized_rental() CASCADE;

-- ============================================================
-- 1. SLUM_SURVEY
--    Represents the origin slum from which beneficiaries come.
-- ============================================================
CREATE TABLE Slum_Survey (
    slum_id         SERIAL PRIMARY KEY,
    slum_name       VARCHAR(100) NOT NULL,
    location        VARCHAR(200) NOT NULL,
    ward_number     VARCHAR(20)  NOT NULL,
    survey_date     DATE         NOT NULL,
    total_families  INTEGER      NOT NULL CHECK (total_families > 0),
    status          VARCHAR(30)  NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active', 'rehabilitated', 'partially_rehabilitated')),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 2. BENEFICIARY
--    One row per person. Family members share the same family_id.
--    Only one head per family. Aadhar must be unique.
-- ============================================================
CREATE TABLE Beneficiary (
    beneficiary_id      SERIAL PRIMARY KEY,
    family_id           INTEGER      NOT NULL,
    aadhar_number       CHAR(12)     NOT NULL UNIQUE,
    name                VARCHAR(100) NOT NULL,
    dob                 DATE         NOT NULL,
    gender              VARCHAR(10)  NOT NULL CHECK (gender IN ('male', 'female', 'other')),
    contact             VARCHAR(15),
    slum_id             INTEGER      NOT NULL REFERENCES Slum_Survey(slum_id) ON DELETE RESTRICT,
    is_head_of_family   BOOLEAN      NOT NULL DEFAULT FALSE,
    eligibility_status  VARCHAR(20)  NOT NULL DEFAULT 'under_review'
                            CHECK (eligibility_status IN ('eligible', 'ineligible', 'under_review')),
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Aadhar must be exactly 12 digits
    CONSTRAINT chk_aadhar_digits CHECK (aadhar_number ~ '^[0-9]{12}$')
);

-- Only ONE head of family allowed per family_id
CREATE UNIQUE INDEX idx_one_head_per_family
    ON Beneficiary (family_id)
    WHERE is_head_of_family = TRUE;

-- ============================================================
-- 3. BUILDING
--    A rehabilitation project building, linked to the slum it
--    was built to rehabilitate.
-- ============================================================
CREATE TABLE Building (
    building_id         SERIAL PRIMARY KEY,
    slum_id             INTEGER      NOT NULL REFERENCES Slum_Survey(slum_id) ON DELETE RESTRICT,
    project_name        VARCHAR(150) NOT NULL,
    builder_name        VARCHAR(100) NOT NULL,
    location            VARCHAR(200) NOT NULL,
    ward_number         VARCHAR(20)  NOT NULL,
    total_floors        INTEGER      NOT NULL CHECK (total_floors > 0),
    total_flats         INTEGER      NOT NULL CHECK (total_flats > 0),
    construction_year   INTEGER      CHECK (construction_year >= 1900 AND construction_year <= 2100),
    status              VARCHAR(25)  NOT NULL DEFAULT 'under_construction'
                            CHECK (status IN ('under_construction', 'ready', 'occupied')),
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 4. FLAT
--    Individual flat units inside a building.
--    Family assignment happens through Allotment, not here.
-- ============================================================
CREATE TABLE Flat (
    flat_id         SERIAL PRIMARY KEY,
    building_id     INTEGER      NOT NULL REFERENCES Building(building_id) ON DELETE RESTRICT,
    flat_number     VARCHAR(20)  NOT NULL,
    floor_number    INTEGER      NOT NULL CHECK (floor_number >= 0),
    area_sqft       NUMERIC(8,2) CHECK (area_sqft > 0),
    flat_status     VARCHAR(20)  NOT NULL DEFAULT 'vacant'
                        CHECK (flat_status IN ('vacant', 'allotted', 'disputed', 'locked')),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- No duplicate flat numbers within the same building
    CONSTRAINT uq_flat_in_building UNIQUE (building_id, flat_number)
);

-- ============================================================
-- 5. ALLOTMENT
--    Links a family to a flat. Core enforcement table.
--    One active allotment per family. One active allotment per flat.
--    lock_in_end_date is set automatically by trigger (FIX 1).
-- ============================================================
CREATE TABLE Allotment (
    allotment_id        SERIAL PRIMARY KEY,
    flat_id             INTEGER     NOT NULL REFERENCES Flat(flat_id) ON DELETE RESTRICT,
    family_id           INTEGER     NOT NULL,
    beneficiary_id      INTEGER     NOT NULL REFERENCES Beneficiary(beneficiary_id) ON DELETE RESTRICT,
    allotment_date      DATE        NOT NULL DEFAULT CURRENT_DATE,
    lock_in_end_date    DATE        NOT NULL,   -- set by trg_set_lock_in_date trigger
    allotment_status    VARCHAR(20) NOT NULL DEFAULT 'active'
                            CHECK (allotment_status IN ('active', 'cancelled', 'expired', 'disputed')),
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    -- FIX 2: Removed redundant chk_beneficiary_not_null — NOT NULL above is sufficient
);

-- One ACTIVE allotment per family (prevents duplicate flat claims)
CREATE UNIQUE INDEX idx_one_active_allotment_per_family
    ON Allotment (family_id)
    WHERE allotment_status = 'active';

-- One ACTIVE allotment per flat (prevents double allotment)
CREATE UNIQUE INDEX idx_one_active_allotment_per_flat
    ON Allotment (flat_id)
    WHERE allotment_status = 'active';

-- ============================================================
-- 6. OWNERSHIP_HISTORY
--    Records every transfer of a flat. Auto-flags lock-in breaches.
-- ============================================================
CREATE TABLE Ownership_History (
    ownership_id        SERIAL PRIMARY KEY,
    flat_id             INTEGER     NOT NULL REFERENCES Flat(flat_id) ON DELETE RESTRICT,
    allotment_id        INTEGER     NOT NULL REFERENCES Allotment(allotment_id) ON DELETE RESTRICT,
    prev_owner_id       INTEGER     REFERENCES Beneficiary(beneficiary_id) ON DELETE SET NULL,
    new_owner_id        INTEGER     NOT NULL REFERENCES Beneficiary(beneficiary_id) ON DELETE RESTRICT,
    transfer_date       DATE        NOT NULL DEFAULT CURRENT_DATE,
    transfer_type       VARCHAR(25) NOT NULL
                            CHECK (transfer_type IN (
                                'legal_transfer', 'illegal_sale',
                                'inheritance', 'surrender'
                            )),
    approved_by         VARCHAR(100),
    is_within_lock_in   BOOLEAN     NOT NULL DEFAULT FALSE,
    remarks             TEXT,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 7. RENTAL_AGREEMENT
--    Tracks subletting. Unauthorized rentals during lock-in
--    are a policy violation.
-- ============================================================
CREATE TABLE Rental_Agreement (
    rental_id       SERIAL PRIMARY KEY,
    flat_id         INTEGER       NOT NULL REFERENCES Flat(flat_id) ON DELETE RESTRICT,
    allotment_id    INTEGER       NOT NULL REFERENCES Allotment(allotment_id) ON DELETE RESTRICT,
    tenant_name     VARCHAR(100)  NOT NULL,
    tenant_aadhar   CHAR(12)      NOT NULL CHECK (tenant_aadhar ~ '^[0-9]{12}$'),
    monthly_rent    NUMERIC(10,2) CHECK (monthly_rent >= 0),
    start_date      DATE          NOT NULL,
    end_date        DATE,
    is_authorized   BOOLEAN       NOT NULL DEFAULT FALSE,

    CONSTRAINT chk_rental_dates CHECK (end_date IS NULL OR end_date > start_date)
);

-- ============================================================
-- 8. RENTAL_APPROVAL
--    Tracks formal SRA approval requests for subletting.
--    Includes reason for rental and beneficiary's new address.
--    FIX 4: approved_by is now nullable to allow pending records.
-- ============================================================
CREATE TABLE Rental_Approval (
    approval_id             SERIAL PRIMARY KEY,
    rental_id               INTEGER      NOT NULL UNIQUE
                                REFERENCES Rental_Agreement(rental_id) ON DELETE CASCADE,
    approved_by             VARCHAR(100),            -- FIX 4: nullable — not known at pending stage
    approval_date           DATE,
    document_reference      VARCHAR(100),            -- SRA letter / order number
    reason                  TEXT         NOT NULL,   -- why beneficiary is renting out
    beneficiary_new_address TEXT         NOT NULL,   -- where beneficiary has moved to
    new_address_verified    BOOLEAN      NOT NULL DEFAULT FALSE,
    status                  VARCHAR(20)  NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason        TEXT,
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- If approved, approval_date AND approved_by must both be set
    CONSTRAINT chk_approval_date CHECK (
        status != 'approved' OR (approval_date IS NOT NULL AND approved_by IS NOT NULL)
    ),
    -- If rejected, rejection_reason must be provided
    CONSTRAINT chk_rejection_reason CHECK (
        status != 'rejected' OR rejection_reason IS NOT NULL
    )
);

-- ============================================================
-- 9. VIOLATION_LOG
--    Auto-populated when illegal transfers, duplicate claims,
--    or lock-in breaches are detected.
-- ============================================================
CREATE TABLE Violation_Log (
    violation_id    SERIAL PRIMARY KEY,
    allotment_id    INTEGER     REFERENCES Allotment(allotment_id) ON DELETE SET NULL,
    flat_id         INTEGER     NOT NULL REFERENCES Flat(flat_id) ON DELETE RESTRICT,
    beneficiary_id  INTEGER     NOT NULL REFERENCES Beneficiary(beneficiary_id) ON DELETE RESTRICT,
    violation_type  VARCHAR(30) NOT NULL
                        CHECK (violation_type IN (
                            'illegal_sale', 'duplicate_claim',
                            'lock_in_breach', 'unauthorized_rental', 'abandonment'
                        )),
    detected_date   DATE        NOT NULL DEFAULT CURRENT_DATE,
    description     TEXT,
    status          VARCHAR(25) NOT NULL DEFAULT 'open'
                        CHECK (status IN ('open', 'under_investigation', 'resolved', 'dismissed')),
    reported_by     VARCHAR(100),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TRIGGER FUNCTION: Auto-set lock_in_end_date on Allotment insert
-- FIX 1: Replaces the unsupported GENERATED ALWAYS AS INTERVAL column
-- ============================================================
CREATE OR REPLACE FUNCTION set_lock_in_date()
RETURNS TRIGGER AS $$
BEGIN
    NEW.lock_in_end_date := NEW.allotment_date + INTERVAL '10 years';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_lock_in_date
    BEFORE INSERT ON Allotment
    FOR EACH ROW
    EXECUTE FUNCTION set_lock_in_date();

-- ============================================================
-- TRIGGER FUNCTION: Auto-flag lock-in breach on ownership transfer
-- FIX 3: Guard against NULL prev_owner_id before inserting violation
-- ============================================================
CREATE OR REPLACE FUNCTION flag_lock_in_breach()
RETURNS TRIGGER AS $$
DECLARE
    v_lock_in_end DATE;
BEGIN
    SELECT lock_in_end_date INTO v_lock_in_end
    FROM Allotment
    WHERE allotment_id = NEW.allotment_id;

    -- FIX 3: Only log violation if prev_owner_id is not NULL
    --        (first-time allotments have no previous owner)
    IF NEW.prev_owner_id IS NOT NULL AND NEW.transfer_date < v_lock_in_end THEN
        NEW.is_within_lock_in := TRUE;

        INSERT INTO Violation_Log (
            allotment_id, flat_id, beneficiary_id,
            violation_type, detected_date, description, reported_by
        ) VALUES (
            NEW.allotment_id,
            NEW.flat_id,
            NEW.prev_owner_id,
            'lock_in_breach',
            NEW.transfer_date,
            'Ownership transfer attempted within 10-year SRA lock-in period.',
            'system_trigger'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_lock_in_check
    BEFORE INSERT ON Ownership_History
    FOR EACH ROW
    EXECUTE FUNCTION flag_lock_in_breach();

-- ============================================================
-- TRIGGER FUNCTION: Auto-flag unauthorized rental during lock-in
-- ============================================================
CREATE OR REPLACE FUNCTION flag_unauthorized_rental()
RETURNS TRIGGER AS $$
DECLARE
    v_lock_in_end DATE;
    v_beneficiary INTEGER;
BEGIN
    SELECT lock_in_end_date, beneficiary_id INTO v_lock_in_end, v_beneficiary
    FROM Allotment
    WHERE allotment_id = NEW.allotment_id;

    IF NOT NEW.is_authorized AND NEW.start_date < v_lock_in_end THEN
        INSERT INTO Violation_Log (
            allotment_id, flat_id, beneficiary_id,
            violation_type, detected_date, description, reported_by
        ) VALUES (
            NEW.allotment_id,
            NEW.flat_id,
            v_beneficiary,
            'unauthorized_rental',
            NEW.start_date,
            'Unauthorized subletting detected during lock-in period.',
            'system_trigger'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_rental_check
    BEFORE INSERT ON Rental_Agreement
    FOR EACH ROW
    EXECUTE FUNCTION flag_unauthorized_rental();

-- ============================================================
-- VIEWS
-- ============================================================

-- Active allotments with beneficiary and flat details
CREATE OR REPLACE VIEW v_active_allotments AS
SELECT
    a.allotment_id,
    b.name              AS beneficiary_name,
    b.aadhar_number,
    b.family_id,
    f.flat_number,
    f.floor_number,
    bl.project_name,
    bl.location         AS building_location,
    a.allotment_date,
    a.lock_in_end_date,
    CASE
        WHEN CURRENT_DATE < a.lock_in_end_date THEN 'In Lock-In'
        ELSE 'Lock-In Expired'
    END                 AS lock_in_status
FROM Allotment a
JOIN Beneficiary b  ON a.beneficiary_id = b.beneficiary_id
JOIN Flat f         ON a.flat_id = f.flat_id
JOIN Building bl    ON f.building_id = bl.building_id
WHERE a.allotment_status = 'active';

-- Families flagged for duplicate claims
CREATE OR REPLACE VIEW v_duplicate_claims AS
SELECT
    family_id,
    COUNT(*) AS active_allotment_count
FROM Allotment
WHERE allotment_status = 'active'
GROUP BY family_id
HAVING COUNT(*) > 1;

-- All open violations with beneficiary info
CREATE OR REPLACE VIEW v_open_violations AS
SELECT
    vl.violation_id,
    vl.violation_type,
    vl.detected_date,
    vl.status,
    b.name          AS beneficiary_name,
    b.aadhar_number,
    f.flat_number,
    bl.project_name
FROM Violation_Log vl
JOIN Beneficiary b  ON vl.beneficiary_id = b.beneficiary_id
JOIN Flat f         ON vl.flat_id = f.flat_id
JOIN Building bl    ON f.building_id = bl.building_id
WHERE vl.status IN ('open', 'under_investigation');

-- Approved rentals with beneficiary new address and verification status
CREATE OR REPLACE VIEW v_approved_rentals AS
SELECT
    ra.rental_id,
    f.flat_number,
    bl.project_name,
    b.name              AS beneficiary_name,
    b.aadhar_number,
    ra2.tenant_name,
    ra2.monthly_rent,
    ra2.start_date,
    ra2.end_date,
    ra.reason           AS rental_reason,
    ra.beneficiary_new_address,
    ra.new_address_verified,
    ra.approved_by,
    ra.approval_date,
    ra.document_reference
FROM Rental_Approval ra
JOIN Rental_Agreement ra2   ON ra.rental_id = ra2.rental_id
JOIN Allotment a            ON ra2.allotment_id = a.allotment_id
JOIN Beneficiary b          ON a.beneficiary_id = b.beneficiary_id
JOIN Flat f                 ON ra2.flat_id = f.flat_id
JOIN Building bl            ON f.building_id = bl.building_id
WHERE ra.status = 'approved';
