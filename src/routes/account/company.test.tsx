import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// ─── Router mock ─────────────────────────────────────────────────────────────

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: unknown) => config,
}))

// ─── Auth mock ────────────────────────────────────────────────────────────────

const mockAuthFetch = vi.fn()
vi.mock('#/context/auth', () => ({
  useAuth: () => ({ authFetch: mockAuthFetch, user: { id: 'user-1' } }),
}))

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

// ─── B2B API mock ─────────────────────────────────────────────────────────────

const mockListCompanies = vi.fn()
const mockCreateCompany = vi.fn()
const mockListMembers = vi.fn()
const mockAddMember = vi.fn()
const mockRemoveMember = vi.fn()
const mockUpdateMemberRole = vi.fn()
const mockListInvitations = vi.fn()
const mockSendInvitation = vi.fn()
const mockCancelInvitation = vi.fn()

vi.mock('#/lib/b2b-api', () => ({
  listCompanies: (...a: unknown[]) => mockListCompanies(...a),
  createCompany: (...a: unknown[]) => mockCreateCompany(...a),
  listMembers: (...a: unknown[]) => mockListMembers(...a),
  addMember: (...a: unknown[]) => mockAddMember(...a),
  removeMember: (...a: unknown[]) => mockRemoveMember(...a),
  updateMemberRole: (...a: unknown[]) => mockUpdateMemberRole(...a),
  listInvitations: (...a: unknown[]) => mockListInvitations(...a),
  sendInvitation: (...a: unknown[]) => mockSendInvitation(...a),
  cancelInvitation: (...a: unknown[]) => mockCancelInvitation(...a),
}))

