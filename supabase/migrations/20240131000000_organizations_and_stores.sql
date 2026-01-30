-- Organizations and Stores - Complete Multi-Tenant Structure
-- Migration: 20240131000000_organizations_and_stores.sql
--
-- This migration enhances existing organizations and stores tables
-- to support the onboarding flow and multi-tenant architecture

-- =============================================================================
-- ALTER ORGANIZATIONS TABLE
-- =============================================================================
-- Add missing columns to existing organizations table

DO $$
BEGIN
    -- Add owner_id column (link to auth.users)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'organizations' AND column_name = 'owner_id'
    ) THEN
        ALTER TABLE organizations
        ADD COLUMN owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    -- Add updated_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'organizations' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE organizations
        ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Add unique constraint on owner_id (one org per user)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'organizations_owner_id_unique'
    ) THEN
        ALTER TABLE organizations
        ADD CONSTRAINT organizations_owner_id_unique UNIQUE (owner_id);
    END IF;
END $$;

-- Create indexes for organizations
CREATE INDEX IF NOT EXISTS idx_organizations_owner ON organizations(owner_id);
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_created ON organizations(created_at DESC);

-- =============================================================================
-- ALTER STORES TABLE
-- =============================================================================
-- Add missing columns to existing stores table

DO $$
BEGIN
    -- Add slug column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'stores' AND column_name = 'slug'
    ) THEN
        ALTER TABLE stores
        ADD COLUMN slug TEXT;
    END IF;

    -- Add store_type column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'stores' AND column_name = 'store_type'
    ) THEN
        ALTER TABLE stores
        ADD COLUMN store_type TEXT CHECK (store_type IN ('clothing', 'car_care'));
    END IF;

    -- Add theme_id column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'stores' AND column_name = 'theme_id'
    ) THEN
        ALTER TABLE stores
        ADD COLUMN theme_id TEXT;
    END IF;

    -- Add default_locale column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'stores' AND column_name = 'default_locale'
    ) THEN
        ALTER TABLE stores
        ADD COLUMN default_locale TEXT DEFAULT 'en';
    END IF;

    -- Add updated_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'stores' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE stores
        ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    -- Add published_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'stores' AND column_name = 'published_at'
    ) THEN
        ALTER TABLE stores
        ADD COLUMN published_at TIMESTAMPTZ;
    END IF;
END $$;

-- Update status column constraint if needed (make sure draft is included)
DO $$
BEGIN
    -- Drop old constraint if it exists and doesn't include draft
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'stores_status_check'
    ) THEN
        ALTER TABLE stores DROP CONSTRAINT stores_status_check;
    END IF;

    -- Add new constraint with all status values
    ALTER TABLE stores
    ADD CONSTRAINT stores_status_check
    CHECK (status IN ('draft', 'active', 'suspended', 'archived'));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Ensure status has default value
ALTER TABLE stores ALTER COLUMN status SET DEFAULT 'draft';

-- Add unique constraint on organization_id (one store per org for now)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'stores_organization_id_unique'
    ) THEN
        ALTER TABLE stores
        ADD CONSTRAINT stores_organization_id_unique UNIQUE (organization_id);
    END IF;
END $$;

-- Create indexes for stores
CREATE INDEX IF NOT EXISTS idx_stores_organization ON stores(organization_id);
CREATE INDEX IF NOT EXISTS idx_stores_slug ON stores(slug);
CREATE INDEX IF NOT EXISTS idx_stores_status ON stores(status);
CREATE INDEX IF NOT EXISTS idx_stores_store_type ON stores(store_type);
CREATE INDEX IF NOT EXISTS idx_stores_created ON stores(created_at DESC);

-- =============================================================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- Enable RLS if not already enabled
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view own organization" ON organizations;
DROP POLICY IF EXISTS "Users can insert own organization" ON organizations;
DROP POLICY IF EXISTS "Users can update own organization" ON organizations;
DROP POLICY IF EXISTS "Users can view own stores" ON stores;
DROP POLICY IF EXISTS "Users can insert own stores" ON stores;
DROP POLICY IF EXISTS "Users can update own stores" ON stores;

-- Organizations: Users can only see/manage their own organization
CREATE POLICY "Users can view own organization" ON organizations
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own organization" ON organizations
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own organization" ON organizations
  FOR UPDATE USING (auth.uid() = owner_id);

-- Stores: Users can only see/manage stores in their organization
CREATE POLICY "Users can view own stores" ON stores
  FOR SELECT USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own stores" ON stores
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own stores" ON stores
  FOR UPDATE USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

-- =============================================================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
DROP TRIGGER IF EXISTS update_stores_updated_at ON stores;

-- Create triggers (reuse existing function if it exists)
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stores_updated_at
  BEFORE UPDATE ON stores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- FUNCTION: CREATE ORGANIZATION AND STORE FROM INTENT
