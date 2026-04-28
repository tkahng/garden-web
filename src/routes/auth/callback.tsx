import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { useAuth } from '#/context/auth'

export const Route = createFileRoute('/auth/callback')({
  component: AuthCallbackRoute,
})

function AuthCallbackRoute() {
  const { loginWithTokens } = useAuth()
  const navigate = useNavigate()
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return
    handled.current = true

    const params = new URLSearchParams(window.location.hash.slice(1))
    const accessToken = params.get('accessToken')
    const refreshToken = params.get('refreshToken')

    if (!accessToken || !refreshToken) {
      navigate({ to: '/' })
      return
    }

    loginWithTokens(accessToken, refreshToken)
      .then(() => navigate({ to: '/' }))
      .catch(() => navigate({ to: '/' }))
  }, [loginWithTokens, navigate])

  return (
    <main className="page-wrap py-16 text-center">
      <p className="text-muted-foreground">Signing you in…</p>
    </main>
  )
}
