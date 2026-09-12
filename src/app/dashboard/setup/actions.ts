'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { isPlausiblePhone, normalisePhone, slugify } from '@/lib/format'
import { isPlausibleHandle, normaliseHandle } from '@/lib/channels'

export type StoreState = { error?: string }

/**
 * Empty stays null rather than an empty string, so it reads as "not set".
 * Anything that isn't a usable username is reported back rather than stored.
 */
function handle(
  value: FormDataEntryValue | null,
  platform: string
): { value: string | null } | { error: string } {
  const raw = String(value ?? '').trim()
  if (!raw) return { value: null }

  const cleaned = normaliseHandle(raw)

  if (!isPlausibleHandle(cleaned)) {
    return {
      error: `"${raw}" doesn't look like a ${platform} username. Use the @name people type to find you, not your display name -- no spaces.`,
    }
  }

  return { value: cleaned }
}

const RESERVED_SLUGS = new Set([
  'dashboard',
  'login',
  'signup',
  'api',
  'admin',
  'settings',
  'about',
  'pricing',
  'terms',
  'privacy',
  'auth',
])

/**
 * Creates the seller row on first run, and edits it afterwards.
 * The slug is what the whole public storefront hangs off, so it's validated
 * hard: reserved words out, uniqueness enforced by the DB.
 */
export async function saveStore(
  _prev: StoreState,
  formData: FormData
): Promise<StoreState> {
  const user = await requireUser()

  const businessName = String(formData.get('business_name') ?? '').trim()
  const rawSlug = String(formData.get('slug') ?? '').trim()
  const rawPhone = String(formData.get('whatsapp') ?? '').trim()
  const deliveryNote = String(formData.get('delivery_note') ?? '').trim()
  const rawLogo = String(formData.get('logo_url') ?? '').trim()

  // Only accept a URL we put there ourselves -- this field is a plain string
  // in a form, so it would otherwise accept any address at all.
  const logoUrl =
    rawLogo.startsWith(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/`)
      ? rawLogo
      : null

  if (!businessName) return { error: 'Your business needs a name.' }

  const slug = slugify(rawSlug || businessName)
  if (slug.length < 3) {
    return { error: 'The store link needs at least 3 letters or numbers.' }
  }
  if (RESERVED_SLUGS.has(slug)) {
    return { error: `"${slug}" is reserved. Please pick another store link.` }
  }

  const whatsapp = normalisePhone(rawPhone)
  if (!isPlausiblePhone(whatsapp)) {
    return { error: 'That WhatsApp number does not look right. Example: 0801 234 5678.' }
  }

  const instagram = handle(formData.get('instagram'), 'Instagram')
  if ('error' in instagram) return { error: instagram.error }

  const facebook = handle(formData.get('facebook'), 'Facebook')
  if ('error' in facebook) return { error: facebook.error }

  const telegram = handle(formData.get('telegram'), 'Telegram')
  if ('error' in telegram) return { error: telegram.error }

  const supabase = await createClient()
  const { error } = await supabase.from('sellers').upsert({
    id: user.id,
    slug,
    business_name: businessName,
    whatsapp,
    delivery_note: deliveryNote || null,
    logo_url: logoUrl,
    instagram: instagram.value,
    facebook: facebook.value,
    telegram: telegram.value,
    accepts_sms: formData.get('accepts_sms') === 'yes',
  })

  if (error) {
    // 23505 = unique violation, which here can only be the slug.
    if (error.code === '23505') {
      return { error: `"${slug}" is already taken. Try adding a word to it.` }
    }
    return { error: error.message }
  }

  revalidatePath('/dashboard', 'layout')
  revalidatePath(`/${slug}`, 'layout')
  redirect('/dashboard')
}
