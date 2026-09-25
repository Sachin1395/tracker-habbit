import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export type Profile = {
  id: string;
  name: string;
  email: string;
  created_at: string;
};

export type Task = {
  id: string;
  user_id: string;
  task_name: string;
  xp: 5 | 10 | 15 | 20 | 25;
  task_date: string;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
};

export type TaskWithProfile = Task & {
  profiles: { name: string } | null;
};

export const XP_VALUES = [5, 10, 15, 20, 25] as const;
