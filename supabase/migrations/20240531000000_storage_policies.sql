
-- Drop existing policies if they exist, to ensure a clean slate.
DROP POLICY IF EXISTS "Allow public read access to screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous uploads to screenshots" ON storage.objects;

-- Create a policy that allows public (anonymous) read access to files in the 'screenshots' folder.
CREATE POLICY "Allow public read access to screenshots"
ON storage.objects FOR SELECT
USING ( bucket_id = 'investments' AND (storage.folder(name))[1] = 'screenshots' );

-- Create a policy that allows any user (authenticated or anonymous) to upload to the 'screenshots' folder.
CREATE POLICY "Allow anonymous uploads to screenshots"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'investments' AND (storage.folder(name))[1] = 'screenshots' );
