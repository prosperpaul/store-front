'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

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

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()

  revalidatePath('/', 'layout')
  redirect('/login')
}
