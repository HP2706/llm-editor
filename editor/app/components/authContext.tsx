import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

import { supabase } from '@/lib/supabaseClient';

interface AuthContextType {
  user: any; // Consider using a more specific type here
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null); // Consider using a more specific type here
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = supabase.auth.session();
    setUser(session?.user || null);
    setLoading(false);

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      listener.unsubscribe();
    };
  }, []);

  const value = {
    user,
    loading,
    signIn: (email : string, password : string) : => supabase.auth.signIn({ email, password }),
    signOut: () => supabase.auth.signOut(),
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);