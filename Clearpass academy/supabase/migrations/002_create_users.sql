CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  facility_id uuid REFERENCES facilities(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  credential text CHECK (credential IN ('RN','LPN','CNA','HHA','DON','NHA','MDS','Staff')),
  role text NOT NULL DEFAULT 'learner' CHECK (role IN ('learner','admin','super_admin')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
