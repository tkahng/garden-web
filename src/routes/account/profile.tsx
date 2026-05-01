import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useAuth } from '#/context/auth'
import { Skeleton } from '#/components/ui/skeleton'
import { getAccount, updateAccount, updatePassword, resendVerification } from '#/lib/account-api'
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

export function ProfilePage() {
  const { authFetch } = useAuth()

  const [account, setAccount] = useState<AccountResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwError, setPwError] = useState<string | null>(null)
  const [pwSuccess, setPwSuccess] = useState(false)

  // Resend verification state
  const [resending, setResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)

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

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setPwError('Passwords do not match.')
      return
    }
    if (newPassword.length < 8) {
      setPwError('New password must be at least 8 characters.')
      return
    }
    setPwSaving(true)
    setPwError(null)
    setPwSuccess(false)
    try {
      await updatePassword(authFetch, { currentPassword, newPassword })
      setPwSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch {
      setPwError('Failed to update password. Check your current password and try again.')
    } finally {
      setPwSaving(false)
    }
  }

  async function handleResendVerification() {
    if (!account?.email) return
    setResending(true)
    setResendSuccess(false)
    try {
      await resendVerification(authFetch, account.email)
      setResendSuccess(true)
    } finally {
      setResending(false)
    }
  }

  if (isLoading) return <ProfileSkeleton />

  return (
    <div className="flex flex-col gap-8 max-w-md">
      {/* Profile details */}
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <h2 className="text-base font-semibold">Profile</h2>

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
          {account?.status === 'UNVERIFIED' && (
            <div className="mt-1 flex items-center gap-2">
              <p className="text-xs text-muted-foreground">Email not verified.</p>
              {resendSuccess ? (
                <span className="text-xs text-green-600">Verification email sent.</span>
              ) : (
                <button
                  type="button"
                  disabled={resending}
                  onClick={() => void handleResendVerification()}
                  className="text-xs font-medium text-primary hover:underline disabled:opacity-50"
                >
                  {resending ? 'Sending…' : 'Resend verification email'}
                </button>
              )}
            </div>
          )}
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

      <div className="border-t border-border" />

      {/* Change password */}
      <form onSubmit={handlePasswordChange} className="flex flex-col gap-4">
        <h2 className="text-base font-semibold">Change password</h2>

        <div className="flex flex-col gap-1">
          <label htmlFor="currentPassword" className="text-sm font-medium">
            Current password
          </label>
          <input
            id="currentPassword"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => { setCurrentPassword(e.target.value); setPwError(null) }}
            className="rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="newPassword" className="text-sm font-medium">
            New password
          </label>
          <input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => { setNewPassword(e.target.value); setPwError(null) }}
            className="rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="confirmPassword" className="text-sm font-medium">
            Confirm new password
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); setPwError(null) }}
            className="rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            required
          />
        </div>

        {pwError && <p className="text-sm text-destructive">{pwError}</p>}
        {pwSuccess && <p className="text-sm text-green-600">Password updated.</p>}

        <button
          type="submit"
          disabled={pwSaving || !currentPassword || !newPassword || !confirmPassword}
          className="self-start rounded-full bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {pwSaving ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </div>
  )
}
