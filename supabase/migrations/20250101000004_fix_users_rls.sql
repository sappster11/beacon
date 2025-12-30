-- Add missing policy for users to see others in their organization
DROP POLICY IF EXISTS "users_read_own_org" ON users;
CREATE POLICY "users_read_own_org" ON users
  FOR SELECT USING (organization_id = get_user_org_id());

-- Add missing policy for org admins to manage users
DROP POLICY IF EXISTS "org_admin_manage_users" ON users;
CREATE POLICY "org_admin_manage_users" ON users
  FOR ALL USING (
    organization_id = get_user_org_id() AND is_org_admin()
  );
