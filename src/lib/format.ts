/** Small formatting/normalising helpers shared by the dashboard and storefront. */

/** 4500 -> "₦4,500". Kobo are shown only when the price actually has them. */
export function money(amount: number): string {
  const hasKobo = Math.round(amount * 100) % 100 !== 0
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: hasKobo ? 2 : 0,
    maximumFractionDigits: hasKobo ? 2 : 0,
  }).format(amount)
}

/**
 * Turn a business name into a URL-safe slug: "Ada's Thrift Store" -> "adas-thrift-store".
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip accents left behind by NFKD
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '')
}

/**
 * Normalise a WhatsApp number to the full international form WhatsApp links
 * need (no +, no spaces): "0801 234 5678" -> "2348012345678".
 *
 * A bare local number is assumed Nigerian, since that's who we're selling to.
 * Anyone outside can type their full country code and it's left alone.
 */
export function normalisePhone(input: string): string {
  let digits = input.replace(/\D/g, '')

  if (digits.startsWith('00')) digits = digits.slice(2)

  if (digits.length === 11 && digits.startsWith('0')) {
    // Local format: 08012345678 -> 2348012345678
    digits = '234' + digits.slice(1)
  } else if (digits.length === 10 && !digits.startsWith('234')) {
    // Missing the leading zero too: 8012345678 -> 2348012345678
    digits = '234' + digits
  }

  return digits
}

/**
 * "Today" / "Yesterday" / "12 Mar" -- a seller scanning her orders cares
 * about recency, not timestamps.
 */
export function shortDate(iso: string): string {
  const date = new Date(iso)
  const today = new Date()

  const dayStart = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()

  const daysApart = Math.round((dayStart(today) - dayStart(date)) / 86_400_000)

  if (daysApart === 0) return 'Today'
  if (daysApart === 1) return 'Yesterday'

  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    ...(date.getFullYear() === today.getFullYear() ? {} : { year: 'numeric' }),
  })
}

/** Display form of a stored WhatsApp number: 2348012345678 -> 0801 234 5678. */
export function displayPhone(phone: string): string {
  if (phone.startsWith('234') && phone.length === 13) {
    const local = '0' + phone.slice(3)
    return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`
  }
  return '+' + phone
}

/** Loose sanity check -- long enough to be a real international number. */
export function isPlausiblePhone(digits: string): boolean {
  return /^\d{10,15}$/.test(digits)
}
