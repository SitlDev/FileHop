-- Enable RLS on all tables
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_sessions ENABLE ROW LEVEL SECURITY;

-- Facilities: users see only their own facility
CREATE POLICY "facility_isolation" ON facilities FOR ALL USING (id = (SELECT facility_id FROM users WHERE id = auth.uid()));

-- Users: see only users in same facility
CREATE POLICY "same_facility_users" ON users FOR ALL USING (facility_id = (SELECT facility_id FROM users WHERE id = auth.uid()));

-- Certificates: PUBLIC READ for verification page + owner write
CREATE POLICY "public_cert_read" ON certificates FOR SELECT USING (true);
CREATE POLICY "owner_cert_write" ON certificates FOR INSERT WITH CHECK (user_id = auth.uid());

-- Generic facility_id isolation for other tables
-- courses and lessons are public read in this schema (no facility_id)
CREATE POLICY "public_courses_read" ON courses FOR SELECT USING (true);
CREATE POLICY "public_lessons_read" ON lessons FOR SELECT USING (true);

-- Tables with facility_id
CREATE POLICY "enrollments_isolation" ON enrollments FOR ALL USING (facility_id = (SELECT facility_id FROM users WHERE id = auth.uid()));
CREATE POLICY "quiz_attempts_isolation" ON quiz_attempts FOR ALL USING (facility_id = (SELECT facility_id FROM users WHERE id = auth.uid()));
CREATE POLICY "assignments_isolation" ON assignments FOR ALL USING (facility_id = (SELECT facility_id FROM users WHERE id = auth.uid()));
CREATE POLICY "ai_sessions_isolation" ON ai_sessions FOR ALL USING (facility_id = (SELECT facility_id FROM users WHERE id = auth.uid()));
