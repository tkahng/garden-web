import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ResetPasswordPage } from './reset-password'

import * as api from '#/lib/api'

const mockNavigate = vi.fn()
const mockOpenAuthModal = vi.fn()

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal() as Record<string, unknown>
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('#/context/auth-modal', () => ({
  useAuthModal: () => ({ openAuthModal: mockOpenAuthModal }),
}))

vi.mock('#/lib/api', () => ({
  authConfirmPasswordReset: vi.fn(),
}))

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigate.mockResolvedValue(undefined)
  })

  it('shows an error when no token is provided', () => {
    render(<ResetPasswordPage token={null} />)
    expect(screen.getByText(/invalid or expired/i)).toBeInTheDocument()
  })

  it('renders the new password form when token is present', () => {
    render(<ResetPasswordPage token="tok123" />)
    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /set new password/i })).toBeInTheDocument()
  })

  it('calls authConfirmPasswordReset on submit', async () => {
    vi.mocked(api.authConfirmPasswordReset).mockResolvedValue(undefined)

    render(<ResetPasswordPage token="tok123" />)
    fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: 'newpass123' } })
    fireEvent.click(screen.getByRole('button', { name: /set new password/i }))

    await waitFor(() =>
      expect(api.authConfirmPasswordReset).toHaveBeenCalledWith('tok123', 'newpass123'),
    )
  })

  it('navigates home and opens login modal on success', async () => {
    vi.mocked(api.authConfirmPasswordReset).mockResolvedValue(undefined)

    render(<ResetPasswordPage token="tok123" />)
    fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: 'newpass123' } })
    fireEvent.click(screen.getByRole('button', { name: /set new password/i }))

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith({ to: '/' }))
    expect(mockOpenAuthModal).toHaveBeenCalledWith('login')
  })

  it('shows an error message on failure', async () => {
    vi.mocked(api.authConfirmPasswordReset).mockRejectedValue(new Error('HTTP 400'))

    render(<ResetPasswordPage token="tok123" />)
    fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: 'newpass' } })
    fireEvent.click(screen.getByRole('button', { name: /set new password/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByRole('alert')).toHaveTextContent(/link may have expired/i)
    })
  })
})
