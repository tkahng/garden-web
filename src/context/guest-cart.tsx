import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react'
import type { ReactNode } from 'react'
import { toast } from 'sonner'
import type { CartResponse } from '#/lib/cart-api'
import {
  getOrCreateGuestSessionId,
  getGuestCart,
  addGuestCartItem,
  updateGuestCartItem,
  removeGuestCartItem,
  abandonGuestCart,
  saveGuestCartEmail,
} from '#/lib/guest-cart-api'
import { useAuth } from '#/context/auth'

// ─── Types ────────────────────────────────────────────────────────────────────

interface GuestCartContextValue {
  cart: CartResponse | null
  isLoading: boolean
  itemCount: number
  sessionId: string
  guestEmail: string | null
  addItem: (variantId: string, qty?: number) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
  updateQuantity: (itemId: string, qty: number) => Promise<void>
  abandon: () => Promise<void>
  refresh: () => Promise<void>
  updateGuestEmail: (email: string) => Promise<void>
}

// ─── Context ──────────────────────────────────────────────────────────────────

const GuestCartContext = createContext<GuestCartContextValue | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

export function GuestCartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const sessionId = useRef(getOrCreateGuestSessionId())

  const [cart, setCart] = useState<CartResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [guestEmail, setGuestEmailState] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getGuestCart(sessionId.current)
      setCart(data)
    } catch {
      setCart(null)
      toast.error('Failed to load cart')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      setCart(null)
      return
    }
    let cancelled = false
    setIsLoading(true)
    getGuestCart(sessionId.current)
      .then((data) => { if (!cancelled) setCart(data) })
      .catch(() => { if (!cancelled) setCart(null) })
      .finally(() => { if (!cancelled) setIsLoading(false) })
    return () => { cancelled = true }
  }, [isAuthenticated])

  const addItem = useCallback(async (variantId: string, qty = 1) => {
    try {
      const updated = await addGuestCartItem(sessionId.current, variantId, qty)
      setCart(updated)
    } catch {
      toast.error('Failed to add item to cart')
    }
  }, [])

  const removeItem = useCallback(async (itemId: string) => {
    try {
      const updated = await removeGuestCartItem(sessionId.current, itemId)
      setCart(updated)
    } catch {
      toast.error('Failed to remove item from cart')
    }
  }, [])

  const updateQuantity = useCallback(async (itemId: string, qty: number) => {
    try {
      const updated = await updateGuestCartItem(sessionId.current, itemId, qty)
      setCart(updated)
    } catch {
      toast.error('Failed to update cart')
    }
  }, [])

  const abandon = useCallback(async () => {
    try {
      await abandonGuestCart(sessionId.current)
      setCart(null)
      setGuestEmailState(null)
    } catch {
      toast.error('Failed to clear cart')
    }
  }, [])

  const updateGuestEmail = useCallback(async (email: string) => {
    try {
      await saveGuestCartEmail(sessionId.current, email)
      setGuestEmailState(email)
    } catch {
      toast.error('Failed to save email')
    }
  }, [])

  const itemCount = useMemo(

    () => cart?.items?.reduce((sum, item) => sum + (item.quantity ?? 0), 0) ?? 0,
    [cart],
  )

  return (
    <GuestCartContext.Provider
      value={{
        cart,
        isLoading,
        itemCount,
        sessionId: sessionId.current,
        guestEmail,
        addItem,
        removeItem,
        updateQuantity,
        abandon,
        refresh: load,
        updateGuestEmail,
      }}
    >
      {children}
    </GuestCartContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useGuestCart() {
  const ctx = useContext(GuestCartContext)
  if (!ctx) throw new Error('useGuestCart must be used within GuestCartProvider')
  return ctx
}
