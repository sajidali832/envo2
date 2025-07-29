-- supabase/migrations/20240602000000_fix_referral_logic.sql

-- Drop the old, faulty function if it exists to ensure a clean slate
DROP FUNCTION IF EXISTS public.finalize_registration_with_bonus(integer,uuid,character varying);

-- Create the new, corrected function
CREATE OR REPLACE FUNCTION public.finalize_registration_with_bonus(
    p_investment_id integer,
    p_new_user_id uuid,
    p_referral_code character varying
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_referrer_id uuid;
    v_new_user_bonus numeric := 200; -- Bonus for the new user
    v_referrer_bonus numeric := 200; -- Bonus for the referrer
BEGIN
    -- Step 1: Link the investment to the new user and mark as registered
    UPDATE public.investments
    SET user_id = p_new_user_id,
        status = 'registered'
    WHERE id = p_investment_id;

    -- Step 2: Initialize new user's earnings with their sign-up bonus
    UPDATE public.profiles
    SET total_earnings = total_earnings + v_new_user_bonus
    WHERE id = p_new_user_id;

    -- Create history for the new user's bonus
    INSERT INTO public.earning_history (user_id, description, amount)
    VALUES (p_new_user_id, 'Registration Bonus', v_new_user_bonus);

    -- Step 3: If a valid referral code was provided, process the bonus for the referrer
    IF p_referral_code IS NOT NULL AND p_referral_code <> '' THEN
        -- Find the referrer by their referral code
        SELECT id INTO v_referrer_id
        FROM public.profiles
        WHERE referral_code = p_referral_code
        LIMIT 1;

        -- If a referrer was found, apply their bonus and update their stats
        IF v_referrer_id IS NOT NULL THEN
            -- Update the new user's profile to link them to the referrer
            UPDATE public.profiles
            SET referred_by = v_referrer_id
            WHERE id = p_new_user_id;

            -- Update the referrer's profile: increment referrals and add bonus
            UPDATE public.profiles
            SET 
                total_referrals = total_referrals + 1,
                total_earnings = total_earnings + v_referrer_bonus,
                referral_bonus_total = referral_bonus_total + v_referrer_bonus
            WHERE id = v_referrer_id;

            -- Create an earning history record for the referrer's bonus
            INSERT INTO public.earning_history (user_id, description, amount)
            VALUES (v_referrer_id, 'Referral Bonus', v_referrer_bonus);
        END IF;
    END IF;
END;
$$;
