import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '#/components/ui/dialog'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Button } from '#/components/ui/button'
import {
  checkEmailExists,
  getShippingRates,
  submitGuestCheckout,
  type ShippingRateOption,
  type GuestAddress,
} from '#/lib/guest-cart-api'
import type { CartResponse } from '#/lib/cart-api'
import { useAuthModal } from '#/context/auth-modal'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

const COUNTRIES = [
  { code: 'US', label: 'United States' },
  { code: 'CA', label: 'Canada' },
  { code: 'GB', label: 'United Kingdom' },
  { code: 'AU', label: 'Australia' },
  { code: 'NZ', label: 'New Zealand' },
  { code: 'DE', label: 'Germany' },
  { code: 'FR', label: 'France' },
  { code: 'NL', label: 'Netherlands' },
  { code: 'SE', label: 'Sweden' },
  { code: 'NO', label: 'Norway' },
  { code: 'DK', label: 'Denmark' },
  { code: 'JP', label: 'Japan' },
  { code: 'SG', label: 'Singapore' },
  { code: 'MX', label: 'Mexico' },
  { code: 'BR', label: 'Brazil' },
]

function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(t)
  }, [value, delayMs])
  return debounced
}

// ─── ShippingRateSelector ─────────────────────────────────────────────────────

function ShippingRateSelector({
  rates,
  selectedId,
  onSelect,
}: {
  rates: ShippingRateOption[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  if (rates.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No shipping rates available for this address.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {rates.map((rate) => (
        <label
          key={rate.id}
          className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${
            selectedId === rate.id
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          }`}
        >
          <input
            type="radio"
            name="shippingRate"
            value={rate.id}
            checked={selectedId === rate.id}
            onChange={() => onSelect(rate.id)}
            className="accent-primary"
          />
          <div className="flex flex-1 flex-col gap-0.5">
            <span className="text-sm font-semibold text-foreground">
              {rate.name}
              {rate.carrier && (
                <span className="ml-1 font-normal text-muted-foreground">via {rate.carrier}</span>
              )}
            </span>
            {(rate.estimatedDaysMin || rate.estimatedDaysMax) && (
              <span className="text-xs text-muted-foreground">
                {rate.estimatedDaysMin === rate.estimatedDaysMax
                  ? `${rate.estimatedDaysMin} business days`
                  : `${rate.estimatedDaysMin}–${rate.estimatedDaysMax} business days`}
              </span>
            )}
          </div>
          <span className="text-sm font-semibold text-foreground">
            {rate.price === 0 ? 'Free' : formatPrice(rate.price)}
          </span>
        </label>
      ))}
    </div>
  )
}

// ─── GuestCheckoutDialog ──────────────────────────────────────────────────────

interface Props {
  open: boolean
  onClose: () => void
  cart: CartResponse
  sessionId: string
}

export function GuestCheckoutDialog({ open, onClose, cart, sessionId }: Props) {
  const { openAuthModal } = useAuthModal()

  // Email state
  const [email, setEmail] = useState('')
  const [emailTouched, setEmailTouched] = useState(false)
  const [emailExists, setEmailExists] = useState(false)
  const [emailChecking, setEmailChecking] = useState(false)
  const debouncedEmail = useDebounce(email, 500)

  // Address state
  const [address, setAddress] = useState<GuestAddress>({
    firstName: '',
    lastName: '',
    address1: '',
    address2: '',
    city: '',
    province: '',
    zip: '',
    country: 'US',
  })

  // Shipping state
  const [rates, setRates] = useState<ShippingRateOption[]>([])
  const [ratesLoading, setRatesLoading] = useState(false)
  const [selectedRateId, setSelectedRateId] = useState<string | null>(null)

  // Submit state
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Check email existence
  useEffect(() => {
    const trimmed = debouncedEmail.trim()
    if (!trimmed || !trimmed.includes('@')) {
      setEmailExists(false)
      return
    }
    let cancelled = false
    setEmailChecking(true)
    checkEmailExists(trimmed)
      .then((exists) => { if (!cancelled) setEmailExists(exists) })
      .catch(() => { if (!cancelled) setEmailExists(false) })
      .finally(() => { if (!cancelled) setEmailChecking(false) })
    return () => { cancelled = true }
  }, [debouncedEmail])

  // Fetch shipping rates when country changes
  useEffect(() => {
    if (!address.country) return
    const subtotal = cart.items?.reduce(
      (sum, item) => sum + (item.unitPrice ?? 0) * (item.quantity ?? 1),
      0,
    ) ?? 0
    let cancelled = false
    setRatesLoading(true)
    setSelectedRateId(null)
    getShippingRates(address.country, address.province || undefined, subtotal)
      .then((data) => {
        if (!cancelled) {
          setRates(data)
          if (data.length === 1) setSelectedRateId(data[0].id)
        }
      })
      .catch(() => { if (!cancelled) setRates([]) })
      .finally(() => { if (!cancelled) setRatesLoading(false) })
    return () => { cancelled = true }
  }, [address.country, address.province, cart.items])

  function setAddr(field: keyof GuestAddress, value: string) {
    setAddress((prev) => ({ ...prev, [field]: value }))
  }

  const emailValid = email.trim().length > 0 && email.includes('@') && !emailExists
  const addressValid =
    address.firstName.trim() &&
    address.lastName.trim() &&
    address.address1.trim() &&
    address.city.trim() &&
    address.zip.trim() &&
    address.country.trim()
  const canSubmit = emailValid && addressValid && !!selectedRateId && !submitting

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit || !selectedRateId) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const result = await submitGuestCheckout(sessionId, {
        email: email.trim(),
        shippingAddress: {
          ...address,
          address2: address.address2 || undefined,
          province: address.province || undefined,
        },
        shippingRateId: selectedRateId,
      })
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl
      } else {
        setSubmitError('No checkout URL returned. Please try again.')
        setSubmitting(false)
      }
    } catch (err: unknown) {
      const code = (err as { code?: string }).code
      if (code === 'EMAIL_EXISTS') {
        setEmailExists(true)
        setSubmitError(null)
      } else {
        setSubmitError('Failed to start checkout. Please try again.')
      }
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Guest Checkout</DialogTitle>
          <DialogDescription>
            No account required. We'll email your order confirmation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6 pt-2">
          {/* ── Email ── */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="guest-email" className="text-base font-semibold">
              Email address
            </Label>
            <Input
              id="guest-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setEmailTouched(true)}
              className={`h-11 text-base ${emailExists ? 'border-destructive focus-visible:ring-destructive' : ''}`}
              required
            />
            {emailChecking && (
              <p className="text-xs text-muted-foreground">Checking…</p>
            )}
            {emailExists && emailTouched && (
              <p className="text-sm text-destructive">
                An account with this email already exists.{' '}
                <button
                  type="button"
                  className="font-semibold underline"
                  onClick={() => { onClose(); openAuthModal('login') }}
                >
                  Log in instead
                </button>
              </p>
            )}
          </div>

          {/* ── Shipping address ── */}
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-foreground">Shipping address</p>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="g-first">First name</Label>
                <Input
                  id="g-first"
                  autoComplete="given-name"
                  value={address.firstName}
                  onChange={(e) => setAddr('firstName', e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="g-last">Last name</Label>
                <Input
                  id="g-last"
                  autoComplete="family-name"
                  value={address.lastName}
                  onChange={(e) => setAddr('lastName', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="g-addr1">Address</Label>
              <Input
                id="g-addr1"
                autoComplete="address-line1"
                value={address.address1}
                onChange={(e) => setAddr('address1', e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="g-addr2">
                Apartment, suite, etc.{' '}
                <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="g-addr2"
                autoComplete="address-line2"
                value={address.address2}
                onChange={(e) => setAddr('address2', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="g-city">City</Label>
                <Input
                  id="g-city"
                  autoComplete="address-level2"
                  value={address.city}
                  onChange={(e) => setAddr('city', e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="g-zip">ZIP / Postal code</Label>
                <Input
                  id="g-zip"
                  autoComplete="postal-code"
                  value={address.zip}
                  onChange={(e) => setAddr('zip', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="g-country">Country</Label>
                <select
                  id="g-country"
                  autoComplete="country"
                  value={address.country}
                  onChange={(e) => setAddr('country', e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  required
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="g-province">
                  State / Province{' '}
                  <span className="font-normal text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="g-province"
                  autoComplete="address-level1"
                  value={address.province}
                  onChange={(e) => setAddr('province', e.target.value)}
                  placeholder="e.g. CA"
                />
              </div>
            </div>
          </div>

          {/* ── Shipping method ── */}
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-foreground">Shipping method</p>
            {ratesLoading ? (
              <div className="h-14 animate-pulse rounded-lg bg-muted" />
            ) : (
              <ShippingRateSelector
                rates={rates}
                selectedId={selectedRateId}
                onSelect={setSelectedRateId}
              />
            )}
          </div>

          {/* ── Order total preview ── */}
          {selectedRateId && (() => {
            const rate = rates.find((r) => r.id === selectedRateId)
            const subtotal = cart.items?.reduce(
              (sum, item) => sum + (item.unitPrice ?? 0) * (item.quantity ?? 1),
              0,
            ) ?? 0
            const shipping = rate?.price ?? 0
            return (
              <div className="flex flex-col gap-1 rounded-lg bg-muted/40 px-4 py-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-1 font-semibold">
                  <span>Total</span>
                  <span>{formatPrice(subtotal + shipping)}</span>
                </div>
              </div>
            )
          })()}

          {submitError && (
            <p className="text-sm text-destructive">{submitError}</p>
          )}

          <Button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-full py-3 text-sm font-bold"
          >
            {submitting ? 'Processing…' : 'Continue to payment'}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Already have an account?{' '}
            <button
              type="button"
              className="font-semibold text-primary hover:underline"
              onClick={() => { onClose(); openAuthModal('login') }}
            >
              Log in
            </button>
          </p>
        </form>
      </DialogContent>
    </Dialog>
  )
}
