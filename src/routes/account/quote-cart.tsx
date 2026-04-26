import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '#/context/auth'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Skeleton } from '#/components/ui/skeleton'
import { Separator } from '#/components/ui/separator'
import { toast } from 'sonner'
import {
  getQuoteCart,
  removeQuoteCartItem,
  updateQuoteCartItem,
  submitQuote,
  listCompanies,
} from '#/lib/b2b-api'
import type { QuoteCartResponse, QuoteCartItemResponse, CompanyResponse } from '#/lib/b2b-api'

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/account/quote-cart')({
  component: QuoteCartPage,
})

// ─── CartItem ─────────────────────────────────────────────────────────────────

function CartItem({
  item,
  onRemove,
  onQuantityChange,
}: {
  item: QuoteCartItemResponse
  onRemove: (id: string) => void
  onQuantityChange: (id: string, qty: number) => void
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.variantId}</p>
        {item.note && <p className="text-xs text-muted-foreground">{item.note}</p>}
      </div>
      <div className="flex items-center gap-3 ml-4">
        <input
          type="number"
          min={1}
          value={item.quantity ?? 1}
          onChange={(e) => {
            const qty = parseInt(e.target.value, 10)
            if (qty > 0) onQuantityChange(item.id!, qty)
          }}
          className="w-16 h-8 rounded-md border border-input bg-background px-2 text-sm text-center"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => onRemove(item.id!)}
        >
          Remove
        </Button>
      </div>
    </div>
  )
}

// ─── SubmitForm ───────────────────────────────────────────────────────────────

function SubmitForm({
  companies,
  onSubmit,
  submitting,
}: {
  companies: CompanyResponse[]
  onSubmit: (data: {
    companyId: string
    addressLine1: string
    city: string
    postalCode: string
    country: string
    notes: string
  }) => void
  submitting: boolean
}) {
  const [companyId, setCompanyId] = useState(companies[0]?.id ?? '')
  const [addressLine1, setAddressLine1] = useState('')
  const [city, setCity] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [country, setCountry] = useState('US')
  const [notes, setNotes] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({ companyId, addressLine1, city, postalCode, country, notes })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-sm font-semibold">Submit quote request</h3>

      {companies.length > 1 && (
        <div className="space-y-1">
          <Label htmlFor="company">Company</Label>
          <select
            id="company"
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-1">
        <Label htmlFor="address">Delivery address *</Label>
        <Input
          id="address"
          value={addressLine1}
          onChange={(e) => setAddressLine1(e.target.value)}
          placeholder="123 Main St"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Springfield"
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="postal">Postal code *</Label>
          <Input
            id="postal"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            placeholder="12345"
            required
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="country">Country *</Label>
        <Input
          id="country"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          placeholder="US"
          required
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="notes">Notes (optional)</Label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Shipping requirements, special instructions…"
          rows={3}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
        />
      </div>

      <Button type="submit" disabled={submitting || !companyId}>
        {submitting ? 'Submitting…' : 'Submit quote request'}
      </Button>
    </form>
  )
}

// ─── QuoteCartPage ────────────────────────────────────────────────────────────

export function QuoteCartPage() {
  const { authFetch } = useAuth()
  const navigate = useNavigate()

  const [cart, setCart] = useState<QuoteCartResponse | null>(null)
  const [companies, setCompanies] = useState<CompanyResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const loadCart = useCallback(() => {
    return getQuoteCart(authFetch).then(setCart)
  }, [authFetch])

  useEffect(() => {
    Promise.all([loadCart(), listCompanies(authFetch).then(setCompanies)])
      .catch(() => toast.error('Failed to load quote cart'))
      .finally(() => setIsLoading(false))
  }, [authFetch, loadCart])

  async function handleRemove(itemId: string) {
    try {
      const updated = await removeQuoteCartItem(authFetch, itemId)
      setCart(updated)
    } catch {
      toast.error('Failed to remove item')
    }
  }

  async function handleQuantityChange(itemId: string, qty: number) {
    try {
      const updated = await updateQuoteCartItem(authFetch, itemId, { quantity: qty })
      setCart(updated)
    } catch {
      toast.error('Failed to update quantity')
    }
  }

  async function handleSubmit(data: {
    companyId: string
    addressLine1: string
    city: string
    postalCode: string
    country: string
    notes: string
  }) {
    setSubmitting(true)
    try {
      const quote = await submitQuote(authFetch, {
        companyId: data.companyId,
        deliveryAddressLine1: data.addressLine1,
        deliveryCity: data.city,
        deliveryPostalCode: data.postalCode,
        deliveryCountry: data.country,
        customerNotes: data.notes || undefined,
      })
      toast.success('Quote request submitted')
      navigate({ to: '/account/quotes/$quoteId', params: { quoteId: quote.id! } })
    } catch {
      toast.error('Failed to submit quote')
    } finally {
      setSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  const items = cart?.items ?? []

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-lg font-semibold">Quote Cart</h2>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Your quote cart is empty. Add items from a product page.
        </p>
      ) : (
        <>
          <div className="divide-y divide-border rounded-xl border border-border">
            {items.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                onRemove={handleRemove}
                onQuantityChange={handleQuantityChange}
              />
            ))}
          </div>

          <Separator />

          {companies.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You need to{' '}
              <a href="/account/company" className="underline">
                create a company
              </a>{' '}
              before submitting a quote request.
            </p>
          ) : (
            <SubmitForm
              companies={companies}
              onSubmit={handleSubmit}
              submitting={submitting}
            />
          )}
        </>
      )}
    </div>
  )
}
