import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AuthModalProvider, useAuthModal } from '#/context/auth-modal'
import { AuthProvider } from '#/context/auth'
import AuthModal from './AuthModal'

import * as api from '#/lib/api'

vi.mock('#/lib/api', () => ({
  authLogin: vi.fn(),
  authRegister: vi.fn(),
  authLogout: vi.fn(),
  authRefresh: vi.fn(),
  getAccount: vi.fn(),
  createAuthClient: vi.fn(() => ({ GET: vi.fn(), POST: vi.fn(), PUT: vi.fn(), DELETE: vi.fn(), PATCH: vi.fn() })),
  authRequestPasswordReset: vi.fn(),
}))

function OpenModalButton({ tab }: { tab?: 'login' | 'register' | 'forgot-password' | 'verify-email' }) {
  const { openAuthModal } = useAuthModal()
  return <button onClick={() => openAuthModal(tab ?? 'login')}>open modal</button>
}

function Harness({ tab }: { tab?: 'login' | 'register' | 'forgot-password' | 'verify-email' }) {
  return (
    <AuthModalProvider>
      <AuthProvider>
        <OpenModalButton tab={tab} />
        <AuthModal />
      </AuthProvider>
    </AuthModalProvider>
  )
}

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
})

describe('AuthModal - Login tab', () => {
  it('is not visible when modal is closed', () => {
    render(<Harness tab="login" />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows the login form when opened with login tab', () => {
    render(<Harness tab="login" />)
    fireEvent.click(screen.getByText('open modal'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('calls login on submit', async () => {
    vi.mocked(api.authLogin).mockResolvedValue({ accessToken: 'acc', refreshToken: 'ref' })
    vi.mocked(api.getAccount).mockResolvedValue({
      id: 'u1', email: 'a@b.com', firstName: 'Jane', lastName: 'Doe', phone: null, status: 'ACTIVE',
    })

    render(<Harness tab="login" />)
    fireEvent.click(screen.getByText('open modal'))

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'pass' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => expect(api.authLogin).toHaveBeenCalledWith('a@b.com', 'pass'))
  })

  it('shows inline error on login failure', async () => {
    vi.mocked(api.authLogin).mockRejectedValue(new Error('HTTP 401'))

    render(<Harness tab="login" />)
    fireEvent.click(screen.getByText('open modal'))
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
  })

  it('switches to register tab when link is clicked', () => {
    render(<Harness tab="login" />)
    fireEvent.click(screen.getByText('open modal'))
    fireEvent.click(screen.getByText(/don't have an account/i))
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
  })

  it('switches to forgot-password tab when link is clicked', () => {
    render(<Harness tab="login" />)
    fireEvent.click(screen.getByText('open modal'))
    fireEvent.click(screen.getByText(/forgot password/i))
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument()
  })
})

describe('AuthModal - Register tab', () => {
  it('shows register form when opened with register tab', () => {
    render(<Harness tab="register" />)
    fireEvent.click(screen.getByText('open modal'))
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })

  it('calls register on submit and closes the modal', async () => {
    vi.mocked(api.authRegister).mockResolvedValue({ accessToken: 'acc', refreshToken: 'ref' })
    vi.mocked(api.getAccount).mockResolvedValue({
      id: 'u1', email: 'a@b.com', firstName: 'Jane', lastName: 'Doe', phone: null, status: 'UNVERIFIED',
    })

    render(<Harness tab="register" />)
    fireEvent.click(screen.getByText('open modal'))
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Jane' } })
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'pass' } })
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() =>
      expect(api.authRegister).toHaveBeenCalledWith('a@b.com', 'pass', 'Jane', 'Doe'),
    )
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })
})

describe('AuthModal - Forgot password tab', () => {
  it('shows forgot password form', () => {
    render(<Harness tab="forgot-password" />)
    fireEvent.click(screen.getByText('open modal'))
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument()
  })

  it('calls authRequestPasswordReset on submit and shows success message', async () => {
    vi.mocked(api.authRequestPasswordReset).mockResolvedValue(undefined)

    render(<Harness tab="forgot-password" />)
    fireEvent.click(screen.getByText('open modal'))
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } })
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }))

    await waitFor(() => expect(screen.getByText(/check your email/i)).toBeInTheDocument())
  })
})

describe('AuthModal - Verify email tab', () => {
  it('shows verify email informational content', () => {
    render(<Harness tab="verify-email" />)
    fireEvent.click(screen.getByText('open modal'))
    expect(screen.getByText(/check your email/i)).toBeInTheDocument()
  })
})
