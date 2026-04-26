import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { ProfilePage, ProfileSkeleton } from './profile'

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (_config: unknown) => ({}),
}))

const mockAuthFetch = { GET: vi.fn(), POST: vi.fn(), PUT: vi.fn(), DELETE: vi.fn(), PATCH: vi.fn() }

vi.mock('#/context/auth', () => ({
  useAuth: () => ({ authFetch: mockAuthFetch }),
}))

vi.mock('#/lib/account-api', () => ({
  getAccount: vi.fn(),
  updateAccount: vi.fn(),
}))

import * as accountApi from '#/lib/account-api'

const mockAccount = {
  id: 'user-1',
  email: 'user@example.com',
  firstName: 'Jane',
  lastName: 'Smith',
  phone: '555-1234',
  status: 'ACTIVE' as const,
  emailVerifiedAt: '2026-01-01T00:00:00Z',
}

beforeEach(() => {
  vi.mocked(accountApi.getAccount).mockResolvedValue(mockAccount)
  vi.mocked(accountApi.updateAccount).mockResolvedValue(mockAccount)
})

describe('ProfileSkeleton', () => {
  it('renders skeleton placeholders', () => {
    render(<ProfileSkeleton />)
    expect(screen.getByTestId('profile-skeleton')).toBeInTheDocument()
  })
})

describe('ProfilePage', () => {
  it('shows loading skeleton while fetching', () => {
    vi.mocked(accountApi.getAccount).mockReturnValue(new Promise(() => {}))
    render(<ProfilePage />)
    expect(screen.getByTestId('profile-skeleton')).toBeInTheDocument()
  })

  it('shows email as read-only after load', async () => {
    render(<ProfilePage />)
    await waitFor(() => expect(screen.getByText('user@example.com')).toBeInTheDocument())
  })

  it('shows ACTIVE status badge', async () => {
    render(<ProfilePage />)
    await waitFor(() => expect(screen.getByText(/active/i)).toBeInTheDocument())
  })

  it('pre-fills first name and last name fields', async () => {
    render(<ProfilePage />)
    await waitFor(() => {
      expect(screen.getByDisplayValue('Jane')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Smith')).toBeInTheDocument()
    })
  })

  it('calls updateAccount on save', async () => {
    vi.mocked(accountApi.updateAccount).mockResolvedValue({ ...mockAccount, firstName: 'Janet' })
    render(<ProfilePage />)
    await waitFor(() => screen.getByDisplayValue('Jane'))

    fireEvent.change(screen.getByDisplayValue('Jane'), { target: { value: 'Janet' } })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /save/i }))
    })

    await waitFor(() => expect(accountApi.updateAccount).toHaveBeenCalled())
  })

  it('shows success message after save', async () => {
    render(<ProfilePage />)
    await waitFor(() => screen.getByDisplayValue('Jane'))

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /save/i }))
    })

    await waitFor(() => expect(screen.getByText(/changes saved/i)).toBeInTheDocument())
  })

  it('shows error message on save failure', async () => {
    vi.mocked(accountApi.updateAccount).mockRejectedValue(new Error('HTTP 500'))
    render(<ProfilePage />)
    await waitFor(() => screen.getByDisplayValue('Jane'))

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /save/i }))
    })

    await waitFor(() => expect(screen.getByText(/failed to save/i)).toBeInTheDocument())
  })
})
