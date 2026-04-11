import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CartPage, { CartItemRow, CartEmpty } from './index'

// Mock TanStack Router Link
vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, className }: { to: string; children: React.ReactNode; className?: string }) => (
    <a href={to} className={className}>{children}</a>
  ),
  createFileRoute: () => (_config: unknown) => ({}),
}))

// Cart context mock state
let mockCart: ReturnType<typeof buildCart> | null = null
let mockIsLoading = false
const mockRemoveItem = vi.fn()
const mockUpdateQuantity = vi.fn()
const mockAbandon = vi.fn()

vi.mock('#/context/cart', () => ({
  useCart: () => ({
    cart: mockCart,
    isLoading: mockIsLoading,
    itemCount: mockCart?.items?.reduce((s: number, i: { quantity?: number }) => s + (i.quantity ?? 0), 0) ?? 0,
    removeItem: mockRemoveItem,
    updateQuantity: mockUpdateQuantity,
    abandon: mockAbandon,
  }),
}))

function buildCart(overrides = {}) {
  return {
    id: 'cart-1',
    status: 'ACTIVE' as const,
    createdAt: '2026-04-10T00:00:00Z',
    items: [
      {
        id: 'item-1',
        variantId: 'v1',
        quantity: 2,
        unitPrice: 9.99,
        product: {
          productId: 'p1',
          productTitle: 'Tomato Seeds',
          variantTitle: 'Small Pack',
          imageUrl: 'https://cdn.example.com/tomato.jpg',
        },
      },
    ],
    ...overrides,
  }
}

beforeEach(() => {
  mockCart = null
  mockIsLoading = false
  mockRemoveItem.mockClear()
  mockUpdateQuantity.mockClear()
  mockAbandon.mockClear()
})

describe('CartEmpty', () => {
  it('renders empty state message', () => {
    render(<CartEmpty />)
    expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument()
  })

  it('renders a link to /products', () => {
    render(<CartEmpty />)
    const link = screen.getByRole('link', { name: /continue shopping/i })
    expect(link).toHaveAttribute('href', '/products')
  })
})

describe('CartItemRow', () => {
  const item = buildCart().items[0]

  it('renders product title and variant title', () => {
    render(
      <CartItemRow item={item} onRemove={vi.fn()} onUpdateQuantity={vi.fn()} />,
    )
    expect(screen.getByText('Tomato Seeds')).toBeInTheDocument()
    expect(screen.getByText('Small Pack')).toBeInTheDocument()
  })

  it('renders product image when imageUrl is present', () => {
    render(
      <CartItemRow item={item} onRemove={vi.fn()} onUpdateQuantity={vi.fn()} />,
    )
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', 'https://cdn.example.com/tomato.jpg')
  })

  it('renders a placeholder when imageUrl is null', () => {
    const itemNoImg = { ...item, product: { ...item.product, imageUrl: null } }
    render(
      <CartItemRow item={itemNoImg} onRemove={vi.fn()} onUpdateQuantity={vi.fn()} />,
    )
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByTestId('image-placeholder')).toBeInTheDocument()
  })

  it('renders quantity and unit price', () => {
    render(
      <CartItemRow item={item} onRemove={vi.fn()} onUpdateQuantity={vi.fn()} />,
    )
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('$9.99')).toBeInTheDocument()
  })

  it('renders the line total (unitPrice × quantity)', () => {
    render(
      <CartItemRow item={item} onRemove={vi.fn()} onUpdateQuantity={vi.fn()} />,
    )
    expect(screen.getByTestId('line-total')).toHaveTextContent('$19.98')
  })

  it('calls onUpdateQuantity with qty+1 when + button clicked', () => {
    const onUpdateQuantity = vi.fn()
    render(
      <CartItemRow item={item} onRemove={vi.fn()} onUpdateQuantity={onUpdateQuantity} />,
    )
    fireEvent.click(screen.getByRole('button', { name: /increase quantity/i }))
    expect(onUpdateQuantity).toHaveBeenCalledWith('item-1', 3)
  })

  it('calls onUpdateQuantity with qty-1 when - button clicked and qty > 1', () => {
    const onUpdateQuantity = vi.fn()
    render(
      <CartItemRow item={item} onRemove={vi.fn()} onUpdateQuantity={onUpdateQuantity} />,
    )
    fireEvent.click(screen.getByRole('button', { name: /decrease quantity/i }))
    expect(onUpdateQuantity).toHaveBeenCalledWith('item-1', 1)
  })

  it('disables - button when quantity is 1', () => {
    const itemQty1 = { ...item, quantity: 1 }
    render(
      <CartItemRow item={itemQty1} onRemove={vi.fn()} onUpdateQuantity={vi.fn()} />,
    )
    expect(screen.getByRole('button', { name: /decrease quantity/i })).toBeDisabled()
  })

  it('calls onRemove with itemId when remove button clicked', () => {
    const onRemove = vi.fn()
    render(
      <CartItemRow item={item} onRemove={onRemove} onUpdateQuantity={vi.fn()} />,
    )
    fireEvent.click(screen.getByRole('button', { name: /remove item/i }))
    expect(onRemove).toHaveBeenCalledWith('item-1')
  })
})

describe('CartPage', () => {
  it('renders loading skeleton when isLoading is true', () => {
    mockIsLoading = true
    render(<CartPage />)
    expect(screen.getByTestId('cart-loading')).toBeInTheDocument()
  })

  it('renders empty state when cart has no items', () => {
    mockCart = buildCart({ items: [] })
    render(<CartPage />)
    expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument()
  })

  it('renders empty state when cart is null', () => {
    mockCart = null
    render(<CartPage />)
    expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument()
  })

  it('renders cart items when cart has items', () => {
    mockCart = buildCart()
    render(<CartPage />)
    expect(screen.getByText('Tomato Seeds')).toBeInTheDocument()
  })

  it('renders the cart subtotal', () => {
    mockCart = buildCart()
    render(<CartPage />)
    expect(screen.getByTestId('cart-subtotal')).toHaveTextContent('$19.98')
  })

  it('calls abandon when Abandon cart button is clicked', () => {
    mockCart = buildCart()
    render(<CartPage />)
    fireEvent.click(screen.getByRole('button', { name: /abandon cart/i }))
    expect(mockAbandon).toHaveBeenCalled()
  })
})
