import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import {
  AccountPage,
  ProfileTab,
  ProfileSkeleton,
  AddressesTab,
  AddressSkeleton,
  OrdersTab,
  OrderSkeleton,
} from './index'

// ─── Router mock ─────────────────────────────────────────────────────────────

const mockNavigate = vi.fn()
let mockSearch: { tab: string } = { tab: 'profile' }

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (_config: unknown) => ({}),
  useNavigate: () => mockNavigate,
  useSearch: () => mockSearch,
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}))

// Mock Radix Tabs so onValueChange fires on click in jsdom
let _tabsOnValueChange: ((v: string) => void) | undefined
vi.mock('#/components/ui/tabs', () => ({
  Tabs: ({
    children,
    onValueChange,
  }: {
    children: React.ReactNode
    value?: string
    onValueChange?: (v: string) => void
  }) => {
    _tabsOnValueChange = onValueChange
    return <div>{children}</div>
  },
  TabsList: ({ children }: { children: React.ReactNode }) => (
    <div role="tablist">{children}</div>
  ),
  TabsTrigger: ({ value, children }: { value: string; children: React.ReactNode }) => (
    <button role="tab" onClick={() => _tabsOnValueChange?.(value)}>
      {children}
    </button>
  ),
  TabsContent: ({ value, children }: { value: string; children: React.ReactNode }) => (
    <div data-tab-content={value}>{children}</div>
  ),
}))

// ─── Auth context mock ────────────────────────────────────────────────────────

let mockIsAuthenticated = true
const mockAuthFetch = vi.fn()

vi.mock('#/context/auth', () => ({
  useAuth: () => ({
    isAuthenticated: mockIsAuthenticated,
    authFetch: mockAuthFetch,
  }),
}))

// ─── Auth modal context mock ──────────────────────────────────────────────────

const mockOpenAuthModal = vi.fn()

vi.mock('#/context/auth-modal', () => ({
  useAuthModal: () => ({ openAuthModal: mockOpenAuthModal }),
}))

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockAccount = {
  id: 'user-1',
  email: 'user@example.com',
  firstName: 'Jane',
  lastName: 'Smith',
  phone: '555-1234',
  status: 'ACTIVE' as const,
  emailVerifiedAt: '2026-01-01T00:00:00Z',
}

const mockAddress = {
  id: 'addr-1',
  firstName: 'Jane',
  lastName: 'Smith',
  address1: '123 Garden St',
  city: 'Portland',
  province: 'OR',
  zip: '97201',
  country: 'US',
  isDefault: true,
}

const mockOrder = {
  id: 'order-1',
  userId: 'user-1',
  status: 'PAID' as const,
  totalAmount: 29.99,
  currency: 'USD',
  stripeSessionId: 'sess_1',
  items: [
    {
      id: 'item-1',
      variantId: 'v-1',
      quantity: 2,
      unitPrice: 14.99,
      product: {
        productId: 'p-1',
        productTitle: 'Tomato Seeds',
        variantTitle: 'Small Pack',
        imageUrl: 'https://cdn.example.com/tomato.jpg',
      },
    },
  ],
  createdAt: '2026-04-01T00:00:00Z',
}

const mockPendingOrder = {
  ...mockOrder,
  id: 'order-2',
  status: 'PENDING_PAYMENT' as const,
}

beforeEach(() => {
  mockIsAuthenticated = true
  mockSearch = { tab: 'profile' }
  mockNavigate.mockReset()
  mockOpenAuthModal.mockReset()
  mockAuthFetch.mockReset()
})

// ─── Auth guard ───────────────────────────────────────────────────────────────

