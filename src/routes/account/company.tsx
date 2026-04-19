import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '#/context/auth'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Skeleton } from '#/components/ui/skeleton'
import { Separator } from '#/components/ui/separator'
import { toast } from 'sonner'
import {
  listCompanies,
  createCompany,
  listMembers,
  addMember,
  removeMember,
  updateMemberRole,
  listInvitations,
  sendInvitation,
  cancelInvitation,
} from '#/lib/b2b-api'
import type {
  CompanyResponse,
  CompanyMemberResponse,
  InvitationResponse,
} from '#/lib/b2b-api'

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/account/company')({
  component: CompanyPage,
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

type Tab = 'members' | 'invitations'

function RoleBadge({ role }: { role?: string }) {
  const cls =
    role === 'OWNER'
      ? 'bg-violet-100 text-violet-800'
      : role === 'MANAGER'
        ? 'bg-blue-100 text-blue-800'
        : 'bg-muted text-muted-foreground'
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {role?.toLowerCase()}
    </span>
  )
}

function StatusBadge({ status }: { status?: string }) {
  const cls =
    status === 'PENDING'
      ? 'bg-yellow-100 text-yellow-800'
      : status === 'ACCEPTED'
        ? 'bg-green-100 text-green-800'
        : 'bg-muted text-muted-foreground'
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {status?.toLowerCase()}
    </span>
  )
}

// ─── CreateCompanyForm ────────────────────────────────────────────────────────

export function CreateCompanyForm({ onCreate }: { onCreate: (c: CompanyResponse) => void }) {
  const { authFetch } = useAuth()
  const [name, setName] = useState('')
  const [taxId, setTaxId] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)
    try {
      const company = await createCompany(authFetch, {
        name: name.trim(),
        taxId: taxId.trim() || undefined,
      })
      toast.success('Company created')
      onCreate(company)
    } catch {
      toast.error('Failed to create company')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-md space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Create your company</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Set up a company account to access B2B pricing, quotes, and team management.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="company-name">Company name *</Label>
          <Input
            id="company-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Acme Corp"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tax-id">Tax ID (optional)</Label>
          <Input
            id="tax-id"
            value={taxId}
            onChange={(e) => setTaxId(e.target.value)}
            placeholder="12-3456789"
          />
        </div>
        <Button type="submit" disabled={submitting || !name.trim()}>
          {submitting ? 'Creating…' : 'Create company'}
        </Button>
      </form>
    </div>
  )
}

// ─── MembersTab ───────────────────────────────────────────────────────────────

