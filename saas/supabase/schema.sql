-- ==============================================================================
-- AGROSTECH SAAS - POSTGRESQL & POSTGIS DATABASE SCHEMA + RLS POLICIES
-- Multi-tenant B2B / B2C Geospatial Land Intelligence & Digital Twin Platform
-- Updated under CR-001 (C06 & C07 compliance: Departmental workflows, non-recursive RLS)
-- ==============================================================================

-- 1. Enable PostGIS and Cryptographic Extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Organizations Table (For B2B Enterprise / Cooperative clients e.g. Coplacana)
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('bank', 'agribusiness', 'investment_fund', 'cooperative', 'trader')),
    cnpj TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Users / Profiles Table (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL CHECK (role IN ('b2c', 'b2b_admin', 'b2b_viewer')) DEFAULT 'b2c',
    department TEXT CHECK (department IN ('precision_agriculture', 'credit_risk')),
    org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Land Parcels Table (Core Asset Management with PostGIS & Canonical GeoJSON)
CREATE TABLE IF NOT EXISTS public.land_parcels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    
    -- Official Registry & Cadastral Codes
    car_code TEXT UNIQUE,
    matricula_code TEXT,
    municipality TEXT,
    state_uf VARCHAR(2),
    
    -- Spatial Boundaries
    geom geometry(Geometry, 4326),
    geojson_boundary JSONB NOT NULL,
    
    -- Real-time Metrics & Calculations
    metrics_json JSONB NOT NULL DEFAULT '{
        "total_area_ha": 0,
        "app_area_ha": 0,
        "legal_reserve_area_ha": 0,
        "consolidated_area_ha": 0,
        "slope_avg_percent": 0
    }'::jsonb,
    
    -- Compliance & Spatial Enrichment Layers
    compliance_sicar JSONB DEFAULT '{
        "status": "active",
        "has_app": true,
        "legal_reserve_deficit_ha": 0,
        "car_overlap_detected": false
    }'::jsonb,
    
    compliance_sigef JSONB DEFAULT '{
        "certified": false,
        "code": null,
        "tenure_status": "unverified"
    }'::jsonb,
    
    compliance_ibama JSONB DEFAULT '{
        "is_embargoed": false,
        "embargos_count": 0,
        "records": []
    }'::jsonb,
    
    environmental_context JSONB DEFAULT '{
        "biome": "Cerrado",
        "watershed": null,
        "soil_type": null,
        "indigenous_overlap": false,
        "conservation_unit_overlap": false
    }'::jsonb,
    
    -- 3D Digital Twin Settings (Optional Module M2)
    model_3d_url TEXT,
    model_type TEXT CHECK (model_type IN ('glb', '3dtiles')) DEFAULT 'glb',
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Financed Operations Table (C03 & C06: Operation-level scope under CMN 5.267)
CREATE TABLE IF NOT EXISTS public.financed_operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parcel_id UUID NOT NULL REFERENCES public.land_parcels(id) ON DELETE CASCADE,
    org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    purpose TEXT NOT NULL CHECK (purpose IN ('custeio', 'investimento', 'comercializacao')),
    contract_date DATE NOT NULL,
    crop TEXT NOT NULL DEFAULT 'Cana-de-Açúcar', -- Coplacana pilot focus
    season TEXT NOT NULL DEFAULT '2026/2027',
    financed_area_ha NUMERIC(10, 2) NOT NULL,
    geom geometry(Polygon, 4326),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Departmental Cases Table (C06: Precision Agriculture & Credit Desk workflows)
CREATE TABLE IF NOT EXISTS public.departmental_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parcel_id UUID NOT NULL REFERENCES public.land_parcels(id) ON DELETE CASCADE,
    org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    operation_id UUID REFERENCES public.financed_operations(id) ON DELETE SET NULL,
    department TEXT NOT NULL CHECK (department IN ('precision_agriculture', 'credit_risk')),
    state TEXT NOT NULL CHECK (state IN ('open', 'under_review', 'awaiting_evidence', 'closed')) DEFAULT 'open',
    finding_disposition TEXT CHECK (finding_disposition IN ('confirmed', 'unconfirmed', 'inconclusive', 'no_action')),
    reviewer_id UUID REFERENCES auth.users(id),
    evidence_request TEXT,
    decision TEXT,
    action_taken TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Findings Table (C06: Individual observations linked to cases)
