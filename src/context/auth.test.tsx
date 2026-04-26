import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { AuthModalProvider } from './auth-modal'
import { AuthProvider, useAuth } from './auth'

import * as api from '#/lib/api'

const mockApiClient = {
  GET: vi.fn(),
  POST: vi.fn(),
  PUT: vi.fn(),
  DELETE: vi.fn(),
  PATCH: vi.fn(),
}

// Stub api module
vi.mock('#/lib/api', () => ({
  authLogin: vi.fn(),
  authRegister: vi.fn(),
  authLogout: vi.fn(),
  authRefresh: vi.fn(),
  getAccount: vi.fn(),
  createAuthClient: vi.fn(() => mockApiClient),
}))

const STORAGE_KEY = 'garden:auth'

function Harness() {
  return (
    <AuthModalProvider>
      <AuthProvider>
        <Display />
      </AuthProvider>
    </AuthModalProvider>
  )
}

function Display() {
  const { user, isAuthenticated } = useAuth()
  return (
    <div>
      <span data-testid="authenticated">{String(isAuthenticated)}</span>
      <span data-testid="email">{user?.email ?? 'none'}</span>
    </div>
  )
}

function LoginButton() {
  const { login } = useAuth()
  return <button onClick={() => login('a@b.com', 'pass')}>login</button>
}

function LogoutButton() {
  const { logout } = useAuth()
  return <button onClick={() => logout()}>logout</button>
}

function RegisterButton() {
  const { register } = useAuth()
  return <button onClick={() => register('a@b.com', 'pass', 'Jane', 'Doe')}>register</button>
}

function FullHarness() {
  return (
    <AuthModalProvider>
      <AuthProvider>
        <Display />
        <LoginButton />
        <LogoutButton />
        <RegisterButton />
      </AuthProvider>
    </AuthModalProvider>
  )
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('AuthProvider', () => {
  it('starts unauthenticated when localStorage is empty', () => {
    render(<Harness />)
    expect(screen.getByTestId('authenticated').textContent).toBe('false')
    expect(screen.getByTestId('email').textContent).toBe('none')
  })

  it('login calls authLogin + getAccount and sets user', async () => {
    vi.mocked(api.authLogin).mockResolvedValue({ accessToken: 'acc', refreshToken: 'ref' })
    vi.mocked(api.getAccount).mockResolvedValue({
      id: 'u1', email: 'a@b.com', firstName: 'Jane', lastName: 'Doe', phone: null, status: 'ACTIVE',
    })

    render(<FullHarness />)

    await act(async () => {
      screen.getByText('login').click()
    })

    expect(api.authLogin).toHaveBeenCalledWith('a@b.com', 'pass')
    expect(api.getAccount).toHaveBeenCalledWith('acc')
    expect(screen.getByTestId('authenticated').textContent).toBe('true')
    expect(screen.getByTestId('email').textContent).toBe('a@b.com')
  })

  it('login persists tokens to localStorage', async () => {
    vi.mocked(api.authLogin).mockResolvedValue({ accessToken: 'acc', refreshToken: 'ref' })
    vi.mocked(api.getAccount).mockResolvedValue({
      id: 'u1', email: 'a@b.com', firstName: 'Jane', lastName: 'Doe', phone: null, status: 'ACTIVE',
    })

    render(<FullHarness />)

    await act(async () => {
      screen.getByText('login').click()
    })

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    expect(stored.accessToken).toBe('acc')
    expect(stored.refreshToken).toBe('ref')
    expect(stored.user.email).toBe('a@b.com')
  })

  it('logout clears user and localStorage', async () => {
    vi.mocked(api.authLogin).mockResolvedValue({ accessToken: 'acc', refreshToken: 'ref' })
    vi.mocked(api.getAccount).mockResolvedValue({
      id: 'u1', email: 'a@b.com', firstName: 'Jane', lastName: 'Doe', phone: null, status: 'ACTIVE',
    })
    vi.mocked(api.authLogout).mockResolvedValue(undefined)

    render(<FullHarness />)

    await act(async () => { screen.getByText('login').click() })
    await act(async () => { screen.getByText('logout').click() })

    expect(screen.getByTestId('authenticated').textContent).toBe('false')
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('rehydrates from localStorage on mount', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      user: { id: 'u2', email: 'b@c.com', firstName: 'Bob', lastName: 'Smith', phone: null, status: 'ACTIVE' },
      accessToken: 'stored-acc',
      refreshToken: 'stored-ref',
    }))

    render(<Harness />)

    expect(screen.getByTestId('authenticated').textContent).toBe('true')
    expect(screen.getByTestId('email').textContent).toBe('b@c.com')
  })

  it('register calls authRegister + getAccount and sets user', async () => {
    vi.mocked(api.authRegister).mockResolvedValue({ accessToken: 'acc', refreshToken: 'ref' })
    vi.mocked(api.getAccount).mockResolvedValue({
      id: 'u1', email: 'a@b.com', firstName: 'Jane', lastName: 'Doe', phone: null, status: 'UNVERIFIED',
    })

    render(<FullHarness />)

    await act(async () => {
      screen.getByText('register').click()
    })

    expect(api.authRegister).toHaveBeenCalledWith('a@b.com', 'pass', 'Jane', 'Doe')
    expect(screen.getByTestId('authenticated').textContent).toBe('true')
  })

  function RefreshButton() {
    const { refreshTokens } = useAuth()
    return <button onClick={() => refreshTokens()}>refresh</button>
  }

  function RefreshHarness() {
    return (
      <AuthModalProvider>
        <AuthProvider>
          <Display />
          <RefreshButton />
        </AuthProvider>
      </AuthModalProvider>
    )
  }

  it('stays unauthenticated when login fails', async () => {
    vi.mocked(api.authLogin).mockRejectedValue(new Error('HTTP 401'))

    let capturedLogin!: (email: string, password: string) => Promise<void>
    function LoginCapture() {
      const { login } = useAuth()
      capturedLogin = login
      return null
    }
    function FailHarness() {
      return (
        <AuthModalProvider>
          <AuthProvider>
            <Display />
            <LoginCapture />
          </AuthProvider>
        </AuthModalProvider>
      )
    }

    render(<FailHarness />)

    await act(async () => {
      await capturedLogin('a@b.com', 'pass').catch(() => {
        // HTTP 401 is expected; state should remain unauthenticated
      })
    })

    expect(screen.getByTestId('authenticated').textContent).toBe('false')
    expect(screen.getByTestId('email').textContent).toBe('none')
  })

  it('refreshTokens updates tokens in state and localStorage', async () => {
    localStorage.setItem('garden:auth', JSON.stringify({
      user: { id: 'u1', email: 'a@b.com', firstName: 'Jane', lastName: 'Doe', phone: null, status: 'ACTIVE' },
      accessToken: 'old-acc',
      refreshToken: 'old-ref',
    }))
    vi.mocked(api.authRefresh).mockResolvedValue({ accessToken: 'new-acc', refreshToken: 'new-ref' })

    render(<RefreshHarness />)

    await act(async () => { screen.getByText('refresh').click() })

    const stored = JSON.parse(localStorage.getItem('garden:auth')!)
    expect(stored.accessToken).toBe('new-acc')
    expect(stored.refreshToken).toBe('new-ref')
    // user is preserved
    expect(stored.user.email).toBe('a@b.com')
  })
})