-- =============================================================================
-- This function is the SINGLE SOURCE OF TRUTH for tenant creation.
-- It must be:
-- 1. Idempotent (safe to call multiple times)
-- 2. Atomic (all or nothing)
-- 3. RLS-aware (only creates for authenticated user)

CREATE OR REPLACE FUNCTION create_organization_from_intent()
RETURNS TABLE (
  organization_id UUID,
  store_id UUID,
  already_existed BOOLEAN
) AS $$
DECLARE
  v_user_id UUID;
  v_store_type TEXT;
  v_org_id UUID;
  v_store_id UUID;
  v_org_slug TEXT;
  v_store_slug TEXT;
  v_default_locale TEXT;
  v_already_existed BOOLEAN := FALSE;
BEGIN
  -- Get authenticated user
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if organization already exists (idempotency check)
  SELECT id INTO v_org_id
  FROM organizations
  WHERE owner_id = v_user_id;

  IF v_org_id IS NOT NULL THEN
    -- Organization exists, get the store
    SELECT id INTO v_store_id
    FROM stores
    WHERE organization_id = v_org_id;

    v_already_existed := TRUE;

    RETURN QUERY SELECT v_org_id, v_store_id, v_already_existed;
    RETURN;
  END IF;

  -- Fetch onboarding intent
  SELECT store_type INTO v_store_type
  FROM onboarding_intent
  WHERE user_id = v_user_id;

  IF v_store_type IS NULL THEN
    RAISE EXCEPTION 'No onboarding intent found for user';
  END IF;

  -- Generate unique slug for organization
  -- Format: org-{first-8-chars-of-uuid}
  v_org_slug := 'org-' || SUBSTRING(v_user_id::TEXT FROM 1 FOR 8);

  -- Ensure slug uniqueness (append random suffix if needed)
  WHILE EXISTS (SELECT 1 FROM organizations WHERE slug = v_org_slug) LOOP
    v_org_slug := 'org-' || SUBSTRING(v_user_id::TEXT FROM 1 FOR 8) || '-' || SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 4);
  END LOOP;

  -- Generate unique slug for store
  v_store_slug := 'store-' || SUBSTRING(v_user_id::TEXT FROM 1 FOR 8);

  -- Ensure store slug uniqueness
  WHILE EXISTS (SELECT 1 FROM stores WHERE slug = v_store_slug) LOOP
    v_store_slug := 'store-' || SUBSTRING(v_user_id::TEXT FROM 1 FOR 8) || '-' || SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 4);
  END LOOP;

  -- Determine default locale (you can enhance this with user preference detection)
  v_default_locale := 'en'; -- Default to English

  -- Create organization
  INSERT INTO organizations (owner_id, slug, name, type)
  VALUES (v_user_id, v_org_slug, NULL, NULL)
  RETURNING id INTO v_org_id;

  -- Create store
  INSERT INTO stores (
    organization_id,
    slug,
    name,
    store_type,
    status,
    theme_id,
    default_locale
  )
  VALUES (
    v_org_id,
    v_store_slug,
    NULL,
    v_store_type,
    'draft',
    NULL,
    v_default_locale
  )
  RETURNING id INTO v_store_id;

  -- Mark intent as consumed by deleting it
  DELETE FROM onboarding_intent WHERE user_id = v_user_id;

  -- Return the created IDs
  RETURN QUERY SELECT v_org_id, v_store_id, v_already_existed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION create_organization_from_intent() TO authenticated;

-- =============================================================================
-- HELPER FUNCTION: GET USER'S ORGANIZATION
-- =============================================================================

CREATE OR REPLACE FUNCTION get_user_organization()
RETURNS TABLE (
  organization_id UUID,
  organization_slug TEXT,
  store_id UUID,
  store_slug TEXT,
  store_type TEXT,
  store_status TEXT
) AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    o.id,
    o.slug,
    s.id,
    s.slug,
    s.store_type,
    s.status
  FROM organizations o
  LEFT JOIN stores s ON s.organization_id = o.id
  WHERE o.owner_id = v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_user_organization() TO authenticated;

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE organizations IS 'Multi-tenant organization structure - one per user (owner)';
COMMENT ON TABLE stores IS 'Store instances - each organization has one store (initially)';
COMMENT ON COLUMN organizations.owner_id IS 'Link to auth.users - one organization per user';
COMMENT ON COLUMN stores.store_type IS 'Type of store: clothing or car_care (from onboarding intent)';
COMMENT ON COLUMN stores.theme_id IS 'Theme identifier - null until Task 5 (theme assignment)';
COMMENT ON COLUMN stores.status IS 'Store status: draft (initial), active, suspended, archived';
COMMENT ON FUNCTION create_organization_from_intent() IS 'Idempotent function to create organization and store from onboarding_intent';
COMMENT ON FUNCTION get_user_organization() IS 'Helper to retrieve user''s organization and store in one call';
