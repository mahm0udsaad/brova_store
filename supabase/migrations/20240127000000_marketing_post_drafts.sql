-- Create marketing_post_drafts table for storing AI-generated social media posts
CREATE TABLE IF NOT EXISTS marketing_post_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'tiktok', 'twitter', 'linkedin', 'general')),
  
  -- Post structure and content
  ui_structure JSONB NOT NULL DEFAULT '{}', -- Contains caption, cta, suggestedTime, tips
  media_assets JSONB NOT NULL DEFAULT '{}', -- Contains images, videos, etc.
  copy_text JSONB NOT NULL DEFAULT '{}', -- Contains hashtags, mentions, etc.
  
  -- Metadata
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'archived')),
  version INTEGER NOT NULL DEFAULT 1,
  product_ids TEXT[] DEFAULT '{}', -- Array of product IDs this post is about
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_marketing_post_drafts_merchant_id 
  ON marketing_post_drafts(merchant_id);
CREATE INDEX IF NOT EXISTS idx_marketing_post_drafts_platform 
  ON marketing_post_drafts(platform);
CREATE INDEX IF NOT EXISTS idx_marketing_post_drafts_status 
  ON marketing_post_drafts(status);
CREATE INDEX IF NOT EXISTS idx_marketing_post_drafts_created_at 
  ON marketing_post_drafts(created_at DESC);

-- Enable Row Level Security
ALTER TABLE marketing_post_drafts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own drafts"
  ON marketing_post_drafts FOR SELECT
  USING (auth.uid() = merchant_id);

CREATE POLICY "Users can insert their own drafts"
  ON marketing_post_drafts FOR INSERT
  WITH CHECK (auth.uid() = merchant_id);

CREATE POLICY "Users can update their own drafts"
  ON marketing_post_drafts FOR UPDATE
  USING (auth.uid() = merchant_id);

CREATE POLICY "Users can delete their own drafts"
  ON marketing_post_drafts FOR DELETE
  USING (auth.uid() = merchant_id);

-- Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_marketing_post_drafts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_marketing_post_drafts_updated_at
  BEFORE UPDATE ON marketing_post_drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_marketing_post_drafts_updated_at();
