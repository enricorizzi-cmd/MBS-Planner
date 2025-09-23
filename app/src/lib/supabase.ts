import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: 'admin' | 'project_manager' | 'amministrazione' | 'titolare';
          partner_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          role: 'admin' | 'project_manager' | 'amministrazione' | 'titolare';
          partner_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: 'admin' | 'project_manager' | 'amministrazione' | 'titolare';
          partner_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      partners: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      students: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          partner_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          email: string;
          phone?: string | null;
          partner_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          phone?: string | null;
          partner_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      companies: {
        Row: {
          id: string;
          name: string;
          address: string | null;
          phone: string | null;
          email: string | null;
          partner_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          address?: string | null;
          phone?: string | null;
          email?: string | null;
          partner_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          address?: string | null;
          phone?: string | null;
          email?: string | null;
          partner_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      supervisors: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          company_id: string;
          partner_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          email: string;
          phone?: string | null;
          company_id: string;
          partner_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          phone?: string | null;
          company_id?: string;
          partner_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};

