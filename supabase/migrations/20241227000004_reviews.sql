-- Review Cycles
CREATE TABLE review_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL')),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),

  -- Multi-tenancy
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_review_cycles_organization ON review_cycles(organization_id);
CREATE INDEX idx_review_cycles_status ON review_cycles(status);

CREATE TRIGGER update_review_cycles_updated_at
  BEFORE UPDATE ON review_cycles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Reviews
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  reviewee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cycle_id UUID NOT NULL REFERENCES review_cycles(id) ON DELETE CASCADE,

  -- Competencies: JSON array of { name, description, selfRating, managerRating }
  competencies JSONB,

  -- Self-reflection: JSON array of { question, answer }
  self_reflections JSONB,

  -- Assigned goals: JSON array of goal IDs
  assigned_goals JSONB,

  -- Overall ratings (1-4 scale)
  overall_self_rating INTEGER CHECK (overall_self_rating BETWEEN 1 AND 4),
  overall_manager_rating INTEGER CHECK (overall_manager_rating BETWEEN 1 AND 4),

  -- Legacy fields
  self_assessment TEXT,
  manager_assessment TEXT,

  -- Summary comments: JSON { employeeComment, managerComment }
  summary_comments JSONB,

  status TEXT DEFAULT 'NOT_STARTED' CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'CALIBRATED')),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_reviews_reviewee ON reviews(reviewee_id);
CREATE INDEX idx_reviews_reviewer ON reviews(reviewer_id);
CREATE INDEX idx_reviews_cycle ON reviews(cycle_id);
CREATE INDEX idx_reviews_status ON reviews(status);

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Peer Feedback (anonymous)
CREATE TABLE peer_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  giver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  feedback TEXT NOT NULL,
  rating INTEGER CHECK (rating BETWEEN 1 AND 4),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_peer_feedback_review ON peer_feedback(review_id);
CREATE INDEX idx_peer_feedback_giver ON peer_feedback(giver_id);
CREATE INDEX idx_peer_feedback_receiver ON peer_feedback(receiver_id);

CREATE TRIGGER update_peer_feedback_updated_at
  BEFORE UPDATE ON peer_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Competency Comments
CREATE TABLE competency_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  competency_name TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  author_role TEXT NOT NULL CHECK (author_role IN ('EMPLOYEE', 'MANAGER')),
  content TEXT NOT NULL,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_competency_comments_review ON competency_comments(review_id);
CREATE INDEX idx_competency_comments_author ON competency_comments(author_id);

CREATE TRIGGER update_competency_comments_updated_at
  BEFORE UPDATE ON competency_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Goal Comments (for review-assigned goals)
CREATE TABLE goal_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  goal_id TEXT NOT NULL, -- References goal in JSON array
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  author_role TEXT NOT NULL CHECK (author_role IN ('EMPLOYEE', 'MANAGER')),
  content TEXT NOT NULL,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_goal_comments_review ON goal_comments(review_id);
CREATE INDEX idx_goal_comments_author ON goal_comments(author_id);

CREATE TRIGGER update_goal_comments_updated_at
  BEFORE UPDATE ON goal_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
