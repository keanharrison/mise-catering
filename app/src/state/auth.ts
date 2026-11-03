import { supabase } from '@/lib/supabase'
import { CUSTOMER_PROFILE_KEY, readCustomerProfile } from './customerProfile'

export type Role = 'customer' | 'owner' | 'manager' | 'staff'
export type Profile = { id: string; role: Role; fullName: string; phone: string; email: string; restaurantId: string | null }

export const LOGIN_URL = '/pearl-login.html'
export const isStaffRole = (role: Role) => role !== 'customer'
export const homeFor = (role: Role) => (isStaffRole(role) ? '/staff' : '/customer')

function client() {
  if (!supabase) throw new Error('Accounts are not configured yet.')
  return supabase
}

export async function fetchProfile(): Promise<Profile | null> {
  if (!supabase) return null
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null
  const { data } = await supabase.from('profiles').select('id, role, full_name, phone, email, restaurant_id').eq('id', session.user.id).maybeSingle()
  if (!data) return null
  return { id: data.id, role: data.role, fullName: data.full_name, phone: data.phone, email: data.email, restaurantId: data.restaurant_id }
}

/** Prefill request forms from the saved account, keeping any organization the customer already typed. */
export function saveProfileLocally(profile: Profile) {
  if (isStaffRole(profile.role)) return
  const existing = readCustomerProfile()
  try {
    localStorage.setItem(CUSTOMER_PROFILE_KEY, JSON.stringify({ ...existing, name: profile.fullName, email: profile.email, phone: profile.phone }))
  } catch {
    // Prefill is a convenience; the account itself is saved server-side.
  }
}

export async function signIn(email: string, password: string) {
  const { error } = await client().auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message === 'Invalid login credentials' ? 'Email or password is incorrect.' : error.message)
}

/** Resolves true when the account is ready, false when the person must confirm their email first. */
export async function signUp(input: { fullName: string; email: string; phone: string; password: string }) {
  const { data, error } = await client().auth.signUp({
    email: input.email,
    password: input.password,
    options: { data: { full_name: input.fullName, phone: input.phone }, emailRedirectTo: `${window.location.origin}${LOGIN_URL}` },
  })
  if (error) throw new Error(error.message)
  return data.session !== null
}

export async function signOut() {
  if (supabase) await supabase.auth.signOut()
  window.location.assign(LOGIN_URL)
}

export async function sendPasswordReset(email: string) {
  const { error } = await client().auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}${LOGIN_URL}` })
  if (error) throw new Error(error.message)
}

export async function setPassword(password: string) {
  const { error } = await client().auth.updateUser({ password })
  if (error) throw new Error(error.message)
}

export async function requestDemo(input: { restaurantName: string; contactName: string; email: string; phone: string; message: string }) {
  const { error } = await client().from('demo_inquiries').insert({
    restaurant_name: input.restaurantName,
    contact_name: input.contactName,
    email: input.email,
    phone: input.phone,
    message: input.message,
  })
  if (error) throw new Error('We could not send your request. Please try again.')
}
