import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Seller } from '@/lib/types'

/**
 * The logged-in seller, or null. Uses getUser() (not getSession()) because
 * only getUser() actually verifies the token with Supabase.
 */
export async function getUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

/**
 * Guard for anything under /dashboard. Proxy already bounces logged-out
 * visitors, but Server Actions are reachable by direct POST, so every
 * action re-checks here rather than trusting the proxy.
 */
export async function requireUser() {
  const user = await getUser()
  if (!user) redirect('/login')
  return user
}

/**
 * Like requireUser, but also insists the seller has finished store setup.
 * Sends her to /dashboard/setup if she hasn't.
 */
export async function requireSeller(): Promise<{
  user: Awaited<ReturnType<typeof requireUser>>
  seller: Seller
}> {
  const user = await requireUser()
  const supabase = await createClient()

  const { data: seller } = await supabase
    .from('sellers')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (!seller) redirect('/dashboard/setup')

  return { user, seller: seller as Seller }
}
