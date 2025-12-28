-- Enable Row Level Security on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE competency_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE one_on_ones ENABLE ROW LEVEL SECURITY;
ALTER TABLE one_on_one_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE development_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_oauth_tokens ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's organization_id
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS UUID AS $$
  SELECT organization_id FROM users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function to check if user is admin (HR_ADMIN or SUPER_ADMIN)
CREATE OR REPLACE FUNCTION is_org_admin()
RETURNS BOOLEAN AS $$
  SELECT role IN ('HR_ADMIN', 'SUPER_ADMIN') FROM users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function to check if user is platform admin
CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS BOOLEAN AS $$
  SELECT role = 'PLATFORM_ADMIN' FROM users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;


-- =====================
-- ORGANIZATIONS
-- =====================
-- Users can read their own organization
CREATE POLICY "users_read_own_org" ON organizations
  FOR SELECT USING (id = get_user_org_id() OR is_platform_admin());

-- Platform admins can do everything
CREATE POLICY "platform_admin_all_orgs" ON organizations
  FOR ALL USING (is_platform_admin());


-- =====================
-- USERS
-- =====================
-- Users can see others in their organization
CREATE POLICY "users_read_own_org" ON users
  FOR SELECT USING (organization_id = get_user_org_id() OR is_platform_admin());

-- Users can update their own profile
CREATE POLICY "users_update_self" ON users
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = (SELECT role FROM users WHERE id = auth.uid())); -- Can't change own role

-- Org admins can manage users in their org
CREATE POLICY "org_admin_manage_users" ON users
  FOR ALL USING (
    organization_id = get_user_org_id() AND is_org_admin()
  );


-- =====================
-- DEPARTMENTS
-- =====================
CREATE POLICY "users_read_own_org" ON departments
  FOR SELECT USING (organization_id = get_user_org_id());

CREATE POLICY "org_admin_manage" ON departments
  FOR ALL USING (organization_id = get_user_org_id() AND is_org_admin());


-- =====================
-- REVIEW CYCLES
-- =====================
CREATE POLICY "users_read_own_org" ON review_cycles
  FOR SELECT USING (organization_id = get_user_org_id());

CREATE POLICY "org_admin_manage" ON review_cycles
  FOR ALL USING (organization_id = get_user_org_id() AND is_org_admin());


-- =====================
-- REVIEWS
-- =====================
-- Users can see reviews where they are reviewee or reviewer
CREATE POLICY "participant_read" ON reviews
  FOR SELECT USING (
    reviewee_id = auth.uid() OR
    reviewer_id = auth.uid() OR
    (is_org_admin() AND EXISTS (
      SELECT 1 FROM users WHERE id = reviews.reviewee_id AND organization_id = get_user_org_id()
    ))
  );

-- Reviewee can update their self-assessment parts
CREATE POLICY "reviewee_update_self" ON reviews
  FOR UPDATE USING (reviewee_id = auth.uid())
  WITH CHECK (reviewee_id = auth.uid());

-- Reviewer (manager) can update their assessment
CREATE POLICY "reviewer_update" ON reviews
  FOR UPDATE USING (reviewer_id = auth.uid())
  WITH CHECK (reviewer_id = auth.uid());

-- Org admins can manage all reviews in their org
CREATE POLICY "org_admin_manage" ON reviews
  FOR ALL USING (
    is_org_admin() AND EXISTS (
      SELECT 1 FROM users WHERE id = reviews.reviewee_id AND organization_id = get_user_org_id()
    )
  );


-- =====================
-- PEER FEEDBACK
-- =====================
-- Giver can see their own feedback
CREATE POLICY "giver_read_own" ON peer_feedback
  FOR SELECT USING (giver_id = auth.uid());

-- Receiver can see feedback but NOT the giver (anonymous)
-- This is enforced in app layer - they see feedback content but not giver_id
CREATE POLICY "receiver_read_anonymous" ON peer_feedback
  FOR SELECT USING (receiver_id = auth.uid());

-- Givers can create and update their own feedback
CREATE POLICY "giver_manage_own" ON peer_feedback
  FOR ALL USING (giver_id = auth.uid());

-- Org admins can see all (for moderation)
CREATE POLICY "org_admin_read" ON peer_feedback
  FOR SELECT USING (
    is_org_admin() AND EXISTS (
      SELECT 1 FROM users WHERE id = peer_feedback.receiver_id AND organization_id = get_user_org_id()
    )
  );


-- =====================
-- COMPETENCY COMMENTS & GOAL COMMENTS
-- =====================
CREATE POLICY "participant_read" ON competency_comments
  FOR SELECT USING (
    author_id = auth.uid() OR EXISTS (
      SELECT 1 FROM reviews r WHERE r.id = review_id AND (r.reviewee_id = auth.uid() OR r.reviewer_id = auth.uid())
    )
  );

CREATE POLICY "author_manage" ON competency_comments
  FOR ALL USING (author_id = auth.uid());

