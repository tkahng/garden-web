import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { useAuth } from '#/context/auth'

export const Route = createFileRoute('/auth/callback')({
  component: AuthCallbackRoute,
  validateSearch: (search: Record<string, unknown>) => ({
    accessToken: typeof search.accessToken === 'string' ? search.accessToken : null,
    refreshToken: typeof search.refreshToken === 'string' ? search.refreshToken : null,
  }),
})

function AuthCallbackRoute() {
  const { accessToken, refreshToken } = Route.useSearch()
  const { loginWithTokens } = useAuth()
  const navigate = useNavigate()
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return
    handled.current = true

    if (!accessToken || !refreshToken) {
      navigate({ to: '/' })
      return
    }

    loginWithTokens(accessToken, refreshToken)
      .then(() => navigate({ to: '/' }))
      .catch(() => navigate({ to: '/' }))
  }, [accessToken, refreshToken, loginWithTokens, navigate])

  return (
    <main className="page-wrap py-16 text-center">
      <p className="text-muted-foreground">Signing you in…</p>
    </main>
  )
}
