import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useCart } from '#/context/cart'
import { useGuestCart } from '#/context/guest-cart'
import { useAuth } from '#/context/auth'
import { toast } from 'sonner'
import { listAddresses, createOrderTemplate } from '#/lib/account-api'
import { getShippingRates, type ShippingRateOption } from '#/lib/guest-cart-api'
import type { CartItemResponse } from '#/lib/cart-api'
import { validateDiscount, validateGiftCard } from '#/lib/cart-api'
import type { AddressResponse } from '#/lib/account-api'
import { getCreditAccount, getCompany, type CreditAccountResponse, type CompanyResponse } from '#/lib/b2b-api'
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
  const moq = item.minimumOrderQty ?? 1
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
          disabled={qty <= moq}
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
  const navigate = useNavigate()
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [defaultAddress, setDefaultAddress] = useState<AddressResponse | null | undefined>(undefined)
  const [rates, setRates] = useState<ShippingRateOption[]>([])
  const [ratesLoading, setRatesLoading] = useState(false)
  const [selectedRateId, setSelectedRateId] = useState<string | null>(null)
  const [discountInput, setDiscountInput] = useState('')
  const [appliedCode, setAppliedCode] = useState<string | null>(null)
  const [discountAmount, setDiscountAmount] = useState<number | null>(null)
  const [discountError, setDiscountError] = useState<string | null>(null)
  const [discountLoading, setDiscountLoading] = useState(false)
  const [giftCardInput, setGiftCardInput] = useState('')
  const [appliedGiftCard, setAppliedGiftCard] = useState<string | null>(null)
  const [giftCardBalance, setGiftCardBalance] = useState<number | null>(null)
  const [giftCardError, setGiftCardError] = useState<string | null>(null)
  const [giftCardLoading, setGiftCardLoading] = useState(false)
  const [creditAccount, setCreditAccount] = useState<CreditAccountResponse | null>(null)
  const [company, setCompany] = useState<CompanyResponse | null>(null)
  const [poNumber, setPoNumber] = useState('')
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [isSavingTemplate, setIsSavingTemplate] = useState(false)

  useEffect(() => {
    listAddresses(authFetch)
      .then((addresses) => {
        setDefaultAddress(addresses.find((a) => a.isDefault) ?? addresses[0] ?? null)
      })
      .catch(() => setDefaultAddress(null))
  }, [authFetch])

  useEffect(() => {
    const companyId = cart?.companyId
    if (!companyId) { setCreditAccount(null); setCompany(null); return }
    getCreditAccount(authFetch, companyId)
      .then(setCreditAccount)
      .catch(() => setCreditAccount(null))
    getCompany(authFetch, companyId)
      .then(setCompany)
      .catch(() => setCompany(null))
  }, [authFetch, cart])

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

  async function applyDiscount() {
    const code = discountInput.trim().toUpperCase()
    if (!code) return
    setDiscountLoading(true)
    setDiscountError(null)
    try {
      const subtotal = cart?.items?.reduce(
        (sum, item) => sum + (item.unitPrice ?? 0) * (item.quantity ?? 1), 0,
      ) ?? 0
      const res = await validateDiscount(authFetch, code, subtotal)
      if (res.valid) {
        setAppliedCode(code)
        setDiscountAmount(res.discountedAmount ?? 0)
        setDiscountInput('')
      } else {
        setDiscountError(res.message ?? 'Invalid discount code')
      }
    } catch {
      setDiscountError('Could not apply discount code')
    } finally {
      setDiscountLoading(false)
    }
  }

  function removeDiscount() {
    setAppliedCode(null)
    setDiscountAmount(null)
    setDiscountError(null)
    setDiscountInput('')
  }

  async function applyGiftCard() {
    const code = giftCardInput.trim().toUpperCase()
    if (!code) return
    setGiftCardLoading(true)
    setGiftCardError(null)
    try {
      const res = await validateGiftCard(code)
      if (res.valid) {
        setAppliedGiftCard(res.code ?? code)
        setGiftCardBalance(res.currentBalance ?? 0)
        setGiftCardInput('')
      } else {
        setGiftCardError(res.message ?? 'Invalid gift card')
      }
    } catch {
      setGiftCardError('Could not apply gift card')
    } finally {
      setGiftCardLoading(false)
    }
  }

  function removeGiftCard() {
    setAppliedGiftCard(null)
    setGiftCardBalance(null)
    setGiftCardError(null)
    setGiftCardInput('')
  }

  async function handleCheckout() {
    setIsCheckingOut(true)
    setCheckoutError(null)
    try {
      const result = await checkout(selectedRateId ?? undefined, appliedCode ?? undefined, appliedGiftCard ?? undefined, poNumber || undefined)
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl
      } else if (result.orderId) {
        // Net terms or zero-total order — no Stripe redirect
        await navigate({ to: '/account/orders/$orderId', params: { orderId: result.orderId } })
      } else {
        setCheckoutError('No checkout URL returned. Please try again.')
      }
    } catch {
      setCheckoutError('Failed to start checkout. Please try again.')
    } finally {
      setIsCheckingOut(false)
    }
  }

  async function handleSaveTemplate(e: React.FormEvent) {
    e.preventDefault()
    const name = templateName.trim()
    if (!name) return
    const cartItems = cart?.items ?? []
    if (cartItems.length === 0) { toast.error('Cart is empty.'); return }
    setIsSavingTemplate(true)
    try {
      await createOrderTemplate(
        authFetch,
        name,
        cartItems
          .filter((i) => i.variantId)
          .map((i) => ({ variantId: i.variantId!, quantity: i.quantity ?? 1 })),
      )
      toast.success('Template saved.')
      setSaveTemplateOpen(false)
      setTemplateName('')
    } catch {
      toast.error('Failed to save template.')
    } finally {
      setIsSavingTemplate(false)
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
  const discount = discountAmount ?? 0
  const giftCardApplied = giftCardBalance != null ? Math.min(giftCardBalance, subtotal + shippingCost - discount) : 0
  const total = subtotal + shippingCost - discount - giftCardApplied

  const isTaxExempt = company?.taxExempt ?? false
  const creditLimit = creditAccount?.creditLimit ?? 0
  const availableCredit = creditAccount?.availableCredit ?? 0
  const outstandingBalance = creditAccount?.outstandingBalance ?? 0
  const utilizationPct = creditLimit > 0 ? Math.min(100, Math.round((outstandingBalance / creditLimit) * 100)) : 0
  const overCreditLimit = creditAccount != null && total > availableCredit

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

        {/* Discount code */}
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-foreground">Discount code</p>
          {appliedCode ? (
            <div className="flex items-center justify-between rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-sm dark:border-green-700 dark:bg-green-950/30">
              <span className="font-mono font-semibold text-green-700 dark:text-green-400">
                {appliedCode}
                {discountAmount != null && discountAmount > 0 && (
                  <span className="ml-2 font-normal text-green-600">−{formatPrice(discountAmount)}</span>
                )}
              </span>
              <button
                type="button"
                onClick={removeDiscount}
                className="ml-3 text-xs text-muted-foreground hover:text-foreground"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter code"
                value={discountInput}
                onChange={(e) => { setDiscountInput(e.target.value.toUpperCase()); setDiscountError(null) }}
                onKeyDown={(e) => { if (e.key === 'Enter') void applyDiscount() }}
                className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
              />
              <button
                type="button"
                onClick={() => void applyDiscount()}
                disabled={!discountInput.trim() || discountLoading}
                className="rounded-lg border border-input px-4 py-2 text-sm font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                {discountLoading ? '…' : 'Apply'}
              </button>
            </div>
          )}
          {discountError && (
            <p className="text-xs text-destructive">{discountError}</p>
          )}
        </div>

        {/* Gift card */}
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-foreground">Gift card</p>
          {appliedGiftCard ? (
            <div className="flex items-center justify-between rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-sm dark:border-blue-700 dark:bg-blue-950/30">
              <span className="font-mono font-semibold text-blue-700 dark:text-blue-400">
                {appliedGiftCard}
                {giftCardBalance != null && (
                  <span className="ml-2 font-normal text-blue-600">Balance: {formatPrice(giftCardBalance)}</span>
                )}
              </span>
              <button
                type="button"
                onClick={removeGiftCard}
                className="ml-3 text-xs text-muted-foreground hover:text-foreground"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter gift card code"
                value={giftCardInput}
                onChange={(e) => { setGiftCardInput(e.target.value.toUpperCase()); setGiftCardError(null) }}
                onKeyDown={(e) => { if (e.key === 'Enter') void applyGiftCard() }}
                className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
              />
              <button
                type="button"
                onClick={() => void applyGiftCard()}
                disabled={!giftCardInput.trim() || giftCardLoading}
                className="rounded-lg border border-input px-4 py-2 text-sm font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                {giftCardLoading ? '…' : 'Apply'}
              </button>
            </div>
          )}
          {giftCardError && (
            <p className="text-xs text-destructive">{giftCardError}</p>
          )}
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

        {/* Credit account utilization */}
        {creditAccount && (
          <div className="rounded-xl border border-border px-4 py-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-foreground">Credit account</span>
              <span className="text-muted-foreground">
                {formatPrice(availableCredit)} available of {formatPrice(creditLimit)}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  utilizationPct > 80 ? 'bg-destructive' : utilizationPct > 50 ? 'bg-yellow-500' : 'bg-primary'
                }`}
                style={{ width: `${utilizationPct}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              NET {creditAccount.paymentTermsDays ?? 30} · {utilizationPct}% utilized
            </p>
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
            {discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount ({appliedCode})</span>
                <span>−{formatPrice(discount)}</span>
              </div>
            )}
            {giftCardApplied > 0 && (
              <div className="flex justify-between text-blue-600">
                <span>Gift card ({appliedGiftCard})</span>
                <span>−{formatPrice(giftCardApplied)}</span>
              </div>
            )}
            {isTaxExempt && (
              <div className="flex justify-between text-green-600">
                <span>Tax (exempt)</span>
                <span>$0.00</span>
              </div>
            )}
            <div className="flex justify-between border-t border-border pt-1 font-bold text-foreground">
              <span>Total</span><span>{formatPrice(Math.max(0, total))}</span>
            </div>
          </div>
        )}

        {overCreditLimit && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <p className="font-semibold">Credit limit exceeded</p>
            <p className="mt-0.5 text-xs">
              This order ({formatPrice(total)}) exceeds your available credit ({formatPrice(availableCredit)}).
              Please contact your account manager to increase your credit limit.
            </p>
          </div>
        )}

        {cart?.companyId && (
          <div className="flex flex-col gap-1">
            <label htmlFor="po-number" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              PO Number <span className="font-normal normal-case">(optional)</span>
            </label>
            <input
              id="po-number"
              type="text"
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value)}
              placeholder="e.g. PO-2026-0042"
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
        )}

        {checkoutError && (
          <p className="text-sm text-destructive">{checkoutError}</p>
        )}

        {creditAccount != null && (creditAccount.paymentTermsDays ?? 0) > 0 && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            <p className="font-semibold">Net {creditAccount.paymentTermsDays} payment terms</p>
            <p className="mt-0.5 text-xs text-green-700">
              This order will be invoiced. No payment is required at checkout.
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={handleCheckout}
          disabled={isCheckingOut || !defaultAddress || (rates.length > 0 && !selectedRateId) || overCreditLimit}
          className="w-full rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isCheckingOut
            ? 'Processing…'
            : (creditAccount?.paymentTermsDays ?? 0) > 0
              ? `Place Order (Net ${creditAccount!.paymentTermsDays})`
              : 'Proceed to Checkout'}
        </button>

        {/* Save as template */}
        {!saveTemplateOpen ? (
          <button
            type="button"
            onClick={() => setSaveTemplateOpen(true)}
            className="w-full text-center text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
          >
            Save cart as template
          </button>
        ) : (
          <form
            onSubmit={(e) => void handleSaveTemplate(e)}
            className="flex flex-col gap-2"
          >
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Template name (e.g. Monthly supply)"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isSavingTemplate || !templateName.trim()}
                className="flex-1 rounded-full bg-primary py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {isSavingTemplate ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => { setSaveTemplateOpen(false); setTemplateName('') }}
                className="rounded-full border border-border px-4 py-2 text-xs font-semibold hover:bg-muted"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
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
