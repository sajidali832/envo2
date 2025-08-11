
'use server'

import { supabaseAdmin } from "@/lib/supabaseClient";
import { revalidatePath } from "next/cache";

export async function updateUserBalance(userId: string, newBalance: number) {
    if (!supabaseAdmin) {
        throw new Error('Admin client not available. Ensure SUPABASE_SERVICE_KEY is set in your environment variables.');
    }
    
    if (!userId) {
        throw new Error('User ID is required to update balance.');
    }

    const { error } = await supabaseAdmin
        .from('profiles')
        .update({ total_earnings: newBalance })
        .eq('id', userId);
    
    if (error) {
        console.error('Error updating balance in action:', error);
        throw new Error(`Failed to update balance: ${error.message}`);
    }

    revalidatePath('/admin/users');
}

export async function toggleUserBlock(userId: string, newStatus: 'active' | 'blocked') {
    if (!supabaseAdmin) {
        throw new Error('Admin client not available.');
    }

    if (!userId) {
        throw new Error('User ID is required.');
    }

    const { error } = await supabaseAdmin
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', userId);

    if (error) {
        console.error(`Error ${newStatus === 'blocked' ? 'blocking' : 'unblocking'} user:`, error);
        throw new Error(`Failed to ${newStatus} user: ${error.message}`);
    }

    revalidatePath('/admin/users');
}
