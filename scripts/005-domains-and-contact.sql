-- Create store_domains table
CREATE TABLE IF NOT EXISTS store_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    domain TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, verified, active
    is_primary BOOLEAN DEFAULT FALSE,
    dns_records JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(domain)
);

-- Index for store_domains
CREATE INDEX IF NOT EXISTS idx_store_domains_store_id ON store_domains(store_id);
CREATE INDEX IF NOT EXISTS idx_store_domains_domain ON store_domains(domain);

-- Enable RLS for store_domains
ALTER TABLE store_domains ENABLE ROW LEVEL SECURITY;

-- Create policies for store_domains
CREATE POLICY "Users can view own store domains" ON store_domains
    FOR SELECT USING (
        store_id IN (
            SELECT id FROM stores 
            WHERE organization_id IN (
                SELECT id FROM organizations WHERE owner_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert own store domains" ON store_domains
    FOR INSERT WITH CHECK (
        store_id IN (
            SELECT id FROM stores 
            WHERE organization_id IN (
                SELECT id FROM organizations WHERE owner_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update own store domains" ON store_domains
    FOR UPDATE USING (
        store_id IN (
            SELECT id FROM stores 
            WHERE organization_id IN (
                SELECT id FROM organizations WHERE owner_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can delete own store domains" ON store_domains
    FOR DELETE USING (
        store_id IN (
            SELECT id FROM stores 
            WHERE organization_id IN (
                SELECT id FROM organizations WHERE owner_id = auth.uid()
            )
        )
    );


-- Create store_contact table
CREATE TABLE IF NOT EXISTS store_contact (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    store_name TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    country TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(store_id)
);

-- Index for store_contact
CREATE INDEX IF NOT EXISTS idx_store_contact_store_id ON store_contact(store_id);

-- Enable RLS for store_contact
ALTER TABLE store_contact ENABLE ROW LEVEL SECURITY;

-- Create policies for store_contact
CREATE POLICY "Users can view own store contact" ON store_contact
    FOR SELECT USING (
        store_id IN (
            SELECT id FROM stores 
            WHERE organization_id IN (
                SELECT id FROM organizations WHERE owner_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert own store contact" ON store_contact
    FOR INSERT WITH CHECK (
        store_id IN (
            SELECT id FROM stores 
            WHERE organization_id IN (
                SELECT id FROM organizations WHERE owner_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update own store contact" ON store_contact
    FOR UPDATE USING (
        store_id IN (
            SELECT id FROM stores 
            WHERE organization_id IN (
                SELECT id FROM organizations WHERE owner_id = auth.uid()
            )
        )
    );

-- Migrate data from store_settings to store_contact
-- Assuming store_settings has store_id and contact_info JSONB
INSERT INTO store_contact (store_id, store_name, email, phone, address, country)
SELECT 
    store_id,
    contact_info->>'store_name',
    contact_info->>'email',
    contact_info->>'phone',
    contact_info->>'address',
    contact_info->>'country'
FROM store_settings
WHERE contact_info IS NOT NULL
ON CONFLICT (store_id) DO UPDATE SET
    store_name = EXCLUDED.store_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    country = EXCLUDED.country;

-- Function to get store by domain (for tenant resolver)
CREATE OR REPLACE FUNCTION get_store_by_domain(domain_name TEXT)
RETURNS UUID AS $$
DECLARE
    found_store_id UUID;
BEGIN
    -- Check store_domains first
    SELECT store_id INTO found_store_id
    FROM store_domains
    WHERE domain = domain_name
    LIMIT 1;

    IF found_store_id IS NOT NULL THEN
        RETURN found_store_id;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get tenant (org) slug by domain
CREATE OR REPLACE FUNCTION get_tenant_slug_by_domain(domain_name TEXT)
RETURNS TEXT AS $$
DECLARE
    found_slug TEXT;
BEGIN
    SELECT o.slug INTO found_slug
    FROM store_domains sd
    JOIN stores s ON s.id = sd.store_id
    JOIN organizations o ON o.id = s.organization_id
    WHERE sd.domain = domain_name
    LIMIT 1;

    RETURN found_slug;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to public for the function (if needed for unauthenticated tenant resolution)
GRANT EXECUTE ON FUNCTION get_store_by_domain(TEXT) TO public;
GRANT EXECUTE ON FUNCTION get_store_by_domain(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_store_by_domain(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_store_by_domain(TEXT) TO service_role;

GRANT EXECUTE ON FUNCTION get_tenant_slug_by_domain(TEXT) TO public;
GRANT EXECUTE ON FUNCTION get_tenant_slug_by_domain(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_tenant_slug_by_domain(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_tenant_slug_by_domain(TEXT) TO service_role;