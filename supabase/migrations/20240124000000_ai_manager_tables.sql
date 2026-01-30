-- AI Manager Assistant Database Schema
-- Migration: 20240124000000_ai_manager_tables.sql

-- =============================================================================
-- AI TASKS TABLE
-- Tracks all AI operations and their status
-- =============================================================================
CREATE TABLE IF NOT EXISTS ai_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  agent TEXT NOT NULL CHECK (agent IN ('manager', 'product', 'photographer', 'marketer', 'analyst', 'video')),
  task_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  input JSONB,
  output JSONB,
  error TEXT,
  parent_task_id UUID REFERENCES ai_tasks(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for ai_tasks
CREATE INDEX idx_ai_tasks_merchant ON ai_tasks(merchant_id);
CREATE INDEX idx_ai_tasks_status ON ai_tasks(status);
CREATE INDEX idx_ai_tasks_agent ON ai_tasks(agent);
CREATE INDEX idx_ai_tasks_parent ON ai_tasks(parent_task_id);
CREATE INDEX idx_ai_tasks_created ON ai_tasks(created_at DESC);

-- =============================================================================
-- GENERATED ASSETS TABLE
-- Stores AI-generated images and other assets
-- =============================================================================
CREATE TABLE IF NOT EXISTS generated_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES ai_tasks(id) ON DELETE SET NULL,
  product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('product_image', 'lifestyle', 'try_on', 'background_removed', 'model_shot', 'video_thumbnail')),
  source_url TEXT,
  generated_url TEXT NOT NULL,
  prompt TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Indexes for generated_assets
CREATE INDEX idx_generated_assets_merchant ON generated_assets(merchant_id);
CREATE INDEX idx_generated_assets_product ON generated_assets(product_id);
CREATE INDEX idx_generated_assets_task ON generated_assets(task_id);
CREATE INDEX idx_generated_assets_type ON generated_assets(asset_type);
CREATE INDEX idx_generated_assets_created ON generated_assets(created_at DESC);

-- =============================================================================
-- CAMPAIGNS TABLE
-- Marketing campaigns and content
-- =============================================================================
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('email', 'sms', 'instagram', 'facebook', 'general')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled')),
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  target JSONB DEFAULT '{}'::jsonb,
  schedule JSONB DEFAULT '{}'::jsonb,
  products UUID[] DEFAULT '{}',
  metrics JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

-- Indexes for campaigns
CREATE INDEX idx_campaigns_merchant ON campaigns(merchant_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_type ON campaigns(type);
CREATE INDEX idx_campaigns_created ON campaigns(created_at DESC);

-- =============================================================================
-- BULK DEAL BATCHES TABLE
-- Batch processing for bulk image operations
-- =============================================================================
CREATE TABLE IF NOT EXISTS bulk_deal_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'analyzing', 'processing', 'completed', 'failed', 'paused')),
  source_urls TEXT[] DEFAULT '{}',
  product_groups JSONB DEFAULT '[]'::jsonb,
  config JSONB DEFAULT '{}'::jsonb,
  total_images INTEGER DEFAULT 0,
  processed_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  current_product TEXT,
  error_log JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes for bulk_deal_batches
CREATE INDEX idx_bulk_deal_batches_merchant ON bulk_deal_batches(merchant_id);
CREATE INDEX idx_bulk_deal_batches_status ON bulk_deal_batches(status);
CREATE INDEX idx_bulk_deal_batches_created ON bulk_deal_batches(created_at DESC);

-- =============================================================================
-- AI USAGE TABLE
-- Track AI usage for cost control and limits
-- =============================================================================
CREATE TABLE IF NOT EXISTS ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  operation TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  count INTEGER DEFAULT 1,
  tokens_used INTEGER DEFAULT 0,
  cost_estimate DECIMAL(10, 4) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for ai_usage
CREATE INDEX idx_ai_usage_merchant ON ai_usage(merchant_id);
CREATE INDEX idx_ai_usage_date ON ai_usage(date);
CREATE INDEX idx_ai_usage_operation ON ai_usage(operation);

-- Unique constraint for daily aggregation
CREATE UNIQUE INDEX idx_ai_usage_daily ON ai_usage(merchant_id, operation, date);

-- =============================================================================
-- STORE SETTINGS TABLE
-- Store customization and AI preferences
-- =============================================================================
CREATE TABLE IF NOT EXISTS store_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  ai_preferences JSONB DEFAULT '{
    "auto_generate_descriptions": true,
    "auto_suggest_pricing": false,
    "default_image_style": "clean",
    "daily_limits": {
      "image_generation": 100,
      "text_tokens": 500000,
      "screenshot_analysis": 20,
      "bulk_batches": 5
    }
  }'::jsonb,
  appearance JSONB DEFAULT '{
    "primary_color": "#000000",
    "accent_color": "#6366f1",
    "font_family": "Inter",
    "logo_url": null,
    "favicon_url": null
  }'::jsonb,
  notifications JSONB DEFAULT '{
    "email_on_order": true,
    "sms_on_order": false,
    "ai_task_completion": true
  }'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for store_settings
