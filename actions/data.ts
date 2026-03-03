import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import { Log, Profile } from '@/types';

// Helper to access store outside of components (optional, but cleaner to pass setters or use store inside components)
// For these actions, we'll return the result and let the component update the store, 
// OR we can import the store directly if we want to centralize logic.
// Zustand store can be used outside components via getState() / setState()

import { FoodLogSchema } from '@/lib/schemas';

// ... (helper comments)

export const addUserLog = async (log: Log) => {

    const validation = FoodLogSchema.safeParse(log);

    if (!validation.success) {
        console.error('Validation Error:', validation.error.flatten());
        return { error: validation.error.errors[0].message };
    }

    const { error } = await supabase.from('logs').insert([validation.data]);

    if (error) {
        console.error('Error adding log:', error);
        return { error };
    }

    // specific to Zustand: we can update it here directly
    useStore.getState().addLog(log);
    { return { success: true }; }
};

export const deleteUserLog = async (id: string) => {
    const { error } = await supabase.from('logs').delete().eq('id', id);

    if (error) {
        console.error('Error deleting log:', error);
        return { error };
    }

    useStore.getState().removeLog(id);
    return { success: true };
};

export const updateUserProfile = async (id: string, updates: Partial<Profile>) => {
    // 1. Update Profile Table
    const { error } = await supabase.from('profiles').update(updates).eq('id', id);

    if (error) {
        console.error('Error updating profile:', JSON.stringify(error, null, 2));
        return { error };
    }

    // 2. Sync with Auth Metadata if full_name is present
    if (updates.full_name) {
        const { error: authError } = await supabase.auth.updateUser({
            data: { full_name: updates.full_name }
        });

        if (authError) {
            console.error('Error updating auth metadata:', authError);
            // We don't necessarily want to fail the whole operation if metadata sync fails,
            // but logging it is important.
        }
    }

    // 3. Update local store
    const currentProfile = useStore.getState().profile;
    if (currentProfile) {
        useStore.getState().setProfile({ ...currentProfile, ...updates });
    }
    return { success: true };
};
