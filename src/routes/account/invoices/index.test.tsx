import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

// ─── Router mock ─────────────────────────────────────────────────────────────

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: unknown) => config,
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

const mockListCompanies = vi.fn()
const mockListInvoices = vi.fn()

vi.mock('#/lib/b2b-api', () => ({
  listCompanies: (...a: unknown[]) => mockListCompanies(...a),
  listInvoices: (...a: unknown[]) => mockListInvoices(...a),
}))

import { InvoicesPage, InvoiceRow } from './index'
import type { InvoiceResponse } from '#/lib/b2b-api'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const stubCompany = { id: 'co-1', name: 'Acme Corp' }

const issuedInvoice: InvoiceResponse = {
  id: 'inv-1',
  companyId: 'co-1',
  status: 'ISSUED',
  totalAmount: 296.95,
  paidAmount: 0,
  outstandingAmount: 296.95,
  currency: 'USD',
  issuedAt: '2026-04-06T10:00:00Z',
  dueAt: '2026-05-06T10:00:00Z',
  payments: [],
}

const paidInvoice: InvoiceResponse = {
  id: 'inv-2',
  companyId: 'co-1',
  status: 'PAID',
  totalAmount: 150.00,
  paidAmount: 150.00,
  outstandingAmount: 0,
  currency: 'USD',
  issuedAt: '2026-03-01T10:00:00Z',
  dueAt: '2026-03-31T10:00:00Z',
  payments: [],
}

const overdueInvoice: InvoiceResponse = {
  ...issuedInvoice,
  id: 'inv-3',
  status: 'OVERDUE',
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── InvoiceRow ───────────────────────────────────────────────────────────────

describe('InvoiceRow', () => {
  it('renders status badge', () => {
    render(<InvoiceRow invoice={issuedInvoice} companyId="co-1" />)
    expect(screen.getByText('issued')).toBeInTheDocument()
  })

  it('renders total amount', () => {
    render(<InvoiceRow invoice={issuedInvoice} companyId="co-1" />)
    expect(screen.getByText('$296.95')).toBeInTheDocument()
  })

  it('renders outstanding amount when > 0', () => {
    render(<InvoiceRow invoice={issuedInvoice} companyId="co-1" />)
    expect(screen.getByText(/\$296\.95 due/)).toBeInTheDocument()
  })

  it('shows Paid when outstanding is 0', () => {
    render(<InvoiceRow invoice={paidInvoice} companyId="co-1" />)
    expect(screen.getByText('Paid')).toBeInTheDocument()
  })

  it('renders issue date', () => {
    render(<InvoiceRow invoice={issuedInvoice} companyId="co-1" />)
    expect(screen.getByText(/apr 6, 2026/i)).toBeInTheDocument()
  })
})

// ─── InvoicesPage ─────────────────────────────────────────────────────────────

describe('InvoicesPage', () => {
  it('shows empty state when no invoices', async () => {
    mockListCompanies.mockResolvedValue([stubCompany])
    mockListInvoices.mockResolvedValue([])
    render(<InvoicesPage />)
    await waitFor(() =>
      expect(screen.getByText(/no invoices yet/i)).toBeInTheDocument(),
    )
  })

  it('shows company-prompt when user has no company', async () => {
    mockListCompanies.mockResolvedValue([])
    render(<InvoicesPage />)
    await waitFor(() =>
      expect(screen.getByText(/company account/i)).toBeInTheDocument(),
    )
  })

  it('renders a row for each invoice', async () => {
    mockListCompanies.mockResolvedValue([stubCompany])
    mockListInvoices.mockResolvedValue([issuedInvoice, paidInvoice])
    render(<InvoicesPage />)
    await waitFor(() => expect(screen.getAllByText(/view →/i)).toHaveLength(2))
  })

  it('shows overdue status badge', async () => {
    mockListCompanies.mockResolvedValue([stubCompany])
    mockListInvoices.mockResolvedValue([overdueInvoice])
    render(<InvoicesPage />)
    await waitFor(() =>
      expect(screen.getByText('overdue')).toBeInTheDocument(),
    )
  })

  it('calls listInvoices with the first company id', async () => {
    mockListCompanies.mockResolvedValue([stubCompany])
    mockListInvoices.mockResolvedValue([])
    render(<InvoicesPage />)
    await waitFor(() =>
      expect(mockListInvoices).toHaveBeenCalledWith(mockAuthFetch, 'co-1'),
    )
  })
})
