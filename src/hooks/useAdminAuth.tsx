import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

// Special admin email that always gets admin access
const SUPER_ADMIN_EMAILS = ['communitycodeday1@gmail.com'];

interface AdminUser {
  id: string;
  user_id: string;
  email: string;
  display_name: string;
  role: 'super_admin' | 'admin' | 'moderator';
  is_active: boolean;
  last_login: string | null;
}

interface AdminAuthContextType {
  user: User | null;
  adminUser: AdminUser | null;
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminStatus(session.user);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await checkAdminStatus(session.user);
      } else {
        setAdminUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (authUser: User) => {
    try {
      // First check by user_id
      let { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', authUser.id)
        .eq('is_active', true)
        .single();

      // If not found by user_id, check by email (for special admin emails)
      if ((error || !data) && authUser.email && SUPER_ADMIN_EMAILS.includes(authUser.email)) {
        // Try to find by email
        const { data: emailData, error: emailError } = await supabase
          .from('admin_users')
          .select('*')
          .eq('email', authUser.email)
          .eq('is_active', true)
          .single();

        if (!emailError && emailData) {
          // Update the admin_users record to link user_id
          await supabase
            .from('admin_users')
            .update({ user_id: authUser.id })
            .eq('id', emailData.id);
          
          data = { ...emailData, user_id: authUser.id };
          error = null;
        }
      }

      if (error || !data) {
        setAdminUser(null);
      } else {
        setAdminUser(data as AdminUser);
        // Update last login
        await supabase
          .from('admin_users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', data.id);
      }
    } catch (err) {
      console.error('Error checking admin status:', err);
      setAdminUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error };
    }

    if (data.user) {
      // Check if user is an admin (by user_id or email)
      let { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', data.user.id)
        .eq('is_active', true)
        .single();

      // If not found by user_id, check by email for special admin emails
      if ((adminError || !adminData) && SUPER_ADMIN_EMAILS.includes(email)) {
        const { data: emailAdminData, error: emailAdminError } = await supabase
          .from('admin_users')
          .select('*')
          .eq('email', email)
          .eq('is_active', true)
          .single();

        if (!emailAdminError && emailAdminData) {
          // Link the user_id to the admin record
          await supabase
            .from('admin_users')
            .update({ user_id: data.user.id })
            .eq('id', emailAdminData.id);
          
          adminData = { ...emailAdminData, user_id: data.user.id };
          adminError = null;
        }
      }

      if (adminError || !adminData) {
        await supabase.auth.signOut();
        return { error: { message: 'You do not have admin access.' } };
      }
    }

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setAdminUser(null);
  };

  const value = {
    user,
    adminUser,
    loading,
    isAdmin: !!adminUser,
    isSuperAdmin: adminUser?.role === 'super_admin',
    signIn,
    signOut,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
