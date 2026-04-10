import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

export type AuthTab = 'login' | 'register' | 'forgot-password' | 'verify-email'

interface AuthModalContextValue {
  isOpen: boolean
  activeTab: AuthTab
  openAuthModal: (tab?: AuthTab) => void
  closeAuthModal: () => void
}

const AuthModalContext = createContext<AuthModalContextValue | null>(null)

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<AuthTab>('login')

  function openAuthModal(tab: AuthTab = 'login') {
    setActiveTab(tab)
    setIsOpen(true)
  }

  function closeAuthModal() {
    setIsOpen(false)
  }

  return (
    <AuthModalContext.Provider value={{ isOpen, activeTab, openAuthModal, closeAuthModal }}>
      {children}
    </AuthModalContext.Provider>
  )
}

export function useAuthModal() {
  const ctx = useContext(AuthModalContext)
  if (!ctx) throw new Error('useAuthModal must be used within AuthModalProvider')
  return ctx
}
