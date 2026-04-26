import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'

// ─── Router mock ─────────────────────────────────────────────────────────────

const mockNavigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: unknown) => ({
    ...(config as object),
    useParams: () => ({ quoteId: 'q-1' }),
  }),
  useNavigate: () => mockNavigate,
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

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }))

// ─── B2B API mock ─────────────────────────────────────────────────────────────

const mockGetQuote = vi.fn()
const mockAcceptQuote = vi.fn()
const mockCancelQuote = vi.fn()

vi.mock('#/lib/b2b-api', () => ({
  getQuote: (...a: unknown[]) => mockGetQuote(...a),
  acceptQuote: (...a: unknown[]) => mockAcceptQuote(...a),
  cancelQuote: (...a: unknown[]) => mockCancelQuote(...a),
  getQuotePdfUrl: (id: string) => `/api/v1/quotes/${id}/pdf`,
}))

import { QuoteDetailPage } from './$quoteId'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const sentQuote = {
  id: 'q-1',
  status: 'SENT' as const,
  deliveryAddressLine1: '1 Main St',
  deliveryCity: 'Portland',
  deliveryPostalCode: '97201',
  deliveryCountry: 'US',
  expiresAt: new Date(Date.now() + 86400000).toISOString(),
  items: [
    { id: 'i-1', description: 'Widget A', quantity: 3, unitPrice: 25.0 },
    { id: 'i-2', description: 'Widget B', quantity: 1, unitPrice: 10.0 },
  ],
  createdAt: '2026-01-15T10:00:00Z',
}

