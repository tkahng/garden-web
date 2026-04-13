import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useAuth } from '#/context/auth'
import { Skeleton } from '#/components/ui/skeleton'
import { listOrders } from '#/lib/account-api'
import type { OrderResponse, PageMeta } from '#/lib/account-api'

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/account/orders/')({
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search.page ?? 0),
  }),
  component: OrdersPage,
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatPrice(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}

const ORDER_STATUS_CLASS: Record<string, string> = {
  PENDING_PAYMENT: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-muted text-muted-foreground',
  REFUNDED: 'bg-blue-100 text-blue-800',
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

// ─── OrderRow ─────────────────────────────────────────────────────────────────

export function OrderRow({ order }: { order: OrderResponse }) {
  const itemCount = order.items?.length ?? 0

  return (
    <Link
      to="/account/orders/$orderId"
      params={{ orderId: order.id! }}
      className="flex items-center justify-between rounded-xl border border-border px-4 py-3 hover:bg-muted/40 transition-colors"
    >
      <span className="text-sm text-muted-foreground">
        {order.createdAt ? formatDate(order.createdAt) : '—'}
      </span>
      <span className="text-sm text-muted-foreground">
        {itemCount} {itemCount === 1 ? 'item' : 'items'}
      </span>
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-medium ${ORDER_STATUS_CLASS[order.status ?? ''] ?? ''}`}
      >
        {order.status}
      </span>
      <span className="text-sm font-semibold">
        {formatPrice(order.totalAmount ?? 0, order.currency ?? 'USD')}
      </span>
      <span className="text-sm text-muted-foreground">View →</span>
    </Link>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({
  meta,
  currentPage,
}: {
  meta: PageMeta
  currentPage: number
}) {
  const totalPages = Math.ceil((meta.total ?? 0) / (meta.pageSize ?? 10))
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between pt-4">
      <Link
        to="/account/orders"
        search={{ page: currentPage - 1 }}
        className={[
          'rounded-full border border-border px-5 py-2 text-sm font-semibold',
          currentPage === 0
            ? 'pointer-events-none opacity-40'
            : 'hover:bg-muted',
        ].join(' ')}
        aria-disabled={currentPage === 0}
      >
        ← Previous
      </Link>
      <span className="text-sm text-muted-foreground">
        Page {currentPage + 1} of {totalPages}
      </span>
      <Link
        to="/account/orders"
        search={{ page: currentPage + 1 }}
        className={[
          'rounded-full border border-border px-5 py-2 text-sm font-semibold',
          currentPage >= totalPages - 1
            ? 'pointer-events-none opacity-40'
            : 'hover:bg-muted',
        ].join(' ')}
        aria-disabled={currentPage >= totalPages - 1}
      >
        Next →
      </Link>
    </div>
  )
}

// ─── OrdersPage ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 10

function OrdersPage() {
  const { authFetch } = useAuth()
  const { page } = Route.useSearch()

  const [orders, setOrders] = useState<OrderResponse[]>([])
  const [meta, setMeta] = useState<PageMeta | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    listOrders(authFetch, { page, size: PAGE_SIZE })
      .then((data) => {
        if (cancelled) return
        setOrders(data.content ?? [])
        setMeta(data.meta ?? null)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [authFetch, page])

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
    <div className="flex flex-col gap-3 max-w-2xl">
      <h2 className="text-lg font-semibold">Orders</h2>
      {orders.map((order) => (
        <OrderRow key={order.id} order={order} />
      ))}
      {meta && <Pagination meta={meta} currentPage={page} />}
    </div>
  )
}
