import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '#/context/auth'
import { Button } from '#/components/ui/button'
import { Skeleton } from '#/components/ui/skeleton'
import { Separator } from '#/components/ui/separator'
import { toast } from 'sonner'
import { getQuote, acceptQuote, cancelQuote, getQuotePdfUrl } from '#/lib/b2b-api'
import type { QuoteRequestResponse, QuoteItemResponse } from '#/lib/b2b-api'

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/account/quotes/$quoteId')({
  component: QuoteDetailPage,
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatPrice(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}

const QUOTE_STATUS_CLASS: Record<string, string> = {
  PENDING: 'bg-muted text-muted-foreground',
  ASSIGNED: 'bg-muted text-muted-foreground',
  DRAFT: 'bg-muted text-muted-foreground',
  SENT: 'bg-blue-100 text-blue-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  PAID: 'bg-green-100 text-green-800',
  PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800',
  REJECTED: 'bg-red-100 text-red-800',
  EXPIRED: 'bg-muted text-muted-foreground',
  CANCELLED: 'bg-muted text-muted-foreground',
}

// ─── Expiry countdown ─────────────────────────────────────────────────────────

type Countdown = { days: number; hours: number; minutes: number; seconds: number; expired: boolean }

function computeCountdown(expiresAt: string): Countdown {
  const ms = Math.max(0, new Date(expiresAt).getTime() - Date.now())
  const totalSeconds = Math.floor(ms / 1000)
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    expired: ms === 0,
  }
}

function useCountdown(expiresAt: string): Countdown {
  const [count, setCount] = useState(() => computeCountdown(expiresAt))
  const tick = useCallback(() => setCount(computeCountdown(expiresAt)), [expiresAt])
  useEffect(() => {
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [tick])
  return count
}

function ExpiryCountdown({ expiresAt }: { expiresAt: string }) {
  const { days, hours, minutes, seconds, expired } = useCountdown(expiresAt)

  if (expired) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 font-medium">
        This offer has expired.
      </div>
    )
  }

  if (days === 0) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
        <span className="font-semibold">Offer expires soon — </span>
        {hours > 0 && <span>{hours}h </span>}
        <span>{minutes}m </span>
        <span>{seconds}s</span>
      </div>
    )
  }

  if (days <= 3) {
    return (
      <div className="rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-3 text-sm text-yellow-800">
        <span className="font-semibold">Offer expires in </span>
        <span>{days}d {hours}h</span>
      </div>
    )
  }

  return (
    <p className="text-xs text-muted-foreground">
      Offer expires in {days} days ({formatDate(expiresAt)})
    </p>
  )
}

// ─── QuoteLineItem ────────────────────────────────────────────────────────────

function QuoteLineItem({ item }: { item: QuoteItemResponse }) {
  const lineTotal =
    item.unitPrice != null ? item.unitPrice * (item.quantity ?? 1) : null

  return (
    <div className="flex items-start justify-between py-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{item.description}</p>
        <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
      </div>
      <div className="text-right ml-4 shrink-0">
        {item.unitPrice != null ? (
          <>
            <p className="text-sm">{formatPrice(item.unitPrice)} ea.</p>
            {lineTotal != null && (
              <p className="text-sm font-semibold">{formatPrice(lineTotal)}</p>
            )}
          </>
        ) : (
          <p className="text-xs text-muted-foreground">Pending pricing</p>
        )}
      </div>
    </div>
  )
}

// ─── QuoteDetailPage ──────────────────────────────────────────────────────────

