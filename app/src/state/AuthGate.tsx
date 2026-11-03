import { useEffect, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useDemoAccount } from './demoAccount'
import { LOGIN_URL, fetchProfile, isStaffRole, saveProfileLocally } from './auth'

/**
 * Holds the app until a signed-in profile is known, then sets the demo account from the profile's role.
 * Without Supabase settings (local dev only) the app opens as the customer demo instead.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { account, setAccount } = useDemoAccount()
  const [ready, setReady] = useState(supabase === null)

  useEffect(() => {
    if (!supabase) return
    let alive = true
    fetchProfile().then((profile) => {
      if (!alive) return
      if (!profile) {
        window.location.replace(LOGIN_URL)
        return
      }
      const next = isStaffRole(profile.role) ? 'team' : 'customer'
      if (next !== account) setAccount(next)
      saveProfileLocally(profile)
      setReady(true)
    })
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') window.location.replace(LOGIN_URL)
    })
    return () => {
      alive = false
      data.subscription.unsubscribe()
    }
    // Run once per page load: the role comes from the server, not from later local state changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return ready ? <>{children}</> : null
}
