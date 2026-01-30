-- Onboarding intent table
-- Records what type of store a user wants to build (before any org/store creation)
CREATE TABLE onboarding_intent (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  store_type TEXT NOT NULL CHECK (store_type IN ('clothing', 'car_care')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE onboarding_intent ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own intent" ON onboarding_intent
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
