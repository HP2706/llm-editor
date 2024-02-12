import React, { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabaseClient';

interface AuthState {
  user: User | null;
  session: Session | null;
}

const AuthStateContext = createContext<{
  authState: AuthState;
  setAuthState: React.Dispatch<React.SetStateAction<AuthState>>;
}>({
  authState: { user: null, session: null },
  setAuthState: () => {},
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [authState, setAuthState] = useState<AuthState>({ user: null, session: null });
  
    useEffect(() => {
      const sessionSubscription = supabase.auth.onAuthStateChange((_event, session) => {
          setAuthState({ user: session?.user ?? null, session });
      });
  
      return () => {
          sessionSubscription.data.subscription.unsubscribe();
      };
    }, []);
  
    return (
      <AuthStateContext.Provider value={{ authState, setAuthState }}>
        {children}
      </AuthStateContext.Provider>
    );
  };
export const useAuth = () => useContext(AuthStateContext);
