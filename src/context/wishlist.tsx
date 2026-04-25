import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react'
import type { ReactNode } from 'react'
import { useAuth } from '#/context/auth'
import { getWishlist, addWishlistItem, removeWishlistItem } from '#/lib/wishlist-api'

interface WishlistContextValue {
  wishlistProductIds: Set<string>
  isLoading: boolean
  isWishlisted: (productId: string) => boolean
  toggleWishlist: (productId: string) => Promise<void>
}

const WishlistContext = createContext<WishlistContextValue | null>(null)

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, authFetch } = useAuth()
  const authFetchRef = useRef(authFetch)
  authFetchRef.current = authFetch

  const [wishlistProductIds, setWishlistProductIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      setWishlistProductIds(new Set())
      return
    }
    let cancelled = false
    setIsLoading(true)
    getWishlist(authFetchRef.current)
      .then((data) => {
        if (!cancelled) {
          setWishlistProductIds(new Set(data.items.map((i) => i.productId)))
        }
      })
      .catch(() => {
        if (!cancelled) setWishlistProductIds(new Set())
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => { cancelled = true }
  }, [isAuthenticated])

  const isWishlisted = useCallback(
    (productId: string) => wishlistProductIds.has(productId),
    [wishlistProductIds],
  )

  const toggleWishlist = useCallback(async (productId: string) => {
    if (wishlistProductIds.has(productId)) {
      const updated = await removeWishlistItem(productId, authFetchRef.current)
      setWishlistProductIds(new Set(updated.items.map((i) => i.productId)))
    } else {
      const updated = await addWishlistItem(productId, authFetchRef.current)
      setWishlistProductIds(new Set(updated.items.map((i) => i.productId)))
    }
  }, [wishlistProductIds])

  return (
    <WishlistContext.Provider value={{ wishlistProductIds, isLoading, isWishlisted, toggleWishlist }}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider')
  return ctx
}
