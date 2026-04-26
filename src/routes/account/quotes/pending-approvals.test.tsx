import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// ─── Router mock ─────────────────────────────────────────────────────────────

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: unknown) => config,
}))

// ─── Auth mock ────────────────────────────────────────────────────────────────

const mockAuthFetch = vi.fn()
vi.mock('#/context/auth', () => ({
  useAuth: () => ({ authFetch: mockAuthFetch }),
}))

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }))

// ─── B2B API mock ─────────────────────────────────────────────────────────────

const mockListPendingApprovals = vi.fn()
const mockApproveQuote = vi.fn()
const mockRejectApproval = vi.fn()

vi.mock('#/lib/b2b-api', () => ({
  listPendingApprovals: (...a: unknown[]) => mockListPendingApprovals(...a),
  approveQuote: (...a: unknown[]) => mockApproveQuote(...a),
  rejectApproval: (...a: unknown[]) => mockRejectApproval(...a),
}))

import { PendingApprovalsPage } from './pending-approvals'
import type { QuoteRequestResponse } from '#/lib/b2b-api'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const pendingQuote: QuoteRequestResponse = {
  id: 'q-1',
  status: 'PENDING_APPROVAL',
  createdAt: '2026-04-10T10:00:00Z',
  deliveryAddressLine1: '456 Bloom Ave',
  deliveryCity: 'Portland',
  deliveryState: 'OR',
  deliveryPostalCode: '97202',
  deliveryCountry: 'US',
  items: [
    { id: 'i-1', description: 'Garden Trowel', quantity: 20, unitPrice: 9.99 },
    { id: 'i-2', description: 'Pruning Shears', quantity: 10, unitPrice: 19.99 },
  ],
}

const pendingQuote2: QuoteRequestResponse = {
  ...pendingQuote,
  id: 'q-2',
  items: [{ id: 'i-3', description: 'Watering Can', quantity: 5, unitPrice: 18.50 }],
}

const pagedOne = { content: [pendingQuote], meta: { total: 1, pageSize: 20 } }
const pagedTwo = { content: [pendingQuote, pendingQuote2], meta: { total: 2, pageSize: 20 } }
const pagedEmpty = { content: [], meta: { total: 0, pageSize: 20 } }

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PendingApprovalsPage', () => {
  it('shows empty state when no pending approvals', async () => {
    mockListPendingApprovals.mockResolvedValue(pagedEmpty)
    render(<PendingApprovalsPage />)
    await waitFor(() =>
      expect(screen.getByText(/no quotes awaiting approval/i)).toBeInTheDocument(),
    )
  })

  it('renders a card for each pending quote', async () => {
    mockListPendingApprovals.mockResolvedValue(pagedTwo)
    render(<PendingApprovalsPage />)
    await waitFor(() =>
      expect(screen.getAllByRole('button', { name: /^approve$/i })).toHaveLength(2),
    )
  })

  it('shows item descriptions and total', async () => {
    mockListPendingApprovals.mockResolvedValue(pagedOne)
    render(<PendingApprovalsPage />)
    await waitFor(() => screen.getByText('Garden Trowel'))
    expect(screen.getByText('Pruning Shears')).toBeInTheDocument()
    // Total: 20×9.99 + 10×19.99 = 199.80 + 199.90 = 399.70
    expect(screen.getByText('$399.70')).toBeInTheDocument()
  })

  it('shows delivery address', async () => {
    mockListPendingApprovals.mockResolvedValue(pagedOne)
    render(<PendingApprovalsPage />)
    await waitFor(() => screen.getByText('Garden Trowel'))
    expect(screen.getByText(/456 Bloom Ave/)).toBeInTheDocument()
  })

  it('shows submitted date', async () => {
    mockListPendingApprovals.mockResolvedValue(pagedOne)
    render(<PendingApprovalsPage />)
    await waitFor(() => screen.getByText(/apr 10, 2026/i))
  })

  it('calls approveQuote and removes card on approve', async () => {
    mockListPendingApprovals.mockResolvedValue(pagedOne)
    mockApproveQuote.mockResolvedValue({})
    render(<PendingApprovalsPage />)
    await waitFor(() => screen.getByRole('button', { name: /^approve$/i }))
    fireEvent.click(screen.getByRole('button', { name: /^approve$/i }))
    await waitFor(() =>
      expect(mockApproveQuote).toHaveBeenCalledWith(mockAuthFetch, 'q-1'),
    )
    await waitFor(() =>
      expect(screen.queryByText('Garden Trowel')).not.toBeInTheDocument(),
    )
  })

  it('calls rejectApproval and removes card on reject', async () => {
    mockListPendingApprovals.mockResolvedValue(pagedOne)
    mockRejectApproval.mockResolvedValue({ id: 'q-1', status: 'REJECTED' })
    render(<PendingApprovalsPage />)
    await waitFor(() => screen.getByRole('button', { name: /^reject$/i }))
    fireEvent.click(screen.getByRole('button', { name: /^reject$/i }))
    await waitFor(() =>
      expect(mockRejectApproval).toHaveBeenCalledWith(mockAuthFetch, 'q-1'),
    )
    await waitFor(() =>
      expect(screen.queryByText('Garden Trowel')).not.toBeInTheDocument(),
    )
  })

  it('redirects to checkout URL when Stripe path returned on approve', async () => {
    mockListPendingApprovals.mockResolvedValue(pagedOne)
    mockApproveQuote.mockResolvedValue({ checkoutUrl: 'https://stripe.test/pay/cs_abc' })
    Object.defineProperty(window, 'location', { value: { href: '' }, writable: true })
    render(<PendingApprovalsPage />)
    await waitFor(() => screen.getByRole('button', { name: /^approve$/i }))
    fireEvent.click(screen.getByRole('button', { name: /^approve$/i }))
    await waitFor(() =>
      expect(window.location.href).toBe('https://stripe.test/pay/cs_abc'),
    )
  })

  it('disables both buttons while approving', async () => {
    mockListPendingApprovals.mockResolvedValue(pagedOne)
    mockApproveQuote.mockReturnValue(new Promise(() => {}))
    render(<PendingApprovalsPage />)
    await waitFor(() => screen.getByRole('button', { name: /^approve$/i }))
    fireEvent.click(screen.getByRole('button', { name: /^approve$/i }))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /approving/i })).toBeDisabled(),
    )
    expect(screen.getByRole('button', { name: /^reject$/i })).toBeDisabled()
  })

  it('disables both buttons while rejecting', async () => {
    mockListPendingApprovals.mockResolvedValue(pagedOne)
    mockRejectApproval.mockReturnValue(new Promise(() => {}))
    render(<PendingApprovalsPage />)
    await waitFor(() => screen.getByRole('button', { name: /^reject$/i }))
    fireEvent.click(screen.getByRole('button', { name: /^reject$/i }))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /rejecting/i })).toBeDisabled(),
    )
    expect(screen.getByRole('button', { name: /^approve$/i })).toBeDisabled()
  })

  it('only removes the approved card, not others', async () => {
    mockListPendingApprovals.mockResolvedValue(pagedTwo)
    mockApproveQuote.mockResolvedValue({})
    render(<PendingApprovalsPage />)
    const approveButtons = await waitFor(() =>
      screen.getAllByRole('button', { name: /^approve$/i }),
    )
    fireEvent.click(approveButtons[0])
    await waitFor(() =>
      expect(screen.getAllByRole('button', { name: /^approve$/i })).toHaveLength(1),
    )
  })
})
