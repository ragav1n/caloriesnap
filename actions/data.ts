import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import { Log, Profile } from '@/types';

// Helper to access store outside of components (optional, but cleaner to pass setters or use store inside components)
// For these actions, we'll return the result and let the component update the store, 
// OR we can import the store directly if we want to centralize logic.
// Zustand store can be used outside components via getState() / setState()

export const addUserLog = async (log: Log) => {
    const { error } = await supabase.from('logs').insert([{
        id: log.id,
        user_id: log.user_id,
        food_name: log.food_name,
        calories: log.calories,
        protein: log.protein,
        carbs: log.carbs,
        fats: log.fats,
        meal_type: log.meal_type,
        created_at: log.created_at
    }]);

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
    const { error } = await supabase.from('profiles').update(updates).eq('id', id);

    if (error) {
        console.error('Error updating profile:', error);
        return { error };
    }

    // We need to merge the updates with the current profile in the store
    const currentProfile = useStore.getState().profile;
    if (currentProfile) {
        useStore.getState().setProfile({ ...currentProfile, ...updates });
    }
    return { success: true };
};