import { CompanyPage, CreateCompanyForm } from './company'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const stubCompany = { id: 'co-1', name: 'Acme Corp', taxId: '12-3456789' }
const ownerMember = {
  membershipId: 'm-1',
  userId: 'user-1',
  email: 'owner@example.com',
  firstName: 'Alice',
  lastName: 'Owner',
  role: 'OWNER',
}
const regularMember = {
  membershipId: 'm-2',
  userId: 'user-2',
  email: 'bob@example.com',
  firstName: 'Bob',
  lastName: 'User',
  role: 'MEMBER',
}
const pendingInvitation = {
  id: 'inv-1',
  email: 'charlie@example.com',
  role: 'MEMBER',
  status: 'PENDING',
  expiresAt: new Date(Date.now() + 86400000).toISOString(),
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── CreateCompanyForm ────────────────────────────────────────────────────────

describe('CreateCompanyForm', () => {
  it('renders company name input', () => {
    render(<CreateCompanyForm onCreate={vi.fn()} />)
    expect(screen.getByLabelText(/company name/i)).toBeInTheDocument()
  })

  it('calls createCompany and invokes onCreate on submit', async () => {
    mockCreateCompany.mockResolvedValue(stubCompany)
    const onCreate = vi.fn()
    render(<CreateCompanyForm onCreate={onCreate} />)
    fireEvent.change(screen.getByLabelText(/company name/i), {
      target: { value: 'Acme Corp' },
    })
    fireEvent.click(screen.getByRole('button', { name: /create company/i }))
    await waitFor(() => expect(mockCreateCompany).toHaveBeenCalledWith(
      mockAuthFetch,
      expect.objectContaining({ name: 'Acme Corp' }),
    ))
    await waitFor(() => expect(onCreate).toHaveBeenCalledWith(stubCompany))
  })

  it('submit button is disabled when name is empty', () => {
    render(<CreateCompanyForm onCreate={vi.fn()} />)
    expect(screen.getByRole('button', { name: /create company/i })).toBeDisabled()
  })
})

// ─── CompanyPage ──────────────────────────────────────────────────────────────

describe('CompanyPage', () => {
  it('shows create form when user has no companies', async () => {
    mockListCompanies.mockResolvedValue([])
    render(<CompanyPage />)
    await waitFor(() =>
      expect(screen.getByText(/create your company/i)).toBeInTheDocument(),
    )
  })

  it('shows company name when company exists', async () => {
    mockListCompanies.mockResolvedValue([stubCompany])
    mockListMembers.mockResolvedValue([ownerMember])
    render(<CompanyPage />)
    await waitFor(() => expect(screen.getByText('Acme Corp')).toBeInTheDocument())
  })

  it('shows members tab by default with member list', async () => {
    mockListCompanies.mockResolvedValue([stubCompany])
    mockListMembers.mockResolvedValue([ownerMember, regularMember])
    render(<CompanyPage />)
    await waitFor(() => screen.getByText('Acme Corp'))
    await waitFor(() => expect(screen.getByText('bob@example.com')).toBeInTheDocument())
  })

  it('shows invitations tab for owner', async () => {
    mockListCompanies.mockResolvedValue([stubCompany])
    mockListMembers.mockResolvedValue([ownerMember])
    mockListInvitations.mockResolvedValue([pendingInvitation])
    render(<CompanyPage />)
    const invTab = await waitFor(() => screen.getByRole('button', { name: /invitations/i }))
    fireEvent.click(invTab)
    await waitFor(() =>
      expect(screen.getByText('charlie@example.com')).toBeInTheDocument(),
    )
  })

  it('does NOT show invitations tab for regular member', async () => {
    mockListCompanies.mockResolvedValue([stubCompany])
    // user-1 is a MEMBER here
    mockListMembers.mockResolvedValue([
      { ...ownerMember, userId: 'other-user' },
      { ...regularMember, userId: 'user-1' },
    ])
    render(<CompanyPage />)
    await waitFor(() => screen.getByText('Acme Corp'))
    await waitFor(() => screen.getByText('owner@example.com'))
    expect(screen.queryByRole('button', { name: /invitations/i })).not.toBeInTheDocument()
  })

  it('owner can remove a regular member', async () => {
    mockListCompanies.mockResolvedValue([stubCompany])
    mockListMembers.mockResolvedValue([ownerMember, regularMember])
    mockRemoveMember.mockResolvedValue(undefined)
    render(<CompanyPage />)
    // wait for canManage buttons to appear
    await waitFor(() => screen.getByRole('button', { name: /remove/i }))
    fireEvent.click(screen.getByRole('button', { name: /remove/i }))
    await waitFor(() =>
      expect(mockRemoveMember).toHaveBeenCalledWith(mockAuthFetch, 'co-1', 'user-2'),
    )
  })

  it('owner can promote member to manager', async () => {
    mockListCompanies.mockResolvedValue([stubCompany])
    mockListMembers.mockResolvedValue([ownerMember, regularMember])
    mockUpdateMemberRole.mockResolvedValue({ ...regularMember, role: 'MANAGER' })
    render(<CompanyPage />)
    await waitFor(() => screen.getByRole('button', { name: /make manager/i }))
    fireEvent.click(screen.getByRole('button', { name: /make manager/i }))
    await waitFor(() =>
      expect(mockUpdateMemberRole).toHaveBeenCalledWith(
        mockAuthFetch, 'co-1', 'user-2', { role: 'MANAGER' },
      ),
    )
  })

  it('sends invitation with selected role', async () => {
    mockListCompanies.mockResolvedValue([stubCompany])
    mockListMembers.mockResolvedValue([ownerMember])
    mockListInvitations.mockResolvedValue([])
    mockSendInvitation.mockResolvedValue(pendingInvitation)
    render(<CompanyPage />)
    const invTab = await waitFor(() => screen.getByRole('button', { name: /invitations/i }))
    fireEvent.click(invTab)
    await waitFor(() => screen.getByLabelText(/email/i))
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'charlie@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /send invite/i }))
    await waitFor(() =>
      expect(mockSendInvitation).toHaveBeenCalledWith(
        mockAuthFetch,
        'co-1',
        expect.objectContaining({ email: 'charlie@example.com' }),
      ),
    )
  })

  it('can cancel a pending invitation', async () => {
    mockListCompanies.mockResolvedValue([stubCompany])
    mockListMembers.mockResolvedValue([ownerMember])
    mockListInvitations.mockResolvedValue([pendingInvitation])
    mockCancelInvitation.mockResolvedValue({ ...pendingInvitation, status: 'CANCELLED' })
    render(<CompanyPage />)
    // wait for invitations tab button (requires myRole=OWNER to resolve first)
    const invTab = await waitFor(() =>
      screen.getByRole('button', { name: /invitations/i }),
    )
    fireEvent.click(invTab)
    await waitFor(() => screen.getByText('charlie@example.com'))
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    await waitFor(() =>
      expect(mockCancelInvitation).toHaveBeenCalledWith(mockAuthFetch, 'co-1', 'inv-1'),
    )
  })
})
