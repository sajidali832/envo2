-- Create the earning_history table
CREATE TABLE IF NOT EXISTS public.earning_history (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    description text NOT NULL,
    amount numeric(10, 2) NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.earning_history ENABLE ROW LEVEL SECURITY;

-- Policies for earning_history
CREATE POLICY "Users can view their own earning history"
ON public.earning_history
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service roles can do anything"
ON public.earning_history
FOR ALL
USING (true)
WITH CHECK (true);


-- Create the function to add daily credit
CREATE OR REPLACE FUNCTION public.add_daily_credit_to_all_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_record record;
BEGIN
    FOR user_record IN SELECT id FROM public.profiles LOOP
        -- Add 200 PKR to total_earnings
        UPDATE public.profiles
        SET total_earnings = total_earnings + 200
        WHERE id = user_record.id;

        -- Insert a record into earning_history
        INSERT INTO public.earning_history (user_id, description, amount)
        VALUES (user_record.id, 'Daily Credit Bonus', 200);
    END LOOP;
END;
$$;

-- Grant execute permission to service_role
GRANT EXECUTE ON FUNCTION public.add_daily_credit_to_all_users() TO service_role;

-- Schedule the job with pg_cron
-- This runs every day at midnight (00:00) UTC.
SELECT cron.schedule('daily-credit-job', '0 0 * * *', 'SELECT public.add_daily_credit_to_all_users()');


-- Create function to finalize registration and apply referral bonus
CREATE OR REPLACE FUNCTION public.finalize_registration_with_bonus(
    p_investment_id bigint,
    p_new_user_id uuid,
    p_referral_code text
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    referrer_id uuid;
    referrer_exists boolean;
BEGIN
    -- Link the investment to the new user
    UPDATE public.investments
    SET user_id = p_new_user_id
    WHERE id = p_investment_id;

    -- Check if a valid referral code was provided
    IF p_referral_code IS NOT NULL AND p_referral_code <> '' THEN
        -- Find the referrer
        SELECT id INTO referrer_id
        FROM public.profiles
        WHERE referral_code = p_referral_code
        LIMIT 1;

        -- If a referrer was found
        IF referrer_id IS NOT NULL THEN
            -- Update the new user's profile with who referred them
            UPDATE public.profiles
            SET referred_by = referrer_id
            WHERE id = p_new_user_id;

            -- Give the new user their 200 PKR bonus
            UPDATE public.profiles
            SET total_earnings = total_earnings + 200
            WHERE id = p_new_user_id;
            
            INSERT INTO public.earning_history (user_id, description, amount)
            VALUES (p_new_user_id, 'Referral Sign-up Bonus', 200);


            -- Give the referrer their 200 PKR bonus and increment their referral count
            UPDATE public.profiles
            SET 
                total_referrals = total_referrals + 1,
                referral_bonus_total = referral_bonus_total + 200,
                total_earnings = total_earnings + 200
            WHERE id = referrer_id;

            INSERT INTO public.earning_history (user_id, description, amount)
            VALUES (referrer_id, 'Referral Bonus for inviting a new user', 200);

        END IF;
    END IF;
END;
$$;

-- Create the trigger function
CREATE OR REPLACE FUNCTION public.create_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, referral_code)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'full_name',
        NEW.email,
        NEW.raw_user_meta_data->>'referral_code'
    );
    RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.create_user_profile();
