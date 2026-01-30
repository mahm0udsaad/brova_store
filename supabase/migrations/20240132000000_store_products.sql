-- Store Products: Add columns for AI onboarding approval flow
-- Migration: 20240132000000_store_products.sql
-- Applied via Supabase MCP: apply_migration name="store_products_add_onboarding_columns"
--
-- The store_products table already existed with: id, store_id, legacy_product_id, name, price, inventory, status, created_at
-- This migration adds columns required for onboarding draft persistence.

-- =============================================================================
-- ADD SLUG AND BACKFILL
-- =============================================================================

ALTER TABLE store_products ADD COLUMN IF NOT EXISTS slug TEXT;

UPDATE store_products SET slug = 'p-' || SUBSTRING(id::TEXT FROM 1 FOR 8) WHERE slug IS NULL;

ALTER TABLE store_products ALTER COLUMN slug SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'store_products_store_slug_unique'
  ) THEN
    ALTER TABLE store_products ADD CONSTRAINT store_products_store_slug_unique UNIQUE (store_id, slug);
  END IF;
END $$;

-- =============================================================================
-- ADD ONBOARDING COLUMNS
-- =============================================================================

ALTER TABLE store_products ADD COLUMN IF NOT EXISTS name_ar TEXT;
ALTER TABLE store_products ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE store_products ADD COLUMN IF NOT EXISTS description_ar TEXT;
ALTER TABLE store_products ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'EGP';
ALTER TABLE store_products ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE store_products ADD COLUMN IF NOT EXISTS category_ar TEXT;
ALTER TABLE store_products ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE store_products ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE store_products ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';
ALTER TABLE store_products ADD COLUMN IF NOT EXISTS sku TEXT;
ALTER TABLE store_products ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT FALSE;
ALTER TABLE store_products ADD COLUMN IF NOT EXISTS ai_confidence TEXT CHECK (ai_confidence IS NULL OR ai_confidence IN ('high', 'medium', 'low'));
ALTER TABLE store_products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE store_products ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
ALTER TABLE store_products ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0;

UPDATE store_products SET stock_quantity = COALESCE(inventory, 0) WHERE inventory IS NOT NULL AND (stock_quantity IS NULL OR stock_quantity = 0);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_store_products_slug ON store_products(slug);
CREATE INDEX IF NOT EXISTS idx_store_products_category ON store_products(category) WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_store_products_updated ON store_products(updated_at DESC) WHERE updated_at IS NOT NULL;

-- =============================================================================
-- TRIGGER FOR updated_at
-- =============================================================================

DROP TRIGGER IF EXISTS update_store_products_updated_at ON store_products;

CREATE TRIGGER update_store_products_updated_at
  BEFORE UPDATE ON store_products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- HELPER: Generate unique product slug per store
-- =============================================================================

CREATE OR REPLACE FUNCTION generate_product_slug(p_store_id UUID, p_name TEXT)
RETURNS TEXT AS $$
DECLARE
  v_slug TEXT;
  v_counter INTEGER := 1;
  v_base_slug TEXT;
BEGIN
  v_base_slug := lower(regexp_replace(p_name, '[^a-zA-Z0-9\s-]', '', 'g'));
  v_base_slug := regexp_replace(v_base_slug, '\s+', '-', 'g');
  v_base_slug := regexp_replace(v_base_slug, '-+', '-', 'g');
  v_base_slug := trim(both '-' from v_base_slug);

  IF v_base_slug = '' THEN
    v_base_slug := 'product';
  END IF;

  v_slug := v_base_slug;

  WHILE EXISTS (
    SELECT 1 FROM store_products
    WHERE store_id = p_store_id AND slug = v_slug
  ) LOOP
    v_slug := v_base_slug || '-' || v_counter;
    v_counter := v_counter + 1;
  END LOOP;

  RETURN v_slug;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION generate_product_slug(UUID, TEXT) TO authenticated;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON COLUMN store_products.slug IS 'URL-safe unique identifier per store';
COMMENT ON COLUMN store_products.ai_generated IS 'True if created during AI Concierge onboarding';
COMMENT ON COLUMN store_products.ai_confidence IS 'AI confidence when ai_generated=true';
COMMENT ON FUNCTION generate_product_slug(UUID, TEXT) IS 'Unique slug for product within a store';
