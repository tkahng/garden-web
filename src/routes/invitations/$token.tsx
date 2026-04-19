import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useAuth } from '#/context/auth'
import { useAuthModal } from '#/context/auth-modal'
import { getInvitationByToken, acceptInvitation } from '#/lib/b2b-api'
import type { InvitationResponse } from '#/lib/b2b-api'
import { Button } from '#/components/ui/button'
import { Skeleton } from '#/components/ui/skeleton'
import { toast } from 'sonner'

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/invitations/$token')({
  component: InvitationPage,
})

// ─── InvitationPage ───────────────────────────────────────────────────────────

export function InvitationPage() {
  const { token } = Route.useParams()
  const { isAuthenticated, authFetch } = useAuth()
  const { openAuthModal } = useAuthModal()
  const navigate = useNavigate()

  const [invitation, setInvitation] = useState<InvitationResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAccepting, setIsAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getInvitationByToken(token)
      .then(setInvitation)
      .catch(() => setError('Invitation not found or has expired.'))
      .finally(() => setIsLoading(false))
  }, [token])

  async function handleAccept() {
    if (!isAuthenticated) {
      openAuthModal('login')
      return
    }
    setIsAccepting(true)
    try {
      await acceptInvitation(authFetch, token)
      toast.success(`You've joined ${invitation?.companyName ?? 'the company'}!`)
      navigate({ to: '/account/company' })
    } catch (e: unknown) {
      const status = e instanceof Error ? e.message : ''
      if (status === '409') {
        toast.error('You are already a member of this company.')
      } else if (status === '403') {
        toast.error('This invitation was sent to a different email address.')
      } else {
        toast.error('Failed to accept invitation. It may have expired.')
      }
    } finally {
      setIsAccepting(false)
    }
  }

  if (isLoading) {
    return (
      <main className="page-wrap flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-10 w-32" />
        </div>
      </main>
    )
  }

  if (error || !invitation) {
    return (
      <main className="page-wrap flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold">Invitation not found</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </main>
    )
  }

  const isExpired =
    invitation.status !== 'PENDING' ||
    (invitation.expiresAt ? new Date(invitation.expiresAt) < new Date() : false)

  return (
    <main className="page-wrap flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md space-y-6">
        <div>
          <p className="text-sm text-muted-foreground mb-1">You've been invited to join</p>
          <h1 className="text-3xl font-bold">{invitation.companyName}</h1>
        </div>

        <div className="rounded-xl border border-border p-5 space-y-3 text-sm">
          <Row label="Role" value={invitation.role ?? 'Member'} />
          <Row label="Invited to" value={invitation.email ?? ''} />
          {invitation.expiresAt && (
            <Row
              label="Expires"
              value={new Date(invitation.expiresAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            />
          )}
        </div>

        {isExpired ? (
          <p className="text-sm text-destructive font-medium">
            This invitation is no longer valid (status: {invitation.status}).
          </p>
        ) : (
          <div className="space-y-3">
            {!isAuthenticated && (
              <p className="text-sm text-muted-foreground">
                Sign in or create an account with <strong>{invitation.email}</strong> to accept.
              </p>
            )}
            <Button onClick={handleAccept} disabled={isAccepting} className="w-full">
              {isAccepting ? 'Accepting…' : 'Accept invitation'}
            </Button>
          </div>
        )}
      </div>
    </main>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium capitalize">{value.toLowerCase()}</span>
    </div>
  )
}
