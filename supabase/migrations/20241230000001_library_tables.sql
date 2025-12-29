-- Goals & Competencies Library Tables
-- Organization-scoped templates with platform defaults support

-- Goals Library
CREATE TABLE IF NOT EXISTS goal_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  is_platform_default BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Competencies Library
CREATE TABLE IF NOT EXISTS competency_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  is_platform_default BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_goal_library_org ON goal_library(organization_id);
CREATE INDEX IF NOT EXISTS idx_goal_library_category ON goal_library(category);
CREATE INDEX IF NOT EXISTS idx_goal_library_platform ON goal_library(is_platform_default) WHERE is_platform_default = TRUE;

CREATE INDEX IF NOT EXISTS idx_competency_library_org ON competency_library(organization_id);
CREATE INDEX IF NOT EXISTS idx_competency_library_category ON competency_library(category);
CREATE INDEX IF NOT EXISTS idx_competency_library_platform ON competency_library(is_platform_default) WHERE is_platform_default = TRUE;

-- Enable RLS
ALTER TABLE goal_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE competency_library ENABLE ROW LEVEL SECURITY;

-- RLS Policies for goal_library

-- Read: Users can see their org's items OR platform defaults
DROP POLICY IF EXISTS "goal_library_read" ON goal_library;
CREATE POLICY "goal_library_read" ON goal_library
  FOR SELECT USING (
    is_platform_default = TRUE
    OR organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
  );

-- Insert: Managers+ can create for their org
DROP POLICY IF EXISTS "goal_library_insert" ON goal_library;
CREATE POLICY "goal_library_insert" ON goal_library
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('MANAGER', 'HR_ADMIN', 'SUPER_ADMIN')
    )
  );

-- Update: Managers+ can update their org's items (not platform defaults)
DROP POLICY IF EXISTS "goal_library_update" ON goal_library;
CREATE POLICY "goal_library_update" ON goal_library
  FOR UPDATE USING (
    is_platform_default = FALSE
    AND organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('MANAGER', 'HR_ADMIN', 'SUPER_ADMIN')
    )
  );

-- Delete: Managers+ can delete their org's items (not platform defaults)
DROP POLICY IF EXISTS "goal_library_delete" ON goal_library;
CREATE POLICY "goal_library_delete" ON goal_library
  FOR DELETE USING (
    is_platform_default = FALSE
    AND organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('MANAGER', 'HR_ADMIN', 'SUPER_ADMIN')
    )
  );

-- RLS Policies for competency_library (same pattern)

DROP POLICY IF EXISTS "competency_library_read" ON competency_library;
CREATE POLICY "competency_library_read" ON competency_library
  FOR SELECT USING (
    is_platform_default = TRUE
    OR organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "competency_library_insert" ON competency_library;
CREATE POLICY "competency_library_insert" ON competency_library
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('MANAGER', 'HR_ADMIN', 'SUPER_ADMIN')
    )
  );

DROP POLICY IF EXISTS "competency_library_update" ON competency_library;
CREATE POLICY "competency_library_update" ON competency_library
  FOR UPDATE USING (
    is_platform_default = FALSE
    AND organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('MANAGER', 'HR_ADMIN', 'SUPER_ADMIN')
    )
  );

DROP POLICY IF EXISTS "competency_library_delete" ON competency_library;
CREATE POLICY "competency_library_delete" ON competency_library
  FOR DELETE USING (
    is_platform_default = FALSE
    AND organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('MANAGER', 'HR_ADMIN', 'SUPER_ADMIN')
    )
  );

-- Seed platform default goals
INSERT INTO goal_library (title, description, category, is_platform_default) VALUES
  ('Improve team communication', 'Enhance communication effectiveness within the team through regular updates and feedback sessions', 'Leadership', TRUE),
  ('Complete professional certification', 'Obtain a relevant professional certification to expand skills and knowledge', 'Development', TRUE),
  ('Mentor a junior team member', 'Provide guidance and support to help a junior colleague develop their skills', 'Leadership', TRUE),
  ('Reduce customer response time', 'Improve efficiency in responding to customer inquiries and issues', 'Performance', TRUE),
  ('Increase code review participation', 'Actively participate in code reviews to improve code quality and knowledge sharing', 'Technical', TRUE),
  ('Lead a cross-functional project', 'Take ownership of a project involving multiple teams or departments', 'Leadership', TRUE),
  ('Improve documentation practices', 'Create and maintain comprehensive documentation for projects and processes', 'Technical', TRUE),
  ('Expand product knowledge', 'Deepen understanding of the company products and how they serve customers', 'Development', TRUE)
ON CONFLICT DO NOTHING;

-- Seed platform default competencies
INSERT INTO competency_library (name, description, category, is_platform_default) VALUES
  ('Communication', 'Demonstrates clear, effective written and verbal communication skills', 'Core', TRUE),
  ('Problem Solving', 'Applies analytical thinking and creative approaches to solve complex problems', 'Core', TRUE),
  ('Leadership', 'Guides, motivates, and develops team members effectively', 'Leadership', TRUE),
  ('Technical Excellence', 'Demonstrates deep expertise in relevant technologies and best practices', 'Technical', TRUE),
  ('Collaboration', 'Works effectively with others across teams and functions', 'Core', TRUE),
  ('Initiative', 'Proactively identifies opportunities and takes action without being asked', 'Core', TRUE),
  ('Adaptability', 'Adjusts effectively to changing priorities, requirements, and environments', 'Core', TRUE),
  ('Customer Focus', 'Prioritizes customer needs and delivers excellent service', 'Core', TRUE),
  ('Strategic Thinking', 'Considers long-term implications and aligns actions with organizational goals', 'Leadership', TRUE),
  ('Time Management', 'Effectively prioritizes tasks and manages workload to meet deadlines', 'Core', TRUE)
ON CONFLICT DO NOTHING;
