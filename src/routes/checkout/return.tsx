import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import type { CheckoutReturnResponse } from '#/lib/cart-api'
import { createPublicClient, callApi } from '#/lib/client'

export const Route = createFileRoute('/checkout/return')({
  component: CheckoutReturnRoute,
  validateSearch: (search: Record<string, unknown>) => ({
    session_id: typeof search.session_id === 'string' ? search.session_id : null,
  }),
})

function CheckoutReturnRoute() {
  const { session_id } = Route.useSearch()
  return <CheckoutReturnPage sessionId={session_id} />
}

export function CheckoutReturnPage({ sessionId }: { sessionId: string | null }) {
  const [status, setStatus] = useState<'loading' | 'success' | 'cancelled' | 'error'>(
    sessionId ? 'loading' : 'error',
  )
  const [order, setOrder] = useState<CheckoutReturnResponse | null>(null)

  useEffect(() => {
    if (!sessionId) return
    let cancelled = false

    callApi(createPublicClient().GET('/api/v1/checkout/return', {
      params: { query: { session_id: sessionId } },
    }))
      .then((data) => {
        if (cancelled) return
        const d = data as CheckoutReturnResponse
        setOrder(d)
        setStatus(d.status === 'CANCELLED' ? 'cancelled' : 'success')
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })

    return () => { cancelled = true }
  }, [sessionId])

  if (status === 'loading') {
    return (
      <main className="page-wrap py-16 text-center">
        <p className="text-muted-foreground">Confirming your order…</p>
      </main>
    )
  }

  if (status === 'cancelled') {
    return (
      <main className="page-wrap py-16 text-center">
        <h1 className="text-2xl font-bold text-foreground">Payment cancelled</h1>
        <p className="mt-2 text-muted-foreground">
          Your payment was cancelled. Your cart is still saved.
        </p>
        <Link
          to="/cart"
          className="mt-6 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90"
        >
          Return to cart
        </Link>
      </main>
    )
  }

  if (status === 'error') {
    return (
      <main className="page-wrap py-16 text-center">
        <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
        <p className="mt-2 text-muted-foreground">
          We couldn't confirm your order. Please contact support.
        </p>
        <Link
          to="/cart"
          className="mt-6 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90"
        >
          Return to cart
        </Link>
      </main>
    )
  }

  return (
    <main className="page-wrap py-16 text-center">
      <h1 className="text-2xl font-bold text-foreground">Order confirmed!</h1>
      <p className="mt-2 text-muted-foreground">
        Thank you for your purchase.
        {order?.orderId && (
          <> Your order ID is <span className="font-semibold text-foreground">{order.orderId}</span>.</>
        )}
      </p>
      {order?.status === 'PENDING_PAYMENT' && (
        <p className="mt-2 text-sm text-muted-foreground">Payment is being processed.</p>
      )}
      <Link
        to="/products"
        search={{ page: 0 }}
        className="mt-6 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90"
      >
        Continue shopping
      </Link>
    </main>
  )
}
