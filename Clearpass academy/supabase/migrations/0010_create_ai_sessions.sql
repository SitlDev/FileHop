CREATE TABLE ai_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  facility_id uuid REFERENCES facilities(id) ON DELETE CASCADE,
  messages jsonb DEFAULT '[]',
  query_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
