import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AddressesPage, { AddressSkeleton } from './addresses'

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (_config: unknown) => ({}),
}))

const mockAuthFetch = vi.fn()

vi.mock('#/context/auth', () => ({
  useAuth: () => ({ authFetch: mockAuthFetch }),
}))

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

beforeEach(() => {
  mockAuthFetch.mockReset()
})

describe('AddressSkeleton', () => {
  it('renders skeleton placeholders', () => {
    render(<AddressSkeleton />)
    expect(screen.getByTestId('address-skeleton')).toBeInTheDocument()
  })
})

describe('AddressesPage', () => {
  it('shows skeleton while loading', () => {
    mockAuthFetch.mockReturnValue(new Promise(() => {}))
    render(<AddressesPage />)
    expect(screen.getByTestId('address-skeleton')).toBeInTheDocument()
  })

  it('shows empty state when no addresses', async () => {
    mockAuthFetch.mockResolvedValue([])
    render(<AddressesPage />)
    await waitFor(() =>
      expect(screen.getByText(/no saved addresses/i)).toBeInTheDocument(),
    )
  })

  it('renders address cards with address details', async () => {
    mockAuthFetch.mockResolvedValue([mockAddress])
    render(<AddressesPage />)
    await waitFor(() => {
      expect(screen.getByText('123 Garden St')).toBeInTheDocument()
      expect(screen.getByText(/portland/i)).toBeInTheDocument()
    })
  })

  it('shows Default badge on default address', async () => {
    mockAuthFetch.mockResolvedValue([mockAddress])
    render(<AddressesPage />)
    await waitFor(() => expect(screen.getByText(/default/i)).toBeInTheDocument())
  })

  it('shows Add address button', async () => {
    mockAuthFetch.mockResolvedValue([])
    render(<AddressesPage />)
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /add address/i })).toBeInTheDocument(),
    )
  })

  it('shows address form when Add address is clicked', async () => {
    mockAuthFetch.mockResolvedValue([])
    render(<AddressesPage />)
    await waitFor(() => screen.getByRole('button', { name: /add address/i }))
    fireEvent.click(screen.getByRole('button', { name: /add address/i }))
    expect(screen.getByLabelText(/address line 1/i)).toBeInTheDocument()
  })

  it('calls createAddress on form submit', async () => {
    mockAuthFetch
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(mockAddress)
      .mockResolvedValueOnce([mockAddress])
    render(<AddressesPage />)
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
    render(<AddressesPage />)
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
