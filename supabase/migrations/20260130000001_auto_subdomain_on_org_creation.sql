-- Migration: Auto-assign subdomain when organization is created
-- Description: Updates create_organization_from_intent() to automatically insert
--              a subdomain entry into store_domains table
-- Date: 2026-01-30

-- Drop and recreate the function with subdomain auto-assignment
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
  v_domain TEXT;
  v_environment TEXT;
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
  VALUES (v_user_id, v_org_slug, v_org_slug, 'standard')
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
    v_store_slug,
    v_store_type,
    'draft',
    NULL,
    v_default_locale
  )
  RETURNING id INTO v_store_id;

  -- =========================================================================
  -- NEW: Auto-assign subdomain
  -- =========================================================================

  -- Detect environment (check for app.environment setting)
  -- Default to localhost for development
  BEGIN
    v_environment := current_setting('app.environment', true);
  EXCEPTION
    WHEN undefined_object THEN
      v_environment := NULL;
  END;

  -- Set domain based on environment
  IF v_environment = 'production' THEN
    v_domain := v_org_slug || '.brova.app';
  ELSE
    -- Development: use localhost
    v_domain := v_org_slug || '.localhost';
  END IF;

  -- Insert subdomain into store_domains table
  -- ON CONFLICT ensures idempotency if function is called multiple times
  INSERT INTO store_domains (
    store_id,
    domain,
    status,
    is_primary
  )
  VALUES (
    v_store_id,
    v_domain,
    'active',
    true
  )
  ON CONFLICT (domain) DO NOTHING;

  -- Log the domain creation for debugging
  RAISE NOTICE 'Auto-assigned subdomain: % for store: %', v_domain, v_store_id;

  -- =========================================================================
  -- End of subdomain auto-assignment
  -- =========================================================================

  -- Mark intent as consumed by deleting it
  DELETE FROM onboarding_intent WHERE user_id = v_user_id;

  -- Return the created IDs
  RETURN QUERY SELECT v_org_id, v_store_id, v_already_existed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_organization_from_intent() TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION create_organization_from_intent() IS
'Creates organization and store from onboarding intent. Auto-assigns subdomain in format {org-slug}.localhost (dev) or {org-slug}.brova.app (prod). Idempotent - safe to call multiple times.';
