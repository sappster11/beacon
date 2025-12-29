-- Platform Admins table - users who can see all organizations
CREATE TABLE IF NOT EXISTS platform_admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE platform_admins ENABLE ROW LEVEL SECURITY;

-- Only platform admins can read this table (bootstrap issue solved by function being SECURITY DEFINER)
DROP POLICY IF EXISTS "platform_admin_read" ON platform_admins;
CREATE POLICY "platform_admin_read" ON platform_admins
  FOR SELECT USING (user_id = auth.uid());

-- Update is_platform_admin function to use the new table
CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM platform_admins WHERE user_id = auth.uid()
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Add platform admin policies to key tables for viewing all data

-- Organizations: platform admins can read all
DROP POLICY IF EXISTS "platform_admin_read_all_orgs" ON organizations;
CREATE POLICY "platform_admin_read_all_orgs" ON organizations
  FOR SELECT USING (is_platform_admin());

-- Users: platform admins can read all
DROP POLICY IF EXISTS "platform_admin_read_all_users" ON users;
CREATE POLICY "platform_admin_read_all_users" ON users
  FOR SELECT USING (is_platform_admin());

-- Departments: platform admins can read all
DROP POLICY IF EXISTS "platform_admin_read_all_depts" ON departments;
CREATE POLICY "platform_admin_read_all_depts" ON departments
  FOR SELECT USING (is_platform_admin());

-- Review cycles: platform admins can read all
DROP POLICY IF EXISTS "platform_admin_read_all_cycles" ON review_cycles;
CREATE POLICY "platform_admin_read_all_cycles" ON review_cycles
  FOR SELECT USING (is_platform_admin());

-- Invitations: platform admins can read all
DROP POLICY IF EXISTS "platform_admin_read_all_invitations" ON invitations;
CREATE POLICY "platform_admin_read_all_invitations" ON invitations
  FOR SELECT USING (is_platform_admin());
