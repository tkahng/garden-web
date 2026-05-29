import { createFileRoute } from '@tanstack/react-router'
import React, { useState, useEffect, useCallback } from 'react'
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
  updateSpendingLimit,
  listInvitations,
  sendInvitation,
  cancelInvitation,
  listDepartments,
  createDepartment,
  deleteDepartment,
  getSpendingSummary,
  uploadTaxCertificate,
} from '#/lib/b2b-api'
import type {
  CompanyResponse,
  CompanyMemberResponse,
  InvitationResponse,
  DepartmentResponse,
  CompanySpendingSummaryResponse,
} from '#/lib/b2b-api'

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/account/company')({
  component: CompanyPage,
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

type Tab = 'members' | 'invitations' | 'departments' | 'spending' | 'compliance'

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

function SpendingLimitCell({
  member,
  companyId,
  onUpdate,
}: {
  member: CompanyMemberResponse
  companyId: string
  onUpdate: () => void
}) {
  const { authFetch } = useAuth()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(
    member.spendingLimit != null ? String(member.spendingLimit) : '',
  )
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!member.userId) return
    setSaving(true)
    try {
      const parsed = value.trim() === '' ? null : Number(value)
      if (parsed !== null && (isNaN(parsed) || parsed < 0)) {
        toast.error('Enter a valid amount or leave blank for no limit')
        return
      }
      await updateSpendingLimit(authFetch, companyId, member.userId, parsed)
      toast.success('Spending limit updated')
      setEditing(false)
      onUpdate()
    } catch {
      toast.error('Failed to update spending limit')
    } finally {
      setSaving(false)
    }
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-xs text-muted-foreground hover:text-foreground"
        title="Edit spending limit"
      >
        {member.spendingLimit != null
          ? `$${member.spendingLimit.toLocaleString()} limit`
          : 'No limit'}
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <Input
        type="number"
        min={0}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="No limit"
        className="h-7 w-24 text-xs"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Enter') void handleSave()
          if (e.key === 'Escape') setEditing(false)
        }}
      />
      <Button size="sm" variant="outline" disabled={saving} onClick={() => void handleSave()}>
        {saving ? '…' : 'Save'}
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
        ✕
      </Button>
    </div>
  )
}

