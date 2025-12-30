-- Fix invitations that are still PENDING but the user already exists
UPDATE invitations
SET status = 'ACCEPTED', accepted_at = NOW()
WHERE status = 'PENDING'
AND email IN (SELECT email FROM users);
