import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useAuth } from '#/context/auth'
import { useWishlist } from '#/context/wishlist'
import { getWishlist } from '#/lib/wishlist-api'
import type { WishlistItemResponse } from '#/lib/wishlist-api'
export const Route = createFileRoute('/account/wishlist')({
  component: WishlistPage,
})

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

function WishlistItemCard({
  item,
  onRemove,
  onAddToCart,
}: {
  item: WishlistItemResponse
  onRemove: () => void
  onAddToCart: () => void
}) {
  return (
    <div className="flex items-start gap-4 border-b border-border py-5">
      <Link to="/products/$handle" params={{ handle: item.handle }} className="flex-shrink-0">
        <div className="h-24 w-24 overflow-hidden rounded-xl bg-muted">
          {item.featuredImageUrl ? (
            <img
              src={item.featuredImageUrl}
              alt={item.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full" />
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-1 min-w-0">
        <Link
          to="/products/$handle"
          params={{ handle: item.handle }}
          className="font-semibold text-foreground hover:underline"
        >
          {item.title}
        </Link>
        {item.priceMin !== null && (
          <p className="text-sm text-muted-foreground">{formatPrice(item.priceMin)}</p>
        )}
        <div className="mt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={onAddToCart}
            className="rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground hover:opacity-90"
          >
            Add to cart
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="text-xs text-muted-foreground hover:text-destructive"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  )
}

export function WishlistPage() {
  const { authFetch, isAuthenticated } = useAuth()
  const { toggleWishlist } = useWishlist()
  const [items, setItems] = useState<WishlistItemResponse[]>([])
  const [isLoading, setIsLoading] = useState(false)

  async function load() {
    setIsLoading(true)
    try {
      const data = await getWishlist(authFetch)
      setItems(data.items)
    } catch {
      setItems([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) load()
  }, [isAuthenticated])

  async function handleRemove(productId: string) {
    await toggleWishlist(productId)
    setItems((prev) => prev.filter((i) => i.productId !== productId))
  }

  async function handleAddToCart(item: WishlistItemResponse) {
    // Navigate to product page for variant selection since we don't know the variant
    window.location.href = `/products/${item.handle}`
  }

  return (
    <main className="page-wrap px-4 py-10">
      <div className="mb-6">
        <nav className="text-xs text-muted-foreground mb-2">
          <Link to="/account/profile" className="hover:underline">Account</Link>
          {' / '}
          <span>Wishlist</span>
        </nav>
        <h1 className="text-2xl font-bold text-foreground">Wishlist</h1>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <p className="text-lg font-semibold text-foreground">Your wishlist is empty</p>
          <p className="text-sm text-muted-foreground">
            Save products you love by clicking the heart icon.
          </p>
          <Link
            to="/products"
            search={{ page: 0 }}
            className="rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90"
          >
            Browse products
          </Link>
        </div>
      ) : (
        <div>
          <p className="text-sm text-muted-foreground mb-4">{items.length} saved item{items.length !== 1 ? 's' : ''}</p>
          {items.map((item) => (
            <WishlistItemCard
              key={item.id}
              item={item}
              onRemove={() => handleRemove(item.productId)}
              onAddToCart={() => handleAddToCart(item)}
            />
          ))}
        </div>
      )}
    </main>
  )
}
