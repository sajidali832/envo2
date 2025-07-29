
'use server'

import { supabaseAdmin } from "@/lib/supabaseClient";

export async function processApproval(investmentId: number, newStatus: 'approved' | 'rejected', screenshotUrl: string) {
    if (!supabaseAdmin) throw new Error("Admin client not available");

    // 1. Update investment status
    const { error: updateError } = await supabaseAdmin
        .from('investments')
        .update({ status: newStatus })
        .eq('id', investmentId);

    if (updateError) {
        throw new Error(`Failed to update status: ${updateError.message}`);
    }

    // 2. Delete screenshot from storage using the admin client
    if (screenshotUrl) {
        try {
            const urlParts = screenshotUrl.split('/');
            const fileName = urlParts[urlParts.length - 1];
            const filePath = `screenshots/${fileName}`;
            
            if (fileName) {
                const { error: storageError } = await supabaseAdmin.storage
                    .from('investments')
                    .remove([filePath]);

                if (storageError) {
                    // Log a warning but don't block the process. The main goal is updating the status.
                    console.warn(`Failed to delete screenshot, but continuing: ${storageError.message}`);
                }
            }
        } catch (e) {
            console.warn(`Error parsing screenshot URL for deletion: ${e}`);
        }
    }
}
