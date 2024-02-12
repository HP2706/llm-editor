//import './index.css'

import { User, createClient } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'

import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import {supabase} from '@/lib/supabaseClient'
import { useAuth } from '@/app/components/authContext'

interface Session {
    provider_token?: string | null
    access_token: string
    expires_in?: number
    expires_at?: number
    refresh_token: string
    token_type: string
    user: User
  }


export default function AuthForm() {
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (!session) {
    return (<Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} />)
  }
  else {
    return (
        <p className="bg-clip-text text-transparent drop-shadow-2xl bg-gradient-to-b from-white/80 to-white/20">
          You are authenticated
        </p> 
    )
  }
}