
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

serve(async (_req) => {
  try {
    // 1. Fetch all active users with their plans
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, plan, total_earnings')
      .eq('status', 'active');

    if (profileError) {
      throw new Error(`Error fetching profiles: ${profileError.message}`);
    }

    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ message: 'No active users to process.' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const earningsToInsert = [];
    const profilesToUpdate = [];

    for (const profile of profiles) {
      let dailyEarning = 0;
      // Plan-based earnings
      switch (profile.plan) {
        case 'basic':
          dailyEarning = 100; // Example for basic plan
          break;
        case 'standard':
          dailyEarning = 250; // Example for standard plan
          break;
        case 'premium':
            dailyEarning = 600; // Example for premium plan
            break;
        // 'free' or other plans get 0
      }

      if (dailyEarning > 0) {
        const newTotalEarnings = profile.total_earnings + dailyEarning;

        profilesToUpdate.push({
          id: profile.id,
          total_earnings: newTotalEarnings,
        });

        earningsToInsert.push({
          user_id: profile.id,
          amount: dailyEarning,
          type: 'daily_earning',
        });
      }
    }

    // 2. Batch update profiles with new earnings
    if (profilesToUpdate.length > 0) {
      // Supabase JS client doesn't support bulk updates returning data, so we loop.
      // This is acceptable within a serverless function context.
      for(const update of profilesToUpdate) {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ total_earnings: update.total_earnings })
            .eq('id', update.id);
          if (updateError) console.error(`Failed to update profile ${update.id}: ${updateError.message}`);
      }
    }

    // 3. Batch insert into earnings history
    if (earningsToInsert.length > 0) {
      const { error: historyError } = await supabase
        .from('earnings_history')
        .insert(earningsToInsert);

      if (historyError) {
        // Log this error but don't throw, as the main earnings were updated.
        console.error(`Failed to insert into earnings history: ${historyError.message}`);
      }
    }

    return new Response(JSON.stringify({ message: `Processed earnings for ${profilesToUpdate.length} users.` }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
