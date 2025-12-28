-- Development Plans
CREATE TABLE development_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  career_goals TEXT NOT NULL,
  skills_to_add JSONB, -- Array of skills
  milestones JSONB, -- Array of milestones

  progress INTEGER DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_development_plans_user ON development_plans(user_id);

CREATE TRIGGER update_development_plans_updated_at
  BEFORE UPDATE ON development_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
