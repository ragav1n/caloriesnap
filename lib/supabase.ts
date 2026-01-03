import { createClient as createBrowserClient } from './supabase/client';

export const createClient = () => createBrowserClient();

// Singleton for backward compatibility
export const supabase = createClient();
