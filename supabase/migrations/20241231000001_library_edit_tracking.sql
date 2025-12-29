-- Add edit tracking fields to library tables

-- Add updated_by to goal_library
ALTER TABLE goal_library ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id);

-- Add updated_by to competency_library
ALTER TABLE competency_library ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id);

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_goal_library_updated_by ON goal_library(updated_by);
CREATE INDEX IF NOT EXISTS idx_competency_library_updated_by ON competency_library(updated_by);
