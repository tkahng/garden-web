import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// ─── Router mock ─────────────────────────────────────────────────────────────

const mockNavigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: unknown) => ({
    ...(config as object),
    useParams: () => ({ token: 'test-token-uuid' }),
  }),
  useNavigate: () => mockNavigate,
}))

// ─── Auth mock ────────────────────────────────────────────────────────────────

const mockAuthFetch = vi.fn()

vi.mock('#/context/auth', () => ({
  useAuth: () => ({ isAuthenticated: true, authFetch: mockAuthFetch }),
}))

vi.mock('#/context/auth-modal', () => ({
  useAuthModal: () => ({ openAuthModal: vi.fn() }),
}))

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

// ─── B2B API mock ─────────────────────────────────────────────────────────────

const mockGetInvitation = vi.fn()
const mockAcceptInvitation = vi.fn()

vi.mock('#/lib/b2b-api', () => ({
  getInvitationByToken: (...a: unknown[]) => mockGetInvitation(...a),
  acceptInvitation: (...a: unknown[]) => mockAcceptInvitation(...a),
}))

import { InvitationPage } from './$token'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const pendingInvitation = {
  id: 'inv-1',
  companyName: 'Acme Corp',
  email: 'user@example.com',
  role: 'MEMBER' as const,
  status: 'PENDING' as const,
  expiresAt: new Date(Date.now() + 86400000 * 7).toISOString(),
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('InvitationPage', () => {
  it('shows error state when invitation not found', async () => {
    mockGetInvitation.mockRejectedValue(new Error('404'))
    render(<InvitationPage />)
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /invitation not found/i })).toBeInTheDocument(),
    )
  })

  it('shows company name and accept button for pending invitation', async () => {
    mockGetInvitation.mockResolvedValue(pendingInvitation)
    render(<InvitationPage />)
    await waitFor(() => expect(screen.getByText('Acme Corp')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /accept invitation/i })).toBeInTheDocument()
  })

  it('shows email and role in detail rows', async () => {
    mockGetInvitation.mockResolvedValue(pendingInvitation)
    render(<InvitationPage />)
    await waitFor(() => screen.getByText('Acme Corp'))
    expect(screen.getByText('user@example.com')).toBeInTheDocument()
    expect(screen.getByText('member')).toBeInTheDocument()
  })

  it('hides accept button and shows expired message for cancelled invitation', async () => {
    mockGetInvitation.mockResolvedValue({ ...pendingInvitation, status: 'CANCELLED' as const })
    render(<InvitationPage />)
    await waitFor(() => screen.getByText('Acme Corp'))
    expect(screen.queryByRole('button', { name: /accept/i })).not.toBeInTheDocument()
    expect(screen.getByText(/no longer valid/i)).toBeInTheDocument()
  })

  it('calls acceptInvitation with the token from the route', async () => {
    mockGetInvitation.mockResolvedValue(pendingInvitation)
    mockAcceptInvitation.mockResolvedValue({ ...pendingInvitation, status: 'ACCEPTED' })
    render(<InvitationPage />)
    await waitFor(() => screen.getByRole('button', { name: /accept invitation/i }))
    fireEvent.click(screen.getByRole('button', { name: /accept invitation/i }))
    await waitFor(() =>
      expect(mockAcceptInvitation).toHaveBeenCalledWith(mockAuthFetch, 'test-token-uuid'),
    )
  })

  it('disables button while accepting', async () => {
    mockGetInvitation.mockResolvedValue(pendingInvitation)
    mockAcceptInvitation.mockReturnValue(new Promise(() => {}))
    render(<InvitationPage />)
    await waitFor(() => screen.getByRole('button', { name: /accept invitation/i }))
    fireEvent.click(screen.getByRole('button', { name: /accept invitation/i }))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /accepting/i })).toBeDisabled(),
    )
  })

  it('does not call acceptInvitation for expired invitation', async () => {
    mockGetInvitation.mockResolvedValue({ ...pendingInvitation, status: 'EXPIRED' as const })
    render(<InvitationPage />)
    await waitFor(() => screen.getByText('Acme Corp'))
    expect(mockAcceptInvitation).not.toHaveBeenCalled()
  })
})
