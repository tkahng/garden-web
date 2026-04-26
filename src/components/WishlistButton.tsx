import { useState } from 'react'
import { HeartIcon } from '@phosphor-icons/react'
import { useAuth } from '#/context/auth'
import { useAuthModal } from '#/context/auth-modal'
import { useWishlist } from '#/context/wishlist'

export function WishlistButton({
  productId,
  className,
}: {
  productId: string
  className?: string
}) {
  const { isAuthenticated } = useAuth()
  const { openAuthModal } = useAuthModal()
  const { isWishlisted, toggleWishlist } = useWishlist()
  const [isPending, setIsPending] = useState(false)

  const wishlisted = isWishlisted(productId)

  async function handleClick() {
    if (!isAuthenticated) {
      openAuthModal('login')
      return
    }
    setIsPending(true)
    try {
      await toggleWishlist(productId)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <button
      type="button"
      aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      onClick={handleClick}
      disabled={isPending}
      className={`flex items-center justify-center rounded-full p-2 transition disabled:opacity-50 ${
        wishlisted
          ? 'text-red-500 hover:text-red-600'
          : 'text-muted-foreground hover:text-red-400'
      } ${className ?? ''}`}
    >
      <HeartIcon size={20} weight={wishlisted ? 'fill' : 'regular'} />
    </button>
  )
}
