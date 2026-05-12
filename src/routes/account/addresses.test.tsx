import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { AddressesPage, AddressSkeleton } from './addresses'

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (_config: unknown) => ({}),
}))

const mockAuthFetch = { GET: vi.fn(), POST: vi.fn(), PUT: vi.fn(), DELETE: vi.fn(), PATCH: vi.fn() }

vi.mock('#/context/auth', () => ({
  useAuth: () => ({ authFetch: mockAuthFetch }),
}))

vi.mock('#/lib/account-api', () => ({
  listAddresses: vi.fn(),
  createAddress: vi.fn(),
  updateAddress: vi.fn(),
  deleteAddress: vi.fn(),
}))

import * as accountApi from '#/lib/account-api'

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
  vi.mocked(accountApi.listAddresses).mockResolvedValue([])
  vi.mocked(accountApi.createAddress).mockResolvedValue(mockAddress)
  vi.mocked(accountApi.updateAddress).mockResolvedValue(mockAddress)
  vi.mocked(accountApi.deleteAddress).mockResolvedValue(undefined as never)
})

describe('AddressSkeleton', () => {
  it('renders skeleton placeholders', () => {
    render(<AddressSkeleton />)
    expect(screen.getByTestId('address-skeleton')).toBeInTheDocument()
  })
})

describe('AddressesPage', () => {
  it('shows skeleton while loading', () => {
    vi.mocked(accountApi.listAddresses).mockReturnValue(new Promise(() => {}))
    render(<AddressesPage />)
    expect(screen.getByTestId('address-skeleton')).toBeInTheDocument()
  })

  it('shows empty state when no addresses', async () => {
    vi.mocked(accountApi.listAddresses).mockResolvedValue([])
    render(<AddressesPage />)
    await waitFor(() =>
      expect(screen.getByText(/no saved addresses/i)).toBeInTheDocument(),
    )
  })

  it('renders address cards with address details', async () => {
    vi.mocked(accountApi.listAddresses).mockResolvedValue([mockAddress])
    render(<AddressesPage />)
    await waitFor(() => {
      expect(screen.getByText('123 Garden St')).toBeInTheDocument()
      expect(screen.getByText(/portland/i)).toBeInTheDocument()
    })
  })

  it('shows Default badge on default address', async () => {
    vi.mocked(accountApi.listAddresses).mockResolvedValue([mockAddress])
    render(<AddressesPage />)
    await waitFor(() => expect(screen.getByText(/default/i)).toBeInTheDocument())
  })

  it('shows Add address button', async () => {
    render(<AddressesPage />)
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /add address/i })).toBeInTheDocument(),
    )
  })

  it('shows address form when Add address is clicked', async () => {
    render(<AddressesPage />)
    await waitFor(() => screen.getByRole('button', { name: /add address/i }))
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /add address/i }))
    })
    await waitFor(() => expect(screen.getByLabelText(/address line 1/i)).toBeInTheDocument())
  })

  it('calls createAddress on form submit', async () => {
    vi.mocked(accountApi.listAddresses)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([mockAddress])
    render(<AddressesPage />)
    await waitFor(() => screen.getByRole('button', { name: /add address/i }))
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /add address/i }))
    })

    await waitFor(() => screen.getByLabelText(/first name/i))
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Jane' } })
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Smith' } })
    fireEvent.change(screen.getByLabelText(/address line 1/i), {
      target: { value: '123 Garden St' },
    })
    fireEvent.change(screen.getByLabelText(/city/i), { target: { value: 'Portland' } })
    fireEvent.change(screen.getByLabelText(/zip/i), { target: { value: '97201' } })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /save address/i }))
    })

    await waitFor(() => expect(accountApi.createAddress).toHaveBeenCalled())
  })

  it('calls deleteAddress when Delete is confirmed', async () => {
    vi.mocked(accountApi.listAddresses)
      .mockResolvedValueOnce([mockAddress])
      .mockResolvedValueOnce([])
    render(<AddressesPage />)
    await waitFor(() => screen.getByText('123 Garden St'))

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /delete/i }))
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /confirm/i }))
    })

    await waitFor(() => expect(accountApi.deleteAddress).toHaveBeenCalledWith(
      expect.anything(),
      'addr-1',
    ))
  })
})
