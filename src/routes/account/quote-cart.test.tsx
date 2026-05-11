import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// ─── Router mock ─────────────────────────────────────────────────────────────

const mockNavigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    to,
    children,
    className,
    params,
  }: {
    to: string
    children: React.ReactNode
    className?: string
    params?: Record<string, string>
    [key: string]: unknown
  }) => {
    let href = to
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        href = href.replace(`$${key}`, value)
      })
    }
    return <a href={href} className={className}>{children}</a>
  },
  createFileRoute: () => (config: unknown) => config,
  useNavigate: () => mockNavigate,
}))

// ─── Auth mock ────────────────────────────────────────────────────────────────

const mockAuthFetch = vi.fn()
vi.mock('#/context/auth', () => ({
  useAuth: () => ({ authFetch: mockAuthFetch }),
}))

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

// ─── B2B API mock ─────────────────────────────────────────────────────────────

const mockGetQuoteCart = vi.fn()
const mockRemoveQuoteCartItem = vi.fn()
const mockUpdateQuoteCartItem = vi.fn()
const mockSubmitQuote = vi.fn()
const mockListCompanies = vi.fn()

vi.mock('#/lib/b2b-api', () => ({
  getQuoteCart: (...a: unknown[]) => mockGetQuoteCart(...a),
  removeQuoteCartItem: (...a: unknown[]) => mockRemoveQuoteCartItem(...a),
  updateQuoteCartItem: (...a: unknown[]) => mockUpdateQuoteCartItem(...a),
  submitQuote: (...a: unknown[]) => mockSubmitQuote(...a),
  listCompanies: (...a: unknown[]) => mockListCompanies(...a),
}))

import { QuoteCartPage } from './quote-cart'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const emptyCart = { id: 'cart-1', status: 'ACTIVE', items: [] }
const cartWithItem = {
  id: 'cart-1',
  status: 'ACTIVE',
  items: [{ id: 'item-1', variantId: 'var-1', quantity: 2, note: 'Rush order' }],
}
const stubCompany = { id: 'co-1', name: 'Acme Corp' }

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('QuoteCartPage', () => {
  it('shows empty state when cart has no items', async () => {
    mockGetQuoteCart.mockResolvedValue(emptyCart)
    mockListCompanies.mockResolvedValue([stubCompany])
    render(<QuoteCartPage />)
    await waitFor(() =>
      expect(screen.getByText(/quote cart is empty/i)).toBeInTheDocument(),
    )
  })

  it('shows cart items when present', async () => {
    mockGetQuoteCart.mockResolvedValue(cartWithItem)
    mockListCompanies.mockResolvedValue([stubCompany])
    render(<QuoteCartPage />)
    await waitFor(() => expect(screen.getByText('Rush order')).toBeInTheDocument())
  })

  it('shows submit form when company exists and cart has items', async () => {
    mockGetQuoteCart.mockResolvedValue(cartWithItem)
    mockListCompanies.mockResolvedValue([stubCompany])
    render(<QuoteCartPage />)
    await waitFor(() => screen.getByText('Rush order'))
    expect(screen.getByLabelText(/delivery address/i)).toBeInTheDocument()
  })

  it('shows create company prompt when no companies and cart has items', async () => {
    mockGetQuoteCart.mockResolvedValue(cartWithItem)
    mockListCompanies.mockResolvedValue([])
    render(<QuoteCartPage />)
    await waitFor(() => screen.getByText('Rush order'))
    expect(screen.getByRole('link', { name: /create a company/i })).toHaveAttribute('href', '/account/company')
    expect(screen.queryByLabelText(/delivery address/i)).not.toBeInTheDocument()
  })

  it('calls removeQuoteCartItem when Remove is clicked', async () => {
    mockGetQuoteCart.mockResolvedValue(cartWithItem)
    mockListCompanies.mockResolvedValue([stubCompany])
    mockRemoveQuoteCartItem.mockResolvedValue(emptyCart)
    render(<QuoteCartPage />)
    await waitFor(() => screen.getByRole('button', { name: /remove/i }))
    fireEvent.click(screen.getByRole('button', { name: /remove/i }))
    await waitFor(() =>
      expect(mockRemoveQuoteCartItem).toHaveBeenCalledWith(mockAuthFetch, 'item-1'),
    )
  })

  it('submits quote with correct payload and navigates to new quote', async () => {
    mockGetQuoteCart.mockResolvedValue(cartWithItem)
    mockListCompanies.mockResolvedValue([stubCompany])
    mockSubmitQuote.mockResolvedValue({ id: 'quote-99' })
    render(<QuoteCartPage />)
    await waitFor(() => screen.getByLabelText(/delivery address/i))
    fireEvent.change(screen.getByLabelText(/delivery address/i), {
      target: { value: '99 Main St' },
    })
    fireEvent.change(screen.getByLabelText(/city/i), { target: { value: 'Portland' } })
    fireEvent.change(screen.getByLabelText(/postal code/i), { target: { value: '97201' } })
    fireEvent.change(screen.getByLabelText(/country/i), { target: { value: 'US' } })
    fireEvent.click(screen.getByRole('button', { name: /submit quote request/i }))
    await waitFor(() =>
      expect(mockSubmitQuote).toHaveBeenCalledWith(
        mockAuthFetch,
        expect.objectContaining({
          companyId: 'co-1',
          deliveryAddressLine1: '99 Main St',
          deliveryCity: 'Portland',
        }),
      ),
    )
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({ params: { quoteId: 'quote-99' } }),
      ),
    )
  })

  it('does not call submitQuote when cart is empty', async () => {
    mockGetQuoteCart.mockResolvedValue(emptyCart)
    mockListCompanies.mockResolvedValue([stubCompany])
    render(<QuoteCartPage />)
    await waitFor(() => screen.getByText(/quote cart is empty/i))
    expect(mockSubmitQuote).not.toHaveBeenCalled()
  })
})
