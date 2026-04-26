import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

// ─── Router mock ─────────────────────────────────────────────────────────────

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: unknown) => ({
    ...(config as object),
    useSearch: () => ({ page: 0 }),
  }),
  Link: ({
    children,
    to,
    className,
  }: {
    children: React.ReactNode
    to: string
    className?: string
  }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}))

// ─── Auth mock ────────────────────────────────────────────────────────────────

const mockAuthFetch = vi.fn()
vi.mock('#/context/auth', () => ({
  useAuth: () => ({ authFetch: mockAuthFetch }),
}))

vi.mock('sonner', () => ({ toast: { error: vi.fn() } }))

// ─── B2B API mock ─────────────────────────────────────────────────────────────

const mockListQuotes = vi.fn()
vi.mock('#/lib/b2b-api', () => ({
  listQuotes: (...a: unknown[]) => mockListQuotes(...a),
}))

import { QuotesPage, QuoteRow } from './index'
import type { QuoteRequestResponse } from '#/lib/b2b-api'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const stubQuote: QuoteRequestResponse = {
  id: 'q-1',
  status: 'SENT',
  items: [{ id: 'i-1', description: 'Widget', quantity: 2, unitPrice: 10 }],
  createdAt: '2026-01-15T10:00:00Z',
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('QuoteRow', () => {
  it('renders quote status badge', () => {
    render(<QuoteRow quote={stubQuote} />)
    expect(screen.getByText('sent')).toBeInTheDocument()
  })

  it('renders item count', () => {
    render(<QuoteRow quote={stubQuote} />)
    expect(screen.getByText(/1 item/i)).toBeInTheDocument()
  })

  it('renders creation date', () => {
    render(<QuoteRow quote={stubQuote} />)
    expect(screen.getByText(/jan 15, 2026/i)).toBeInTheDocument()
  })
})

describe('QuotesPage', () => {
  it('shows empty state when no quotes', async () => {
    mockListQuotes.mockResolvedValue({ content: [], meta: { total: 0, pageSize: 10 } })
    render(<QuotesPage />)
    await waitFor(() =>
      expect(screen.getByText(/no quotes yet/i)).toBeInTheDocument(),
    )
  })

  it('renders a row for each quote', async () => {
    const q2 = { ...stubQuote, id: 'q-2', status: 'PENDING' as const }
    mockListQuotes.mockResolvedValue({
      content: [stubQuote, q2],
      meta: { total: 2, pageSize: 10 },
    })
    render(<QuotesPage />)
    await waitFor(() => expect(screen.getAllByText(/view →/i)).toHaveLength(2))
  })

  it('shows quote cart link', async () => {
    mockListQuotes.mockResolvedValue({ content: [], meta: { total: 0, pageSize: 10 } })
    render(<QuotesPage />)
    await waitFor(() => screen.getByText(/no quotes/i))
    expect(screen.getByText(/quote cart/i)).toBeInTheDocument()
  })

  it('does not show pagination when only one page', async () => {
    mockListQuotes.mockResolvedValue({
      content: [stubQuote],
      meta: { total: 1, pageSize: 10 },
    })
    render(<QuotesPage />)
    await waitFor(() => screen.getByText('sent'))
    expect(screen.queryByText(/previous/i)).not.toBeInTheDocument()
  })

  it('calls listQuotes with page 0 on initial load', async () => {
    mockListQuotes.mockResolvedValue({ content: [], meta: {} })
    render(<QuotesPage />)
    await waitFor(() =>
      expect(mockListQuotes).toHaveBeenCalledWith(
        mockAuthFetch,
        expect.objectContaining({ page: 0 }),
      ),
    )
  })
})
