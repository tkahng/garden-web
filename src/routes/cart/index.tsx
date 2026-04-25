import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useCart } from '#/context/cart'
import { useGuestCart } from '#/context/guest-cart'
import { useAuth } from '#/context/auth'
import { listAddresses } from '#/lib/account-api'
import { getShippingRates, type ShippingRateOption } from '#/lib/guest-cart-api'
import type { CartItemResponse } from '#/lib/cart-api'
import type { AddressResponse } from '#/lib/account-api'
import { GuestCheckoutDialog } from '#/components/GuestCheckoutDialog'

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/cart/')({
  component: CartPage,
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

// ─── CartEmpty ────────────────────────────────────────────────────────────────

export function CartEmpty() {
  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <p className="text-lg font-semibold text-foreground">Your cart is empty</p>
      <p className="text-sm text-muted-foreground">
        Looks like you haven't added anything yet.
      </p>
      <Link
        to="/products"
        search={{ page: 0 }}
        className="rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90"
      >
        Continue shopping
      </Link>
    </div>
  )
}

// ─── CartItemRow ──────────────────────────────────────────────────────────────

export function CartItemRow({
  item,
  onRemove,
  onUpdateQuantity,
}: {
  item: CartItemResponse
  onRemove: (itemId: string) => void
  onUpdateQuantity: (itemId: string, qty: number) => void
}) {
  if (!item.id) return null
  const { id } = item

  const qty = item.quantity ?? 1
  const unitPrice = item.unitPrice ?? 0
  const lineTotal = unitPrice * qty

  return (
    <div className="flex items-center gap-4 border-b border-border py-4">
      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
        {item.product?.imageUrl ? (
          <img
            src={item.product.imageUrl}
            alt={item.product.productTitle ?? ''}
            className="h-full w-full object-cover"
          />
        ) : (
          <div data-testid="image-placeholder" className="h-full w-full" />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1">
        <p className="font-semibold text-foreground">
          {item.product?.productTitle ?? 'Unknown product'}
        </p>
        {item.product?.variantTitle && (
          <p className="text-sm text-muted-foreground">{item.product.variantTitle}</p>
        )}
        <p className="text-sm text-muted-foreground">{formatPrice(unitPrice)}</p>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Decrease quantity"
          disabled={qty <= 1}
          onClick={() => onUpdateQuantity(id, qty - 1)}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40 hover:border-primary"
        >
          −
        </button>
        <span className="w-6 text-center text-sm font-semibold">{qty}</span>
        <button
          type="button"
          aria-label="Increase quantity"
          onClick={() => onUpdateQuantity(id, qty + 1)}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-sm font-bold hover:border-primary"
        >
          +
        </button>
      </div>

      <p data-testid="line-total" className="w-20 text-right font-semibold text-foreground">
        {formatPrice(lineTotal)}
      </p>

      <button
        type="button"
        aria-label="Remove item"
        onClick={() => onRemove(id)}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ✕
      </button>
    </div>
  )
}

// ─── ShippingAddressSummary ───────────────────────────────────────────────────

function ShippingAddressSummary({ address }: { address: AddressResponse }) {
  return (
    <div className="rounded-xl border border-border p-4 text-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5 text-muted-foreground">
          <p className="font-semibold text-foreground">
            {address.firstName} {address.lastName}
          </p>
          <p>{address.address1}</p>
          {address.address2 && <p>{address.address2}</p>}
          <p>
            {address.city}
            {address.province ? `, ${address.province}` : ''} {address.zip}
          </p>
          <p>{address.country}</p>
        </div>
        <Link
          to="/account/addresses"
          className="shrink-0 text-sm text-primary hover:underline"
        >
          Change
        </Link>
      </div>
    </div>
  )
}

// ─── ShippingRateSelector ─────────────────────────────────────────────────────

function ShippingRateSelector({
  rates,
  selectedId,
  onSelect,
  loading,
}: {
  rates: ShippingRateOption[]
  selectedId: string | null
  onSelect: (id: string) => void
  loading: boolean
}) {
  if (loading) {
    return <div className="h-12 animate-pulse rounded-xl bg-muted" />
  }
  if (rates.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      {rates.map((rate) => (
        <label
          key={rate.id}
          className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition ${
            selectedId === rate.id
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          }`}
        >
          <input
            type="radio"
            name="authShippingRate"
            value={rate.id}
            checked={selectedId === rate.id}
            onChange={() => onSelect(rate.id)}
            className="accent-primary"
          />
          <span className="flex-1 font-medium text-foreground">
            {rate.name}
            {rate.carrier && (
              <span className="ml-1 font-normal text-muted-foreground">via {rate.carrier}</span>
            )}
            {(rate.estimatedDaysMin || rate.estimatedDaysMax) && (
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                ({rate.estimatedDaysMin}–{rate.estimatedDaysMax} days)
              </span>
            )}
          </span>
          <span className="font-semibold">
            {rate.price === 0 ? 'Free' : formatPrice(rate.price)}
          </span>
        </label>
      ))}
    </div>
  )
}

// ─── AuthCart ─────────────────────────────────────────────────────────────────

function AuthCart() {
  const { cart, isLoading, removeItem, updateQuantity, abandon, checkout } = useCart()
  const { authFetch } = useAuth()
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [defaultAddress, setDefaultAddress] = useState<AddressResponse | null | undefined>(undefined)
  const [rates, setRates] = useState<ShippingRateOption[]>([])
  const [ratesLoading, setRatesLoading] = useState(false)
  const [selectedRateId, setSelectedRateId] = useState<string | null>(null)

  useEffect(() => {
    listAddresses(authFetch)
      .then((addresses) => {
        setDefaultAddress(addresses.find((a) => a.isDefault) ?? null)
      })
      .catch(() => setDefaultAddress(null))
  }, [authFetch])

  // Fetch shipping rates once we have the default address
  useEffect(() => {
    if (!defaultAddress?.country) return
    const subtotal = cart?.items?.reduce(
      (sum, item) => sum + (item.unitPrice ?? 0) * (item.quantity ?? 1),
      0,
    ) ?? 0
    let cancelled = false
    setRatesLoading(true)
    setSelectedRateId(null)
    getShippingRates(defaultAddress.country, defaultAddress.province ?? undefined, subtotal)
      .then((data) => {
        if (!cancelled) {
          setRates(data)
          if (data.length === 1) setSelectedRateId(data[0].id)
        }
      })
      .catch(() => { if (!cancelled) setRates([]) })
      .finally(() => { if (!cancelled) setRatesLoading(false) })
    return () => { cancelled = true }
  }, [defaultAddress, cart?.items])

  async function handleCheckout() {
    setIsCheckingOut(true)
    setCheckoutError(null)
    try {
      const result = await checkout(selectedRateId ?? undefined)
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl
      } else {
        setCheckoutError('No checkout URL returned. Please try again.')
      }
    } catch {
      setCheckoutError('Failed to start checkout. Please try again.')
    } finally {
      setIsCheckingOut(false)
    }
  }

  if (isLoading) {
    return (
      <main className="page-wrap px-4 py-10">
        <div data-testid="cart-loading" className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </main>
    )
  }

  const items = cart?.items ?? []

  if (items.length === 0) {
    return (
      <main className="page-wrap px-4 py-10">
        <CartEmpty />
      </main>
    )
  }

  const subtotal = items.reduce(
    (sum, item) => sum + (item.unitPrice ?? 0) * (item.quantity ?? 1),
    0,
  )
  const selectedRate = rates.find((r) => r.id === selectedRateId)
  const shippingCost = selectedRate?.price ?? 0
  const total = subtotal + shippingCost

  return (
    <main className="page-wrap px-4 py-10">
      <h1 className="mb-8 text-2xl font-bold text-foreground">Your Cart</h1>
      <div className="flex flex-col">
        {items.map((item) => (
          <CartItemRow
            key={item.id}
            item={item}
            onRemove={removeItem}
            onUpdateQuantity={updateQuantity}
          />
        ))}
      </div>

      <div className="mt-8 flex flex-col gap-4 border-t border-border pt-6">
        {/* Subtotal row */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Subtotal</p>
            <p data-testid="cart-subtotal" className="text-xl font-bold text-foreground">
              {formatPrice(subtotal)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => abandon()}
            className="rounded-full border border-border px-5 py-2 text-sm font-semibold text-muted-foreground hover:border-primary hover:text-foreground"
          >
            Abandon cart
          </button>
        </div>

        {/* Ship to */}
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-foreground">Ship to</p>
          {defaultAddress === undefined ? (
            <div className="h-20 animate-pulse rounded-xl bg-muted" />
          ) : defaultAddress ? (
            <ShippingAddressSummary address={defaultAddress} />
          ) : (
            <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
              No shipping address on file.{' '}
              <Link to="/account/addresses" className="font-semibold underline">
                Add one
              </Link>{' '}
              before checking out.
            </div>
          )}
        </div>

        {/* Shipping method */}
        {defaultAddress && rates.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-foreground">Shipping method</p>
            <ShippingRateSelector
              rates={rates}
              selectedId={selectedRateId}
              onSelect={setSelectedRateId}
              loading={ratesLoading}
            />
          </div>
        )}

        {/* Total */}
        {selectedRate && (
          <div className="flex flex-col gap-1 rounded-xl bg-muted/40 px-4 py-3 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span><span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Shipping</span>
              <span>{shippingCost === 0 ? 'Free' : formatPrice(shippingCost)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-1 font-bold text-foreground">
              <span>Total</span><span>{formatPrice(total)}</span>
            </div>
          </div>
        )}

        {checkoutError && (
          <p className="text-sm text-destructive">{checkoutError}</p>
        )}

        <button
          type="button"
          onClick={handleCheckout}
          disabled={isCheckingOut || !defaultAddress || (rates.length > 0 && !selectedRateId)}
          className="w-full rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isCheckingOut ? 'Processing…' : 'Proceed to Checkout'}
        </button>
      </div>
    </main>
  )
}

// ─── GuestCart ────────────────────────────────────────────────────────────────

function GuestCart() {
  const { cart, isLoading, removeItem, updateQuantity, abandon, sessionId } = useGuestCart()
  const [dialogOpen, setDialogOpen] = useState(false)

  if (isLoading) {
    return (
      <main className="page-wrap px-4 py-10">
        <div data-testid="cart-loading" className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </main>
    )
  }

  const items = cart?.items ?? []

  if (items.length === 0) {
    return (
      <main className="page-wrap px-4 py-10">
        <CartEmpty />
      </main>
    )
  }

  const subtotal = items.reduce(
    (sum, item) => sum + (item.unitPrice ?? 0) * (item.quantity ?? 1),
    0,
  )

  return (
    <main className="page-wrap px-4 py-10">
      <h1 className="mb-8 text-2xl font-bold text-foreground">Your Cart</h1>
      <div className="flex flex-col">
        {items.map((item) => (
          <CartItemRow
            key={item.id}
            item={item}
            onRemove={removeItem}
            onUpdateQuantity={updateQuantity}
          />
        ))}
      </div>

      <div className="mt-8 flex flex-col gap-4 border-t border-border pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Subtotal</p>
            <p data-testid="cart-subtotal" className="text-xl font-bold text-foreground">
              {formatPrice(subtotal)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => abandon()}
            className="rounded-full border border-border px-5 py-2 text-sm font-semibold text-muted-foreground hover:border-primary hover:text-foreground"
          >
            Clear cart
          </button>
        </div>

        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="w-full rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground hover:opacity-90"
        >
          Checkout as guest
        </button>
      </div>

      {cart && (
        <GuestCheckoutDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          cart={cart}
          sessionId={sessionId}
        />
      )}
    </main>
  )
}

// ─── CartPage ─────────────────────────────────────────────────────────────────

export function CartPage() {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <AuthCart /> : <GuestCart />
}
