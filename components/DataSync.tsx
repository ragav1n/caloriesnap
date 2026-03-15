'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import { Profile, Log, ActivityLog } from '@/types';
import { toast } from 'sonner';

export function DataSync() {
    const setProfile = useStore((state) => state.setProfile);
    const setLogs = useStore((state) => state.setLogs);
    const setActivityLogs = useStore((state) => state.setActivityLogs);
    const setIsLoading = useStore((state) => state.setIsLoading);

    useEffect(() => {
        const syncData = async (userId: string) => {
            // Fetch Profile
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (profileData) {
                setProfile(profileData as Profile);
            } else if (profileError) {
                console.error('Error fetching profile:', profileError);
                toast.error('Failed to load your profile. Please refresh.');
            }

            // Fetch Logs
            const { data: logsData, error: logsError } = await supabase
                .from('logs')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (logsData) {
                setLogs(logsData as Log[]);
            } else if (logsError) {
                console.error('Error fetching logs:', logsError);
                toast.error('Failed to load food logs. Please refresh.');
            }

            // Fetch Activity Logs
            const { data: activityLogsData, error: activityLogsError } = await supabase
                .from('activity_logs')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (activityLogsData) {
                setActivityLogs(activityLogsData as ActivityLog[]);
            } else if (activityLogsError) {
                console.error('Error fetching activity logs:', activityLogsError);
                toast.error('Failed to load activity logs. Please refresh.');
            }

            setIsLoading(false);
        };

        // Initial sync
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) syncData(user.id);
            else setIsLoading(false);
        });

        // Re-sync on auth state changes (e.g. token refresh, user switch)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                setIsLoading(true);
                syncData(session.user.id);
            }
        });

        return () => subscription.unsubscribe();
    }, [setProfile, setLogs, setActivityLogs, setIsLoading]);

    return null;
}
