import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '#/context/auth'
import { Button } from '#/components/ui/button'
import { Skeleton } from '#/components/ui/skeleton'
import { Separator } from '#/components/ui/separator'
import { toast } from 'sonner'
import {
  listPendingApprovals,
  approveQuote,
  rejectApproval,
} from '#/lib/b2b-api'
import type { QuoteRequestResponse, QuoteItemResponse } from '#/lib/b2b-api'

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/account/quotes/pending-approvals')({
  component: PendingApprovalsPage,
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

// ─── QuoteItemsList ───────────────────────────────────────────────────────────

function QuoteItemsList({ items }: { items: QuoteItemResponse[] }) {
  const total = items.reduce((sum, i) => {
    if (i.unitPrice == null) return sum
    return sum + i.unitPrice * (i.quantity ?? 1)
  }, 0)
  const allPriced = items.length > 0 && items.every((i) => i.unitPrice != null)

  return (
    <div className="rounded-lg border border-border">
      <div className="px-4 divide-y divide-border">
        {items.map((item) => (
          <div key={item.id} className="flex items-start justify-between py-2.5">
            <div className="flex-1 min-w-0">
              <p className="text-sm">{item.description}</p>
              <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
            </div>
            <div className="text-right ml-4 shrink-0">
              {item.unitPrice != null ? (
                <p className="text-sm font-medium">
                  {formatPrice(item.unitPrice * (item.quantity ?? 1))}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">Pending pricing</p>
              )}
            </div>
          </div>
        ))}
      </div>
      {allPriced && (
        <>
          <Separator />
          <div className="flex justify-between px-4 py-2.5">
            <span className="text-sm font-semibold">Total</span>
            <span className="text-sm font-semibold">{formatPrice(total)}</span>
          </div>
        </>
      )}
    </div>
  )
}

// ─── ApprovalCard ─────────────────────────────────────────────────────────────

interface ApprovalCardProps {
  quote: QuoteRequestResponse
  onApprove: (id: string) => Promise<void>
  onReject: (id: string) => Promise<void>
}

function ApprovalCard({ quote, onApprove, onReject }: ApprovalCardProps) {
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const busy = isApproving || isRejecting

  async function handleApprove() {
    setIsApproving(true)
    try {
      await onApprove(quote.id!)
    } finally {
      setIsApproving(false)
    }
  }

  async function handleReject() {
    setIsRejecting(true)
    try {
      await onReject(quote.id!)
    } finally {
      setIsRejecting(false)
    }
  }

  const items = quote.items ?? []

  return (
    <div className="rounded-xl border border-yellow-200 bg-yellow-50/40 p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold">
            Quote #{quote.id?.slice(0, 8)}
          </p>
          {quote.createdAt && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Submitted {formatDate(quote.createdAt)}
            </p>
          )}
        </div>
        <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800">
          pending approval
        </span>
      </div>

      {/* Items */}
      {items.length > 0 && <QuoteItemsList items={items} />}

      {/* Delivery */}
      {quote.deliveryAddressLine1 && (
        <p className="text-xs text-muted-foreground">
          Deliver to: {quote.deliveryAddressLine1}, {quote.deliveryCity}
          {quote.deliveryState ? `, ${quote.deliveryState}` : ''} {quote.deliveryPostalCode}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button size="sm" onClick={handleApprove} disabled={busy}>
          {isApproving ? 'Approving…' : 'Approve'}
        </Button>
        <Button size="sm" variant="outline" onClick={handleReject} disabled={busy}>
          {isRejecting ? 'Rejecting…' : 'Reject'}
        </Button>
      </div>
    </div>
  )
}

// ─── PendingApprovalsPage ─────────────────────────────────────────────────────

export function PendingApprovalsPage() {
  const { authFetch } = useAuth()
  const [quotes, setQuotes] = useState<QuoteRequestResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    listPendingApprovals(authFetch)
      .then((data) => {
        if (!cancelled) setQuotes(data.content ?? [])
      })
      .catch(() => toast.error('Failed to load pending approvals'))
      .finally(() => { if (!cancelled) setIsLoading(false) })
    return () => { cancelled = true }
  }, [authFetch])

  const handleApprove = useCallback(async (id: string) => {
    try {
      const result = await approveQuote(authFetch, id)
      setQuotes((prev) => prev.filter((q) => q.id !== id))
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl
      } else if (result.invoiceId) {
        toast.success('Quote approved — invoice issued on net terms.')
      } else {
        toast.success('Quote approved.')
      }
    } catch {
      toast.error('Failed to approve quote.')
    }
  }, [authFetch])

  const handleReject = useCallback(async (id: string) => {
    try {
      await rejectApproval(authFetch, id)
      setQuotes((prev) => prev.filter((q) => q.id !== id))
      toast.success('Approval rejected.')
    } catch {
      toast.error('Failed to reject approval.')
    }
  }, [authFetch])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 max-w-2xl">
        {[1, 2].map((i) => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <h2 className="text-lg font-semibold">Pending Approvals</h2>

      {quotes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No quotes awaiting approval.</p>
      ) : (
        quotes.map((q) => (
          <ApprovalCard
            key={q.id}
            quote={q}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        ))
      )}
    </div>
  )
}
