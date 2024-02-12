'use client'

import { Auth } from '@supabase/auth-ui-react'
import { Database } from '@/types/database.types'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { supabase } from '@/lib/supabaseClient'
export default function AuthForm() {
  return (
    <Auth
      supabaseClient={supabase}
      view="magic_link"
      appearance={{ theme: ThemeSupa }}
      theme="dark"
      showLinks={false}
      providers={[]}
      redirectTo="/authCallback"
    />
  )
}