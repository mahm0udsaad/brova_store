-- Create domains table
CREATE TABLE IF NOT EXISTS domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'active')),
  is_primary BOOLEAN DEFAULT FALSE,
  dns_records JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, domain)
);

-- Enable RLS for domains
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;

-- Domains policies
-- We need to check if the policy already exists to avoid errors, or drop and recreate.
DROP POLICY IF EXISTS "Users can view own domains" ON domains;
CREATE POLICY "Users can view own domains" ON domains
  FOR SELECT USING (
    store_id IN (
      SELECT s.id FROM stores s
      JOIN organizations o ON s.organization_id = o.id
      WHERE o.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own domains" ON domains;
CREATE POLICY "Users can insert own domains" ON domains
  FOR INSERT WITH CHECK (
    store_id IN (
      SELECT s.id FROM stores s
      JOIN organizations o ON s.organization_id = o.id
      WHERE o.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own domains" ON domains;
CREATE POLICY "Users can update own domains" ON domains
  FOR UPDATE USING (
    store_id IN (
      SELECT s.id FROM stores s
      JOIN organizations o ON s.organization_id = o.id
      WHERE o.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own domains" ON domains;
CREATE POLICY "Users can delete own domains" ON domains
  FOR DELETE USING (
    store_id IN (
      SELECT s.id FROM stores s
      JOIN organizations o ON s.organization_id = o.id
      WHERE o.owner_id = auth.uid()
    )
  );

-- Update store_settings to include contact info
-- We'll use a DO block to safely add the column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'store_settings' AND column_name = 'contact_info'
    ) THEN
        ALTER TABLE store_settings
        ADD COLUMN contact_info JSONB DEFAULT '{
          "email": null,
          "phone": null,
          "address": null,
          "country": null,
          "store_name": null
        }'::jsonb;
    END IF;
END $$;
