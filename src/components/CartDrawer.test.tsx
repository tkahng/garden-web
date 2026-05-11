import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CartDrawer } from './CartDrawer'

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    to,
    children,
    className,
    params,
  }: {
    to: string
    children: React.ReactNode
    className?: string
    params?: Record<string, string>
    [key: string]: unknown
  }) => {
    let href = to
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        href = href.replace(`$${key}`, value)
      })
    }
    return <a href={href} className={className}>{children}</a>
  },
  useNavigate: () => vi.fn(),
}))

vi.mock('#/components/ui/sheet', () => ({
  Sheet: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SheetTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SheetContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetHeader: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SheetTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  SheetDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  SheetClose: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('#/context/auth', () => ({ useAuth: () => ({ isAuthenticated: false }) }))
vi.mock('#/context/cart', () => ({ useCart: () => ({ cart: null, itemCount: 0 }) }))
vi.mock('#/context/guest-cart', () => ({
  useGuestCart: () => ({ cart: null, itemCount: 0, sessionId: 'session-123' }),
}))
vi.mock('#/components/GuestCheckoutDialog', () => ({
  GuestCheckoutDialog: () => null,
}))
vi.mock('@phosphor-icons/react', () => ({
  ShoppingBagIcon: () => <svg />,
}))

describe('CartDrawer', () => {
  it('empty cart shows Shop now link pointing to /products', () => {
    render(<CartDrawer />)
    const link = screen.getByRole('link', { name: /shop now/i })
    expect(link).toHaveAttribute('href', '/products')
  })
})
