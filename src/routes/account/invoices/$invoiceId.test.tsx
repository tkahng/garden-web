import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

// ─── Router mock ─────────────────────────────────────────────────────────────

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: unknown) => ({
    ...(config as object),
    useParams: () => ({ invoiceId: 'inv-1' }),
    useSearch: () => ({ companyId: 'co-1' }),
  }),
  Link: ({
    children,
    to,
    className,
  }: {
    children: React.ReactNode
    to: string
    className?: string
  }) => <a href={to} className={className}>{children}</a>,
}))

// ─── Auth mock ────────────────────────────────────────────────────────────────

const mockAuthFetch = vi.fn()
vi.mock('#/context/auth', () => ({
  useAuth: () => ({ authFetch: mockAuthFetch }),
}))

vi.mock('sonner', () => ({ toast: { error: vi.fn() } }))

// ─── B2B API mock ─────────────────────────────────────────────────────────────

const mockListInvoices = vi.fn()

vi.mock('#/lib/b2b-api', () => ({
  listInvoices: (...a: unknown[]) => mockListInvoices(...a),
}))

import { InvoiceDetailPage } from './$invoiceId'
import type { InvoiceResponse } from '#/lib/b2b-api'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const issuedInvoice: InvoiceResponse = {
  id: 'inv-1',
  companyId: 'co-1',
  quoteId: 'q-1',
  status: 'ISSUED',
  totalAmount: 296.95,
  paidAmount: 0,
  outstandingAmount: 296.95,
  currency: 'USD',
  issuedAt: '2026-04-06T10:00:00Z',
  dueAt: '2026-05-06T10:00:00Z',
  payments: [],
}

const partialInvoice: InvoiceResponse = {
  ...issuedInvoice,
  id: 'inv-1',
  status: 'PARTIAL',
  paidAmount: 100,
  outstandingAmount: 196.95,
  payments: [
    {
      id: 'pay-1',
      invoiceId: 'inv-1',
      amount: 100,
      paymentReference: 'CHK-001',
      paidAt: '2026-04-10T14:00:00Z',
    },
  ],
}

const overdueInvoice: InvoiceResponse = {
  ...issuedInvoice,
  id: 'inv-1',
  status: 'OVERDUE',
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('InvoiceDetailPage', () => {
  it('shows not-found when invoice id does not match list', async () => {
    mockListInvoices.mockResolvedValue([{ ...issuedInvoice, id: 'inv-99' }])
    render(<InvoiceDetailPage />)
    await waitFor(() =>
      expect(screen.getByText(/invoice not found/i)).toBeInTheDocument(),
    )
  })

  it('shows invoice status badge', async () => {
    mockListInvoices.mockResolvedValue([issuedInvoice])
    render(<InvoiceDetailPage />)
    await waitFor(() => expect(screen.getByText('issued')).toBeInTheDocument())
  })

  it('renders total, paid, and outstanding amounts', async () => {
    mockListInvoices.mockResolvedValue([issuedInvoice])
    render(<InvoiceDetailPage />)
    await waitFor(() => screen.getByText('issued'))
    expect(screen.getAllByText('$296.95').length).toBeGreaterThan(0)
    expect(screen.getAllByText('$0.00').length).toBeGreaterThan(0)
  })

  it('shows overdue warning banner', async () => {
    mockListInvoices.mockResolvedValue([overdueInvoice])
    render(<InvoiceDetailPage />)
    await waitFor(() =>
      expect(screen.getByText(/overdue/i, { selector: 'div' })).toBeInTheDocument(),
    )
  })

  it('shows link to associated quote', async () => {
    mockListInvoices.mockResolvedValue([issuedInvoice])
    render(<InvoiceDetailPage />)
    await waitFor(() =>
      expect(screen.getByRole('link', { name: /view quote/i })).toBeInTheDocument(),
    )
  })

  it('shows payment history when payments exist', async () => {
    mockListInvoices.mockResolvedValue([partialInvoice])
    render(<InvoiceDetailPage />)
    await waitFor(() => screen.getByText('partial'))
    expect(screen.getAllByText('$100.00').length).toBeGreaterThan(0)
    expect(screen.getByText(/CHK-001/)).toBeInTheDocument()
  })

  it('shows empty payment history message when no payments', async () => {
    mockListInvoices.mockResolvedValue([issuedInvoice])
    render(<InvoiceDetailPage />)
    await waitFor(() =>
      expect(screen.getByText(/no payments recorded/i)).toBeInTheDocument(),
    )
  })

  it('shows back link to invoices list', async () => {
    mockListInvoices.mockResolvedValue([issuedInvoice])
    render(<InvoiceDetailPage />)
    await waitFor(() =>
      expect(screen.getByRole('link', { name: /← invoices/i })).toBeInTheDocument(),
    )
  })
})
