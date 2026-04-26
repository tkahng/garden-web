import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

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
const mockListPriceLists = vi.fn()
const mockListPriceListEntries = vi.fn()

vi.mock('#/lib/b2b-api', () => ({
  listCompanies: (...a: unknown[]) => mockListCompanies(...a),
  listPriceLists: (...a: unknown[]) => mockListPriceLists(...a),
  listPriceListEntries: (...a: unknown[]) => mockListPriceListEntries(...a),
}))

import { PricingPage } from './pricing'
import type { PriceListResponse, CustomerPriceEntryResponse } from '#/lib/b2b-api'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const stubCompany = { id: 'co-1', name: 'Acme Corp' }

const activePriceList: PriceListResponse = {
  id: 'pl-1',
  companyId: 'co-1',
  name: 'Contract Pricing 2026',
  currency: 'USD',
  priority: 10,
}

const expiredPriceList: PriceListResponse = {
  ...activePriceList,
  id: 'pl-2',
  name: 'Old Contract',
  endsAt: new Date(Date.now() - 86400000).toISOString(),
}

const upcomingPriceList: PriceListResponse = {
  ...activePriceList,
  id: 'pl-3',
  name: 'Summer Pricing',
  startsAt: new Date(Date.now() + 86400000 * 7).toISOString(),
}

