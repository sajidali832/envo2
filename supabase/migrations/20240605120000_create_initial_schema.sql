-- Enable pg_cron extension
create extension if not exists pg_cron with schema extensions;

-- Create core tables
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name character varying,
    referral_code character varying UNIQUE,
    referred_by uuid REFERENCES public.profiles(id),
    total_earnings numeric DEFAULT 0,
    total_referrals integer DEFAULT 0,
    referral_bonus_total numeric DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE TABLE IF NOT EXISTS public.investments (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    user_name character varying,
    email character varying,
    user_account_number character varying,
    screenshot_url text,
    status character varying DEFAULT 'pending',
    submitted_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public insert for all." ON public.investments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read access." ON public.investments FOR SELECT USING (true);
CREATE POLICY "Allow admin update." ON public.investments FOR UPDATE USING (true);
CREATE POLICY "Allow admin delete." ON public.investments FOR DELETE USING (true);


CREATE TABLE IF NOT EXISTS public.withdrawal_accounts (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    method character varying,
    account_name character varying,
    account_number character varying,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id)
);
ALTER TABLE public.withdrawal_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own withdrawal accounts." ON public.withdrawal_accounts FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.withdrawals (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount numeric,
    method character varying,
    account_info jsonb,
    status character varying DEFAULT 'pending',
    requested_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own withdrawals." ON public.withdrawals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all withdrawals." ON public.withdrawals FOR SELECT USING (true);


CREATE TABLE IF NOT EXISTS public.earning_history (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    description text,
    amount numeric,
    created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.earning_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own earning history." ON public.earning_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow admin read access." ON public.earning_history FOR SELECT USING (true);

-- Create storage bucket and policies
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('investments', 'investments', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow public read access on investments" ON storage.objects FOR SELECT TO public USING (bucket_id = 'investments');
CREATE POLICY "Allow public upload on investments screenshots" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'investments' AND name LIKE 'screenshots/%');
CREATE POLICY "Allow admin full access to investments" ON storage.objects FOR ALL USING (bucket_id = 'investments');


-- Create user setup function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, referral_code)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'referral_code');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user setup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create registration finalization function with referral logic
CREATE OR REPLACE FUNCTION public.finalize_registration_with_bonus(p_investment_id bigint, p_new_user_id uuid, p_referral_code text)
RETURNS void AS $$
DECLARE
  v_referrer_id uuid;
  v_new_user_bonus numeric := 200;
  v_referrer_bonus numeric := 200;
BEGIN
  -- Link investment to the new user
  UPDATE public.investments
  SET user_id = p_new_user_id, status = 'registered'
  WHERE id = p_investment_id;

  -- Grant bonus to the new user for signing up
  UPDATE public.profiles
  SET total_earnings = total_earnings + v_new_user_bonus
  WHERE id = p_new_user_id;

  INSERT INTO public.earning_history (user_id, description, amount)
  VALUES (p_new_user_id, 'Registration Bonus', v_new_user_bonus);

  -- Handle referral bonus if a valid code was provided
  IF p_referral_code IS NOT NULL THEN
    SELECT id INTO v_referrer_id FROM public.profiles WHERE referral_code = p_referral_code;
    
    IF v_referrer_id IS NOT NULL THEN
      -- Update referrer's earnings and referral count
      UPDATE public.profiles
      SET 
        total_earnings = total_earnings + v_referrer_bonus,
        total_referrals = total_referrals + 1,
        referral_bonus_total = referral_bonus_total + v_referrer_bonus
      WHERE id = v_referrer_id;

      -- Create earning history for the referrer
      INSERT INTO public.earning_history (user_id, description, amount)
      VALUES (v_referrer_id, 'Referral Bonus', v_referrer_bonus);

      -- Update the new user's profile to link them to the referrer
      UPDATE public.profiles
      SET referred_by = v_referrer_id
      WHERE id = p_new_user_id;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create daily credit function
CREATE OR REPLACE FUNCTION public.apply_daily_credit()
RETURNS void AS $$
DECLARE
  user_record record;
  daily_bonus numeric := 200;
BEGIN
  FOR user_record IN SELECT id FROM public.profiles LOOP
    UPDATE public.profiles
    SET total_earnings = total_earnings + daily_bonus
    WHERE id = user_record.id;

    INSERT INTO public.earning_history (user_id, description, amount)
    VALUES (user_record.id, 'Daily Credit', daily_bonus);
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Schedule daily credit job using pg_cron
-- Run every day at midnight UTC (0 0 * * *)
SELECT cron.schedule('daily-credit-job', '0 0 * * *', 'SELECT public.apply_daily_credit()');
