
-- Enable Row Level Security for storage objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for the 'investments' bucket to avoid conflicts
DROP POLICY IF EXISTS "Allow public uploads to screenshots folder" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to screenshots" ON storage.objects;


-- Create a policy to allow anonymous (public) users to UPLOAD to the 'screenshots' folder.
CREATE POLICY "Allow public uploads to screenshots folder"
ON storage.objects FOR INSERT
TO public
WITH CHECK (
    bucket_id = 'investments' AND
    (storage.foldername(name))[1] = 'screenshots'
);


-- Create a policy to allow anonymous (public) users to VIEW files in the 'screenshots' folder.
-- This is crucial for the admin panel to be able to display the images.
CREATE POLICY "Allow public read access to screenshots"
ON storage.objects FOR SELECT
TO public
USING (
    bucket_id = 'investments' AND
    (storage.foldername(name))[1] = 'screenshots'
);
