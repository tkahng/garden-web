// src/context/cart.tsx
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
import type { CartResponse, CheckoutResponse } from '#/lib/cart-api'
import {
  getCart,
  addCartItem,
  removeCartItem,
  updateCartItem,
  abandonCart,
  checkout,
} from '#/lib/cart-api'
import { useAuth } from '#/context/auth'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CartContextValue {
  cart: CartResponse | null
  isLoading: boolean
  itemCount: number
  addItem: (variantId: string, qty?: number) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
  updateQuantity: (itemId: string, qty: number) => Promise<void>
  abandon: () => Promise<void>
  checkout: (shippingRateId?: string, discountCode?: string) => Promise<CheckoutResponse>
}

// ─── Context ──────────────────────────────────────────────────────────────────

const CartContext = createContext<CartContextValue | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, authFetch } = useAuth()
  // authFetch identity changes when tokens refresh. We use a ref so mutation
  // callbacks always call the latest client without needing to be recreated.
  const authFetchRef = useRef(authFetch)
  authFetchRef.current = authFetch

  const [cart, setCart] = useState<CartResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      setCart(null)
      return
    }

    let cancelled = false
    setIsLoading(true)

    getCart(authFetchRef.current)
      .then((data) => { if (!cancelled) setCart(data) })
      .catch(() => { if (!cancelled) setCart(null) })
      .finally(() => { if (!cancelled) setIsLoading(false) })

    return () => { cancelled = true }
  }, [isAuthenticated])

  const addItem = useCallback(async (variantId: string, qty = 1) => {
    const updated = await addCartItem(authFetchRef.current, variantId, qty)
    setCart(updated)
  }, [])

  const removeItem = useCallback(async (itemId: string) => {
    const updated = await removeCartItem(authFetchRef.current, itemId)
    setCart(updated)
  }, [])

  const updateQuantity = useCallback(async (itemId: string, qty: number) => {
    const updated = await updateCartItem(authFetchRef.current, itemId, qty)
    setCart(updated)
  }, [])

  const abandon = useCallback(async () => {
    await abandonCart(authFetchRef.current)
    setCart(null)
  }, [])

  const checkoutFn = useCallback(async (shippingRateId?: string, discountCode?: string): Promise<CheckoutResponse> => {
    return checkout(authFetchRef.current, {
      shippingRateId: shippingRateId ?? undefined,
      discountCode: discountCode || undefined,
    })
  }, [])

  const itemCount = useMemo(
    () => cart?.items?.reduce((sum, item) => sum + (item.quantity ?? 0), 0) ?? 0,
    [cart],
  )

  return (
    <CartContext.Provider value={{ cart, isLoading, itemCount, addItem, removeItem, updateQuantity, abandon, checkout: checkoutFn }}>
      {children}
    </CartContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
