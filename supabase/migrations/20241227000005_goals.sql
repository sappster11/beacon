-- Goals table with OKR hierarchy support
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Multi-tenancy
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Goal hierarchy (OKR alignment)
  parent_goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,

  title TEXT NOT NULL,
  description TEXT NOT NULL,

  -- Metrics
  target_value DOUBLE PRECISION,
  current_value DOUBLE PRECISION DEFAULT 0,
  unit TEXT, -- e.g., "sales", "users", "%"

  due_date TIMESTAMPTZ,
  status TEXT DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED')),
  visibility TEXT DEFAULT 'PRIVATE' CHECK (visibility IN ('PRIVATE', 'TEAM', 'COMPANY')),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_goals_owner ON goals(owner_id);
CREATE INDEX idx_goals_organization ON goals(organization_id);
CREATE INDEX idx_goals_parent ON goals(parent_goal_id);
CREATE INDEX idx_goals_status ON goals(status);
CREATE INDEX idx_goals_visibility ON goals(visibility);

CREATE TRIGGER update_goals_updated_at
  BEFORE UPDATE ON goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Goal Templates
CREATE TABLE goal_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenancy
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL, -- e.g., "Sales", "Engineering", "Customer Success"

  -- Default metrics
  target_value DOUBLE PRECISION,
  unit TEXT,

  -- Suggested duration in days
  suggested_duration INTEGER,

  visibility TEXT DEFAULT 'TEAM' CHECK (visibility IN ('TEAM', 'COMPANY')),
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_goal_templates_organization ON goal_templates(organization_id);
CREATE INDEX idx_goal_templates_category ON goal_templates(category);

CREATE TRIGGER update_goal_templates_updated_at
  BEFORE UPDATE ON goal_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
