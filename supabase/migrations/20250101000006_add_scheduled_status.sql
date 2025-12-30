-- Add 'scheduled' to review_cycles status constraint
ALTER TABLE review_cycles DROP CONSTRAINT IF EXISTS review_cycles_status_check;

ALTER TABLE review_cycles ADD CONSTRAINT review_cycles_status_check
CHECK (status IN ('active', 'scheduled', 'completed', 'cancelled'));
