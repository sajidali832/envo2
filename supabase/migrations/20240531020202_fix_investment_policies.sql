
-- Enable Row Level Security for the 'investments' table if it's not already
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh and avoid conflicts
DROP POLICY IF EXISTS "Allow public insert for investments" ON public.investments;
DROP POLICY IF EXISTS "Allow anon to upload to screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon to read screenshots" ON storage.objects;

-- Create a new policy to allow any user (including unauthenticated ones)
-- to insert a new record into the 'investments' table.
CREATE POLICY "Allow public insert for investments"
ON public.investments
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Create a policy to allow any user (including unauthenticated ones)
-- to upload files into the 'screenshots' folder within the 'investments' bucket.
CREATE POLICY "Allow anon to upload to screenshots"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (
    bucket_id = 'investments' AND
    (storage.folder(name))[1] = 'screenshots'
);

-- Create a policy to allow any user (including unauthenticated ones)
-- to view/read files from the 'screenshots' folder.
CREATE POLICY "Allow anon to read screenshots"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (
    bucket_id = 'investments' AND
    (storage.folder(name))[1] = 'screenshots'
);
