import { redirect } from 'next/navigation'
import type { EmailOtpType } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Where every emailed link lands: signup confirmation and password resets.
 *
 * Supabase's default email template sends people to its own verify endpoint,
 * which hands the session back in the URL fragment -- unreadable by a server.
 * The templates point here instead with a `token_hash`, which we exchange for
 * a real cookie session. See README for the exact template text.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next')

  // Only ever redirect within this app -- an open redirect here would let a
  // crafted email bounce someone to an attacker's page carrying our name.
  const destination = next?.startsWith('/') && !next.startsWith('//') ? next : null

  if (tokenHash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })

    if (!error) {
      // A recovery link means they're mid password reset; anything else is a
      // fresh confirmation, so send them on to set their store up.
      redirect(destination ?? (type === 'recovery' ? '/reset-password' : '/dashboard'))
    }
  }

  redirect('/login?error=link')
}
