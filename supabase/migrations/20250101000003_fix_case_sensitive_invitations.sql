-- Fix invitations with case-insensitive email matching
UPDATE invitations
SET status = 'ACCEPTED', accepted_at = NOW()
WHERE status = 'PENDING'
AND LOWER(email) IN (SELECT LOWER(email) FROM users);
