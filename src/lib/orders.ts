/**
 * Carries the finished WhatsApp link from the order action to the
 * confirmation page. Short-lived, and never in the URL -- a buyer's note
 * doesn't belong in their address bar or browser history.
 */
export const PENDING_ORDER_COOKIE = 'ss-pending-order'
