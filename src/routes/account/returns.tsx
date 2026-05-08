import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useAuth } from '#/context/auth'
import { Skeleton } from '#/components/ui/skeleton'
import { listReturns } from '#/lib/account-api'
import type { ReturnRequestResponse } from '#/lib/account-api'

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/account/returns')({
  component: ReturnsPage,
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const STATUS_CLASS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  COMPLETED: 'bg-emerald-100 text-emerald-800',
}

const REASON_LABEL: Record<string, string> = {
  DAMAGED: 'Damaged',
  WRONG_ITEM: 'Wrong item',
  NOT_AS_DESCRIBED: 'Not as described',
  CHANGED_MIND: 'Changed mind',
  OTHER: 'Other',
}

const RESOLUTION_LABEL: Record<string, string> = {
  REFUND: 'Refund',
  EXCHANGE: 'Exchange',
  STORE_CREDIT: 'Store credit',
}

// ─── ReturnRow ────────────────────────────────────────────────────────────────

function ReturnRow({ rr }: { rr: ReturnRequestResponse }) {
  return (
    <div className="flex flex-col gap-1 border border-border rounded-xl px-4 py-3 text-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="font-medium">{REASON_LABEL[rr.reason ?? ''] ?? rr.reason}</span>
          <span className="text-xs text-muted-foreground">
            Resolution: {RESOLUTION_LABEL[rr.resolution ?? ''] ?? rr.resolution}
          </span>
          {rr.createdAt && (
            <span className="text-xs text-muted-foreground">{formatDate(rr.createdAt)}</span>
          )}
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium shrink-0 ${STATUS_CLASS[rr.status ?? ''] ?? ''}`}
        >
          {rr.status}
        </span>
      </div>
      {rr.notes && (
        <p className="text-xs text-muted-foreground mt-1 border-t border-border pt-1">{rr.notes}</p>
      )}
      {rr.staffNotes && (
        <p className="text-xs mt-1">
          <span className="font-medium">Staff note: </span>
          {rr.staffNotes}
        </p>
      )}
      {rr.orderId && (
        <Link
          to="/account/orders/$orderId"
          params={{ orderId: rr.orderId }}
          className="text-xs text-primary hover:underline mt-1 w-fit"
        >
          View order →
        </Link>
      )}
    </div>
  )
}

// ─── ReturnsPage ──────────────────────────────────────────────────────────────

function ReturnsPage() {
  const { authFetch } = useAuth()
  const [returns, setReturns] = useState<ReturnRequestResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    listReturns(authFetch, { page: 0, size: 50 })
      .then((data) => {
        if (!cancelled) setReturns(data.content ?? [])
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => { cancelled = true }
  }, [authFetch])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (returns.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Returns</h2>
        <p className="text-sm text-muted-foreground">No return requests yet.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 max-w-2xl">
      <h2 className="text-lg font-semibold">Returns</h2>
      {returns.map((rr) => (
        <ReturnRow key={rr.id} rr={rr} />
      ))}
    </div>
  )
}