function MembersTab({
  companyId,
  myRole,
}: {
  companyId: string
  myRole?: string
}) {
  const { authFetch } = useAuth()
  const [members, setMembers] = useState<CompanyMemberResponse[]>([])
  const [departments, setDepartments] = useState<DepartmentResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [addEmail, setAddEmail] = useState('')
  const [adding, setAdding] = useState(false)

  const canManage = myRole === 'OWNER' || myRole === 'MANAGER'

  function flattenDepts(depts: DepartmentResponse[]): DepartmentResponse[] {
    return depts.flatMap((d) => [d, ...flattenDepts(d.children ?? [])])
  }
  const deptMap = Object.fromEntries(flattenDepts(departments).map((d) => [d.id, d.name]))

  const load = useCallback(() => {
    setIsLoading(true)
    Promise.all([
      listMembers(authFetch, companyId),
      listDepartments(authFetch, companyId).catch(() => []),
    ])
      .then(([m, d]) => { setMembers(m); setDepartments(d as DepartmentResponse[]) })
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
          <div key={m.membershipId} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
            <div>
              <p className="text-sm font-medium">
                {m.firstName} {m.lastName}
              </p>
              <p className="text-xs text-muted-foreground">{m.email}</p>
              {m.departmentId && deptMap[m.departmentId] && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Dept: {deptMap[m.departmentId]}
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <RoleBadge role={m.role} />
              {canManage && m.role !== 'OWNER' && (
                <>
                  <SpendingLimitCell member={m} companyId={companyId} onUpdate={load} />
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

// ─── DepartmentsTab ───────────────────────────────────────────────────────────

function DepartmentsTab({
  companyId,
  canManage,
}: {
  companyId: string
  canManage: boolean
}) {
  const { authFetch } = useAuth()
  const [tree, setTree] = useState<DepartmentResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [parentId, setParentId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)

  function loadTree() {
    setIsLoading(true)
    listDepartments(authFetch, companyId)
      .then(setTree)
      .catch(() => toast.error('Failed to load departments'))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => { loadTree() }, [authFetch, companyId])

  async function handleCreate() {
    if (!newName.trim()) return
    setIsSaving(true)
    try {
      await createDepartment(authFetch, companyId, { name: newName, parentId: parentId ?? undefined })
      setNewName('')
      setParentId(null)
      setShowForm(false)
      loadTree()
      toast.success('Department created')
    } catch {
      toast.error('Failed to create department')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(deptId: string) {
    try {
      await deleteDepartment(authFetch, companyId, deptId)
      loadTree()
      toast.success('Department deleted')
    } catch {
      toast.error('Failed to delete department')
    }
  }

  function flatten(depts: DepartmentResponse[]): DepartmentResponse[] {
    return depts.flatMap((d) => [d, ...flatten(d.children ?? [])])
  }
  const allDepts = flatten(tree)

  function renderTree(depts: DepartmentResponse[], depth = 0): React.ReactNode {
    return depts.map((dept) => (
      <div key={dept.id} style={{ paddingLeft: depth * 16 }}>
        <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
          <div className="flex items-center gap-2">
            {depth > 0 && <span className="text-muted-foreground text-xs">└</span>}
            <span className="text-sm">{dept.name}</span>
          </div>
          {canManage && (
            <button
              type="button"
              onClick={() => dept.id && handleDelete(dept.id)}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              Remove
            </button>
          )}
        </div>
        {(dept.children ?? []).length > 0 && renderTree(dept.children!, depth + 1)}
      </div>
    ))
  }

  if (isLoading) return <div className="h-16 bg-muted animate-pulse rounded-lg" />

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="text-sm text-primary hover:underline"
          >
            {showForm ? 'Cancel' : '+ Add department'}
          </button>
        </div>
      )}

      {showForm && (
        <div className="rounded-lg border border-border p-4 space-y-3">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input
              placeholder="Engineering"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>
          {allDepts.length > 0 && (
            <div className="space-y-1.5">
              <Label>Parent department (optional)</Label>
              <select
                value={parentId ?? ''}
                onChange={(e) => setParentId(e.target.value || null)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">Top level</option>
                {allDepts.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          )}
          <Button size="sm" onClick={handleCreate} disabled={isSaving || !newName.trim()}>
            {isSaving ? 'Creating…' : 'Create'}
          </Button>
        </div>
      )}

      {tree.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">No departments configured.</p>
      ) : (
        <div className="rounded-lg border border-border px-4">
          {renderTree(tree)}
        </div>
      )}
    </div>
  )
}

// ─── SpendingTab ─────────────────────────────────────────────────────────────

function formatCurrency(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}

function SpendingTab({ companyId }: { companyId: string }) {
  const { authFetch } = useAuth()
  const [summary, setSummary] = useState<CompanySpendingSummaryResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    getSpendingSummary(authFetch, companyId)
      .then(setSummary)
      .catch(() => toast.error('Failed to load spending summary'))
      .finally(() => setIsLoading(false))
  }, [authFetch, companyId])

  if (isLoading) return <Skeleton className="h-48 w-full" />
  if (!summary) return null

  const inv = summary.invoiceSummary
  const currency = summary.currency ?? 'USD'
  return (
    <div className="space-y-6">
      {/* Overview */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-border p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total orders</p>
          <p className="mt-1 text-2xl font-bold">{summary.totalOrders ?? 0}</p>
        </div>
        <div className="rounded-xl border border-border p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total spend</p>
          <p className="mt-1 text-2xl font-bold">{formatCurrency(summary.totalSpend ?? 0, currency)}</p>
        </div>
      </div>

      {/* Invoice summary */}
      {inv && (
        <div className="rounded-xl border border-border p-4 space-y-2">
          <p className="text-sm font-semibold text-foreground">Invoices</p>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Pending</p>
              <p className="font-medium">{inv.pendingCount ?? 0} · {formatCurrency(inv.pendingAmount ?? 0, currency)}</p>
            </div>
            <div>
              <p className="text-destructive">Overdue</p>
              <p className="font-medium text-destructive">{inv.overdueCount ?? 0} · {formatCurrency(inv.overdueAmount ?? 0, currency)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Paid</p>
              <p className="font-medium">{inv.paidCount ?? 0} · {formatCurrency(inv.paidAmount ?? 0, currency)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Per-member spending */}
      {(summary.memberSpending ?? []).length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground">Team spending</p>
          {summary.memberSpending!.map((m) => (
            <div key={m.userId} className="rounded-xl border border-border px-4 py-3 space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium truncate">{m.email}</span>
                <span className="shrink-0 ml-3">{formatCurrency(m.totalSpend ?? 0, currency)}</span>
              </div>
              {m.spendingLimit != null && (
                <>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${(m.utilizationPercent ?? 0) > 80 ? 'bg-destructive' : 'bg-primary'}`}
                      style={{ width: `${Math.min(100, m.utilizationPercent ?? 0)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {m.utilizationPercent ?? 0}% of {formatCurrency(m.spendingLimit, currency)} limit
                  </p>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── ComplianceTab ────────────────────────────────────────────────────────────

function ComplianceTab({ company, onUpdated }: { company: CompanyResponse; onUpdated: (c: CompanyResponse) => void }) {
  const { accessToken } = useAuth()
  const [isUploading, setIsUploading] = useState(false)
  const fileRef = React.useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !company.id) return
    setIsUploading(true)
    try {
      const updated = await uploadTaxCertificate(company.id, file, accessToken)
      onUpdated(updated)
      toast.success('Tax certificate uploaded.')
    } catch {
      toast.error('Failed to upload certificate.')
    } finally {
      setIsUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Tax exemption</p>
            <p className="text-sm text-muted-foreground">
              {company.taxExempt ? 'This company is tax exempt.' : 'This company is not tax exempt.'}
            </p>
          </div>
          {company.taxExempt && (
            <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-800 dark:bg-green-900/30 dark:text-green-400">
              Exempt
            </span>
          )}
        </div>

        <Separator />

        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Tax exemption certificate</p>
          {company.taxCertificateUrl ? (
            <div className="flex items-center gap-3">
              <a
                href={company.taxCertificateUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                View certificate
              </a>
              <span className="text-xs text-muted-foreground">·</span>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={isUploading}
                className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                Replace
              </button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No certificate on file.</p>
          )}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={isUploading}
            className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
          >
            {isUploading ? 'Uploading…' : company.taxCertificateUrl ? 'Replace certificate' : 'Upload certificate'}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            onChange={(e) => void handleFileChange(e)}
          />
          <p className="text-xs text-muted-foreground">PDF, JPG, or PNG. Max 10 MB.</p>
        </div>
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
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {(['members', ...(canManageInvitations ? ['invitations'] : []), 'departments', 'spending', 'compliance'] as Tab[]).map(
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
      {tab === 'departments' && (
        <DepartmentsTab companyId={company.id!} canManage={canManageInvitations} />
      )}
      {tab === 'spending' && (
        <SpendingTab companyId={company.id!} />
      )}
      {tab === 'compliance' && (
        <ComplianceTab company={company} onUpdated={setCompany} />
      )}
    </div>
  )
}
