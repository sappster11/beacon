-- Review Workflow Migration
-- Implements multi-step review process with visibility controls

-- Add new workflow tracking columns to reviews table
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS self_review_submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS manager_review_submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS shared_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS skip_level_approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS skip_level_approver_id UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS auto_approved BOOLEAN DEFAULT FALSE;

-- Create index for skip level approver
CREATE INDEX IF NOT EXISTS idx_reviews_skip_level_approver ON reviews(skip_level_approver_id);

-- Update status check constraint to new workflow values
-- First, migrate existing data to valid new statuses
UPDATE reviews SET status = 'COMPLETED' WHERE status = 'CALIBRATED';
UPDATE reviews SET status = 'SELF_REVIEW' WHERE status = 'NOT_STARTED';
UPDATE reviews SET status = 'MANAGER_REVIEW' WHERE status = 'IN_PROGRESS';

-- Drop old constraint and add new one
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_status_check;
ALTER TABLE reviews ADD CONSTRAINT reviews_status_check
  CHECK (status IN ('SELF_REVIEW', 'MANAGER_REVIEW', 'READY_TO_SHARE', 'SHARED', 'ACKNOWLEDGED', 'PENDING_APPROVAL', 'COMPLETED'));