CREATE TABLE IF NOT EXISTS public.findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES public.departmental_cases(id) ON DELETE CASCADE,
    parcel_id UUID NOT NULL REFERENCES public.land_parcels(id) ON DELETE CASCADE,
    layer_source TEXT NOT NULL, -- e.g. "SAR_M3", "SICAR", "IBAMA"
    finding_type TEXT NOT NULL,
    disposition TEXT NOT NULL CHECK (disposition IN ('confirmed', 'unconfirmed', 'inconclusive', 'no_action')) DEFAULT 'unconfirmed',
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Versioned Audit Reports Table (C08: Truthful, reproducible reports)
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parcel_id UUID NOT NULL REFERENCES public.land_parcels(id) ON DELETE CASCADE,
    report_version TEXT NOT NULL DEFAULT '1.0.0',
    report_type TEXT NOT NULL DEFAULT 'analytical_report',
    signature_status TEXT NOT NULL DEFAULT 'unsigned',
    sha256_checksum TEXT NOT NULL,
    canonical_payload JSONB NOT NULL,
    pdf_storage_path TEXT,
    creator_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Durable SAR Processing Jobs (C09: Persisted background jobs)
CREATE TABLE IF NOT EXISTS public.sar_processing_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id TEXT UNIQUE NOT NULL,
    idempotency_key TEXT UNIQUE,
    customer_org_id UUID REFERENCES public.organizations(id),
    operation_id UUID REFERENCES public.financed_operations(id),
    state TEXT NOT NULL CHECK (state IN ('queued', 'running', 'succeeded', 'failed', 'cancelled')) DEFAULT 'queued',
    attempts INTEGER NOT NULL DEFAULT 0,
    params JSONB NOT NULL,
    result JSONB,
    failure_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Immutable Audit Events (C06 & C07)
CREATE TABLE IF NOT EXISTS public.audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES public.organizations(id),
    user_id UUID REFERENCES auth.users(id),
    event_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. IBAMA Embargos Table (Cached Public Spatial Dataset)
CREATE TABLE IF NOT EXISTS public.ibama_embargos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    process_num TEXT,
    infraction_term TEXT,
    cpf_cnpj TEXT,
    offender_name TEXT,
    embargo_date DATE,
    municipality TEXT,
    state_uf VARCHAR(2),
    geom geometry(MultiPolygon, 4326),
    description TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- SECURITY DEFINER HELPERS TO PREVENT RLS RECURSION (C07)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.get_auth_user_org_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT org_id FROM public.users WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_auth_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM public.users WHERE id = auth.uid();
$$;

-- ==============================================================================
-- SPATIAL & INDEX OPTIMIZATIONS
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_land_parcels_geom ON public.land_parcels USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_ibama_embargos_geom ON public.ibama_embargos USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_land_parcels_owner_id ON public.land_parcels(owner_id);
CREATE INDEX IF NOT EXISTS idx_land_parcels_org_id ON public.land_parcels(org_id);
CREATE INDEX IF NOT EXISTS idx_land_parcels_car_code ON public.land_parcels(car_code);
CREATE INDEX IF NOT EXISTS idx_users_org_id ON public.users(org_id);
CREATE INDEX IF NOT EXISTS idx_financed_ops_parcel ON public.financed_operations(parcel_id);
CREATE INDEX IF NOT EXISTS idx_cases_parcel ON public.departmental_cases(parcel_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES (NON-RECURSIVE)
-- ==============================================================================
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.land_parcels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financed_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departmental_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sar_processing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ibama_embargos ENABLE ROW LEVEL SECURITY;

-- organizations
CREATE POLICY "Users can view their own organization"
ON public.organizations
FOR SELECT
TO authenticated
USING (id = public.get_auth_user_org_id());

-- users (Non-recursive check via security definer function)
CREATE POLICY "Users can view own profile or org colleagues"
ON public.users
FOR SELECT
TO authenticated
USING (
    id = auth.uid()
    OR (
        org_id IS NOT NULL 
        AND org_id = public.get_auth_user_org_id()
    )
);

CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
TO authenticated
USING (id = auth.uid());

-- land_parcels
CREATE POLICY "land_parcels_select_policy"
ON public.land_parcels
FOR SELECT
TO authenticated
USING (
    (auth.uid() = owner_id)
    OR (
        org_id IS NOT NULL
        AND org_id = public.get_auth_user_org_id()
    )
);

CREATE POLICY "land_parcels_insert_policy"
ON public.land_parcels
FOR INSERT
TO authenticated
WITH CHECK (
    (auth.uid() = owner_id)
    OR (
        org_id IS NOT NULL
        AND org_id = public.get_auth_user_org_id()
        AND public.get_auth_user_role() = 'b2b_admin'
    )
);

-- departmental_cases
CREATE POLICY "departmental_cases_select_policy"
ON public.departmental_cases
FOR SELECT
TO authenticated
USING (
    org_id IS NOT NULL
    AND org_id = public.get_auth_user_org_id()
);

-- reports
CREATE POLICY "reports_select_policy"
ON public.reports
FOR SELECT
TO authenticated
USING (
    creator_id = auth.uid()
    OR parcel_id IN (
        SELECT id FROM public.land_parcels 
        WHERE org_id = public.get_auth_user_org_id() OR owner_id = auth.uid()
    )
);

-- ibama_embargos (Read-only reference)
CREATE POLICY "Anyone authenticated can query ibama_embargos"
ON public.ibama_embargos
FOR SELECT
TO authenticated
USING (true);
