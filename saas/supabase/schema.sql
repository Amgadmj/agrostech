-- ==============================================================================
-- AGROSTECH SAAS - POSTGRESQL & POSTGIS DATABASE SCHEMA + RLS POLICIES
-- Multi-tenant B2B / B2C Geospatial Land Intelligence & Digital Twin Platform
-- ==============================================================================

-- 1. Enable PostGIS and Cryptographic Extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Organizations Table (For B2B Enterprise / Financial Institution clients)
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('bank', 'agribusiness', 'investment_fund', 'cooperative', 'trader')),
    cnpj TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Users / Profiles Table (Extends Supabase auth.users)
-- Roles:
-- 'b2c': Individual rural landowner (access strictly scoped to owned lands)
-- 'b2b_admin': Enterprise manager / Credit desk officer (full access to org's portfolio)
-- 'b2b_viewer': Enterprise analyst / Auditor (read-only access to org's portfolio)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL CHECK (role IN ('b2c', 'b2b_admin', 'b2b_viewer')) DEFAULT 'b2c',
    org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Land Parcels Table (Core Asset Management with PostGIS & Compliance JSONBs)
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
    geom geometry(Polygon, 4326),
    geojson_boundary JSONB NOT NULL,
    
    -- Real-time Metrics & Calculations
    metrics_json JSONB NOT NULL DEFAULT '{
        "total_area_ha": 0,
        "app_area_ha": 0,
        "legal_reserve_area_ha": 0,
        "consolidated_area_ha": 0,
        "slope_avg_percent": 0
    }'::jsonb,
    
    -- Compliance & Spatial Enrichment Layers (Data Fusion Engine)
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
        "soil_type": "Latossolo Vermelho",
        "indigenous_overlap": false,
        "conservation_unit_overlap": false
    }'::jsonb,
    
    -- 3D Digital Twin Model Settings
    model_3d_url TEXT,
    model_type TEXT CHECK (model_type IN ('glb', '3dtiles')) DEFAULT 'glb',
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. IBAMA Embargos Table (Cached Public Spatial Dataset for zero-latency local PostGIS queries)
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
-- SPATIAL & INDEX OPTIMIZATIONS
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_land_parcels_geom ON public.land_parcels USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_ibama_embargos_geom ON public.ibama_embargos USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_land_parcels_owner_id ON public.land_parcels(owner_id);
CREATE INDEX IF NOT EXISTS idx_land_parcels_org_id ON public.land_parcels(org_id);
CREATE INDEX IF NOT EXISTS idx_land_parcels_car_code ON public.land_parcels(car_code);
CREATE INDEX IF NOT EXISTS idx_users_org_id ON public.users(org_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Enforce Strict B2B vs. B2C Data Isolation
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.land_parcels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ibama_embargos ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- POLICIES: organizations
-- ------------------------------------------------------------------------------
-- B2B users can view their own organization
CREATE POLICY "Users can view their own organization"
ON public.organizations
FOR SELECT
TO authenticated
USING (
    id IN (SELECT org_id FROM public.users WHERE id = auth.uid())
);

-- ------------------------------------------------------------------------------
-- POLICIES: users (profiles)
-- ------------------------------------------------------------------------------
-- Users can view their own profile, or members in the same organization
CREATE POLICY "Users can view own profile or org colleagues"
ON public.users
FOR SELECT
TO authenticated
USING (
    id = auth.uid()
    OR (
        org_id IS NOT NULL 
        AND org_id = (SELECT u.org_id FROM public.users u WHERE u.id = auth.uid())
    )
);

CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
TO authenticated
USING (id = auth.uid());

-- ------------------------------------------------------------------------------
-- POLICIES: land_parcels (CRITICAL REQUIREMENT)
-- A B2C user can ONLY see their own parcels (auth.uid() = owner_id)
-- A B2B user can see all parcels belonging to their organization portfolio
-- ------------------------------------------------------------------------------
CREATE POLICY "land_parcels_select_policy"
ON public.land_parcels
FOR SELECT
TO authenticated
USING (
    -- B2C Individual Land Owner
    (auth.uid() = owner_id)
    OR
    -- B2B Organization Member
    (
        org_id IS NOT NULL
        AND org_id = (SELECT u.org_id FROM public.users u WHERE u.id = auth.uid())
    )
);

CREATE POLICY "land_parcels_insert_policy"
ON public.land_parcels
FOR INSERT
TO authenticated
WITH CHECK (
    -- B2C owner saving their own land
    (auth.uid() = owner_id)
    OR
    -- B2B admin adding land to organization portfolio
    (
        org_id IS NOT NULL
        AND org_id = (SELECT u.org_id FROM public.users u WHERE u.id = auth.uid())
        AND (SELECT u.role FROM public.users u WHERE u.id = auth.uid()) = 'b2b_admin'
    )
);

CREATE POLICY "land_parcels_update_policy"
ON public.land_parcels
FOR UPDATE
TO authenticated
USING (
    (auth.uid() = owner_id)
    OR
    (
        org_id IS NOT NULL
        AND org_id = (SELECT u.org_id FROM public.users u WHERE u.id = auth.uid())
        AND (SELECT u.role FROM public.users u WHERE u.id = auth.uid()) = 'b2b_admin'
    )
);

CREATE POLICY "land_parcels_delete_policy"
ON public.land_parcels
FOR DELETE
TO authenticated
USING (
    (auth.uid() = owner_id)
    OR
    (
        org_id IS NOT NULL
        AND org_id = (SELECT u.org_id FROM public.users u WHERE u.id = auth.uid())
        AND (SELECT u.role FROM public.users u WHERE u.id = auth.uid()) = 'b2b_admin'
    )
);

-- ------------------------------------------------------------------------------
-- POLICIES: ibama_embargos
-- ------------------------------------------------------------------------------
-- Public read-only for compliance cross-checking
CREATE POLICY "Anyone authenticated can query ibama_embargos"
ON public.ibama_embargos
FOR SELECT
TO authenticated
USING (true);

-- ==============================================================================
-- POSTGIS STORED FUNCTIONS (RPC) FOR ZERO-LATENCY SPATIAL INTERSECTION
-- ==============================================================================

-- Function to cross-check an incoming polygon with cached IBAMA embargos
CREATE OR REPLACE FUNCTION public.check_ibama_intersection(parcel_geometry geometry)
RETURNS TABLE (
    is_embargoed BOOLEAN,
    embargo_count INTEGER,
    records JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    found_count INTEGER;
    embargo_json JSONB;
BEGIN
    SELECT 
        COUNT(*),
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'process_num', process_num,
                    'infraction_term', infraction_term,
                    'embargo_date', embargo_date,
                    'municipality', municipality,
                    'state_uf', state_uf,
                    'intersection_area_ha', ROUND((ST_Area(ST_Intersection(geom, parcel_geometry)::geography) / 10000.0)::numeric, 2)
                )
            ),
            '[]'::jsonb
        )
    INTO found_count, embargo_json
    FROM public.ibama_embargos
    WHERE ST_Intersects(geom, parcel_geometry);

    RETURN QUERY
    SELECT 
        (found_count > 0) AS is_embargoed,
        found_count AS embargo_count,
        embargo_json AS records;
END;
$$;
