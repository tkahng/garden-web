// src/context/cart.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { CartProvider, useCart } from './cart'

let mockIsAuthenticated = false

// Mock auth context — authFetch just needs to look like an ApiClient
vi.mock('#/context/auth', () => ({
  useAuth: () => ({
    isAuthenticated: mockIsAuthenticated,
    authFetch: { GET: vi.fn(), POST: vi.fn(), PUT: vi.fn(), DELETE: vi.fn(), PATCH: vi.fn() },
  }),
}))

// Mock cart-api functions so we control return values per test
vi.mock('#/lib/cart-api', () => ({
  getCart: vi.fn(),
  addCartItem: vi.fn(),
  updateCartItem: vi.fn(),
  removeCartItem: vi.fn(),
  abandonCart: vi.fn(),
  validateDiscount: vi.fn(),
  checkout: vi.fn(),
}))

import * as cartApi from '#/lib/cart-api'

const mockCart = {
  id: 'cart-1',
  status: 'ACTIVE' as const,
  items: [
    {
      id: 'item-1',
      variantId: 'v1',
      quantity: 2,
      unitPrice: 9.99,
      product: { productId: 'p1', productTitle: 'Tomato Seeds', variantTitle: 'Small', imageUrl: undefined },
    },
  ],
  createdAt: '2026-04-10T00:00:00Z',
}

function Display() {
  const { cart, isLoading, error, itemCount } = useCart()
  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="item-count">{itemCount}</span>
      <span data-testid="cart-id">{cart?.id ?? 'none'}</span>
      <span data-testid="error">{error ?? ''}</span>
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
  vi.mocked(cartApi.getCart).mockResolvedValue(mockCart)
  vi.mocked(cartApi.addCartItem).mockResolvedValue({ ...mockCart, id: 'cart-updated' })
  vi.mocked(cartApi.updateCartItem).mockResolvedValue({
    ...mockCart,
    items: [{ ...mockCart.items[0], quantity: 5 }],
  })
  vi.mocked(cartApi.removeCartItem).mockResolvedValue({ ...mockCart, items: [] })
  vi.mocked(cartApi.abandonCart).mockResolvedValue(undefined as never)
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

  it('addItem calls addCartItem and updates cart', async () => {
    mockIsAuthenticated = true
    await act(async () => { render(<Harness />) })
    await act(async () => { screen.getByText('add').click() })
    expect(cartApi.addCartItem).toHaveBeenCalled()
    expect(screen.getByTestId('cart-id').textContent).toBe('cart-updated')
  })

  it('removeItem calls removeCartItem and updates cart', async () => {
    mockIsAuthenticated = true
    await act(async () => { render(<Harness />) })
    await act(async () => { screen.getByText('remove').click() })
    expect(cartApi.removeCartItem).toHaveBeenCalled()
    expect(screen.getByTestId('item-count').textContent).toBe('0')
  })

  it('updateQuantity calls updateCartItem and updates cart', async () => {
    mockIsAuthenticated = true
    await act(async () => { render(<Harness />) })
    await act(async () => { screen.getByText('update').click() })
    expect(cartApi.updateCartItem).toHaveBeenCalled()
    expect(screen.getByTestId('item-count').textContent).toBe('5')
  })

  it('abandon calls abandonCart and clears cart', async () => {
    mockIsAuthenticated = true
    await act(async () => { render(<Harness />) })
    await act(async () => { screen.getByText('abandon').click() })
    expect(cartApi.abandonCart).toHaveBeenCalled()
    expect(screen.getByTestId('cart-id').textContent).toBe('none')
  })

  it('sets cart to null and stops loading when fetch fails', async () => {
    mockIsAuthenticated = true
    vi.mocked(cartApi.getCart).mockRejectedValue(new Error('Network error'))

    await act(async () => { render(<Harness />) })

    expect(screen.getByTestId('cart-id').textContent).toBe('none')
    expect(screen.getByTestId('loading').textContent).toBe('false')
  })

  it('addItem sets error when api fails', async () => {
    mockIsAuthenticated = true
    vi.mocked(cartApi.addCartItem).mockRejectedValue(new Error('Out of stock'))
    await act(async () => { render(<Harness />) })
    await act(async () => { screen.getByText('add').click() })
    expect(screen.getByTestId('error').textContent).toBe('Out of stock')
  })

  it('removeItem sets error when api fails', async () => {
    mockIsAuthenticated = true
    vi.mocked(cartApi.removeCartItem).mockRejectedValue(new Error('Not found'))
    await act(async () => { render(<Harness />) })
    await act(async () => { screen.getByText('remove').click() })
    expect(screen.getByTestId('error').textContent).toBe('Not found')
  })

  it('updateQuantity sets error when api fails', async () => {
    mockIsAuthenticated = true
    vi.mocked(cartApi.updateCartItem).mockRejectedValue(new Error('Invalid quantity'))
    await act(async () => { render(<Harness />) })
    await act(async () => { screen.getByText('update').click() })
    expect(screen.getByTestId('error').textContent).toBe('Invalid quantity')
  })

  it('error clears on next successful operation', async () => {
    mockIsAuthenticated = true
    vi.mocked(cartApi.addCartItem)
      .mockRejectedValueOnce(new Error('Out of stock'))
      .mockResolvedValueOnce({ ...mockCart, id: 'cart-updated' })
    await act(async () => { render(<Harness />) })
    await act(async () => { screen.getByText('add').click() })
    expect(screen.getByTestId('error').textContent).toBe('Out of stock')
    await act(async () => { screen.getByText('add').click() })
    expect(screen.getByTestId('error').textContent).toBe('')
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
