
-- 1. Create investments table
CREATE TABLE IF NOT EXISTS public.investments (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    user_name text NOT NULL,
    email text NOT NULL,
    user_account_number text,
    screenshot_url text,
    status text NOT NULL DEFAULT 'pending', -- pending, approved, rejected
    submitted_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 2. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text,
    referral_code text UNIQUE,
    referred_by uuid REFERENCES auth.users(id),
    total_earnings numeric DEFAULT 0,
    total_referrals integer DEFAULT 0,
    referral_bonus_total numeric DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);

-- 3. Create earning_history table
CREATE TABLE IF NOT EXISTS public.earning_history (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount numeric NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 4. Create withdrawal_accounts table
CREATE TABLE IF NOT EXISTS public.withdrawal_accounts (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    method text, -- e.g., Easypaisa, JazzCash
    account_name text,
    account_number text
);

-- 5. Create withdrawals table
CREATE TABLE IF NOT EXISTS public.withdrawals (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount numeric NOT NULL,
    method text,
    account_info jsonb,
    status text DEFAULT 'pending', -- pending, approved, rejected
    requested_at timestamp with time zone DEFAULT now() NOT NULL
);


-- 6. Enable Row Level Security for all tables
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.earning_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;


-- 7. Create RLS policies
-- Allow anyone to create an investment record
CREATE POLICY "Allow public insert for investments" ON public.investments FOR INSERT WITH CHECK (true);
-- Allow users to view their own profile
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
-- Allow users to see their own earning history
CREATE POLICY "Users can view their own earning history" ON public.earning_history FOR SELECT USING (auth.uid() = user_id);
-- Allow users to manage their own withdrawal accounts
CREATE POLICY "Users can manage their own withdrawal accounts" ON public.withdrawal_accounts FOR ALL USING (auth.uid() = user_id);
-- Allow users to manage their own withdrawal requests
CREATE POLICY "Users can manage their own withdrawals" ON public.withdrawals FOR ALL USING (auth.uid() = user_id);


-- 8. Create Storage Bucket and Policies
-- Note: Bucket creation itself is often done via the Supabase UI, but we add policies here.
-- Assuming 'investments' bucket exists. If not, it needs to be created.
-- Policy to allow anyone to view screenshots
CREATE POLICY "Allow public read access to screenshots" ON storage.objects FOR SELECT USING (bucket_id = 'investments' AND (storage.foldername(name))[1] = 'screenshots');
-- Policy to allow anyone to upload screenshots
CREATE POLICY "Allow public upload access to screenshots" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'investments' AND (storage.foldername(name))[1] = 'screenshots');


-- 9. Create Functions and Triggers
-- Function to create a profile for a new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, referral_code)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'referral_code');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run the function when a new user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to finalize registration, link investment, and apply bonuses
CREATE OR REPLACE FUNCTION public.finalize_registration_with_bonus(p_investment_id bigint, p_new_user_id uuid, p_referral_code text)
RETURNS void AS $$
DECLARE
  referrer_id uuid;
  bonus_amount numeric := 200;
  new_user_initial_bonus numeric := 200;
BEGIN
  -- Link user_id to the investment record
  UPDATE public.investments
  SET user_id = p_new_user_id
  WHERE id = p_investment_id;

  -- If a referral code was used, find the referrer
  IF p_referral_code IS NOT NULL THEN
    SELECT id INTO referrer_id FROM public.profiles WHERE referral_code = p_referral_code;

    -- If referrer is found, apply bonuses
    IF referrer_id IS NOT NULL THEN
      -- Update referrer's profile
      UPDATE public.profiles
      SET
        total_referrals = total_referrals + 1,
        total_earnings = total_earnings + bonus_amount,
        referral_bonus_total = referral_bonus_total + bonus_amount,
        referred_by = referrer_id -- Set who referred the new user
      WHERE id = p_new_user_id;

      -- Add earning history for referrer
      INSERT INTO public.earning_history (user_id, amount, description)
      VALUES (referrer_id, bonus_amount, 'Referral bonus from new user registration.');

      -- Add bonus to new user for being referred
      UPDATE public.profiles
      SET total_earnings = total_earnings + new_user_initial_bonus
      WHERE id = p_new_user_id;

      -- Add earning history for new user's bonus
      INSERT INTO public.earning_history (user_id, amount, description)
      VALUES (p_new_user_id, new_user_initial_bonus, 'Welcome bonus for using a referral code.');
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 10. Schedule Daily Credits with pg_cron
-- Ensure pg_cron is enabled in your Supabase project (Dashboard > Database > Extensions)
-- Function to be called by the cron job
CREATE OR REPLACE FUNCTION public.apply_daily_credits()
RETURNS void AS $$
BEGIN
  -- Add 200 to total_earnings for every user
  UPDATE public.profiles
  SET total_earnings = total_earnings + 200;

  -- Insert a record into earning_history for each user
  INSERT INTO public.earning_history (user_id, amount, description)
  SELECT id, 200, 'Daily credit bonus' FROM public.profiles;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule the job to run every day at midnight UTC (00:00)
-- This command must be run from the Supabase SQL Editor once, as migrations cannot grant cron scheduling permissions.
-- SELECT cron.schedule('daily-credit-job', '0 0 * * *', 'SELECT public.apply_daily_credits()');

