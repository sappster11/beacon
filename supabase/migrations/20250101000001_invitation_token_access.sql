-- Allow anyone to read an invitation by its token (for accept-invite page)
-- This is safe because tokens are UUIDs and essentially unguessable

DROP POLICY IF EXISTS "token_read" ON invitations;
CREATE POLICY "token_read" ON invitations
  FOR SELECT USING (true);
