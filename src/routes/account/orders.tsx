import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useAuth } from '#/context/auth'
import { Skeleton } from '#/components/ui/skeleton'
import { listOrders, cancelOrder } from '#/lib/account-api'
import type { OrderResponse } from '#/lib/account-api'

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/account/orders')({
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

export function OrderRow({
  order,
  onCancel,
  isCancelling,
}: {
  order: OrderResponse
  onCancel: (id: string) => void
  isCancelling: boolean
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-xl border border-border">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-muted/40"
      >
        <span className="font-mono text-sm text-muted-foreground truncate max-w-[120px]">
          {order.id}
        </span>
        <span className="text-sm text-muted-foreground">
          {order.createdAt ? formatDate(order.createdAt) : '—'}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${ORDER_STATUS_CLASS[order.status ?? ''] ?? ''}`}
        >
          {order.status}
        </span>
        <span className="text-sm font-semibold">
          {formatPrice(order.totalAmount ?? 0, order.currency ?? 'USD')}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-border px-4 py-3 flex flex-col gap-3">
          {(order.items ?? []).map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                {item.product?.imageUrl ? (
                  <img
                    src={item.product.imageUrl}
                    alt={item.product.productTitle ?? ''}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full" />
                )}
              </div>
              <div className="flex flex-1 flex-col gap-0.5 text-sm">
                <p className="font-semibold">
                  {item.product?.productTitle ?? item.variantId}
                </p>
                {item.product?.variantTitle && (
                  <p className="text-muted-foreground">{item.product.variantTitle}</p>
                )}
                <p className="text-muted-foreground">
                  {item.quantity} × {formatPrice(item.unitPrice ?? 0)}
                </p>
              </div>
              <p className="text-sm font-semibold">
                {formatPrice((item.unitPrice ?? 0) * (item.quantity ?? 1))}
              </p>
            </div>
          ))}

          <div className="flex items-center justify-between border-t border-border pt-2">
            <span className="text-sm font-semibold">Total</span>
            <span className="text-sm font-semibold">
              {formatPrice(order.totalAmount ?? 0, order.currency ?? 'USD')}
            </span>
          </div>

          {order.status === 'PENDING_PAYMENT' && (
            <button
              type="button"
              disabled={isCancelling}
              onClick={() => onCancel(order.id!)}
              className="self-start rounded-full border border-destructive px-4 py-1.5 text-sm font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-50"
            >
              {isCancelling ? 'Cancelling…' : 'Cancel order'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── OrdersPage ───────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const { authFetch } = useAuth()

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
