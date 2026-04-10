import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Header from './Header'

// Minimal router mock (same as before)
vi.mock('@tanstack/react-router', () => ({
  Link: ({
    to,
    children,
    className,
    activeProps: _activeProps,
  }: {
    to: string
    children: React.ReactNode
    className?: string
    activeProps?: unknown
  }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}))

const mockOpenAuthModal = vi.fn()
const mockLogout = vi.fn()

// Default mock state: guest
let mockUser: null | { firstName: string; lastName: string; email: string } = null
let mockIsAuthenticated = false

vi.mock('#/context/auth-modal', () => ({
  useAuthModal: () => ({ openAuthModal: mockOpenAuthModal }),
}))

vi.mock('#/context/auth', () => ({
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: mockIsAuthenticated,
    logout: mockLogout,
  }),
}))

describe('Header — guest state', () => {
  beforeEach(() => {
    mockUser = null
    mockIsAuthenticated = false
    mockOpenAuthModal.mockClear()
  })

  it('renders the store wordmark', () => {
    render(<Header />)
    expect(screen.getByRole('link', { name: /The Garden Shop/i })).toBeInTheDocument()
  })

  it('cart button opens auth modal with login tab', () => {
    render(<Header />)
    fireEvent.click(screen.getByRole('button', { name: /open cart/i }))
    expect(mockOpenAuthModal).toHaveBeenCalledWith('login')
  })

  it('does not show user avatar', () => {
    render(<Header />)
    expect(screen.queryByRole('button', { name: /user menu/i })).not.toBeInTheDocument()
  })

  it('mobile nav shows Sign in link', () => {
    render(<Header />)
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument()
  })
})

describe('Header — authenticated state', () => {
  beforeEach(() => {
    mockUser = { firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com' }
    mockIsAuthenticated = true
    mockLogout.mockClear()
  })

  it('shows user initials avatar button', () => {
    render(<Header />)
    expect(screen.getByRole('button', { name: /user menu/i })).toBeInTheDocument()
    expect(screen.getByText('JD')).toBeInTheDocument()
  })

  it('dropdown shows user name and email', () => {
    render(<Header />)
    fireEvent.click(screen.getByRole('button', { name: /user menu/i }))
    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    expect(screen.getByText('jane@example.com')).toBeInTheDocument()
  })

  it('Sign out calls logout', () => {
    render(<Header />)
    fireEvent.click(screen.getByRole('button', { name: /user menu/i }))
    fireEvent.click(screen.getByText('Sign out'))
    expect(mockLogout).toHaveBeenCalled()
  })

  it('mobile nav shows Sign out button instead of Sign in link', () => {
    render(<Header />)
    expect(screen.queryByRole('link', { name: /sign in/i })).not.toBeInTheDocument()
    // Mobile sheet has a Sign out button somewhere
    expect(screen.getAllByText('Sign out').length).toBeGreaterThanOrEqual(1)
  })
})
