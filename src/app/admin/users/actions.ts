
'use server'

import { supabaseAdmin } from "@/lib/supabaseClient";
import { revalidatePath } from "next/cache";

export async function updateUserBalance(userId: string, newBalance: number) {
    if (!supabaseAdmin) {
        throw new Error('Admin client not available. Ensure SUPABASE_SERVICE_KEY is set in your environment variables.');
    }
    
    // Ensure userId is provided and is a valid UUID format if needed
    if (!userId) {
        throw new Error('User ID is required to update balance.');
    }

    const { error } = await supabaseAdmin
        .from('profiles')
        .update({ total_earnings: newBalance })
        .eq('id', userId); // Strictly match on the unique user ID
    
    if (error) {
        console.error('Error updating balance in action:', error);
        throw new Error(`Failed to update balance: ${error.message}`);
    }

    // Revalidate the path to ensure the UI updates with the new data
    revalidatePath('/admin/users');
}
