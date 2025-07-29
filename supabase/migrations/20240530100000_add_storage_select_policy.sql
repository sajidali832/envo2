
-- Policy to allow public read access to screenshots
-- This allows anyone with the URL to view the image, which is necessary
-- for the admin panel to display them without requiring special authentication tokens.
-- The URLs themselves are not guessable, providing a layer of security.

CREATE POLICY "Allow public select on screenshots"
ON storage.objects FOR SELECT
USING ( bucket_id = 'investments' AND (storage.foldername(name))[1] = 'screenshots' );
