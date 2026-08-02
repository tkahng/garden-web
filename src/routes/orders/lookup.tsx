import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { createPublicClient, callApi } from '#/lib/client'
import type { components } from '#/schema'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Button } from '#/components/ui/button'

type GuestOrderResponse = components['schemas']['GuestOrderResponse']

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

function statusLabel(status: string | undefined): string {
  switch (status) {
    case 'PAID': return 'Paid'
    case 'PENDING_PAYMENT': return 'Payment pending'
    case 'PARTIALLY_FULFILLED': return 'Partially shipped'
    case 'FULFILLED': return 'Shipped'
    case 'CANCELLED': return 'Cancelled'
    case 'REFUNDED': return 'Refunded'
    default: return status ?? 'Unknown'
  }
}

export const Route = createFileRoute('/orders/lookup')({
  component: OrderLookupRoute,
  validateSearch: (search: Record<string, unknown>) => ({
    orderId: typeof search.orderId === 'string' ? search.orderId : undefined,
  }),
})

function OrderLookupRoute() {
  const { orderId } = Route.useSearch()
  return <OrderLookupPage initialOrderId={orderId} />
}

export function OrderLookupPage({ initialOrderId }: { initialOrderId?: string }) {
  const [orderId, setOrderId] = useState(initialOrderId ?? '')
  const [email, setEmail] = useState('')
  const [order, setOrder] = useState<GuestOrderResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const lookup = async () => {
    if (!orderId || !email) return
    setLoading(true)
    setError(null)
    try {
      const data = await callApi(createPublicClient().GET('/api/v1/checkout/orders/{orderId}/lookup', {
        params: { path: { orderId }, query: { guestEmail: email } },
      })) as GuestOrderResponse
      setOrder(data)
    } catch {
      setError('Order not found. Check your order ID and the email used at checkout.')
      setOrder(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="page-wrap py-12">
      <div className="mx-auto max-w-lg">
        <h1 className="text-2xl font-bold text-foreground">Order lookup</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter your order ID and the email you used at checkout.
        </p>

        {!order && (
          <div className="mt-6 flex flex-col gap-4">
            <div>
              <Label htmlFor="orderId">Order ID</Label>
              <Input
                id="orderId"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="e.g. 019...abc"
              />
            </div>
            <div>
              <Label htmlFor="lookupEmail">Email</Label>
              <Input
                id="lookupEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') lookup() }}
                placeholder="you@example.com"
              />
            </div>
            <Button onClick={lookup} disabled={loading || !orderId || !email}>
              {loading ? 'Looking up…' : 'Look up order'}
            </Button>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )}

        {order && (
          <div className="mt-6 rounded-lg border border-border p-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Status</span>
              <span className="text-sm font-bold text-foreground">{statusLabel(order.status)}</span>
            </div>
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Order ID</span>
              <span className="text-sm font-mono text-foreground">{order.id}</span>
            </div>
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Date</span>
              <span className="text-sm text-foreground">
                {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '—'}
              </span>
            </div>

            {order.items && order.items.length > 0 && (
              <div className="mb-4 border-t border-border pt-4">
                <p className="mb-2 text-sm font-semibold text-foreground">Items</p>
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between py-1 text-sm">
                    <span className="text-muted-foreground">
                      {item.product?.productTitle ?? 'Item'} × {item.quantity}
                    </span>
                    <span className="text-foreground">
                      {formatPrice((item.unitPrice ?? 0) * (item.quantity ?? 0))}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-border pt-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="text-sm text-foreground">{formatPrice(order.totalAmount ?? 0)}</span>
              </div>
              {order.shippingCost ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Shipping</span>
                  <span className="text-sm text-foreground">{formatPrice(order.shippingCost)}</span>
                </div>
              ) : null}
              <div className="flex items-center justify-between border-t border-border pt-2 font-bold">
                <span className="text-sm text-foreground">Total</span>
                <span className="text-sm text-foreground">
                  {formatPrice(order.totalAmount ?? 0)}
                </span>
              </div>
              {order.currency ? (
                <p className="text-xs text-muted-foreground text-right">
                  All amounts in {order.currency.toUpperCase()}
                </p>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => { setOrder(null); setError(null) }}
              className="mt-4 text-sm text-primary underline hover:opacity-80"
            >
              Look up another order
            </button>
          </div>
        )}

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Have an account? <Link to="/" className="text-primary underline">Log in</Link> to see all your orders.
        </p>
      </div>
    </main>
  )
}
