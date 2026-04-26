import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useAuth } from '#/context/auth'
import { Skeleton } from '#/components/ui/skeleton'
import { listCompanies, listInvoices } from '#/lib/b2b-api'
import type { InvoiceResponse } from '#/lib/b2b-api'
import { toast } from 'sonner'

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/account/invoices/')({
  component: InvoicesPage,
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
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

// ─── InvoiceRow ───────────────────────────────────────────────────────────────

export function InvoiceRow({ invoice, companyId }: { invoice: InvoiceResponse; companyId: string }) {
  const isOverdue = invoice.status === 'OVERDUE'
  return (
    <Link
      to="/account/invoices/$invoiceId"
      params={{ invoiceId: invoice.id! }}
      search={{ companyId }}
      className="flex items-center justify-between border border-border px-4 py-3 hover:bg-muted/40 transition-colors"
    >
      <span className="text-sm text-muted-foreground w-28">
        {invoice.issuedAt ? formatDate(invoice.issuedAt) : '—'}
      </span>
      <span className={`text-sm font-medium w-28 ${isOverdue ? 'text-red-600' : 'text-muted-foreground'}`}>
        Due {invoice.dueAt ? formatDate(invoice.dueAt) : '—'}
      </span>
      <span className="text-sm font-semibold w-24 text-right">
        {invoice.totalAmount != null
          ? formatCurrency(invoice.totalAmount, invoice.currency)
          : '—'}
      </span>
      <span className="text-sm text-muted-foreground w-24 text-right">
        {invoice.outstandingAmount != null && invoice.outstandingAmount > 0
          ? `${formatCurrency(invoice.outstandingAmount, invoice.currency)} due`
          : invoice.status === 'PAID' ? 'Paid' : ''}
      </span>
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-medium w-16 text-center ${INVOICE_STATUS_CLASS[invoice.status ?? ''] ?? ''}`}
      >
        {invoice.status?.toLowerCase()}
      </span>
      <span className="text-sm text-muted-foreground">View →</span>
    </Link>
  )
}

// ─── InvoicesPage ─────────────────────────────────────────────────────────────

export function InvoicesPage() {
  const { authFetch } = useAuth()
  const [invoices, setInvoices] = useState<InvoiceResponse[]>([])
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    listCompanies(authFetch)
      .then((companies) => {
        if (cancelled || companies.length === 0) {
          if (!cancelled) setIsLoading(false)
          return
        }
        const cid = companies[0].id!
        setCompanyId(cid)
        return listInvoices(authFetch, cid).then((data) => {
          if (!cancelled) setInvoices(data)
        })
      })
      .catch(() => toast.error('Failed to load invoices'))
      .finally(() => { if (!cancelled) setIsLoading(false) })
    return () => { cancelled = true }
  }, [authFetch])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
      </div>
    )
  }

  if (!companyId) {
    return (
      <div className="max-w-2xl">
        <h2 className="text-lg font-semibold mb-4">Invoices</h2>
        <p className="text-sm text-muted-foreground">
          You need a{' '}
          <Link to="/account/company" className="text-primary underline-offset-4 hover:underline">
            company account
          </Link>{' '}
          to view invoices.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 max-w-3xl">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Invoices</h2>
      </div>

      {invoices.length === 0 ? (
        <p className="text-sm text-muted-foreground">No invoices yet.</p>
      ) : (
        invoices.map((inv) => (
          <InvoiceRow key={inv.id} invoice={inv} companyId={companyId} />
        ))
      )}
    </div>
  )
}
