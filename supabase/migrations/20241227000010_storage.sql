-- Storage buckets for file uploads

-- Profile pictures bucket (public - anyone can view)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-pictures',
  'profile-pictures',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);

-- Transcripts bucket (private - only meeting participants)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'transcripts',
  'transcripts',
  false,
  52428800, -- 50MB
  ARRAY['text/plain', 'application/pdf', 'text/vtt', 'text/srt']
);

-- Storage RLS policies

-- Profile pictures: Anyone can view (public bucket)
CREATE POLICY "public_read_profile_pictures"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-pictures');

-- Profile pictures: Users can upload to their own folder
CREATE POLICY "users_upload_own_profile_picture"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-pictures'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Profile pictures: Users can update their own
CREATE POLICY "users_update_own_profile_picture"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profile-pictures'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Profile pictures: Users can delete their own
CREATE POLICY "users_delete_own_profile_picture"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profile-pictures'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Transcripts: Only meeting participants can access
CREATE POLICY "meeting_participants_read_transcripts"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'transcripts'
  AND EXISTS (
    SELECT 1 FROM one_on_ones
    WHERE id::text = (storage.foldername(name))[1]
    AND (manager_id = auth.uid() OR employee_id = auth.uid())
  )
);

-- Transcripts: Meeting participants can upload
CREATE POLICY "meeting_participants_upload_transcripts"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'transcripts'
  AND EXISTS (
    SELECT 1 FROM one_on_ones
    WHERE id::text = (storage.foldername(name))[1]
    AND (manager_id = auth.uid() OR employee_id = auth.uid())
  )
);

-- Transcripts: Meeting participants can delete
CREATE POLICY "meeting_participants_delete_transcripts"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'transcripts'
  AND EXISTS (
    SELECT 1 FROM one_on_ones
    WHERE id::text = (storage.foldername(name))[1]
    AND (manager_id = auth.uid() OR employee_id = auth.uid())
  )
);
