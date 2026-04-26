import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useAuth } from '#/context/auth'
import { Skeleton } from '#/components/ui/skeleton'
import { listInvoices } from '#/lib/b2b-api'
import type { InvoiceResponse, InvoicePaymentResponse } from '#/lib/b2b-api'
import { toast } from 'sonner'

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/account/invoices/$invoiceId')({
  validateSearch: (search: Record<string, unknown>) => ({
    companyId: String(search.companyId ?? ''),
  }),
  component: InvoiceDetailPage,
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatCurrency(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount)
}

const INVOICE_STATUS_CLASS: Record<string, string> = {
  ISSUED:  'bg-blue-100 text-blue-800',
  PARTIAL: 'bg-yellow-100 text-yellow-800',
  PAID:    'bg-green-100 text-green-800',
  OVERDUE: 'bg-red-100 text-red-800',
  VOID:    'bg-muted text-muted-foreground',
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between border-b border-border py-3 last:border-0">
      <span className="text-sm text-muted-foreground w-36 shrink-0">{label}</span>
      <span className="text-sm text-right">{children}</span>
    </div>
  )
}

// ─── PaymentHistory ───────────────────────────────────────────────────────────

function PaymentHistory({ payments, currency }: { payments: InvoicePaymentResponse[]; currency?: string }) {
  if (payments.length === 0) {
    return <p className="text-sm text-muted-foreground italic">No payments recorded.</p>
  }
  return (
    <div className="flex flex-col gap-2">
      {payments.map((p) => (
        <div key={p.id} className="flex items-center justify-between border border-border px-4 py-3 text-sm">
          <span className="text-muted-foreground">{p.paidAt ? formatDateTime(p.paidAt) : '—'}</span>
          <span className="font-semibold">
            {p.amount != null ? formatCurrency(p.amount, currency) : '—'}
          </span>
          {p.paymentReference && (
            <span className="text-muted-foreground text-xs">Ref: {p.paymentReference}</span>
          )}
          {p.notes && <span className="text-muted-foreground text-xs max-w-xs truncate">{p.notes}</span>}
        </div>
      ))}
    </div>
  )
}

// ─── InvoiceDetailPage ────────────────────────────────────────────────────────

export function InvoiceDetailPage() {
  const { authFetch } = useAuth()
  const { invoiceId } = Route.useParams()
  const { companyId } = Route.useSearch()

  const [invoice, setInvoice] = useState<InvoiceResponse | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!companyId) { setNotFound(true); setIsLoading(false); return }
    let cancelled = false
    listInvoices(authFetch, companyId)
      .then((list) => {
        if (cancelled) return
        const found = list.find((inv) => inv.id === invoiceId)
        if (found) setInvoice(found)
        else setNotFound(true)
      })
      .catch(() => { if (!cancelled) toast.error('Failed to load invoice') })
      .finally(() => { if (!cancelled) setIsLoading(false) })
    return () => { cancelled = true }
  }, [authFetch, companyId, invoiceId])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 max-w-2xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    )
  }

  if (notFound || !invoice) {
    return (
      <div className="max-w-2xl">
        <h2 className="text-lg font-semibold mb-2">Invoice not found</h2>
        <p className="text-sm text-muted-foreground mb-4">
          This invoice does not exist or you don't have access.
        </p>
        <Link to="/account/invoices" className="text-sm text-primary underline-offset-4 hover:underline">
          ← Back to invoices
        </Link>
      </div>
    )
  }

  const isOverdue = invoice.status === 'OVERDUE'
  const payments = invoice.payments ?? []

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/account/invoices"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Invoices
          </Link>
          <span className="text-muted-foreground">/</span>
          <h2 className="text-lg font-semibold">Invoice</h2>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${INVOICE_STATUS_CLASS[invoice.status ?? ''] ?? ''}`}
        >
          {invoice.status?.toLowerCase()}
        </span>
      </div>

      {/* Overdue warning */}
      {isOverdue && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          This invoice is overdue. Please contact us to arrange payment.
        </div>
      )}

      {/* Details */}
      <div className="rounded-xl border border-border divide-y divide-border">
        <DetailRow label="Issued">
          {invoice.issuedAt ? formatDate(invoice.issuedAt) : '—'}
        </DetailRow>
        <DetailRow label="Due date">
          <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
            {invoice.dueAt ? formatDate(invoice.dueAt) : '—'}
          </span>
        </DetailRow>
        <DetailRow label="Total">
          {invoice.totalAmount != null
            ? formatCurrency(invoice.totalAmount, invoice.currency)
            : '—'}
        </DetailRow>
        <DetailRow label="Paid">
          {invoice.paidAmount != null
            ? formatCurrency(invoice.paidAmount, invoice.currency)
            : '—'}
        </DetailRow>
        <DetailRow label="Outstanding">
          <span className={invoice.outstandingAmount && invoice.outstandingAmount > 0 ? 'font-semibold' : ''}>
            {invoice.outstandingAmount != null
              ? formatCurrency(invoice.outstandingAmount, invoice.currency)
              : '—'}
          </span>
        </DetailRow>
        {invoice.quoteId && (
          <DetailRow label="Quote">
            <Link
              to="/account/quotes/$quoteId"
              params={{ quoteId: invoice.quoteId }}
              className="text-primary underline-offset-4 hover:underline"
            >
              View quote →
            </Link>
          </DetailRow>
        )}
      </div>

      {/* Payment history */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Payment history</h3>
        <PaymentHistory payments={payments} currency={invoice.currency} />
      </div>
    </div>
  )
}
