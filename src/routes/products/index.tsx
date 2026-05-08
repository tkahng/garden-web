import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect, useRef } from 'react'
import { listProducts } from '#/lib/api'
import type { ProductSummaryResponse } from '#/lib/api'
import { WishlistButton } from '#/components/WishlistButton'
import { useCart } from '#/context/cart'

// ─── Types ────────────────────────────────────────────────────────────────────

type Search = { q?: string; vendor?: string; type?: string; sort?: string; page: number; companyId?: string }

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'title_asc', label: 'A – Z' },
  { value: 'title_desc', label: 'Z – A' },
] as const

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/products/')({
  validateSearch: (search: Record<string, unknown>): Search => ({
    q: typeof search.q === 'string' ? search.q : undefined,
    vendor: typeof search.vendor === 'string' ? search.vendor : undefined,
    type: typeof search.type === 'string' ? search.type : undefined,
    sort: typeof search.sort === 'string' ? search.sort : undefined,
    companyId: typeof search.companyId === 'string' ? search.companyId : undefined,
    page: (() => {
      const raw = search.page
      const n = typeof raw === 'number' ? raw : Number(raw)
      return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0
    })(),
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) =>
    listProducts({
      q: deps.q,
      vendor: deps.vendor,
      type: deps.type,
      sort: deps.sort,
      page: deps.page,
      size: 20,
      companyId: deps.companyId,
    }),
  component: ProductListingPage,
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

// ─── ProductCard ──────────────────────────────────────────────────────────────

export function ProductCard({ product }: { product: ProductSummaryResponse }) {
  return (
    <div className="group relative block">
      <a href={`/products/${product.handle}`} className="block">
        <div className="island-shell aspect-[3/4] overflow-hidden mb-3">
          {product.featuredImageUrl ? (
            <img
              src={product.featuredImageUrl}
              alt={product.title}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              data-testid="card-placeholder"
              className="w-full h-full bg-muted"
            />
          )}
        </div>
        <p className="font-bold text-foreground text-sm leading-snug">
          {product.title}
        </p>
        {product.vendor && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {product.vendor}
          </p>
        )}
        {product.priceMin != null && product.priceMax != null && (
          <div className="mt-1 text-sm flex items-center gap-2">
            <span>
              {product.priceMin === product.priceMax
                ? formatPrice(product.priceMin ?? 0)
                : `${formatPrice(product.priceMin ?? 0)} – ${formatPrice(product.priceMax ?? 0)}`}
            </span>
            {product.compareAtPriceMin != null &&
              product.compareAtPriceMin > (product.priceMin ?? 0) && (
                <span className="line-through text-muted-foreground">
                  {formatPrice(product.compareAtPriceMin ?? 0)}
                </span>
              )}
          </div>
        )}
      </a>
      <div className="absolute top-2 right-2">
        <WishlistButton
          productId={product.id ?? ''}
          className="bg-background/80 backdrop-blur-sm shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
        />
      </div>
    </div>
  )
}

// ─── SortSelect ───────────────────────────────────────────────────────────────

export function SortSelect({
  value,
  onChange,
}: {
  value: string | undefined
  onChange: (sort: string) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort-select" className="text-sm text-muted-foreground whitespace-nowrap">
        Sort by
      </label>
      <select
        id="sort-select"
        value={value ?? 'newest'}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

// ─── ActiveFilters ────────────────────────────────────────────────────────────

function ActiveFilters({
  search,
  onClear,
}: {
  search: Search
  onClear: (key: keyof Search) => void
}) {
  const chips: { key: keyof Search; label: string }[] = []
  if (search.q) chips.push({ key: 'q', label: `"${search.q}"` })
  if (search.vendor) chips.push({ key: 'vendor', label: search.vendor })
  if (search.type) chips.push({ key: 'type', label: search.type })
  if (chips.length === 0) return null
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <span className="text-xs text-muted-foreground">Filters:</span>
      {chips.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onClear(key)}
          className="flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-0.5 text-xs hover:bg-accent transition"
        >
          {label}
          <span aria-hidden className="ml-0.5 text-muted-foreground">×</span>
        </button>
      ))}
      <a href="/products" className="text-xs text-primary hover:underline">
        Clear all
      </a>
    </div>
  )
}

