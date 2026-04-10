// src/context/cart.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { CartProvider, useCart } from './cart'

let mockIsAuthenticated = false
let mockGetCart: ReturnType<typeof vi.fn>
let mockAddCartItem: ReturnType<typeof vi.fn>
let mockUpdateCartItem: ReturnType<typeof vi.fn>
let mockRemoveCartItem: ReturnType<typeof vi.fn>
let mockAbandonCart: ReturnType<typeof vi.fn>

vi.mock('#/context/auth', () => ({
  useAuth: () => ({
    isAuthenticated: mockIsAuthenticated,
    authFetch: vi.fn().mockImplementation((path: string, init?: RequestInit) => {
      const method = (init?.method ?? 'GET').toUpperCase()
      if (method === 'GET') return mockGetCart()
      if (method === 'POST') return mockAddCartItem()
      if (method === 'DELETE' && path.startsWith('/api/v1/cart/items/')) return mockRemoveCartItem()
      if (method === 'PUT') return mockUpdateCartItem()
      if (method === 'DELETE') return mockAbandonCart()
      return Promise.resolve(null)
    }),
  }),
}))

const mockCart = {
  id: 'cart-1',
  status: 'ACTIVE' as const,
  items: [
    {
      id: 'item-1',
      variantId: 'v1',
      quantity: 2,
      unitPrice: 9.99,
      product: { productId: 'p1', productTitle: 'Tomato Seeds', variantTitle: 'Small', imageUrl: null },
    },
  ],
  createdAt: '2026-04-10T00:00:00Z',
}

function Display() {
  const { cart, isLoading, itemCount } = useCart()
  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="item-count">{itemCount}</span>
      <span data-testid="cart-id">{cart?.id ?? 'none'}</span>
    </div>
  )
}

function AddButton() {
  const { addItem } = useCart()
  return <button onClick={() => addItem('v1', 1)}>add</button>
}

function RemoveButton() {
  const { removeItem } = useCart()
  return <button onClick={() => removeItem('item-1')}>remove</button>
}

function UpdateButton() {
  const { updateQuantity } = useCart()
  return <button onClick={() => updateQuantity('item-1', 5)}>update</button>
}

function AbandonButton() {
  const { abandon } = useCart()
  return <button onClick={() => abandon()}>abandon</button>
}

function Harness() {
  return (
    <CartProvider>
      <Display />
      <AddButton />
      <RemoveButton />
      <UpdateButton />
      <AbandonButton />
    </CartProvider>
  )
}

beforeEach(() => {
  mockIsAuthenticated = false
  mockGetCart = vi.fn().mockResolvedValue(mockCart)
  mockAddCartItem = vi.fn().mockResolvedValue({ ...mockCart, id: 'cart-updated' })
  mockUpdateCartItem = vi.fn().mockResolvedValue({ ...mockCart, items: [{ ...mockCart.items[0], quantity: 5 }] })
  mockRemoveCartItem = vi.fn().mockResolvedValue({ ...mockCart, items: [] })
  mockAbandonCart = vi.fn().mockResolvedValue(undefined)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('CartProvider', () => {
  it('starts with null cart and not loading when unauthenticated', () => {
    render(<Harness />)
    expect(screen.getByTestId('cart-id').textContent).toBe('none')
    expect(screen.getByTestId('loading').textContent).toBe('false')
    expect(screen.getByTestId('item-count').textContent).toBe('0')
  })

  it('fetches cart on mount when authenticated', async () => {
    mockIsAuthenticated = true
    await act(async () => { render(<Harness />) })
    expect(screen.getByTestId('cart-id').textContent).toBe('cart-1')
  })

  it('computes itemCount as sum of item quantities', async () => {
    mockIsAuthenticated = true
    await act(async () => { render(<Harness />) })
    expect(screen.getByTestId('item-count').textContent).toBe('2')
  })

  it('addItem calls authFetch POST and updates cart', async () => {
    mockIsAuthenticated = true
    await act(async () => { render(<Harness />) })
    await act(async () => { screen.getByText('add').click() })
    expect(mockAddCartItem).toHaveBeenCalled()
    expect(screen.getByTestId('cart-id').textContent).toBe('cart-updated')
  })

  it('removeItem calls authFetch DELETE and updates cart', async () => {
    mockIsAuthenticated = true
    await act(async () => { render(<Harness />) })
    await act(async () => { screen.getByText('remove').click() })
    expect(mockRemoveCartItem).toHaveBeenCalled()
    expect(screen.getByTestId('item-count').textContent).toBe('0')
  })

  it('updateQuantity calls authFetch PUT and updates cart', async () => {
    mockIsAuthenticated = true
    await act(async () => { render(<Harness />) })
    await act(async () => { screen.getByText('update').click() })
    expect(mockUpdateCartItem).toHaveBeenCalled()
    expect(screen.getByTestId('item-count').textContent).toBe('5')
  })

  it('abandon calls authFetch DELETE on /api/v1/cart and clears cart', async () => {
    mockIsAuthenticated = true
    await act(async () => { render(<Harness />) })
    await act(async () => { screen.getByText('abandon').click() })
    expect(mockAbandonCart).toHaveBeenCalled()
    expect(screen.getByTestId('cart-id').textContent).toBe('none')
  })

  it('clears cart when user logs out', async () => {
    mockIsAuthenticated = true
    const { rerender } = await act(async () => render(<Harness />))
    expect(screen.getByTestId('cart-id').textContent).toBe('cart-1')

    mockIsAuthenticated = false
    await act(async () => { rerender(<Harness />) })
    expect(screen.getByTestId('cart-id').textContent).toBe('none')
  })
})