CREATE INDEX idx_store_settings_merchant ON store_settings(merchant_id);

-- =============================================================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE ai_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulk_deal_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

-- AI Tasks policies
CREATE POLICY "Users can view own ai_tasks" ON ai_tasks
  FOR SELECT USING (auth.uid() = merchant_id);

CREATE POLICY "Users can insert own ai_tasks" ON ai_tasks
  FOR INSERT WITH CHECK (auth.uid() = merchant_id);

CREATE POLICY "Users can update own ai_tasks" ON ai_tasks
  FOR UPDATE USING (auth.uid() = merchant_id);

-- Generated Assets policies
CREATE POLICY "Users can view own generated_assets" ON generated_assets
  FOR SELECT USING (auth.uid() = merchant_id);

CREATE POLICY "Users can insert own generated_assets" ON generated_assets
  FOR INSERT WITH CHECK (auth.uid() = merchant_id);

CREATE POLICY "Users can update own generated_assets" ON generated_assets
  FOR UPDATE USING (auth.uid() = merchant_id);

CREATE POLICY "Users can delete own generated_assets" ON generated_assets
  FOR DELETE USING (auth.uid() = merchant_id);

-- Campaigns policies
CREATE POLICY "Users can view own campaigns" ON campaigns
  FOR SELECT USING (auth.uid() = merchant_id);

CREATE POLICY "Users can insert own campaigns" ON campaigns
  FOR INSERT WITH CHECK (auth.uid() = merchant_id);

CREATE POLICY "Users can update own campaigns" ON campaigns
  FOR UPDATE USING (auth.uid() = merchant_id);

CREATE POLICY "Users can delete own campaigns" ON campaigns
  FOR DELETE USING (auth.uid() = merchant_id);

-- Bulk Deal Batches policies
CREATE POLICY "Users can view own bulk_deal_batches" ON bulk_deal_batches
  FOR SELECT USING (auth.uid() = merchant_id);

CREATE POLICY "Users can insert own bulk_deal_batches" ON bulk_deal_batches
  FOR INSERT WITH CHECK (auth.uid() = merchant_id);

CREATE POLICY "Users can update own bulk_deal_batches" ON bulk_deal_batches
  FOR UPDATE USING (auth.uid() = merchant_id);

-- AI Usage policies
CREATE POLICY "Users can view own ai_usage" ON ai_usage
  FOR SELECT USING (auth.uid() = merchant_id);

CREATE POLICY "Users can insert own ai_usage" ON ai_usage
  FOR INSERT WITH CHECK (auth.uid() = merchant_id);

-- Store Settings policies
CREATE POLICY "Users can view own store_settings" ON store_settings
  FOR SELECT USING (auth.uid() = merchant_id);

CREATE POLICY "Users can insert own store_settings" ON store_settings
  FOR INSERT WITH CHECK (auth.uid() = merchant_id);

CREATE POLICY "Users can update own store_settings" ON store_settings
  FOR UPDATE USING (auth.uid() = merchant_id);

-- =============================================================================
-- FUNCTIONS AND TRIGGERS
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bulk_deal_batches_updated_at
  BEFORE UPDATE ON bulk_deal_batches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_store_settings_updated_at
  BEFORE UPDATE ON store_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to increment AI usage (upsert with daily aggregation)
CREATE OR REPLACE FUNCTION increment_ai_usage(
  p_merchant_id UUID,
  p_operation TEXT,
  p_count INTEGER DEFAULT 1,
  p_tokens INTEGER DEFAULT 0,
  p_cost DECIMAL DEFAULT 0
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO ai_usage (merchant_id, operation, date, count, tokens_used, cost_estimate)
  VALUES (p_merchant_id, p_operation, CURRENT_DATE, p_count, p_tokens, p_cost)
  ON CONFLICT (merchant_id, operation, date)
  DO UPDATE SET
    count = ai_usage.count + EXCLUDED.count,
    tokens_used = ai_usage.tokens_used + EXCLUDED.tokens_used,
    cost_estimate = ai_usage.cost_estimate + EXCLUDED.cost_estimate;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check usage limits
CREATE OR REPLACE FUNCTION check_usage_limit(
  p_merchant_id UUID,
  p_operation TEXT,
  p_limit INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  current_usage INTEGER;
BEGIN
  SELECT COALESCE(SUM(count), 0) INTO current_usage
  FROM ai_usage
  WHERE merchant_id = p_merchant_id
    AND operation = p_operation
    AND date = CURRENT_DATE;

  RETURN current_usage < p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- ENABLE REALTIME
-- =============================================================================

-- Enable realtime for bulk_deal_batches (for progress tracking)
ALTER PUBLICATION supabase_realtime ADD TABLE bulk_deal_batches;
ALTER PUBLICATION supabase_realtime ADD TABLE ai_tasks;