describe('AccountPage auth guard', () => {
  it('redirects to / and opens login modal when not authenticated', () => {
    mockIsAuthenticated = false
    render(<AccountPage />)
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/' })
    expect(mockOpenAuthModal).toHaveBeenCalledWith('login')
  })

  it('does not redirect when authenticated', () => {
    mockAuthFetch.mockResolvedValue(mockAccount)
    render(<AccountPage />)
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})

// ─── Tab navigation ───────────────────────────────────────────────────────────

describe('AccountPage tab navigation', () => {
  it('renders Profile, Addresses, and Orders tabs', () => {
    mockAuthFetch.mockResolvedValue(mockAccount)
    render(<AccountPage />)
    expect(screen.getByRole('tab', { name: /profile/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /addresses/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /orders/i })).toBeInTheDocument()
  })

  it('navigates to addresses tab on click', () => {
    mockAuthFetch.mockResolvedValue(mockAccount)
    render(<AccountPage />)
    fireEvent.click(screen.getByRole('tab', { name: /addresses/i }))
    expect(mockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({ search: expect.any(Function) }),
    )
  })
})

// ─── ProfileSkeleton ──────────────────────────────────────────────────────────

describe('ProfileSkeleton', () => {
  it('renders skeleton placeholders', () => {
    render(<ProfileSkeleton />)
    expect(screen.getByTestId('profile-skeleton')).toBeInTheDocument()
  })
})

// ─── ProfileTab ───────────────────────────────────────────────────────────────

describe('ProfileTab', () => {
  it('shows loading skeleton while fetching', () => {
    mockAuthFetch.mockReturnValue(new Promise(() => {}))
    render(<ProfileTab authFetch={mockAuthFetch} />)
    expect(screen.getByTestId('profile-skeleton')).toBeInTheDocument()
  })

  it('shows email as read-only after load', async () => {
    mockAuthFetch.mockResolvedValue(mockAccount)
    render(<ProfileTab authFetch={mockAuthFetch} />)
    await waitFor(() => expect(screen.getByText('user@example.com')).toBeInTheDocument())
  })

  it('shows ACTIVE status badge', async () => {
    mockAuthFetch.mockResolvedValue(mockAccount)
    render(<ProfileTab authFetch={mockAuthFetch} />)
    await waitFor(() => expect(screen.getByText(/active/i)).toBeInTheDocument())
  })

  it('pre-fills first name and last name fields', async () => {
    mockAuthFetch.mockResolvedValue(mockAccount)
    render(<ProfileTab authFetch={mockAuthFetch} />)
    await waitFor(() => {
      expect(screen.getByDisplayValue('Jane')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Smith')).toBeInTheDocument()
    })
  })

  it('calls updateAccount on save', async () => {
    mockAuthFetch
      .mockResolvedValueOnce(mockAccount)
      .mockResolvedValueOnce({ ...mockAccount, firstName: 'Janet' })
    render(<ProfileTab authFetch={mockAuthFetch} />)
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

  it('shows error message on save failure', async () => {
    mockAuthFetch
      .mockResolvedValueOnce(mockAccount)
      .mockRejectedValueOnce(new Error('HTTP 500'))
    render(<ProfileTab authFetch={mockAuthFetch} />)
    await waitFor(() => screen.getByDisplayValue('Jane'))

    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => expect(screen.getByText(/failed to save/i)).toBeInTheDocument())
  })
})

// ─── AddressSkeleton ──────────────────────────────────────────────────────────

describe('AddressSkeleton', () => {
  it('renders skeleton placeholders', () => {
    render(<AddressSkeleton />)
    expect(screen.getByTestId('address-skeleton')).toBeInTheDocument()
  })
})

// ─── AddressesTab ─────────────────────────────────────────────────────────────

describe('AddressesTab', () => {
  it('shows skeleton while loading', () => {
    mockAuthFetch.mockReturnValue(new Promise(() => {}))
    render(<AddressesTab authFetch={mockAuthFetch} />)
    expect(screen.getByTestId('address-skeleton')).toBeInTheDocument()
  })

  it('shows empty state when no addresses', async () => {
    mockAuthFetch.mockResolvedValue([])
    render(<AddressesTab authFetch={mockAuthFetch} />)
    await waitFor(() =>
      expect(screen.getByText(/no saved addresses/i)).toBeInTheDocument(),
    )
  })

  it('renders address cards with address details', async () => {
    mockAuthFetch.mockResolvedValue([mockAddress])
    render(<AddressesTab authFetch={mockAuthFetch} />)
    await waitFor(() => {
      expect(screen.getByText('123 Garden St')).toBeInTheDocument()
      expect(screen.getByText(/portland/i)).toBeInTheDocument()
    })
  })

  it('shows Default badge on default address', async () => {
    mockAuthFetch.mockResolvedValue([mockAddress])
    render(<AddressesTab authFetch={mockAuthFetch} />)
    await waitFor(() => expect(screen.getByText(/default/i)).toBeInTheDocument())
  })

  it('shows Add address button', async () => {
    mockAuthFetch.mockResolvedValue([])
    render(<AddressesTab authFetch={mockAuthFetch} />)
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /add address/i })).toBeInTheDocument(),
    )
  })

  it('shows address form when Add address is clicked', async () => {
    mockAuthFetch.mockResolvedValue([])
    render(<AddressesTab authFetch={mockAuthFetch} />)
    await waitFor(() => screen.getByRole('button', { name: /add address/i }))
    fireEvent.click(screen.getByRole('button', { name: /add address/i }))
    expect(screen.getByLabelText(/address line 1/i)).toBeInTheDocument()
  })

  it('calls createAddress on form submit', async () => {
    mockAuthFetch
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(mockAddress)
      .mockResolvedValueOnce([mockAddress])
    render(<AddressesTab authFetch={mockAuthFetch} />)
    await waitFor(() => screen.getByRole('button', { name: /add address/i }))
    fireEvent.click(screen.getByRole('button', { name: /add address/i }))

    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Jane' } })
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Smith' } })
    fireEvent.change(screen.getByLabelText(/address line 1/i), {
      target: { value: '123 Garden St' },
    })
    fireEvent.change(screen.getByLabelText(/city/i), { target: { value: 'Portland' } })
    fireEvent.change(screen.getByLabelText(/zip/i), { target: { value: '97201' } })
    fireEvent.change(screen.getByLabelText(/country/i), { target: { value: 'US' } })

    fireEvent.click(screen.getByRole('button', { name: /save address/i }))

    await waitFor(() =>
      expect(mockAuthFetch).toHaveBeenCalledWith(
        '/api/v1/account/addresses',
        expect.objectContaining({ method: 'POST' }),
      ),
    )
  })

  it('calls deleteAddress when Delete is confirmed', async () => {
    mockAuthFetch
      .mockResolvedValueOnce([mockAddress])
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce([])
    render(<AddressesTab authFetch={mockAuthFetch} />)
    await waitFor(() => screen.getByText('123 Garden St'))

    fireEvent.click(screen.getByRole('button', { name: /delete/i }))
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }))

    await waitFor(() =>
      expect(mockAuthFetch).toHaveBeenCalledWith(
        '/api/v1/account/addresses/addr-1',
        { method: 'DELETE' },
      ),
    )
  })
})

