-- Enable access to storage buckets
CREATE POLICY "Allow authenticated users to upload media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'media' AND
    (
        CASE WHEN regexp_matches((storage.foldername(name))[1], '^songs/') THEN
            octet_length(decode(regexp_replace(regexp_replace(replace(replace(encode(object, 'base64'), E'\n', ''), E'\r', ''), '["]', ''), '["]$', ''), 'base64')) <= 20971520  -- 20MB
        WHEN regexp_matches((storage.foldername(name))[1], '^images/') THEN
            octet_length(decode(regexp_replace(regexp_replace(replace(replace(encode(object, 'base64'), E'\n', ''), E'\r', ''), '["]', ''), '["]$', ''), 'base64')) <= 5242880  -- 5MB
        ELSE false
        END
    )
);

CREATE POLICY "Allow authenticated users to read media"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'media');

CREATE POLICY "Allow authenticated users to update their media"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Allow authenticated users to delete their media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name)
VALUES ('media', 'media')
ON CONFLICT (id) DO NOTHING;

-- Set bucket configuration
UPDATE storage.buckets
SET public = false,
    file_size_limit = 20971520, -- 20MB
    allowed_mime_types = ARRAY['audio/*', 'image/*']
WHERE id = 'media';