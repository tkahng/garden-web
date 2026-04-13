import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ProfilePage, { ProfileSkeleton } from './profile'

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (_config: unknown) => ({}),
}))

const mockAuthFetch = vi.fn()

vi.mock('#/context/auth', () => ({
  useAuth: () => ({ authFetch: mockAuthFetch }),
}))

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
  mockAuthFetch.mockReset()
})

describe('ProfileSkeleton', () => {
  it('renders skeleton placeholders', () => {
    render(<ProfileSkeleton />)
    expect(screen.getByTestId('profile-skeleton')).toBeInTheDocument()
  })
})

describe('ProfilePage', () => {
  it('shows loading skeleton while fetching', () => {
    mockAuthFetch.mockReturnValue(new Promise(() => {}))
    render(<ProfilePage />)
    expect(screen.getByTestId('profile-skeleton')).toBeInTheDocument()
  })

  it('shows email as read-only after load', async () => {
    mockAuthFetch.mockResolvedValue(mockAccount)
    render(<ProfilePage />)
    await waitFor(() => expect(screen.getByText('user@example.com')).toBeInTheDocument())
  })

  it('shows ACTIVE status badge', async () => {
    mockAuthFetch.mockResolvedValue(mockAccount)
    render(<ProfilePage />)
    await waitFor(() => expect(screen.getByText(/active/i)).toBeInTheDocument())
  })

  it('pre-fills first name and last name fields', async () => {
    mockAuthFetch.mockResolvedValue(mockAccount)
    render(<ProfilePage />)
    await waitFor(() => {
      expect(screen.getByDisplayValue('Jane')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Smith')).toBeInTheDocument()
    })
  })

  it('calls updateAccount on save', async () => {
    mockAuthFetch
      .mockResolvedValueOnce(mockAccount)
      .mockResolvedValueOnce({ ...mockAccount, firstName: 'Janet' })
    render(<ProfilePage />)
    await waitFor(() => screen.getByDisplayValue('Jane'))

    fireEvent.change(screen.getByDisplayValue('Jane'), { target: { value: 'Janet' } })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() =>
      expect(mockAuthFetch).toHaveBeenCalledWith(
        '/api/v1/account',
        expect.objectContaining({ method: 'PUT' }),
      ),
    )
  })

  it('shows success message after save', async () => {
    mockAuthFetch
      .mockResolvedValueOnce(mockAccount)
      .mockResolvedValueOnce(mockAccount)
    render(<ProfilePage />)
    await waitFor(() => screen.getByDisplayValue('Jane'))

    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => expect(screen.getByText(/changes saved/i)).toBeInTheDocument())
  })

  it('shows error message on save failure', async () => {
    mockAuthFetch
      .mockResolvedValueOnce(mockAccount)
      .mockRejectedValueOnce(new Error('HTTP 500'))
    render(<ProfilePage />)
    await waitFor(() => screen.getByDisplayValue('Jane'))

    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => expect(screen.getByText(/failed to save/i)).toBeInTheDocument())
  })
})
