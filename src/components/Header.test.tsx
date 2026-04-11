import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Header from './Header'

// Minimal router mock (same as before)
vi.mock('@tanstack/react-router', () => ({
  Link: ({
    to,
    children,
    className,
    activeProps: _activeProps,
    ...rest
  }: {
    to: string
    children: React.ReactNode
    className?: string
    activeProps?: unknown
    [key: string]: unknown
  }) => (
    <a href={to} className={className} {...rest}>
      {children}
    </a>
  ),
}))

const mockOpenAuthModal = vi.fn()
const mockLogout = vi.fn()

// Default mock state: guest
let mockUser: null | { firstName: string; lastName: string; email: string } =
  null
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

let mockItemCount = 0

vi.mock('#/context/cart', () => ({
  useCart: () => ({ itemCount: mockItemCount }),
}))

describe('Header — guest state', () => {
  beforeEach(() => {
    mockUser = null
    mockIsAuthenticated = false
    mockItemCount = 0
    mockOpenAuthModal.mockClear()
  })

  it('renders the store wordmark', () => {
    render(<Header />)
    expect(
      screen.getByRole('link', { name: /The Garden Shop/i }),
    ).toBeInTheDocument()
  })

  it('cart icon is a link to /cart', () => {
    render(<Header />)
    expect(screen.getByRole('link', { name: /open cart/i })).toHaveAttribute('href', '/cart')
  })

  it('does not show badge when itemCount is 0', () => {
    mockItemCount = 0
    render(<Header />)
    expect(screen.queryByTestId('cart-badge')).not.toBeInTheDocument()
  })

  it('shows badge with count when itemCount > 0', () => {
    mockItemCount = 3
    render(<Header />)
    expect(screen.getByTestId('cart-badge')).toHaveTextContent('3')
  })

  it('does not show user avatar', () => {
    render(<Header />)
    expect(
      screen.queryByRole('button', { name: /user menu/i }),
    ).not.toBeInTheDocument()
  })

  it('mobile nav shows Sign in button', () => {
    render(<Header />)
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })
})

describe('Header — authenticated state', () => {
  beforeEach(() => {
    mockUser = { firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com' }
    mockIsAuthenticated = true
    mockItemCount = 0
    mockLogout.mockClear()
  })

  it('shows user initials avatar button', () => {
    render(<Header />)
    expect(
      screen.getByRole('button', { name: /user menu/i }),
    ).toBeInTheDocument()
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
    fireEvent.click(screen.getAllByText('Sign out')[0])
    expect(mockLogout).toHaveBeenCalled()
  })

  it('mobile nav shows Sign out button instead of Sign in link', () => {
    render(<Header />)
    expect(
      screen.queryByRole('link', { name: /sign in/i }),
    ).not.toBeInTheDocument()
    // Mobile sheet has a Sign out button somewhere
    expect(screen.getAllByText('Sign out').length).toBeGreaterThanOrEqual(1)
  })
})
