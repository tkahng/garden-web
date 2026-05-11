import { useState } from 'react'
import { useNavigate, Link } from '@tanstack/react-router'
import { ShoppingBagIcon } from '@phosphor-icons/react'
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from '#/components/ui/sheet'
import { useAuth } from '#/context/auth'
import { useCart } from '#/context/cart'
import { useGuestCart } from '#/context/guest-cart'
import { GuestCheckoutDialog } from '#/components/GuestCheckoutDialog'
import type { CartItemResponse } from '#/lib/cart-api'

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

function DrawerCartItem({ item }: { item: CartItemResponse }) {
  const qty = item.quantity ?? 1
  const unitPrice = item.unitPrice ?? 0
  const lineTotal = unitPrice * qty

  return (
    <div className="flex items-center gap-3 border-b border-border py-3">
      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-muted">
        {item.product?.imageUrl ? (
          <img
            src={item.product.imageUrl}
            alt={item.product.productTitle ?? ''}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full" />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-0.5 min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">
          {item.product?.productTitle ?? 'Unknown product'}
        </p>
        {item.product?.variantTitle && (
          <p className="truncate text-xs text-muted-foreground">{item.product.variantTitle}</p>
        )}
        <p className="text-xs text-muted-foreground">
          {qty} × {formatPrice(unitPrice)}
        </p>
      </div>
      <p className="flex-shrink-0 text-sm font-semibold text-foreground">{formatPrice(lineTotal)}</p>
    </div>
  )
}

export function CartDrawer() {
  const { isAuthenticated } = useAuth()
  const { cart: authCart, itemCount: authCount } = useCart()
  const { cart: guestCart, itemCount: guestCount, sessionId } = useGuestCart()
  const [guestDialogOpen, setGuestDialogOpen] = useState(false)
  const navigate = useNavigate()

  const cart = isAuthenticated ? authCart : guestCart
  const itemCount = isAuthenticated ? authCount : guestCount
  const items = cart?.items ?? []
  const subtotal = items.reduce(
    (sum, item) => sum + (item.unitPrice ?? 0) * (item.quantity ?? 1),
    0,
  )

  return (
    <>
      <Sheet>
        <SheetTrigger asChild>
          <button
            type="button"
            aria-label="Open cart"
            className="relative rounded-lg p-2 text-muted-foreground transition hover:bg-accent hover:text-foreground"
          >
            <ShoppingBagIcon size={22} />
            {itemCount > 0 && (
              <span
                data-testid="cart-badge"
                className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground"
              >
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </button>
        </SheetTrigger>

        <SheetContent side="right" className="flex w-80 flex-col bg-background p-0 sm:w-96">
          <SheetHeader className="border-b border-border px-6 py-4">
            <SheetTitle className="text-base font-bold">Cart ({itemCount})</SheetTitle>
            <SheetDescription className="sr-only">Your shopping cart</SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6">
            {items.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <p className="text-sm font-semibold text-foreground">Your cart is empty</p>
                <p className="text-xs text-muted-foreground">Add some items to get started.</p>
                <SheetClose asChild>
                  <Link
                    to="/products"
                    search={{ page: 0 }}
                    className="rounded-full bg-primary px-5 py-2 text-xs font-bold text-primary-foreground hover:opacity-90"
                  >
                    Shop now
                  </Link>
                </SheetClose>
              </div>
            ) : (
              <div className="py-2">
                {items.map((item) => (
                  <DrawerCartItem key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>

          {items.length > 0 && (
            <div className="border-t border-border px-6 py-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="text-base font-bold text-foreground">{formatPrice(subtotal)}</span>
              </div>
              <p className="text-xs text-muted-foreground">Shipping calculated at checkout</p>
              <SheetClose asChild>
                <button
                  type="button"
                  onClick={() => navigate({ to: '/cart' })}
                  className="w-full rounded-full border border-border py-2.5 text-sm font-semibold text-foreground hover:border-primary hover:text-primary"
                >
                  View full cart
                </button>
              </SheetClose>
              {isAuthenticated ? (
                <SheetClose asChild>
                  <button
                    type="button"
                    onClick={() => navigate({ to: '/cart' })}
                    className="w-full rounded-full bg-primary py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90"
                  >
                    Checkout
                  </button>
                </SheetClose>
              ) : (
                <SheetClose asChild>
                  <button
                    type="button"
                    onClick={() => setGuestDialogOpen(true)}
                    className="w-full rounded-full bg-primary py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90"
                  >
                    Checkout as guest
                  </button>
                </SheetClose>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {!isAuthenticated && guestCart && (
        <GuestCheckoutDialog
          open={guestDialogOpen}
          onClose={() => setGuestDialogOpen(false)}
          cart={guestCart}
          sessionId={sessionId}
        />
      )}
    </>
  )
}
