import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
// import { useAuth } from '@/components/auth/AuthProvider';

const ADMIN_EMAILS = ['neomav.gmail.com', 'neomav.gmai.com', 'asterohype@gmail.com', 'neomaffofficial@gmail.com', 'miriamlamejor@gmail.com'];
const ADMIN_OVERRIDE_KEY = 'asterohype_admin_override';

export function useAdmin() {
  // const { user, loading: authLoading } = useAuth(); // Avoid circular dependency if useAuth uses useAdmin or viceversa, or context issue
  // Instead of using context, let's get session directly from supabase for admin check to be safe
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAdmin() {
      // 1. Check for localStorage override (Secret Code)
      const override = localStorage.getItem(ADMIN_OVERRIDE_KEY);
      if (override === 'true') {
        setIsAdmin(true);
        setLoading(false);
        return;
      }

      if (authLoading) {
        return; // Wait for auth to load
      }

      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        // 2. Check for hardcoded emails
        if (user.email && ADMIN_EMAILS.includes(user.email)) {
          setIsAdmin(true);
          setLoading(false);
          return;
        }

        // 3. Check Supabase database role
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();

        if (error) {
            console.error('Error checking admin role:', error);
        }

        setIsAdmin(!!data);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    }

    checkAdmin();
  }, [user, authLoading]);

  return { isAdmin, loading: loading || authLoading };
}
