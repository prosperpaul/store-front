import type { Metadata } from 'next'
import { requireSeller } from '@/lib/auth'
import { signOut } from '@/app/(auth)/actions'
import { StoreForm } from '../setup/store-form'

export const metadata: Metadata = { title: 'Store settings' }

export default async function SettingsPage() {
  const { seller } = await requireSeller()

  return (
    <div className="mx-auto w-full max-w-md px-5 py-6">
      <h1 className="text-3xl font-extrabold">My store</h1>
      <p className="mb-6 mt-1 font-medium text-muted">
        Your business details, link and delivery note.
      </p>

      <StoreForm seller={seller} submitLabel="Save changes" />

      <form action={signOut} className="mt-10 border-t-2 border-line-soft pt-6">
        <button type="submit" className="btn-secondary w-full">
          Sign out
        </button>
      </form>
    </div>
  )
}
