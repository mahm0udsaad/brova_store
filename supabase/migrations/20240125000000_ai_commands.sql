-- Create ai_commands table for real-time UI control
CREATE TABLE IF NOT EXISTS ai_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  command JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'executing', 'completed', 'failed')),
  result JSONB,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  executed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Add index for faster queries
CREATE INDEX idx_ai_commands_merchant_id ON ai_commands(merchant_id);
CREATE INDEX idx_ai_commands_status ON ai_commands(status);
CREATE INDEX idx_ai_commands_created_at ON ai_commands(created_at DESC);

-- Enable Row Level Security
ALTER TABLE ai_commands ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own commands
CREATE POLICY "Users can view own commands"
  ON ai_commands
  FOR SELECT
  USING (auth.uid() = merchant_id);

-- Policy: Users can insert their own commands
CREATE POLICY "Users can create own commands"
  ON ai_commands
  FOR INSERT
  WITH CHECK (auth.uid() = merchant_id);

-- Policy: Users can update their own commands
CREATE POLICY "Users can update own commands"
  ON ai_commands
  FOR UPDATE
  USING (auth.uid() = merchant_id);

-- Policy: Users can delete their own commands
CREATE POLICY "Users can delete own commands"
  ON ai_commands
  FOR DELETE
  USING (auth.uid() = merchant_id);

-- Enable real-time for ai_commands
ALTER PUBLICATION supabase_realtime ADD TABLE ai_commands;

-- Function to clean up old completed commands (older than 24 hours)
CREATE OR REPLACE FUNCTION cleanup_old_ai_commands()
RETURNS void AS $$
BEGIN
  DELETE FROM ai_commands
  WHERE status IN ('completed', 'failed')
    AND completed_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Comment on table
COMMENT ON TABLE ai_commands IS 'Stores AI-generated UI commands for real-time execution in the admin interface';