const entries: CustomerPriceEntryResponse[] = [
  {
    variantId: 'v-1',
    productTitle: 'Garden Trowel',
    productHandle: 'garden-trowel',
    variantTitle: 'Default',
    sku: 'SKU-004',
    retailPrice: 12.99,
    contractPrice: 9.99,
    minQty: 1,
  },
  {
    variantId: 'v-2',
    productTitle: 'Pruning Shears',
    productHandle: 'pruning-shears',
    variantTitle: 'Default',
    sku: 'SKU-005',
    retailPrice: 24.99,
    contractPrice: 19.99,
    minQty: 1,
  },
  {
    variantId: 'v-3',
    productTitle: 'Gardening Gloves',
    productHandle: 'gardening-gloves',
    variantTitle: 'M / Forest Green',
    sku: 'SKU-G-M-GRN',
    retailPrice: 14.99,
    contractPrice: 11.99,
    minQty: 1,
  },
  {
    variantId: 'v-3',
    productTitle: 'Gardening Gloves',
    productHandle: 'gardening-gloves',
    variantTitle: 'M / Forest Green',
    sku: 'SKU-G-M-GRN',
    retailPrice: 14.99,
    contractPrice: 9.99,
    minQty: 10,
  },
]

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PricingPage', () => {
  it('shows company-prompt when user has no company', async () => {
    mockListCompanies.mockResolvedValue([])
    render(<PricingPage />)
    await waitFor(() =>
      expect(screen.getByText(/company account/i)).toBeInTheDocument(),
    )
  })

  it('shows empty state when company has no price lists', async () => {
    mockListCompanies.mockResolvedValue([stubCompany])
    mockListPriceLists.mockResolvedValue([])
    render(<PricingPage />)
    await waitFor(() =>
      expect(screen.getByText(/no contract pricing/i)).toBeInTheDocument(),
    )
  })

  it('renders a card for each price list', async () => {
    mockListCompanies.mockResolvedValue([stubCompany])
    mockListPriceLists.mockResolvedValue([activePriceList, expiredPriceList])
    render(<PricingPage />)
    await waitFor(() => screen.getByText('Contract Pricing 2026'))
    expect(screen.getByText('Old Contract')).toBeInTheDocument()
  })

  it('shows expired badge for past price lists', async () => {
    mockListCompanies.mockResolvedValue([stubCompany])
    mockListPriceLists.mockResolvedValue([expiredPriceList])
    render(<PricingPage />)
    await waitFor(() =>
      expect(screen.getByText('expired')).toBeInTheDocument(),
    )
  })

  it('shows upcoming badge for future price lists', async () => {
    mockListCompanies.mockResolvedValue([stubCompany])
    mockListPriceLists.mockResolvedValue([upcomingPriceList])
    render(<PricingPage />)
    await waitFor(() =>
      expect(screen.getByText('upcoming')).toBeInTheDocument(),
    )
  })

  it('fetches and shows entries when card is expanded', async () => {
    mockListCompanies.mockResolvedValue([stubCompany])
    mockListPriceLists.mockResolvedValue([activePriceList])
    mockListPriceListEntries.mockResolvedValue(entries)
    render(<PricingPage />)
    const toggle = await waitFor(() => screen.getByRole('button', { name: /contract pricing 2026/i }))
    fireEvent.click(toggle)
    await waitFor(() =>
      expect(screen.getByText('Garden Trowel')).toBeInTheDocument(),
    )
    expect(screen.getByText('Pruning Shears')).toBeInTheDocument()
    expect(screen.getByText('Gardening Gloves')).toBeInTheDocument()
  })

  it('shows contract price and retail price with line-through', async () => {
    mockListCompanies.mockResolvedValue([stubCompany])
    mockListPriceLists.mockResolvedValue([activePriceList])
    mockListPriceListEntries.mockResolvedValue([entries[0]])
    render(<PricingPage />)
    const toggle = await waitFor(() => screen.getByRole('button', { name: /contract pricing 2026/i }))
    fireEvent.click(toggle)
    await waitFor(() => screen.getByText('Garden Trowel'))
    expect(screen.getByText('$9.99')).toBeInTheDocument()
    expect(screen.getByText('$12.99')).toBeInTheDocument()
  })

  it('shows savings percentage', async () => {
    mockListCompanies.mockResolvedValue([stubCompany])
    mockListPriceLists.mockResolvedValue([activePriceList])
    mockListPriceListEntries.mockResolvedValue([entries[0]])
    render(<PricingPage />)
    const toggle = await waitFor(() => screen.getByRole('button', { name: /contract pricing 2026/i }))
    fireEvent.click(toggle)
    // 12.99 → 9.99 ≈ 23% off
    await waitFor(() =>
      expect(screen.getByText(/23% off/i)).toBeInTheDocument(),
    )
  })

  it('shows volume tiers with min qty labels', async () => {
    mockListCompanies.mockResolvedValue([stubCompany])
    mockListPriceLists.mockResolvedValue([activePriceList])
    mockListPriceListEntries.mockResolvedValue([entries[2], entries[3]])
    render(<PricingPage />)
    const toggle = await waitFor(() => screen.getByRole('button', { name: /contract pricing 2026/i }))
    fireEvent.click(toggle)
    await waitFor(() => screen.getByText('Gardening Gloves'))
    expect(screen.getByText('Any')).toBeInTheDocument()
    expect(screen.getByText('≥ 10')).toBeInTheDocument()
  })

  it('shows empty entries message when price list has no items', async () => {
    mockListCompanies.mockResolvedValue([stubCompany])
    mockListPriceLists.mockResolvedValue([activePriceList])
    mockListPriceListEntries.mockResolvedValue([])
    render(<PricingPage />)
    const toggle = await waitFor(() => screen.getByRole('button', { name: /contract pricing 2026/i }))
    fireEvent.click(toggle)
    await waitFor(() =>
      expect(screen.getByText(/no items in this price list/i)).toBeInTheDocument(),
    )
  })

  it('fetches entries only once when toggled open twice', async () => {
    mockListCompanies.mockResolvedValue([stubCompany])
    mockListPriceLists.mockResolvedValue([activePriceList])
    mockListPriceListEntries.mockResolvedValue(entries)
    render(<PricingPage />)
    const toggle = await waitFor(() => screen.getByRole('button', { name: /contract pricing 2026/i }))
    fireEvent.click(toggle)
    await waitFor(() => screen.getByText('Garden Trowel'))
    fireEvent.click(toggle) // collapse
    fireEvent.click(toggle) // re-expand
    expect(mockListPriceListEntries).toHaveBeenCalledTimes(1)
  })

  it('calls listPriceListEntries with correct company and price list IDs', async () => {
    mockListCompanies.mockResolvedValue([stubCompany])
    mockListPriceLists.mockResolvedValue([activePriceList])
    mockListPriceListEntries.mockResolvedValue([])
    render(<PricingPage />)
    const toggle = await waitFor(() => screen.getByRole('button', { name: /contract pricing 2026/i }))
    fireEvent.click(toggle)
    await waitFor(() =>
      expect(mockListPriceListEntries).toHaveBeenCalledWith(mockAuthFetch, 'co-1', 'pl-1'),
    )
  })
})
