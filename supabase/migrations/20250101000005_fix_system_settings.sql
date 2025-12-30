-- Add unique constraint for system_settings upsert to work correctly
ALTER TABLE system_settings
DROP CONSTRAINT IF EXISTS system_settings_org_category_unique;

ALTER TABLE system_settings
ADD CONSTRAINT system_settings_org_category_unique
UNIQUE (organization_id, category);
