import type { Seller } from '@/lib/types'

/**
 * The ways a buyer can reach a seller.
 *
 * Only WhatsApp and SMS can carry a pre-written message -- Instagram,
 * Messenger and Telegram all open an empty chat box, by their own design.
 * That difference is the whole reason `prefills` exists: where we can't type
 * the order for the buyer, the confirmation page hands them the text to
 * paste instead.
 */
export type ChannelId = 'whatsapp' | 'sms' | 'instagram' | 'facebook' | 'telegram'

export type Channel = {
  id: ChannelId
  label: string
  /** Can the order text be carried into the chat automatically? */
  prefills: boolean
}

export const CHANNELS: Record<ChannelId, Channel> = {
  whatsapp: { id: 'whatsapp', label: 'WhatsApp', prefills: true },
  sms: { id: 'sms', label: 'Text message', prefills: true },
  instagram: { id: 'instagram', label: 'Instagram', prefills: false },
  facebook: { id: 'facebook', label: 'Messenger', prefills: false },
  telegram: { id: 'telegram', label: 'Telegram', prefills: false },
}

export function isChannelId(value: string): value is ChannelId {
  return value in CHANNELS
}

/**
 * Trims a handle down to the bare username.
 *
 * Sellers paste whatever they have -- "@adastore", a full profile URL, a
 * link with tracking junk on the end -- and all of those need to become
 * "adastore" before they can be built into a link.
 */
export function normaliseHandle(input: string): string {
  return input
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/^(www\.)?(instagram|facebook|m|t|telegram)\.(com|me)\//i, '')
    .replace(/^@/, '')
    .replace(/[?/].*$/, '')
    .slice(0, 60)
}

/** Which channels this seller has actually set up, WhatsApp always first. */
export function availableChannels(seller: Seller): Channel[] {
  const channels: Channel[] = [CHANNELS.whatsapp]

  if (seller.accepts_sms) channels.push(CHANNELS.sms)
  if (seller.instagram) channels.push(CHANNELS.instagram)
  if (seller.facebook) channels.push(CHANNELS.facebook)
  if (seller.telegram) channels.push(CHANNELS.telegram)

  return channels
}

/**
 * The link that opens a conversation on a given channel.
 *
 * `message` is only honoured where the platform allows it; elsewhere it's
 * dropped rather than smuggled into the URL, which would just produce a
 * broken link.
 */
export function channelLink(
  seller: Seller,
  channel: ChannelId,
  message: string
): string {
  const text = encodeURIComponent(message)

  switch (channel) {
    case 'whatsapp':
      return `https://wa.me/${seller.whatsapp}?text=${text}`

    case 'sms':
      // `?body=` is understood by Android and current iOS alike.
      return `sms:+${seller.whatsapp}?body=${text}`

    case 'instagram':
      // ig.me/m opens a direct message thread. No way to fill it in.
      return `https://ig.me/m/${seller.instagram}`

    case 'facebook':
      return `https://m.me/${seller.facebook}`

    case 'telegram':
      return `https://t.me/${seller.telegram}`
  }
}
