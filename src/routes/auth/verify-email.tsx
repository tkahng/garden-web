import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { authVerifyEmail } from '#/lib/api'

export const Route = createFileRoute('/auth/verify-email')({
  component: VerifyEmailRoute,
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === 'string' ? search.token : null,
  }),
})

function VerifyEmailRoute() {
  const { token } = Route.useSearch()
  return <VerifyEmailPage token={token} />
}

export function VerifyEmailPage({ token }: { token: string | null }) {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    token ? 'loading' : 'error',
  )

  useEffect(() => {
    if (!token) return
    let cancelled = false
    authVerifyEmail(token)
      .then(() => { if (!cancelled) setStatus('success') })
      .catch((err) => {
        console.error(err)
        if (!cancelled) setStatus('error')
      })
    return () => { cancelled = true }
  }, [token])

  if (status === 'loading') {
    return (
      <main className="page-wrap py-16 text-center">
        <p className="text-[var(--sea-ink-soft)]">Verifying your email…</p>
      </main>
    )
  }

  if (status === 'success') {
    return (
      <main className="page-wrap py-16 text-center">
        <h1 className="text-2xl font-bold text-[var(--sea-ink)]">Email verified!</h1>
        <p className="mt-2 text-[var(--sea-ink-soft)]">
          Your email has been verified. You can now sign in.
        </p>
      </main>
    )
  }

  return (
    <main className="page-wrap py-16 text-center">
      <h1 className="text-2xl font-bold text-[var(--sea-ink)]">Verification failed</h1>
      <p className="mt-2 text-[var(--sea-ink-soft)]">
        This link is invalid or expired. Please request a new verification email.
      </p>
    </main>
  )
}
