-- Users table (linked to Supabase Auth)
-- The id column references auth.users(id) to integrate with Supabase Auth
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  title TEXT,
  role TEXT NOT NULL DEFAULT 'EMPLOYEE' CHECK (role IN ('EMPLOYEE', 'MANAGER', 'HR_ADMIN', 'SUPER_ADMIN', 'PLATFORM_ADMIN')),
  hire_date DATE,

  -- Multi-tenancy
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Profile information
  profile_picture TEXT,
  bio TEXT,
  phone_number TEXT,
  location TEXT,

  -- Org hierarchy
  manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
  department_id UUID, -- FK added after departments table created

  -- External integrations
  gusto_id TEXT UNIQUE,

  -- Activity tracking
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_users_manager ON users(manager_id);
CREATE INDEX idx_users_department ON users(department_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Update timestamp trigger
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Sync user claims to auth.users on insert/update
-- This allows RLS policies to use auth.jwt() claims for role/org checks
CREATE OR REPLACE FUNCTION sync_user_claims()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object(
    'role', NEW.role,
    'organization_id', NEW.organization_id::text,
    'is_active', NEW.is_active
  )
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_user_update_sync_claims
  AFTER INSERT OR UPDATE OF role, organization_id, is_active ON users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_claims();
