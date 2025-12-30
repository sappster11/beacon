-- Add display_name column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Populate display_name with first word of name for existing users
UPDATE users
SET display_name = split_part(name, ' ', 1)
WHERE display_name IS NULL AND name IS NOT NULL;