function MembersTab({
  companyId,
  myRole,
}: {
  companyId: string
  myRole?: string
}) {
  const { authFetch } = useAuth()
  const [members, setMembers] = useState<CompanyMemberResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [addEmail, setAddEmail] = useState('')
  const [adding, setAdding] = useState(false)

  const canManage = myRole === 'OWNER' || myRole === 'MANAGER'

  const load = useCallback(() => {
    setIsLoading(true)
    listMembers(authFetch, companyId)
      .then(setMembers)
      .catch(() => toast.error('Failed to load members'))
      .finally(() => setIsLoading(false))
  }, [authFetch, companyId])

  useEffect(() => { load() }, [load])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!addEmail.trim()) return
    setAdding(true)
    try {
      await addMember(authFetch, companyId, { email: addEmail.trim() })
      toast.success('Member added')
      setAddEmail('')
      load()
    } catch (err: unknown) {
      const status = err instanceof Error ? err.message : ''
      if (status === '404') toast.error('User not found.')
      else if (status === '409') toast.error('Already a member.')
      else toast.error('Failed to add member')
    } finally {
      setAdding(false)
    }
  }

  async function handleRemove(userId: string) {
    try {
      await removeMember(authFetch, companyId, userId)
      toast.success('Member removed')
      load()
    } catch {
      toast.error('Failed to remove member')
    }
  }

  async function handleRoleChange(userId: string, role: 'MANAGER' | 'MEMBER') {
    try {
      await updateMemberRole(authFetch, companyId, userId, { role })
      toast.success('Role updated')
      load()
    } catch {
      toast.error('Failed to update role')
    }
  }

  if (isLoading) return <Skeleton className="h-32 w-full" />

  return (
    <div className="space-y-6">
      <div className="divide-y divide-border rounded-xl border border-border">
        {members.map((m) => (
          <div key={m.membershipId} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium">
                {m.firstName} {m.lastName}
              </p>
              <p className="text-xs text-muted-foreground">{m.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <RoleBadge role={m.role} />
              {canManage && m.role !== 'OWNER' && (
                <>
                  {m.role === 'MEMBER' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRoleChange(m.userId!, 'MANAGER')}
                    >
                      Make manager
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRoleChange(m.userId!, 'MEMBER')}
                    >
                      Make member
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemove(m.userId!)}
                  >
                    Remove
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {canManage && (
        <>
          <Separator />
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Add member by email</h3>
            <form onSubmit={handleAdd} className="flex gap-2">
              <Input
                type="email"
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                placeholder="user@example.com"
                className="max-w-xs"
              />
              <Button type="submit" disabled={adding || !addEmail.trim()}>
                {adding ? 'Adding…' : 'Add'}
              </Button>
            </form>
          </div>
        </>
      )}
    </div>
  )
}

// ─── InvitationsTab ───────────────────────────────────────────────────────────

function InvitationsTab({ companyId }: { companyId: string }) {
  const { authFetch } = useAuth()
  const [invitations, setInvitations] = useState<InvitationResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'MEMBER' | 'MANAGER'>('MEMBER')
  const [inviting, setInviting] = useState(false)

  const load = useCallback(() => {
    setIsLoading(true)
    listInvitations(authFetch, companyId)
      .then(setInvitations)
      .catch(() => toast.error('Failed to load invitations'))
      .finally(() => setIsLoading(false))
  }, [authFetch, companyId])

  useEffect(() => { load() }, [load])

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    setInviting(true)
    try {
      await sendInvitation(authFetch, companyId, { email: inviteEmail.trim(), role: inviteRole })
      toast.success('Invitation sent')
      setInviteEmail('')
      load()
    } catch (err: unknown) {
      const status = err instanceof Error ? err.message : ''
      if (status === '409') toast.error('Already a member or invitation pending.')
      else toast.error('Failed to send invitation')
    } finally {
      setInviting(false)
    }
  }

  async function handleCancel(invitationId: string) {
    try {
      await cancelInvitation(authFetch, companyId, invitationId)
      toast.success('Invitation cancelled')
      load()
    } catch {
      toast.error('Failed to cancel invitation')
    }
  }

  if (isLoading) return <Skeleton className="h-32 w-full" />

  return (
    <div className="space-y-6">
      {invitations.length === 0 ? (
        <p className="text-sm text-muted-foreground">No pending invitations.</p>
      ) : (
        <div className="divide-y divide-border rounded-xl border border-border">
          {invitations.map((inv) => (
            <div key={inv.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium">{inv.email}</p>
                <p className="text-xs text-muted-foreground">
                  {inv.expiresAt
                    ? `Expires ${new Date(inv.expiresAt).toLocaleDateString()}`
                    : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <RoleBadge role={inv.role} />
                <StatusBadge status={inv.status} />
                {inv.status === 'PENDING' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCancel(inv.id!)}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Separator />

      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Invite by email</h3>
        <form onSubmit={handleInvite} className="flex flex-wrap gap-2 items-end">
          <div className="space-y-1">
            <Label htmlFor="invite-email" className="text-xs">Email</Label>
            <Input
              id="invite-email"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="colleague@example.com"
              className="w-64"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="invite-role" className="text-xs">Role</Label>
            <select
              id="invite-role"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as 'MEMBER' | 'MANAGER')}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="MEMBER">Member</option>
              <option value="MANAGER">Manager</option>
            </select>
          </div>
          <Button type="submit" disabled={inviting || !inviteEmail.trim()}>
            {inviting ? 'Sending…' : 'Send invite'}
          </Button>
        </form>
      </div>
    </div>
  )
}

// ─── CompanyPage ──────────────────────────────────────────────────────────────

export function CompanyPage() {
  const { authFetch, user } = useAuth()
  const [company, setCompany] = useState<CompanyResponse | null>(null)
  const [myRole, setMyRole] = useState<string | undefined>()
  const [isLoading, setIsLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('members')

  useEffect(() => {
    listCompanies(authFetch)
      .then((companies) => {
        if (companies.length > 0) {
          setCompany(companies[0])
        }
      })
      .catch(() => toast.error('Failed to load company'))
      .finally(() => setIsLoading(false))
  }, [authFetch])

  // Resolve current user's role once company is loaded
  useEffect(() => {
    if (!company?.id || !user?.id) return
    listMembers(authFetch, company.id).then((members) => {
      const me = members.find((m) => m.userId === user.id)
      setMyRole(me?.role)
    })
  }, [authFetch, company, user])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (!company) {
    return <CreateCompanyForm onCreate={(c) => setCompany(c)} />
  }

  const canManageInvitations = myRole === 'OWNER' || myRole === 'MANAGER'

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold">{company.name}</h2>
        {company.taxId && (
          <p className="text-sm text-muted-foreground">Tax ID: {company.taxId}</p>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border">
        {(['members', ...(canManageInvitations ? ['invitations'] : [])] as Tab[]).map(
          (t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={[
                'px-4 py-2 text-sm font-medium capitalize transition-colors',
                tab === t
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              ].join(' ')}
            >
              {t}
            </button>
          ),
        )}
      </div>

      {tab === 'members' && (
        <MembersTab companyId={company.id!} myRole={myRole} />
      )}
      {tab === 'invitations' && canManageInvitations && (
        <InvitationsTab companyId={company.id!} />
      )}
    </div>
  )
}