export function QuoteDetailPage() {
  const { quoteId } = Route.useParams()
  const { authFetch } = useAuth()
  const navigate = useNavigate()

  const [quote, setQuote] = useState<QuoteRequestResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAccepting, setIsAccepting] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

  useEffect(() => {
    getQuote(authFetch, quoteId)
      .then(setQuote)
      .catch(() => toast.error('Failed to load quote'))
      .finally(() => setIsLoading(false))
  }, [authFetch, quoteId])

  async function handleAccept() {
    setIsAccepting(true)
    try {
      const result = await acceptQuote(authFetch, quoteId)
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl
      } else if (result.invoiceId) {
        toast.success('Quote accepted — invoice issued on net terms.')
        navigate({ to: '/account/quotes', search: { page: 0 } })
      } else if (result.pendingApproval) {
        toast.info('Your order requires manager approval before processing.')
        setQuote((q) => q ? { ...q, status: 'PENDING_APPROVAL' as const } : q)
      } else {
        toast.success('Quote accepted')
        navigate({ to: '/account/quotes', search: { page: 0 } })
      }
    } catch (e: unknown) {
      const status = e instanceof Error ? e.message : ''
      if (status === '409') toast.error('Quote is no longer available.')
      else if (status === '410') toast.error('This quote has expired.')
      else toast.error('Failed to accept quote')
    } finally {
      setIsAccepting(false)
    }
  }

  async function handleCancel() {
    setIsCancelling(true)
    try {
      const updated = await cancelQuote(authFetch, quoteId)
      setQuote(updated)
      toast.success('Quote cancelled')
    } catch {
      toast.error('Failed to cancel quote')
    } finally {
      setIsCancelling(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-2xl">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (!quote) {
    return (
      <div>
        <p className="text-muted-foreground">Quote not found.</p>
        <Link to="/account/quotes" search={{ page: 0 }} className="text-sm underline mt-2 block">
          ← Back to quotes
        </Link>
      </div>
    )
  }

  const items = quote.items ?? []
  const total = items.reduce((sum, i) => {
    if (i.unitPrice == null) return sum
    return sum + i.unitPrice * (i.quantity ?? 1)
  }, 0)
  const allPriced = items.length > 0 && items.every((i) => i.unitPrice != null)

  const canAccept = quote.status === 'SENT'
  const canCancel = ['PENDING', 'ASSIGNED', 'DRAFT', 'SENT', 'PENDING_APPROVAL'].includes(
    quote.status ?? '',
  )

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            to="/account/quotes" search={{ page: 0 }}
            className="text-xs text-muted-foreground hover:underline"
          >
            ← Quotes
          </Link>
          <h2 className="text-lg font-semibold mt-1">
            Quote #{quote.id?.slice(0, 8)}
          </h2>
          {quote.createdAt && (
            <p className="text-sm text-muted-foreground">{formatDate(quote.createdAt)}</p>
          )}
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${QUOTE_STATUS_CLASS[quote.status ?? ''] ?? ''}`}
        >
          {quote.status?.replace('_', ' ').toLowerCase()}
        </span>
      </div>

      {/* Items */}
      <div className="rounded-xl border border-border">
        <div className="px-4 divide-y divide-border">
          {items.map((item) => (
            <QuoteLineItem key={item.id} item={item} />
          ))}
        </div>
        {allPriced && (
          <>
            <Separator />
            <div className="flex justify-between px-4 py-3">
              <span className="text-sm font-semibold">Total</span>
              <span className="text-sm font-semibold">{formatPrice(total)}</span>
            </div>
          </>
        )}
      </div>

      {/* Delivery */}
      {quote.deliveryAddressLine1 && (
        <div className="text-sm space-y-0.5">
          <p className="font-medium text-xs text-muted-foreground uppercase tracking-wide">
            Delivery
          </p>
          <p>{quote.deliveryAddressLine1}</p>
          {quote.deliveryAddressLine2 && <p>{quote.deliveryAddressLine2}</p>}
          <p>
            {quote.deliveryCity}
            {quote.deliveryState ? `, ${quote.deliveryState}` : ''} {quote.deliveryPostalCode}
          </p>
          <p>{quote.deliveryCountry}</p>
        </div>
      )}

      {/* Expiry */}
      {quote.expiresAt && quote.status === 'SENT' && (
        <ExpiryCountdown expiresAt={quote.expiresAt} />
      )}
      {quote.expiresAt && quote.status === 'EXPIRED' && (
        <p className="text-xs text-muted-foreground">
          Expired {formatDate(quote.expiresAt)}
        </p>
      )}

      {/* Approval notice */}
      {quote.status === 'PENDING_APPROVAL' && (
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-3 text-sm text-yellow-800">
          This order is awaiting approval from your company manager or owner.
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {canAccept && (
          <Button onClick={handleAccept} disabled={isAccepting}>
            {isAccepting ? 'Processing…' : 'Accept quote'}
          </Button>
        )}
        {quote.pdfBlobId && (
          <a
            href={getQuotePdfUrl(quoteId)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            Download PDF
          </a>
        )}
        {canCancel && (
          <Button variant="outline" onClick={handleCancel} disabled={isCancelling}>
            {isCancelling ? 'Cancelling…' : 'Cancel quote'}
          </Button>
        )}
      </div>
    </div>
  )
}
