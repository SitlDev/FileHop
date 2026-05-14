CREATE TABLE lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  lesson_number integer NOT NULL,
  title text NOT NULL,
  regulatory_ref text,
  content_html text,
  video_url text,
  duration_minutes integer DEFAULT 10
);
