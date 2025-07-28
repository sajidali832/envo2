'use server'

import { supabaseAdmin } from "@/lib/supabaseClient";
import { revalidatePath } from "next/cache";

export async function updateUserBalance(userId: string, newBalance: number) {
    if (!supabaseAdmin) {
        throw new Error('Admin client not available');
    }

    const { error } = await supabaseAdmin
        .from('profiles')
        .update({ total_earnings: newBalance })
        .eq('id', userId);
    
    if (error) {
        throw new Error(error.message);
    }

    revalidatePath('/admin/users');
}