const pendingQuote = { ...sentQuote, id: 'q-1', status: 'PENDING' as const }

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('QuoteDetailPage', () => {
  it('shows quote status badge', async () => {
    mockGetQuote.mockResolvedValue(sentQuote)
    render(<QuoteDetailPage />)
    await waitFor(() => expect(screen.getByText('sent')).toBeInTheDocument())
  })

  it('renders line items with prices', async () => {
    mockGetQuote.mockResolvedValue(sentQuote)
    render(<QuoteDetailPage />)
    await waitFor(() => screen.getByText('Widget A'))
    expect(screen.getByText('Widget B')).toBeInTheDocument()
  })

  it('shows total when all items are priced', async () => {
    mockGetQuote.mockResolvedValue(sentQuote)
    render(<QuoteDetailPage />)
    await waitFor(() => screen.getByText('Total'))
    // 3*25 + 1*10 = 85
    expect(screen.getByText('$85.00')).toBeInTheDocument()
  })

  it('shows "pending pricing" for items without unit price', async () => {
    const unpriced = { ...sentQuote, items: [{ id: 'i-1', description: 'Widget', quantity: 1 }] }
    mockGetQuote.mockResolvedValue(unpriced)
    render(<QuoteDetailPage />)
    await waitFor(() => screen.getByText('Widget'))
    expect(screen.getByText(/pending pricing/i)).toBeInTheDocument()
  })

  it('shows accept button only for SENT status', async () => {
    mockGetQuote.mockResolvedValue(sentQuote)
    render(<QuoteDetailPage />)
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /accept quote/i })).toBeInTheDocument(),
    )
  })

  it('does not show accept button for PENDING status', async () => {
    mockGetQuote.mockResolvedValue(pendingQuote)
    render(<QuoteDetailPage />)
    await waitFor(() => screen.getByText('Widget A'))
    expect(screen.queryByRole('button', { name: /accept quote/i })).not.toBeInTheDocument()
  })

  it('redirects to checkout URL when Stripe path returned', async () => {
    mockGetQuote.mockResolvedValue(sentQuote)
    mockAcceptQuote.mockResolvedValue({ checkoutUrl: 'https://stripe.test/pay/cs_123' })
    const assignMock = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    })
    render(<QuoteDetailPage />)
    await waitFor(() => screen.getByRole('button', { name: /accept quote/i }))
    fireEvent.click(screen.getByRole('button', { name: /accept quote/i }))
    await waitFor(() =>
      expect(window.location.href).toBe('https://stripe.test/pay/cs_123'),
    )
    assignMock
  })

  it('navigates to quotes list when invoice path returned', async () => {
    mockGetQuote.mockResolvedValue(sentQuote)
    mockAcceptQuote.mockResolvedValue({ invoiceId: 'inv-99' })
    render(<QuoteDetailPage />)
    await waitFor(() => screen.getByRole('button', { name: /accept quote/i }))
    fireEvent.click(screen.getByRole('button', { name: /accept quote/i }))
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({ to: '/account/quotes' }),
      ),
    )
  })

  it('shows pending approval notice when approval required', async () => {
    mockGetQuote.mockResolvedValue(sentQuote)
    mockAcceptQuote.mockResolvedValue({ pendingApproval: true })
    render(<QuoteDetailPage />)
    await waitFor(() => screen.getByRole('button', { name: /accept quote/i }))
    fireEvent.click(screen.getByRole('button', { name: /accept quote/i }))
    await waitFor(() =>
      expect(screen.getByText(/awaiting approval/i)).toBeInTheDocument(),
    )
  })

  it('calls cancelQuote and updates status on cancel', async () => {
    mockGetQuote.mockResolvedValue(sentQuote)
    mockCancelQuote.mockResolvedValue({ ...sentQuote, status: 'CANCELLED' })
    render(<QuoteDetailPage />)
    await waitFor(() => screen.getByRole('button', { name: /cancel quote/i }))
    fireEvent.click(screen.getByRole('button', { name: /cancel quote/i }))
    await waitFor(() =>
      expect(mockCancelQuote).toHaveBeenCalledWith(mockAuthFetch, 'q-1'),
    )
    await waitFor(() => expect(screen.getByText('cancelled')).toBeInTheDocument())
  })

  it('shows PDF download link when pdfBlobId present', async () => {
    mockGetQuote.mockResolvedValue({ ...sentQuote, pdfBlobId: 'blob-1' })
    render(<QuoteDetailPage />)
    await waitFor(() =>
      expect(screen.getByRole('link', { name: /download pdf/i })).toBeInTheDocument(),
    )
  })

  it('does not show PDF link when pdfBlobId absent', async () => {
    mockGetQuote.mockResolvedValue(sentQuote)
    render(<QuoteDetailPage />)
    await waitFor(() => screen.getByText('Widget A'))
    expect(screen.queryByRole('link', { name: /download pdf/i })).not.toBeInTheDocument()
  })

  it('does not show cancel button for accepted quotes', async () => {
    mockGetQuote.mockResolvedValue({ ...sentQuote, status: 'ACCEPTED' as const })
    render(<QuoteDetailPage />)
    await waitFor(() => screen.getByText('Widget A'))
    expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument()
  })

  // ── Expiry countdown ────────────────────────────────────────────────────────

  it('shows days countdown for SENT quote expiring in > 3 days', async () => {
    // +1h buffer ensures Math.floor keeps days = 5 during the brief render delay
    const expiresAt = new Date(Date.now() + 86400000 * 5 + 3600000).toISOString()
    mockGetQuote.mockResolvedValue({ ...sentQuote, expiresAt })
    render(<QuoteDetailPage />)
    await waitFor(() =>
      expect(screen.getByText(/offer expires in 5 days/i)).toBeInTheDocument(),
    )
  })

  it('shows amber warning for SENT quote expiring in 1–3 days', async () => {
    // +1h buffer ensures days = 2
    const expiresAt = new Date(Date.now() + 86400000 * 2 + 3600000).toISOString()
    mockGetQuote.mockResolvedValue({ ...sentQuote, expiresAt })
    render(<QuoteDetailPage />)
    await waitFor(() =>
      expect(screen.getByText(/offer expires in/i)).toBeInTheDocument(),
    )
    expect(screen.getByText(/2d/)).toBeInTheDocument()
  })

  it('shows red urgent banner for SENT quote expiring in < 24 hours', async () => {
    // +30min buffer ensures hours = 2
    const expiresAt = new Date(Date.now() + 3600000 * 2 + 1800000).toISOString()
    mockGetQuote.mockResolvedValue({ ...sentQuote, expiresAt })
    render(<QuoteDetailPage />)
    await waitFor(() =>
      expect(screen.getByText(/offer expires soon/i)).toBeInTheDocument(),
    )
    // hours span is a separate element — check container text content
    await waitFor(() => {
      const banner = screen.getByText(/offer expires soon/i).closest('div')!
      expect(banner.textContent).toMatch(/2h/)
    })
  })

  it('shows expired banner for SENT quote whose expiresAt is in the past', async () => {
    const expiresAt = new Date(Date.now() - 1000).toISOString()
    mockGetQuote.mockResolvedValue({ ...sentQuote, expiresAt })
    render(<QuoteDetailPage />)
    await waitFor(() =>
      expect(screen.getByText(/this offer has expired/i)).toBeInTheDocument(),
    )
  })

  it('shows static expired date for EXPIRED status quote', async () => {
    const expiresAt = new Date(Date.now() - 86400000 * 3).toISOString()
    mockGetQuote.mockResolvedValue({ ...sentQuote, status: 'EXPIRED' as const, expiresAt })
    render(<QuoteDetailPage />)
    // "Expired April 16, 2026" matches; bare "expired" status badge does not
    await waitFor(() =>
      expect(screen.getByText(/^expired \w/i)).toBeInTheDocument(),
    )
  })

  it('does not show countdown for PENDING quote', async () => {
    mockGetQuote.mockResolvedValue({
      ...sentQuote,
      status: 'PENDING' as const,
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    })
    render(<QuoteDetailPage />)
    await waitFor(() => screen.getByText('Widget A'))
    expect(screen.queryByText(/offer expires/i)).not.toBeInTheDocument()
  })

  it('ticks the countdown every second', async () => {
    // Fake only setInterval + Date so waitFor's internal setTimeout keeps working
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] })
    const now = 1_000_000
    vi.setSystemTime(now)
    // exactly 90 seconds → 1m 30s → seconds = 30
    const expiresAt = new Date(now + 90000).toISOString()
    mockGetQuote.mockResolvedValue({ ...sentQuote, expiresAt })
    render(<QuoteDetailPage />)
    await waitFor(() => screen.getByText(/offer expires soon/i))
    expect(screen.getByText(/30s/)).toBeInTheDocument()
    act(() => { vi.advanceTimersByTime(5000) })
    expect(screen.getByText(/25s/)).toBeInTheDocument()
    vi.useRealTimers()
  })
})
