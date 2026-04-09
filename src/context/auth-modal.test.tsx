import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AuthModalProvider, useAuthModal, type AuthTab } from './auth-modal'

function OpenButton({ tab }: { tab?: AuthTab }) {
  const { openAuthModal } = useAuthModal()
  return <button onClick={() => openAuthModal(tab)}>open</button>
}

function CloseButton() {
  const { closeAuthModal } = useAuthModal()
  return <button onClick={closeAuthModal}>close</button>
}

function Display() {
  const { isOpen, activeTab } = useAuthModal()
  return (
    <div>
      <span data-testid="is-open">{String(isOpen)}</span>
      <span data-testid="tab">{activeTab}</span>
    </div>
  )
}

function Harness({ tab }: { tab?: AuthTab }) {
  return (
    <AuthModalProvider>
      <Display />
      <OpenButton tab={tab} />
      <CloseButton />
    </AuthModalProvider>
  )
}

describe('AuthModalProvider', () => {
  it('starts closed with login tab', () => {
    render(<Harness />)
    expect(screen.getByTestId('is-open').textContent).toBe('false')
    expect(screen.getByTestId('tab').textContent).toBe('login')
  })

  it('openAuthModal with no arg defaults to login tab', () => {
    render(<Harness />)
    fireEvent.click(screen.getByText('open'))
    expect(screen.getByTestId('is-open').textContent).toBe('true')
    expect(screen.getByTestId('tab').textContent).toBe('login')
  })

  it('openAuthModal sets the specified tab', () => {
    render(<Harness tab="register" />)
    fireEvent.click(screen.getByText('open'))
    expect(screen.getByTestId('tab').textContent).toBe('register')
  })

  it('closeAuthModal sets isOpen to false', () => {
    render(<Harness />)
    fireEvent.click(screen.getByText('open'))
    fireEvent.click(screen.getByText('close'))
    expect(screen.getByTestId('is-open').textContent).toBe('false')
  })

  it('throws when used outside AuthModalProvider', () => {
    function Bad() { useAuthModal(); return null }
    expect(() => render(<Bad />)).toThrow('useAuthModal must be used within AuthModalProvider')
  })
})
