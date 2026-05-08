import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (_config: unknown) => ({}),
}))

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const mockAuthFetch = { GET: vi.fn(), PUT: vi.fn() }
vi.mock('#/context/auth', () => ({
  useAuth: () => ({ authFetch: mockAuthFetch }),
}))

vi.mock('#/lib/account-api', () => ({
  getNotificationPreferences: vi.fn(),
  updateNotificationPreferences: vi.fn(),
}))

import * as accountApi from '#/lib/account-api'
import type { NotificationPreference } from '#/lib/account-api'
import { NotificationsPage } from './notifications'

const allEnabled: NotificationPreference[] = [
  { type: 'ORDER_CONFIRMATION', enabled: true },
  { type: 'ORDER_SHIPPED', enabled: true },
  { type: 'ORDER_DELIVERED', enabled: true },
  { type: 'ORDER_CANCELLED', enabled: true },
  { type: 'QUOTE_UPDATE', enabled: true },
  { type: 'MARKETING', enabled: true },
]

// NotificationsPage is not exported — grab the default export component from the route
function getPage() {
  // The route file exports NotificationsPage as the component
  return NotificationsPage
}

beforeEach(() => {
  vi.mocked(accountApi.getNotificationPreferences).mockResolvedValue(allEnabled)
  vi.mocked(accountApi.updateNotificationPreferences).mockResolvedValue(allEnabled)
})

describe('NotificationsPage', () => {
  it('shows skeleton while loading', () => {
    vi.mocked(accountApi.getNotificationPreferences).mockReturnValue(new Promise(() => {}))
    const Page = getPage()
    render(<Page />)
    expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
  })

  it('renders all six preference toggles after load', async () => {
    const Page = getPage()
    render(<Page />)
    await waitFor(() => expect(screen.getByText('Order confirmation')).toBeInTheDocument())
    expect(screen.getByText('Shipment notification')).toBeInTheDocument()
    expect(screen.getByText('Delivery confirmation')).toBeInTheDocument()
    expect(screen.getByText('Order cancellation')).toBeInTheDocument()
    expect(screen.getByText('Quote updates')).toBeInTheDocument()
    expect(screen.getByText('Marketing & promotions')).toBeInTheDocument()
  })

  it('all toggles start as enabled (aria-checked=true)', async () => {
    const Page = getPage()
    render(<Page />)
    await waitFor(() => expect(screen.getByText('Order confirmation')).toBeInTheDocument())
    const switches = screen.getAllByRole('switch')
    expect(switches).toHaveLength(6)
    switches.forEach((sw) => expect(sw).toHaveAttribute('aria-checked', 'true'))
  })

  it('clicking a toggle calls updateNotificationPreferences with toggled value', async () => {
    vi.mocked(accountApi.updateNotificationPreferences).mockResolvedValue([
      ...allEnabled.slice(0, 5),
      { type: 'MARKETING', enabled: false },
    ])

    const Page = getPage()
    render(<Page />)
    await waitFor(() => expect(screen.getByText('Marketing & promotions')).toBeInTheDocument())

    const switches = screen.getAllByRole('switch')
    const marketingSwitch = switches[5]
    fireEvent.click(marketingSwitch)

    await waitFor(() =>
      expect(vi.mocked(accountApi.updateNotificationPreferences)).toHaveBeenCalledWith(
        mockAuthFetch,
        { MARKETING: false },
      )
    )
  })

  it('optimistically unchecks the toggle immediately on click', async () => {
    let resolve: (v: NotificationPreference[]) => void
    vi.mocked(accountApi.updateNotificationPreferences).mockReturnValue(
      new Promise((r) => { resolve = r }),
    )

    const Page = getPage()
    render(<Page />)
    await waitFor(() => expect(screen.getAllByRole('switch')).toHaveLength(6))

    const marketingSwitch = screen.getAllByRole('switch')[5]
    expect(marketingSwitch).toHaveAttribute('aria-checked', 'true')

    act(() => { fireEvent.click(marketingSwitch) })

    expect(marketingSwitch).toHaveAttribute('aria-checked', 'false')

    resolve!([...allEnabled.slice(0, 5), { type: 'MARKETING', enabled: false }])
  })

  it('rolls back on API failure', async () => {
    vi.mocked(accountApi.updateNotificationPreferences).mockRejectedValue(new Error('Server error'))

    const Page = getPage()
    render(<Page />)
    await waitFor(() => expect(screen.getAllByRole('switch')).toHaveLength(6))

    const marketingSwitch = screen.getAllByRole('switch')[5]
    fireEvent.click(marketingSwitch)

    await waitFor(() => expect(marketingSwitch).toHaveAttribute('aria-checked', 'true'))
  })
})