CREATE POLICY "participant_read" ON goal_comments
  FOR SELECT USING (
    author_id = auth.uid() OR EXISTS (
      SELECT 1 FROM reviews r WHERE r.id = review_id AND (r.reviewee_id = auth.uid() OR r.reviewer_id = auth.uid())
    )
  );

CREATE POLICY "author_manage" ON goal_comments
  FOR ALL USING (author_id = auth.uid());


-- =====================
-- GOALS
-- =====================
-- Visibility-based access
CREATE POLICY "goals_read" ON goals
  FOR SELECT USING (
    owner_id = auth.uid() OR -- Own goals
    visibility = 'COMPANY' AND organization_id = get_user_org_id() OR -- Company-wide
    visibility = 'TEAM' AND EXISTS ( -- Team goals (same manager or direct report)
      SELECT 1 FROM users u1, users u2
      WHERE u1.id = auth.uid() AND u2.id = goals.owner_id
      AND u1.organization_id = u2.organization_id
      AND (u1.manager_id = u2.manager_id OR u1.id = u2.manager_id OR u1.manager_id = u2.id)
    ) OR
    is_org_admin() AND organization_id = get_user_org_id() -- Admins see all in org
  );

-- Owner can manage their goals
CREATE POLICY "owner_manage" ON goals
  FOR ALL USING (owner_id = auth.uid());

-- Org admins can manage all goals in their org
CREATE POLICY "org_admin_manage" ON goals
  FOR ALL USING (organization_id = get_user_org_id() AND is_org_admin());


-- =====================
-- GOAL TEMPLATES
-- =====================
CREATE POLICY "users_read_own_org" ON goal_templates
  FOR SELECT USING (organization_id = get_user_org_id());

CREATE POLICY "org_admin_manage" ON goal_templates
  FOR ALL USING (organization_id = get_user_org_id() AND is_org_admin());


-- =====================
-- ONE-ON-ONES
-- =====================
CREATE POLICY "participant_read" ON one_on_ones
  FOR SELECT USING (manager_id = auth.uid() OR employee_id = auth.uid());

CREATE POLICY "participant_manage" ON one_on_ones
  FOR ALL USING (manager_id = auth.uid() OR employee_id = auth.uid());

-- Org admins can view (for auditing)
CREATE POLICY "org_admin_read" ON one_on_ones
  FOR SELECT USING (
    is_org_admin() AND EXISTS (
      SELECT 1 FROM users WHERE id = one_on_ones.manager_id AND organization_id = get_user_org_id()
    )
  );


-- =====================
-- ONE-ON-ONE DOCUMENTS
-- =====================
CREATE POLICY "participant_read" ON one_on_one_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM one_on_ones o WHERE o.id = one_on_one_id
      AND (o.manager_id = auth.uid() OR o.employee_id = auth.uid())
    )
  );

CREATE POLICY "participant_manage" ON one_on_one_documents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM one_on_ones o WHERE o.id = one_on_one_id
      AND (o.manager_id = auth.uid() OR o.employee_id = auth.uid())
    )
  );


-- =====================
-- DEVELOPMENT PLANS
-- =====================
-- Owner and their manager can read
CREATE POLICY "owner_manager_read" ON development_plans
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE id = development_plans.user_id AND manager_id = auth.uid()) OR
    is_org_admin() AND EXISTS (SELECT 1 FROM users WHERE id = development_plans.user_id AND organization_id = get_user_org_id())
  );

-- Owner can manage their own
CREATE POLICY "owner_manage" ON development_plans
  FOR ALL USING (user_id = auth.uid());


-- =====================
-- SYSTEM SETTINGS
-- =====================
CREATE POLICY "users_read_own_org" ON system_settings
  FOR SELECT USING (organization_id = get_user_org_id());

CREATE POLICY "org_admin_manage" ON system_settings
  FOR ALL USING (organization_id = get_user_org_id() AND is_org_admin());


-- =====================
-- INTEGRATIONS
-- =====================
-- Only super admins can manage integrations
CREATE POLICY "super_admin_read" ON integrations
  FOR SELECT USING (
    organization_id = get_user_org_id() AND
    get_user_role() = 'SUPER_ADMIN'
  );

CREATE POLICY "super_admin_manage" ON integrations
  FOR ALL USING (
    organization_id = get_user_org_id() AND
    get_user_role() = 'SUPER_ADMIN'
  );


-- =====================
-- AUDIT LOGS
-- =====================
-- Admins can read audit logs (read-only)
CREATE POLICY "org_admin_read" ON audit_logs
  FOR SELECT USING (organization_id = get_user_org_id() AND is_org_admin());

-- Service role inserts audit logs (no user policy for insert)


-- =====================
-- INVITATIONS
-- =====================
CREATE POLICY "org_admin_read" ON invitations
  FOR SELECT USING (organization_id = get_user_org_id() AND is_org_admin());

CREATE POLICY "org_admin_manage" ON invitations
  FOR ALL USING (organization_id = get_user_org_id() AND is_org_admin());


-- =====================
-- USER OAUTH TOKENS
-- =====================
-- Users can only see/manage their own tokens
CREATE POLICY "owner_only" ON user_oauth_tokens
  FOR ALL USING (user_id = auth.uid());
