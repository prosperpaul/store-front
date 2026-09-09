'use client'

import { useFormStatus } from 'react-dom'

/**
 * Submit button that disables itself while the surrounding form's action is
 * in flight -- sellers on slow connections tap twice otherwise.
 */
export function SubmitButton({
  children,
  pendingLabel = 'Saving...',
  className = 'btn-primary w-full',
}: {
  children: React.ReactNode
  pendingLabel?: string
  className?: string
}) {
  const { pending } = useFormStatus()

  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? pendingLabel : children}
    </button>
  )
}
