
-- Allow anonymous users to upload to the 'screenshots' folder in the 'investments' bucket.
CREATE POLICY "Allow anonymous upload to screenshots"
ON storage.objects FOR INSERT TO anon
WITH CHECK (
    bucket_id = 'investments' AND
    (storage.foldername(name))[1] = 'screenshots'
);

-- Allow authenticated users to view their own screenshots.
-- This might not be strictly necessary if they are deleted after review, but is good practice.
CREATE POLICY "Allow users to view their own screenshots"
ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'investments' AND
    (storage.foldername(name))[1] = 'screenshots' AND
    owner = auth.uid()
);

-- Allow admins (or service_role) to delete any screenshot.
-- The RLS for service_role is bypassed by default, but this policy makes it explicit for other admin roles if needed.
CREATE POLICY "Allow admin to delete any screenshot"
ON storage.objects FOR DELETE TO service_role
USING (
    bucket_id = 'investments' AND
    (storage.foldername(name))[1] = 'screenshots'
);

-- Allow admins to view any screenshot.
CREATE POLICY "Allow admin to view any screenshot"
ON storage.objects FOR SELECT TO service_role
USING (
    bucket_id = 'investments' AND
    (storage.foldername(name))[1] = 'screenshots'
);