// ─── OrderSkeleton ────────────────────────────────────────────────────────────

describe('OrderSkeleton', () => {
  it('renders skeleton placeholders', () => {
    render(<OrderSkeleton />)
    expect(screen.getByTestId('order-skeleton')).toBeInTheDocument()
  })
})

// ─── OrdersTab ────────────────────────────────────────────────────────────────

describe('OrdersTab', () => {
  it('shows skeleton while loading', () => {
    mockAuthFetch.mockReturnValue(new Promise(() => {}))
    render(<OrdersTab authFetch={mockAuthFetch} />)
    expect(screen.getByTestId('order-skeleton')).toBeInTheDocument()
  })

  it('shows empty state when no orders', async () => {
    mockAuthFetch.mockResolvedValue({
      content: [],
      meta: { page: 0, pageSize: 10, total: 0 },
    })
    render(<OrdersTab authFetch={mockAuthFetch} />)
    await waitFor(() => expect(screen.getByText(/no orders yet/i)).toBeInTheDocument())
  })

  it('renders order rows with id, date, status, and total', async () => {
    mockAuthFetch.mockResolvedValue({
      content: [mockOrder],
      meta: { page: 0, pageSize: 10, total: 1 },
    })
    render(<OrdersTab authFetch={mockAuthFetch} />)
    await waitFor(() => {
      expect(screen.getByText(/order-1/i)).toBeInTheDocument()
      expect(screen.getByText(/paid/i)).toBeInTheDocument()
      expect(screen.getByText(/\$29\.99/i)).toBeInTheDocument()
    })
  })

  it('shows order items on row expand', async () => {
    mockAuthFetch.mockResolvedValue({
      content: [mockOrder],
      meta: { page: 0, pageSize: 10, total: 1 },
    })
    render(<OrdersTab authFetch={mockAuthFetch} />)
    await waitFor(() => screen.getByText(/order-1/i))

    fireEvent.click(screen.getByText(/order-1/i))

    expect(screen.getByText('Tomato Seeds')).toBeInTheDocument()
    expect(screen.getByText('Small Pack')).toBeInTheDocument()
  })

  it('shows Cancel button only for PENDING_PAYMENT orders', async () => {
    mockAuthFetch.mockResolvedValue({
      content: [mockPendingOrder],
      meta: { page: 0, pageSize: 10, total: 1 },
    })
    render(<OrdersTab authFetch={mockAuthFetch} />)
    await waitFor(() => screen.getByText(/order-2/i))
    fireEvent.click(screen.getByText(/order-2/i))
    expect(screen.getByRole('button', { name: /cancel order/i })).toBeInTheDocument()
  })

  it('does not show Cancel button for PAID orders', async () => {
    mockAuthFetch.mockResolvedValue({
      content: [mockOrder],
      meta: { page: 0, pageSize: 10, total: 1 },
    })
    render(<OrdersTab authFetch={mockAuthFetch} />)
    await waitFor(() => screen.getByText(/order-1/i))
    fireEvent.click(screen.getByText(/order-1/i))
    expect(screen.queryByRole('button', { name: /cancel order/i })).not.toBeInTheDocument()
  })

  it('calls cancelOrder and updates status on cancel', async () => {
    const cancelled = { ...mockPendingOrder, status: 'CANCELLED' as const }
    mockAuthFetch
      .mockResolvedValueOnce({
        content: [mockPendingOrder],
        meta: { page: 0, pageSize: 10, total: 1 },
      })
      .mockResolvedValueOnce(cancelled)
    render(<OrdersTab authFetch={mockAuthFetch} />)
    await waitFor(() => screen.getByText(/order-2/i))
    fireEvent.click(screen.getByText(/order-2/i))
    fireEvent.click(screen.getByRole('button', { name: /cancel order/i }))

    await waitFor(() =>
      expect(mockAuthFetch).toHaveBeenCalledWith(
        '/api/v1/storefront/orders/order-2/cancel',
        { method: 'PUT' },
      ),
    )
  })

  it('shows Load more button when more pages exist', async () => {
    mockAuthFetch.mockResolvedValue({
      content: [mockOrder],
      meta: { page: 0, pageSize: 10, total: 20 },
    })
    render(<OrdersTab authFetch={mockAuthFetch} />)
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /load more/i })).toBeInTheDocument(),
    )
  })

  it('does not show Load more when on last page', async () => {
    mockAuthFetch.mockResolvedValue({
      content: [mockOrder],
      meta: { page: 0, pageSize: 10, total: 1 },
    })
    render(<OrdersTab authFetch={mockAuthFetch} />)
    await waitFor(() => screen.getByText(/order-1/i))
    expect(screen.queryByRole('button', { name: /load more/i })).not.toBeInTheDocument()
  })
})
