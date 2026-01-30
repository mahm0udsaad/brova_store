-- Create bulk_deal_images table for tracking individual image uploads and processing
CREATE TABLE IF NOT EXISTS bulk_deal_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES bulk_deal_batches(id) ON DELETE CASCADE,
  storage_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  original_url TEXT,
  processed_url TEXT,
  processing_data JSONB DEFAULT '{}'::jsonb, -- Stores all processing results (bg_removed, lifestyle, etc.)
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on batch_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_bulk_deal_images_batch ON bulk_deal_images(batch_id);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_bulk_deal_images_status ON bulk_deal_images(status);

-- Enable Row Level Security
ALTER TABLE bulk_deal_images ENABLE ROW LEVEL SECURITY;

-- Create policy for merchant isolation (users can only see their own batch images)
CREATE POLICY bulk_deal_images_isolation ON bulk_deal_images
  FOR ALL
  USING (
    batch_id IN (
      SELECT id FROM bulk_deal_batches WHERE merchant_id = auth.uid()
    )
  );

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_bulk_deal_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bulk_deal_images_updated_at
  BEFORE UPDATE ON bulk_deal_images
  FOR EACH ROW
  EXECUTE FUNCTION update_bulk_deal_images_updated_at();

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE bulk_deal_images;
