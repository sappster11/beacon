-- Add org_role column to separate organizational role from platform access level
-- org_role: Employee, Manager, Leadership (describes position in org hierarchy)
-- role: Employee, Manager, Admin (describes platform access level)

-- Add org_role column
ALTER TABLE users ADD COLUMN IF NOT EXISTS org_role TEXT DEFAULT 'EMPLOYEE'
  CHECK (org_role IN ('EMPLOYEE', 'MANAGER', 'LEADERSHIP'));

-- Migrate existing data: set org_role based on current role
UPDATE users SET org_role = 'EMPLOYEE' WHERE role = 'EMPLOYEE';
UPDATE users SET org_role = 'MANAGER' WHERE role IN ('MANAGER', 'HR_ADMIN');
UPDATE users SET org_role = 'LEADERSHIP' WHERE role = 'SUPER_ADMIN';

-- Update role column constraint to new values
-- First, migrate old role values to new access levels
UPDATE users SET role = 'ADMIN' WHERE role IN ('HR_ADMIN', 'SUPER_ADMIN');
-- EMPLOYEE and MANAGER stay the same, PLATFORM_ADMIN stays as is

-- Drop old constraint and add new one
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('EMPLOYEE', 'MANAGER', 'ADMIN', 'PLATFORM_ADMIN'));

-- Create index for org_role
CREATE INDEX IF NOT EXISTS idx_users_org_role ON users(org_role);
