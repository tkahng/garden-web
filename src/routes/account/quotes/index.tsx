import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useAuth } from '#/context/auth'
import { Skeleton } from '#/components/ui/skeleton'
import { listQuotes } from '#/lib/b2b-api'
import type { QuoteRequestResponse, PagedResultQuoteRequestResponse } from '#/lib/b2b-api'
import type { PageMeta } from '#/lib/account-api'
import { toast } from 'sonner'

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/account/quotes/')({
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search.page ?? 0),
  }),
  component: QuotesPage,
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
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

// ─── QuoteRow ─────────────────────────────────────────────────────────────────

export function QuoteRow({ quote }: { quote: QuoteRequestResponse }) {
  return (
    <Link
      to="/account/quotes/$quoteId"
      params={{ quoteId: quote.id! }}
      className="flex items-center justify-between border border-border px-4 py-3 hover:bg-muted/40 transition-colors"
    >
      <span className="text-sm text-muted-foreground">
        {quote.createdAt ? formatDate(quote.createdAt) : '—'}
      </span>
      <span className="text-sm text-muted-foreground">
        {quote.items?.length ?? 0} {(quote.items?.length ?? 0) === 1 ? 'item' : 'items'}
      </span>
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-medium ${QUOTE_STATUS_CLASS[quote.status ?? ''] ?? ''}`}
      >
        {quote.status?.replace('_', ' ').toLowerCase()}
      </span>
      <span className="text-sm text-muted-foreground">View →</span>
    </Link>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({ meta, currentPage }: { meta: PageMeta; currentPage: number }) {
  const totalPages = Math.ceil((meta.total ?? 0) / (meta.pageSize ?? 10))
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between pt-4">
      <Link
        to="/account/quotes"
        search={{ page: currentPage - 1 }}

        className={[
          'rounded-full border border-border px-5 py-2 text-sm font-semibold',
          currentPage === 0 ? 'pointer-events-none opacity-40' : 'hover:bg-muted',
        ].join(' ')}
        aria-disabled={currentPage === 0}
      >
        ← Previous
      </Link>
      <span className="text-sm text-muted-foreground">
        Page {currentPage + 1} of {totalPages}
      </span>
      <Link
        to="/account/quotes"
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

// ─── QuotesPage ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 10

export function QuotesPage() {
  const { authFetch } = useAuth()
  const { page } = Route.useSearch()

  const [quotes, setQuotes] = useState<QuoteRequestResponse[]>([])
  const [meta, setMeta] = useState<PageMeta | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    listQuotes(authFetch, { page, size: PAGE_SIZE })
      .then((data: PagedResultQuoteRequestResponse) => {
        if (cancelled) return
        setQuotes(data.content ?? [])
        setMeta((data.meta as PageMeta) ?? null)
      })
      .catch(() => toast.error('Failed to load quotes'))
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => { cancelled = true }
  }, [authFetch, page])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 max-w-2xl">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Quotes</h2>
        <Link
          to="/account/quote-cart"
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          Quote cart →
        </Link>
      </div>

      {quotes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No quotes yet.</p>
      ) : (
        <>
          {quotes.map((q) => (
            <QuoteRow key={q.id} quote={q} />
          ))}
          {meta && <Pagination meta={meta} currentPage={page} />}
        </>
      )}
    </div>
  )
}
