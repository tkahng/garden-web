import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Header from './Header'

// Mock TanStack Router Link as a plain anchor so tests run without a full router context
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

describe('Header', () => {
  it('renders the store wordmark linking to /', () => {
    render(<Header />)
    const logo = screen.getByRole('link', { name: /The Garden Shop/i })
    expect(logo).toHaveAttribute('href', '/')
  })

  it('renders desktop nav link for Home', () => {
    render(<Header />)
    const homeLinks = screen.getAllByRole('link', { name: 'Home' })
    expect(homeLinks.length).toBeGreaterThanOrEqual(1)
  })

  it('renders desktop nav link for Products', () => {
    render(<Header />)
    expect(screen.getAllByRole('link', { name: 'Products' }).length).toBeGreaterThanOrEqual(1)
  })

  it('renders desktop nav link for Collections', () => {
    render(<Header />)
    expect(screen.getAllByRole('link', { name: 'Collections' }).length).toBeGreaterThanOrEqual(1)
  })

  it('renders desktop nav link for About', () => {
    render(<Header />)
    expect(screen.getAllByRole('link', { name: 'About' }).length).toBeGreaterThanOrEqual(1)
  })

  it('renders a cart button', () => {
    render(<Header />)
    expect(screen.getByRole('button', { name: /cart/i })).toBeInTheDocument()
  })

  it('renders the mobile menu button', () => {
    render(<Header />)
    expect(screen.getByRole('button', { name: /open.*menu/i })).toBeInTheDocument()
  })
})
