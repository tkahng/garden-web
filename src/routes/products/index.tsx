import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect, useRef } from 'react'
import { listProducts } from '#/lib/api'
import type { ProductSummaryResponse } from '#/lib/api'
import { WishlistButton } from '#/components/WishlistButton'

// ─── Types ────────────────────────────────────────────────────────────────────

type Search = { q?: string; vendor?: string; type?: string; page: number }

// ─── Route (completed in Task 5) ─────────────────────────────────────────────

export const Route = createFileRoute('/products/')({
  validateSearch: (search: Record<string, unknown>): Search => ({
    q: typeof search.q === 'string' ? search.q : undefined,
    vendor: typeof search.vendor === 'string' ? search.vendor : undefined,
    type: typeof search.type === 'string' ? search.type : undefined,
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
      page: deps.page,
      size: 20,
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

// ─── FilterBar ────────────────────────────────────────────────────────────────

export function FilterBar({
  search,
  onSearch,
}: {
  search: { q?: string; vendor?: string; type?: string }
  onSearch: (updates: Partial<Search>) => void
}) {
  const [inputValue, setInputValue] = useState(search.q ?? '')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
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

  function handleVendor(e: React.ChangeEvent<HTMLSelectElement>) {
    onSearch({ vendor: e.target.value || undefined, page: 0 })
  }

  function handleType(e: React.ChangeEvent<HTMLSelectElement>) {
    onSearch({ type: e.target.value || undefined, page: 0 })
  }

  const hasFilters = !!(search.q || search.vendor || search.type)

  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <input
        type="text"
        placeholder="Search products…"
        value={inputValue}
        onChange={handleInput}
        className="border border-border rounded px-3 py-1.5 text-sm bg-background text-foreground"
      />
      {search.vendor !== undefined && (
        <select
          value={search.vendor}
          onChange={handleVendor}
          className="border border-border rounded px-3 py-1.5 text-sm bg-background text-foreground"
        >
          <option value="">All vendors</option>
          <option value={search.vendor}>{search.vendor}</option>
        </select>
      )}
      {search.type !== undefined && (
        <select
          value={search.type}
          onChange={handleType}
          className="border border-border rounded px-3 py-1.5 text-sm bg-background text-foreground"
        >
          <option value="">All types</option>
          <option value={search.type}>{search.type}</option>
        </select>
      )}
      {hasFilters && (
        <a
          href="/products"
          className="text-sm text-primary underline self-center"
        >
          Clear filters
        </a>
      )}
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
        <p className="text-sm text-muted-foreground mt-1">
          {meta.total} products
        </p>
      </header>
      <FilterBar search={search} onSearch={handleSearch} />
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
