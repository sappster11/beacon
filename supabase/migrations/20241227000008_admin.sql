-- System Settings (per organization)
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenancy
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  category TEXT NOT NULL, -- 'review', 'notifications', 'company', 'features'
  settings JSONB NOT NULL,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(organization_id, category)
);

CREATE INDEX idx_system_settings_organization ON system_settings(organization_id);

CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Integrations (Gusto, Google Calendar, etc.)
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenancy
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  type TEXT NOT NULL, -- 'gusto', 'google_calendar', 'hris'
  is_connected BOOLEAN DEFAULT false,
  config JSONB, -- Encrypted credentials
  last_sync_at TIMESTAMPTZ,
  sync_status TEXT CHECK (sync_status IN ('success', 'failed', 'pending')),
  sync_error TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(organization_id, type)
);

CREATE INDEX idx_integrations_organization ON integrations(organization_id);

CREATE TRIGGER update_integrations_updated_at
  BEFORE UPDATE ON integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Audit Logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenancy
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE'
  resource_type TEXT NOT NULL, -- 'User', 'Department', 'Review', etc.
  resource_id TEXT NOT NULL,
  changes JSONB, -- { before: {...}, after: {...} }
  metadata JSONB, -- Additional context (IP, user agent)
  status TEXT DEFAULT 'success' CHECK (status IN ('success', 'failed')),
  error_message TEXT,
  description TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_logs_organization ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_status ON audit_logs(status);

-- Invitations
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  token TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  title TEXT,

  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invited_by_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  manager_id UUID, -- Manager for the new user

  role TEXT DEFAULT 'EMPLOYEE' CHECK (role IN ('EMPLOYEE', 'MANAGER', 'HR_ADMIN', 'SUPER_ADMIN')),
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'EXPIRED')),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_organization ON invitations(organization_id);
CREATE INDEX idx_invitations_status ON invitations(status);

-- User OAuth Tokens (for Google Calendar, etc.)
CREATE TABLE user_oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  provider TEXT NOT NULL, -- 'google'
  access_token TEXT NOT NULL, -- Should be encrypted in app layer
  refresh_token TEXT,
  token_type TEXT DEFAULT 'Bearer',
  expires_at TIMESTAMPTZ,
  scope TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(user_id, provider)
);

CREATE INDEX idx_user_oauth_tokens_user ON user_oauth_tokens(user_id);

CREATE TRIGGER update_user_oauth_tokens_updated_at
  BEFORE UPDATE ON user_oauth_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
