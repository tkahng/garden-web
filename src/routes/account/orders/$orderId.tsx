import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useAuth } from '#/context/auth'
import { Skeleton } from '#/components/ui/skeleton'
import { getOrder, cancelOrder } from '#/lib/account-api'
import type { OrderResponse } from '#/lib/account-api'

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/account/orders/$orderId')({
  component: OrderDetailPage,
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
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

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function OrderDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-5 w-48" />
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-16 w-full rounded-xl" />
    </div>
  )
}

// ─── OrderDetailPage ──────────────────────────────────────────────────────────

function OrderDetailPage() {
  const { authFetch } = useAuth()
  const { orderId } = Route.useParams()

  const [order, setOrder] = useState<OrderResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)
    getOrder(authFetch, orderId)
      .then((data) => {
        if (!cancelled) setOrder(data)
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load order.')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [authFetch, orderId])

  async function handleCancel() {
    if (!order?.id) return
    setIsCancelling(true)
    try {
      const updated = await cancelOrder(authFetch, order.id)
      setOrder(updated)
    } finally {
      setIsCancelling(false)
    }
  }

  if (isLoading) return <OrderDetailSkeleton />

  if (error || !order) {
    return (
      <div className="flex flex-col gap-4">
        <Link
          to="/account/orders"
          search={{ page: 0 }}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to orders
        </Link>
        <p className="text-sm text-destructive">{error ?? 'Order not found.'}</p>
      </div>
    )
  }

  const items = order.items ?? []
  const subtotal = items.reduce(
    (sum, item) => sum + (item.unitPrice ?? 0) * (item.quantity ?? 1),
    0,
  )

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Back */}
      <Link
        to="/account/orders"
        search={{ page: 0 }}
        className="text-sm text-muted-foreground hover:text-foreground w-fit"
      >
        ← Back to orders
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">Order details</h2>
          {order.createdAt && (
            <p className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</p>
          )}
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${ORDER_STATUS_CLASS[order.status ?? ''] ?? ''}`}
        >
          {order.status}
        </span>
      </div>

      {/* Items */}
      <div className="flex flex-col divide-y divide-border rounded-xl border border-border">
        {items.map((item) => {
          const lineTotal = (item.unitPrice ?? 0) * (item.quantity ?? 1)
          return (
            <div key={item.id} className="flex items-center gap-4 px-4 py-4">
              {/* Image */}
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
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

              {/* Info */}
              <div className="flex flex-1 flex-col gap-0.5 text-sm min-w-0">
                <p className="font-semibold truncate">
                  {item.product?.productTitle ?? 'Unknown product'}
                </p>
                {item.product?.variantTitle && (
                  <p className="text-muted-foreground">{item.product.variantTitle}</p>
                )}
                <p className="text-muted-foreground">
                  {item.quantity} × {formatPrice(item.unitPrice ?? 0)}
                </p>
              </div>

              {/* Line total */}
              <p className="text-sm font-semibold shrink-0">
                {formatPrice(lineTotal, order.currency ?? 'USD')}
              </p>
            </div>
          )
        })}
      </div>

      {/* Summary */}
      <div className="flex flex-col gap-2 rounded-xl border border-border px-4 py-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatPrice(subtotal, order.currency ?? 'USD')}</span>
        </div>
        {order.taxAmount != null && order.taxAmount > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Tax</span>
            <span>{formatPrice(order.taxAmount, order.currency ?? 'USD')}</span>
          </div>
        )}
        <div className="flex items-center justify-between border-t border-border pt-2 text-sm font-semibold">
          <span>Total</span>
          <span>{formatPrice(order.totalAmount ?? 0, order.currency ?? 'USD')}</span>
        </div>
      </div>

      {/* Cancel */}
      {order.status === 'PENDING_PAYMENT' && (
        <button
          type="button"
          disabled={isCancelling}
          onClick={handleCancel}
          className="self-start rounded-full border border-destructive px-5 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-50"
        >
          {isCancelling ? 'Cancelling…' : 'Cancel order'}
        </button>
      )}
    </div>
  )
}
