
'use server'

import { supabaseAdmin } from "@/lib/supabaseClient";

export async function processApproval(investmentId: number, newStatus: 'approved' | 'rejected', screenshotUrl: string) {
    if (!supabaseAdmin) {
        throw new Error("Admin client not available. Ensure SUPABASE_SERVICE_KEY is set in your environment variables.");
    }

    // 1. Update investment status
    const { error: updateError } = await supabaseAdmin
        .from('investments')
        .update({ status: newStatus })
        .eq('id', investmentId);

    if (updateError) {
        throw new Error(`Failed to update status: ${updateError.message}`);
    }

    // 2. Delete screenshot from storage using the admin client, regardless of status
    if (screenshotUrl) {
        try {
            // Extract the file path from the full URL
            const url = new URL(screenshotUrl);
            const filePath = url.pathname.split('/object/public/investments/')[1];
            
            if (filePath) {
                const { error: storageError } = await supabaseAdmin.storage
                    .from('investments')
                    .remove([filePath]);

                if (storageError) {
                    // Log a warning but don't block the process. The main goal is updating the status.
                    console.warn(`Failed to delete screenshot, but continuing. Path: ${filePath}, Error: ${storageError.message}`);
                }
            }
        } catch (e: any) {
            console.warn(`Error parsing screenshot URL for deletion: ${e.message}`);
        }
    }
}
