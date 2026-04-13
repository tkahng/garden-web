import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useAuth } from '#/context/auth'
import { Skeleton } from '#/components/ui/skeleton'
import { getAccount, updateAccount } from '#/lib/account-api'
import type { AccountResponse } from '#/lib/account-api'

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/account/profile')({
  component: ProfilePage,
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusClass(status?: string) {
  if (status === 'ACTIVE') return 'bg-green-100 text-green-800'
  if (status === 'UNVERIFIED') return 'bg-yellow-100 text-yellow-800'
  return 'bg-red-100 text-red-800'
}

// ─── ProfileSkeleton ──────────────────────────────────────────────────────────

export function ProfileSkeleton() {
  return (
    <div data-testid="profile-skeleton" className="flex flex-col gap-4">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  )
}

// ─── ProfilePage ──────────────────────────────────────────────────────────────

function ProfilePage() {
  const { authFetch } = useAuth()

  const [account, setAccount] = useState<AccountResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    getAccount(authFetch)
      .then((data) => {
        if (cancelled) return
        setAccount(data)
        setFirstName(data.firstName ?? '')
        setLastName(data.lastName ?? '')
        setPhone(data.phone ?? '')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [authFetch])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)
    setSaveError(null)
    setSaveSuccess(false)
    try {
      const updated = await updateAccount(authFetch, { firstName, lastName, phone })
      setAccount(updated)
      setSaveSuccess(true)
    } catch {
      setSaveError('Failed to save changes. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return <ProfileSkeleton />

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-4 max-w-md">
      {/* Email — read-only */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-muted-foreground">Email</label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-foreground">{account?.email}</span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusClass(account?.status)}`}
          >
            {account?.status}
          </span>
        </div>
      </div>

      {/* First name */}
      <div className="flex flex-col gap-1">
        <label htmlFor="firstName" className="text-sm font-medium">
          First name
        </label>
        <input
          id="firstName"
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Last name */}
      <div className="flex flex-col gap-1">
        <label htmlFor="lastName" className="text-sm font-medium">
          Last name
        </label>
        <input
          id="lastName"
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className="rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Phone */}
      <div className="flex flex-col gap-1">
        <label htmlFor="phone" className="text-sm font-medium">
          Phone
        </label>
        <input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {saveError && <p className="text-sm text-destructive">{saveError}</p>}
      {saveSuccess && <p className="text-sm text-green-600">Changes saved.</p>}

      <button
        type="submit"
        disabled={isSaving}
        className="self-start rounded-full bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
      >
        {isSaving ? 'Saving…' : 'Save'}
      </button>
    </form>
  )
}
