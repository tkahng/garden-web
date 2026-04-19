import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useAuth } from '#/context/auth'
import { Skeleton } from '#/components/ui/skeleton'
import { toast } from 'sonner'
import { listCompanies, listPriceLists, listPriceListEntries } from '#/lib/b2b-api'
import type {
  PriceListResponse,
  CustomerPriceEntryResponse,
} from '#/lib/b2b-api'

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/account/pricing')({
  component: PricingPage,
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function discount(retail: number, contract: number) {
  if (retail <= 0) return null
  const pct = ((retail - contract) / retail) * 100
  return pct > 0 ? `${pct.toFixed(0)}% off` : null
}

// ─── Group entries by product ─────────────────────────────────────────────────

type ProductGroup = {
  productTitle: string
  productHandle: string | undefined
  entries: CustomerPriceEntryResponse[]
}

function groupByProduct(entries: CustomerPriceEntryResponse[]): ProductGroup[] {
  const map = new Map<string, ProductGroup>()
  for (const e of entries) {
    const key = e.productTitle ?? e.variantId ?? 'Unknown'
    if (!map.has(key)) {
      map.set(key, {
        productTitle: e.productTitle ?? 'Unknown product',
        productHandle: e.productHandle,
        entries: [],
      })
    }
    map.get(key)!.entries.push(e)
  }
  return Array.from(map.values())
}

// ─── PriceEntryTable ──────────────────────────────────────────────────────────

function PriceEntryTable({
  entries,
  currency,
}: {
  entries: CustomerPriceEntryResponse[]
  currency: string
}) {
  const groups = groupByProduct(entries)

  return (
    <div className="flex flex-col gap-4">
      {groups.map((group) => (
        <div key={group.productTitle}>
          <div className="flex items-center gap-2 mb-1.5">
            {group.productHandle ? (
              <Link
                to="/products/$handle"
                params={{ handle: group.productHandle }}
                className="text-sm font-semibold hover:underline underline-offset-4"
              >
                {group.productTitle}
              </Link>
            ) : (
              <span className="text-sm font-semibold">{group.productTitle}</span>
            )}
          </div>
          <table className="w-full text-sm border border-border">
            <thead>
              <tr className="bg-muted/50 text-xs text-muted-foreground uppercase tracking-wide">
                <th className="text-left px-3 py-2 font-medium">Variant</th>
                <th className="text-left px-3 py-2 font-medium">SKU</th>
                <th className="text-right px-3 py-2 font-medium">Min qty</th>
                <th className="text-right px-3 py-2 font-medium">Retail</th>
                <th className="text-right px-3 py-2 font-medium">Your price</th>
                <th className="text-right px-3 py-2 font-medium">Savings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {group.entries.map((e, i) => {
                const savings =
                  e.retailPrice != null && e.contractPrice != null
                    ? discount(e.retailPrice, e.contractPrice)
                    : null
                return (
                  <tr key={`${e.variantId}-${e.minQty}-${i}`} className="hover:bg-muted/30">
                    <td className="px-3 py-2 text-muted-foreground">
                      {e.variantTitle ?? '—'}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground font-mono text-xs">
                      {e.sku ?? '—'}
                    </td>
                    <td className="px-3 py-2 text-right text-muted-foreground">
                      {e.minQty === 1 ? 'Any' : `≥ ${e.minQty}`}
                    </td>
                    <td className="px-3 py-2 text-right text-muted-foreground line-through">
                      {e.retailPrice != null
                        ? formatCurrency(e.retailPrice, currency)
                        : '—'}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold">
                      {e.contractPrice != null
                        ? formatCurrency(e.contractPrice, currency)
                        : '—'}
                    </td>
                    <td className="px-3 py-2 text-right text-green-700 font-medium">
                      {savings ?? '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}

// ─── PriceListCard ────────────────────────────────────────────────────────────

function PriceListCard({
  priceList,
  companyId,
  authFetch,
}: {
  priceList: PriceListResponse
  companyId: string
  authFetch: ReturnType<typeof useAuth>['authFetch']
}) {
  const [expanded, setExpanded] = useState(false)
  const [entries, setEntries] = useState<CustomerPriceEntryResponse[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleExpand() {
    if (!expanded && entries === null) {
      setIsLoading(true)
      try {
        const data = await listPriceListEntries(authFetch, companyId, priceList.id!)
        setEntries(data)
      } catch {
        toast.error('Failed to load price list entries.')
        return
      } finally {
        setIsLoading(false)
      }
    }
    setExpanded((v) => !v)
  }

  const now = new Date()
  const isExpired = priceList.endsAt ? new Date(priceList.endsAt) < now : false
  const isFuture = priceList.startsAt ? new Date(priceList.startsAt) > now : false

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      {/* Header row */}
      <button
        onClick={handleExpand}
        aria-expanded={expanded}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/40 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className="font-semibold">{priceList.name}</span>
          {isExpired && (
            <span className="rounded-full bg-muted text-muted-foreground px-2 py-0.5 text-xs">
              expired
            </span>
          )}
          {isFuture && (
            <span className="rounded-full bg-yellow-100 text-yellow-800 px-2 py-0.5 text-xs">
              upcoming
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {priceList.endsAt && (
            <span>Expires {formatDate(priceList.endsAt)}</span>
          )}
          {priceList.startsAt && isFuture && (
            <span>Starts {formatDate(priceList.startsAt)}</span>
          )}
          <span>{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {/* Entries */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-border">
          {isLoading ? (
            <div className="flex flex-col gap-2 pt-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : entries && entries.length === 0 ? (
            <p className="text-sm text-muted-foreground pt-4">No items in this price list.</p>
          ) : entries ? (
            <div className="pt-4">
              <PriceEntryTable entries={entries} currency={priceList.currency ?? 'USD'} />
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

// ─── PricingPage ──────────────────────────────────────────────────────────────

export function PricingPage() {
  const { authFetch } = useAuth()
  const [priceLists, setPriceLists] = useState<PriceListResponse[]>([])
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    listCompanies(authFetch)
      .then((companies) => {
        if (cancelled || companies.length === 0) {
          if (!cancelled) setIsLoading(false)
          return
        }
        const cid = companies[0].id!
        setCompanyId(cid)
        return listPriceLists(authFetch, cid).then((data) => {
          if (!cancelled) setPriceLists(data)
        })
      })
      .catch(() => toast.error('Failed to load pricing.'))
      .finally(() => { if (!cancelled) setIsLoading(false) })
    return () => { cancelled = true }
  }, [authFetch])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 max-w-3xl">
        {[1, 2].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
      </div>
    )
  }

  if (!companyId) {
    return (
      <div className="max-w-2xl">
        <h2 className="text-lg font-semibold mb-4">Contract Pricing</h2>
        <p className="text-sm text-muted-foreground">
          You need a{' '}
          <Link to="/account/company" className="text-primary underline-offset-4 hover:underline">
            company account
          </Link>{' '}
          to view contract pricing.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      <h2 className="text-lg font-semibold">Contract Pricing</h2>

      {priceLists.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No contract pricing has been set up for your account yet.
        </p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Your negotiated rates. Click a price list to see the details.
          </p>
          {priceLists.map((pl) => (
            <PriceListCard
              key={pl.id}
              priceList={pl}
              companyId={companyId}
              authFetch={authFetch}
            />
          ))}
        </>
      )}
    </div>
  )
}
