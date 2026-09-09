'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { siteUrl } from '@/lib/site'

export type AuthState = { error?: string; notice?: string }

function readCredentials(formData: FormData) {
  return {
    email: String(formData.get('email') ?? '').trim(),
    password: String(formData.get('password') ?? ''),
  }
}

export async function signUp(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const { email, password } = readCredentials(formData)

  if (!email || !password) return { error: 'Email and password are both needed.' }
  if (password.length < 8) return { error: 'Use at least 8 characters for the password.' }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({ email, password })

  if (error) return { error: error.message }

  // With email confirmation turned on there's no session yet -- she has to
  // click the link in her inbox before she can sign in.
  if (!data.session) {
    return { notice: `Almost done. Check ${email} for a confirmation link, then sign in.` }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard/setup')
}

export async function signIn(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const { email, password } = readCredentials(formData)

  if (!email || !password) return { error: 'Email and password are both needed.' }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) return { error: error.message }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

/**
 * Sends a reset link. Always reports success, even for an address with no
 * account -- otherwise this page becomes a way to find out who has one.
 */
export async function requestPasswordReset(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get('email') ?? '').trim()
  if (!email) return { error: 'Enter the email you signed up with.' }

  const supabase = await createClient()
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl()}/auth/confirm?next=/reset-password`,
  })

  return {
    notice: `If ${email} has an account, a reset link is on its way. Check your inbox and spam folder.`,
  }
}

/** Sets the new password. Only reachable with a live recovery session. */
export async function updatePassword(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const password = String(formData.get('password') ?? '')

  if (password.length < 8) {
    return { error: 'Use at least 8 characters for the password.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'That reset link has expired. Request a new one.' }
  }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: error.message }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()

  revalidatePath('/', 'layout')
  redirect('/login')
}
