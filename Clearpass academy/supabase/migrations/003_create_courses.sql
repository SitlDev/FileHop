CREATE TABLE courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  regulatory_reference text,
  accreditation text,
  contact_hours numeric(4,1) DEFAULT 1.0,
  role_audience text[],
  plan_required text DEFAULT 'essentials' CHECK (plan_required IN ('essentials','command')),
  sort_order integer DEFAULT 0,
  thumbnail_icon text,
  is_new boolean DEFAULT false,
  has_video boolean DEFAULT false,
  source text DEFAULT 'ClearPass'
);