// ─── FilterBar ────────────────────────────────────────────────────────────────

export function FilterBar({
  search,
  total,
  onSearch,
}: {
  search: Search
  total: number
  onSearch: (updates: Partial<Search>) => void
}) {
  const [inputValue, setInputValue] = useState(search.q ?? '')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setInputValue(search.q ?? '')
  }, [search.q])

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    setInputValue(value)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      onSearch({ q: value || undefined, page: 0 })
    }, 300)
  }

  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <svg
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5"
            >
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search products…"
              value={inputValue}
              onChange={handleInput}
              className="h-9 rounded-lg border border-border bg-background pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Vendor filter */}
          {search.vendor !== undefined && (
            <select
              value={search.vendor}
              onChange={(e) => onSearch({ vendor: e.target.value || undefined, page: 0 })}
              className="h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All vendors</option>
              <option value={search.vendor}>{search.vendor}</option>
            </select>
          )}

          {/* Type filter */}
          {search.type !== undefined && (
            <select
              value={search.type}
              onChange={(e) => onSearch({ type: e.target.value || undefined, page: 0 })}
              className="h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All types</option>
              <option value={search.type}>{search.type}</option>
            </select>
          )}
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{total.toLocaleString()} products</span>
          <SortSelect
            value={search.sort}
            onChange={(sort) => onSearch({ sort, page: 0 })}
          />
        </div>
      </div>

      <ActiveFilters
        search={search}
        onClear={(key) => onSearch({ [key]: undefined, page: 0 })}
      />
    </div>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export function Pagination({
  page,
  total,
  pageSize,
  onPage,
}: {
  page: number
  total: number
  pageSize: number
  onPage: (page: number) => void
}) {
  const totalPages = Math.ceil(total / pageSize)
  if (total <= pageSize) return null

  return (
    <div className="flex items-center justify-center gap-4 mt-10">
      <button
        onClick={() => onPage(page - 1)}
        disabled={page === 0}
        className="px-4 py-2 border border-border rounded text-sm disabled:opacity-40"
      >
        Prev
      </button>
      <span className="text-sm text-muted-foreground">
        Page {page + 1} of {totalPages}
      </span>
      <button
        onClick={() => onPage(page + 1)}
        disabled={page >= totalPages - 1}
        className="px-4 py-2 border border-border rounded text-sm disabled:opacity-40"
      >
        Next
      </button>
    </div>
  )
}

// ─── ProductListingPage ───────────────────────────────────────────────────────

function ProductListingPage() {
  const data = Route.useLoaderData()
  const search = Route.useSearch()
  const navigate = useNavigate({ from: '/products/' })
  const { cart } = useCart()

  useEffect(() => {
    const cartCompanyId = cart?.companyId
    if (cartCompanyId && !search.companyId) {
      navigate({ search: (prev) => ({ ...prev, companyId: cartCompanyId }), replace: true })
    }
  }, [cart?.companyId, search.companyId, navigate])

  function handleSearch(updates: Partial<Search>) {
    navigate({ search: (prev) => ({ ...prev, ...updates }) })
  }

  function handlePage(page: number) {
    navigate({ search: (prev) => ({ ...prev, page }) })
  }

  const { content: products, meta } = data

  return (
    <main className="page-wrap px-4 py-10">
      <header className="mb-6">
        <h1 className="display-title">Products</h1>
      </header>
      <FilterBar search={search} total={meta.total ?? 0} onSearch={handleSearch} />
      {products.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-muted-foreground">No products found.</p>
          <a
            href="/products"
            className="text-sm text-primary underline mt-2 inline-block"
          >
            Clear filters
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
      <Pagination
        page={meta.page ?? 0}
        total={meta.total ?? 0}
        pageSize={meta.pageSize ?? 20}
        onPage={handlePage}
      />
    </main>
  )
}
