CREATE TABLE assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  facility_id uuid REFERENCES facilities(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES users(id),
  due_date date,
  status text DEFAULT 'pending' CHECK (status IN ('pending','completed','overdue')),
  assigned_at timestamptz DEFAULT now()
);
