-- Fix is_org_admin function to use current role values
-- The function was checking for 'HR_ADMIN' and 'SUPER_ADMIN' but roles were changed to just 'ADMIN'

CREATE OR REPLACE FUNCTION is_org_admin()
RETURNS BOOLEAN AS $$
  SELECT role IN ('ADMIN', 'HR_ADMIN', 'SUPER_ADMIN') FROM users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;
