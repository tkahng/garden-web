import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { VerifyEmailPage } from './verify-email'

vi.mock('#/lib/api', () => ({
  authVerifyEmail: vi.fn(),
}))

import * as api from '#/lib/api'

describe('VerifyEmailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading state initially', () => {
    vi.mocked(api.authVerifyEmail).mockImplementation(
      () => new Promise(() => {}), // never resolves
    )
    render(<VerifyEmailPage token="tok" />)
    expect(screen.getByText(/verifying/i)).toBeInTheDocument()
  })

  it('shows success message after successful verification', async () => {
    vi.mocked(api.authVerifyEmail).mockResolvedValue(undefined)
    render(<VerifyEmailPage token="good-tok" />)
    await waitFor(() => expect(screen.getByText(/email verified/i)).toBeInTheDocument())
    expect(api.authVerifyEmail).toHaveBeenCalledWith('good-tok')
  })

  it('shows error message on failure', async () => {
    vi.mocked(api.authVerifyEmail).mockRejectedValue(new Error('HTTP 400'))
    render(<VerifyEmailPage token="bad-tok" />)
    await waitFor(() => expect(screen.getByText(/invalid or expired/i)).toBeInTheDocument())
  })

  it('shows a message when no token is provided', () => {
    render(<VerifyEmailPage token={null} />)
    expect(screen.getByText(/invalid or expired/i)).toBeInTheDocument()
  })
})
