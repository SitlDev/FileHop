CREATE TABLE quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  facility_id uuid REFERENCES facilities(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  score_pct numeric(5,2) NOT NULL,
  passed boolean NOT NULL,
  attempt_number integer DEFAULT 1,
  attempted_at timestamptz DEFAULT now()
);
