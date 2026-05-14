CREATE TABLE enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  facility_id uuid REFERENCES facilities(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  status text DEFAULT 'not_started' CHECK (status IN ('not_started','in_progress','completed')),
  progress_pct numeric(5,2) DEFAULT 0,
  lessons_completed uuid[] DEFAULT '{}',
  started_at timestamptz,
  completed_at timestamptz,
  due_date date,
  UNIQUE(user_id, course_id)
);
