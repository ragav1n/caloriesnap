'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import { Link } from 'lucide-react';
import { Profile, Log } from '@/types';

export function DataSync() {
    const setProfile = useStore((state) => state.setProfile);
    const setLogs = useStore((state) => state.setLogs);

    useEffect(() => {
        const syncData = async () => {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) return; // Middleware should handle redirect, but safe check

            // 1. Fetch Profile
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profileData) {
                setProfile(profileData as Profile);
            } else if (profileError) {
                console.error('Error fetching profile:', profileError);
            }

            // 2. Fetch Logs
            const { data: logsData, error: logsError } = await supabase
                .from('logs')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (logsData) {
                setLogs(logsData as Log[]);
            } else if (logsError) {
                console.error('Error fetching logs:', logsError);
            }
        };

        syncData();
    }, [setProfile, setLogs]);

    return null; // This component renders nothing
}
