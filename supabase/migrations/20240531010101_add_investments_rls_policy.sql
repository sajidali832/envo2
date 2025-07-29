-- Enable Row-Level Security on the 'investments' table if not already enabled
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;

-- Drop any existing insert policy for anon users to avoid conflicts
DROP POLICY IF EXISTS "Allow public insert for investments" ON public.investments;

-- Create a new policy that allows any user (including unauthenticated ones) to insert into the investments table.
CREATE POLICY "Allow public insert for investments"
ON public.investments
FOR INSERT
WITH CHECK (true);
