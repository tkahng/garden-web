import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useAuth } from '#/context/auth'
import { useAuthModal } from '#/context/auth-modal'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '#/components/ui/tabs'
import { Skeleton } from '#/components/ui/skeleton'
import {
  getAccount,
  updateAccount,
  listAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  listOrders,
  cancelOrder,
} from '#/lib/account-api'
import type { AccountResponse, AddressRequest, AddressResponse, OrderResponse } from '#/lib/account-api'
import { AddressForm, AddressCard } from './addresses'
import { OrderRow } from './orders'

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/account/')({
  validateSearch: (search: Record<string, unknown>) => ({
    tab: (search.tab as string) ?? 'profile',
  }),
  component: AccountPage,
})

// ─── AuthFetch type alias ─────────────────────────────────────────────────────

type AuthFetch = Parameters<typeof getAccount>[0]

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

// ─── ProfileTab ───────────────────────────────────────────────────────────────

export function ProfileTab({ authFetch }: { authFetch: AuthFetch }) {
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

  function statusClass(status?: string) {
    if (status === 'ACTIVE') return 'bg-green-100 text-green-800'
    if (status === 'UNVERIFIED') return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

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

// ─── AddressSkeleton ──────────────────────────────────────────────────────────

export function AddressSkeleton() {
  return (
    <div data-testid="address-skeleton" className="flex flex-col gap-3">
      {[1, 2].map((i) => (
        <Skeleton key={i} className="h-28 w-full rounded-xl" />
      ))}
    </div>
  )
}

// ─── AddressesTab ─────────────────────────────────────────────────────────────

export function AddressesTab({ authFetch }: { authFetch: AuthFetch }) {
  const [addresses, setAddresses] = useState<AddressResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | 'new' | null>(null)

  async function loadAddresses() {
    const data = await listAddresses(authFetch)
    setAddresses(data)
  }

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    listAddresses(authFetch)
      .then((data) => {
        if (!cancelled) setAddresses(data)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [authFetch])

  async function handleSave(data: AddressRequest, id?: string) {
    setIsSaving(true)
    try {
      if (id) {
        await updateAddress(authFetch, id, data)
      } else {
        await createAddress(authFetch, data)
      }
      await loadAddresses()
      setEditingId(null)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(id: string) {
    await deleteAddress(authFetch, id)
    await loadAddresses()
  }

  if (isLoading) return <AddressSkeleton />

  return (
    <div className="flex flex-col gap-4 max-w-lg">
      <h2 className="text-lg font-semibold">Addresses</h2>

      {addresses.length === 0 && editingId === null && (
        <p className="text-sm text-muted-foreground">
          No saved addresses. Add one to speed up checkout.
        </p>
      )}

      {addresses.map((addr) =>
        editingId === addr.id ? (
          <AddressForm
            key={addr.id}
            initial={addr as Partial<AddressRequest>}
            onSave={(data) => handleSave(data, addr.id)}
            onCancel={() => setEditingId(null)}
            isSaving={isSaving}
          />
        ) : (
          <AddressCard
            key={addr.id}
            address={addr}
            onEdit={() => setEditingId(addr.id!)}
            onDelete={() => handleDelete(addr.id!)}
          />
        ),
      )}

      {editingId === 'new' ? (
        <AddressForm
          onSave={(data) => handleSave(data)}
          onCancel={() => setEditingId(null)}
          isSaving={isSaving}
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditingId('new')}
          className="self-start rounded-full border border-border px-5 py-2 text-sm font-semibold hover:bg-muted"
        >
          Add address
        </button>
      )}
    </div>
  )
}

// ─── OrderSkeleton ────────────────────────────────────────────────────────────

export function OrderSkeleton() {
  return (
    <div data-testid="order-skeleton" className="flex flex-col gap-3">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-16 w-full rounded-xl" />
      ))}
    </div>
  )
}

// ─── OrdersTab ────────────────────────────────────────────────────────────────

export function OrdersTab({ authFetch }: { authFetch: AuthFetch }) {
  const [orders, setOrders] = useState<OrderResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [isCancelling, setIsCancelling] = useState(false)
  const PAGE_SIZE = 10

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    listOrders(authFetch, { page: 0, size: PAGE_SIZE })
      .then((data) => {
        if (cancelled) return
        setOrders(data.content ?? [])
        setTotal(data.meta?.total ?? 0)
        setPage(0)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [authFetch])

  async function handleLoadMore() {
    const next = page + 1
    const data = await listOrders(authFetch, { page: next, size: PAGE_SIZE })
    setOrders((prev) => [...prev, ...(data.content ?? [])])
    setPage(next)
  }

  async function handleCancel(id: string) {
    setIsCancelling(true)
    try {
      const updated = await cancelOrder(authFetch, id)
      setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)))
    } finally {
      setIsCancelling(false)
    }
  }

  const hasMore = orders.length < total

  if (isLoading) return <OrderSkeleton />

  if (orders.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Orders</h2>
        <p className="text-sm text-muted-foreground">No orders yet. Start shopping!</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <h2 className="text-lg font-semibold">Orders</h2>
      {orders.map((order) => (
        <OrderRow
          key={order.id}
          order={order}
          onCancel={handleCancel}
          isCancelling={isCancelling}
        />
      ))}
      {hasMore && (
        <button
          type="button"
          onClick={handleLoadMore}
          className="self-start rounded-full border border-border px-5 py-2 text-sm font-semibold hover:bg-muted"
        >
          Load more
        </button>
      )}
    </div>
  )
}

// ─── AccountPage ──────────────────────────────────────────────────────────────

export default function AccountPage() {
  const { isAuthenticated, authFetch } = useAuth()
  const { openAuthModal } = useAuthModal()
  const navigate = useNavigate()
  const { tab } = useSearch({ strict: false }) as { tab?: string }

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: '/' })
      openAuthModal('login')
    }
  }, [isAuthenticated, navigate, openAuthModal])

  if (!isAuthenticated) return null

  const activeTab = tab ?? 'profile'

  return (
    <main className="page-wrap px-4 py-10">
      <h1 className="mb-8 text-2xl font-bold">Account</h1>
      <Tabs
        value={activeTab}
        onValueChange={(v) => navigate({ search: (prev: Record<string, unknown>) => ({ ...prev, tab: v }) })}
      >
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="addresses">Addresses</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <ProfileTab authFetch={authFetch} />
        </TabsContent>
        <TabsContent value="addresses">
          <AddressesTab authFetch={authFetch} />
        </TabsContent>
        <TabsContent value="orders">
          <OrdersTab authFetch={authFetch} />
        </TabsContent>
      </Tabs>
    </main>
  )
}
