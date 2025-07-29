
'use server';

import { supabaseAdmin } from "@/lib/supabaseClient";

export async function processInvestment(formData: FormData) {
    if (!supabaseAdmin) {
        return { error: 'Admin client not available. Deployment may be missing SUPABASE_SERVICE_KEY environment variable.' };
    }

    const fullName = formData.get('fullName') as string;
    const email = formData.get('email') as string;
    const accountNumber = formData.get('accountNumber') as string;
    const screenshot = formData.get('screenshot') as File;

    if (!fullName || !email || !accountNumber || !screenshot || screenshot.size === 0) {
        return { error: 'Please fill all fields and upload a screenshot.' };
    }
    
    try {
        // 1. Upload screenshot with admin client
        const fileExt = screenshot.name.split('.').pop();
        const fileName = `${email}-${Date.now()}.${fileExt}`;
        const filePath = `screenshots/${fileName}`;

        const { error: uploadError } = await supabaseAdmin.storage
            .from('investments')
            .upload(filePath, screenshot);

        if (uploadError) {
            console.error('Supabase upload error:', uploadError);
            throw new Error(`Failed to upload screenshot: ${uploadError.message}`);
        }

        // 2. Get public URL
        const { data: { publicUrl } } = supabaseAdmin.storage
            .from('investments')
            .getPublicUrl(filePath);
        
        if (!publicUrl) {
            throw new Error('Could not get public URL for the uploaded file.');
        }

        // 3. Insert investment record with admin client
        const { error: insertError } = await supabaseAdmin
            .from('investments')
            .insert({
                user_name: fullName,
                user_account_number: accountNumber,
                screenshot_url: publicUrl,
                status: 'pending',
                email: email,
            });

        if (insertError) {
             console.error('Supabase insert error:', insertError);
            throw new Error(`Failed to save submission: ${insertError.message}`);
        }

        return { success: true, error: null };

    } catch (error: any) {
        // In case of failure, attempt to delete the uploaded screenshot if it exists
        const filePath = `screenshots/${email}-${Date.now()}`; // Reconstruct a plausible filename to delete
        await supabaseAdmin.storage.from('investments').remove([filePath]);
        return { error: error.message };
    }
}
