-- Add onboarding status to store_settings
-- Migration: 20240128000000_add_onboarding_status.sql

-- =============================================================================
-- UPDATE STORE SETTINGS DEFAULT
-- =============================================================================

-- Update the default ai_preferences to include onboarding_completed
-- This doesn't change existing records, only affects new ones
COMMENT ON TABLE store_settings IS 'Store customization, AI preferences, and onboarding status';

-- =============================================================================
-- ADD ONBOARDING COLUMNS (IF NOT EXISTS PATTERN)
-- =============================================================================

-- Note: In PostgreSQL, we can't use IF NOT EXISTS for columns directly.
-- Instead, we use a DO block to check before adding.

DO $$ 
BEGIN
    -- Check if onboarding_status column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'store_settings' AND column_name = 'onboarding_status'
    ) THEN
        ALTER TABLE store_settings 
        ADD COLUMN onboarding_status TEXT DEFAULT 'not_started'
        CHECK (onboarding_status IN ('not_started', 'in_progress', 'skipped', 'completed'));
    END IF;

    -- Check if onboarding_completed_at column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'store_settings' AND column_name = 'onboarding_completed_at'
    ) THEN
        ALTER TABLE store_settings 
        ADD COLUMN onboarding_completed_at TIMESTAMPTZ;
    END IF;
END $$;

-- =============================================================================
-- CREATE INDEX FOR ONBOARDING STATUS
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_store_settings_onboarding_status 
ON store_settings(onboarding_status);

-- =============================================================================
-- UPDATE AI_PREFERENCES DEFAULT TO INCLUDE ONBOARDING
-- =============================================================================

-- For existing records that don't have onboarding fields in ai_preferences,
-- we don't need to migrate them since we'll handle this at the application level.
-- The ai_preferences JSONB can include:
-- {
--   "onboarding_completed": false,
--   "onboarding_skipped_at": null,
--   ...existing preferences...
-- }

-- =============================================================================
-- FUNCTION TO MARK ONBOARDING COMPLETE
-- =============================================================================

CREATE OR REPLACE FUNCTION mark_onboarding_complete(p_merchant_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE store_settings 
    SET 
        onboarding_status = 'completed',
        onboarding_completed_at = NOW(),
        ai_preferences = ai_preferences || '{"onboarding_completed": true}'::jsonb,
        updated_at = NOW()
    WHERE merchant_id = p_merchant_id;
    
    -- If no row was updated, insert a new one
    IF NOT FOUND THEN
        INSERT INTO store_settings (
            merchant_id, 
            onboarding_status, 
            onboarding_completed_at,
            ai_preferences
        ) VALUES (
            p_merchant_id,
            'completed',
            NOW(),
            '{"onboarding_completed": true}'::jsonb
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- FUNCTION TO SKIP ONBOARDING
-- =============================================================================

CREATE OR REPLACE FUNCTION skip_onboarding(p_merchant_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE store_settings 
    SET 
        onboarding_status = 'skipped',
        ai_preferences = ai_preferences || '{"onboarding_skipped": true, "onboarding_skipped_at": "' || NOW()::text || '"}'::jsonb,
        updated_at = NOW()
    WHERE merchant_id = p_merchant_id;
    
    -- If no row was updated, insert a new one
    IF NOT FOUND THEN
        INSERT INTO store_settings (
            merchant_id, 
            onboarding_status,
            ai_preferences
        ) VALUES (
            p_merchant_id,
            'skipped',
            ('{"onboarding_skipped": true, "onboarding_skipped_at": "' || NOW()::text || '"}')::jsonb
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- GRANT EXECUTE TO AUTHENTICATED USERS
-- =============================================================================

GRANT EXECUTE ON FUNCTION mark_onboarding_complete(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION skip_onboarding(UUID) TO authenticated;
