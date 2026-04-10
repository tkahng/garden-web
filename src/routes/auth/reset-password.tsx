import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { authConfirmPasswordReset } from '#/lib/api'
import { useAuthModal } from '#/context/auth-modal'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Button } from '#/components/ui/button'

export const Route = createFileRoute('/auth/reset-password')({
  component: ResetPasswordRoute,
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === 'string' ? search.token : null,
  }),
})

function ResetPasswordRoute() {
  const { token } = Route.useSearch()
  return <ResetPasswordPage token={token} />
}

export function ResetPasswordPage({ token }: { token: string | null }) {
  const navigate = useNavigate()
  const { openAuthModal } = useAuthModal()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (!token) {
    return (
      <main className="page-wrap py-16 text-center">
        <h1 className="text-2xl font-bold text-[var(--sea-ink)]">Reset link invalid</h1>
        <p className="mt-2 text-[var(--sea-ink-soft)]">
          This link is invalid or expired. Please request a new password reset.
        </p>
      </main>
    )
  }

  const safeToken = token

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await authConfirmPasswordReset(safeToken, password)
      await navigate({ to: '/' })
      openAuthModal('login')
    } catch {
      setError('Failed to reset password. The link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="page-wrap py-16">
      <div className="mx-auto max-w-sm">
        <h1 className="mb-6 text-2xl font-bold text-[var(--sea-ink)]">Set new password</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={loading}>
            Set new password
          </Button>
        </form>
      </div>
    </main>
  )
}
