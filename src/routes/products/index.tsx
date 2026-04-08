import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useRef } from 'react'
import type { ProductSummaryResponse } from '#/lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────

type Search = { q?: string; vendor?: string; type?: string; page: number }

// ─── Route (completed in Task 5) ─────────────────────────────────────────────

export const Route = createFileRoute('/products/')({
  component: () => null,
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

// ─── ProductCard ──────────────────────────────────────────────────────────────

export function ProductCard({ product }: { product: ProductSummaryResponse }) {
  return (
    <a href={`/products/${product.handle}`} className="group block">
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
            className="w-full h-full bg-[var(--lagoon)] opacity-20"
          />
        )}
      </div>
      <p className="font-bold text-[var(--sea-ink)] text-sm leading-snug">{product.title}</p>
      {product.vendor && (
        <p className="text-xs text-[var(--sea-ink-soft)] mt-0.5">{product.vendor}</p>
      )}
      {product.priceMin !== null && product.priceMax !== null && (
        <div className="mt-1 text-sm flex items-center gap-2">
          <span>
            {product.priceMin === product.priceMax
              ? formatPrice(product.priceMin)
              : `${formatPrice(product.priceMin)} – ${formatPrice(product.priceMax)}`}
          </span>
          {product.compareAtPriceMin !== null &&
            product.compareAtPriceMin > product.priceMin && (
              <span className="line-through text-[var(--sea-ink-soft)]">
                {formatPrice(product.compareAtPriceMin)}
              </span>
            )}
        </div>
      )}
    </a>
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
        className="border border-[var(--line)] rounded px-3 py-1.5 text-sm"
      />
      {search.vendor !== undefined && (
        <select
          value={search.vendor}
          onChange={handleVendor}
          className="border border-[var(--line)] rounded px-3 py-1.5 text-sm"
        >
          <option value="">All vendors</option>
          <option value={search.vendor}>{search.vendor}</option>
        </select>
      )}
      {search.type !== undefined && (
        <select
          value={search.type}
          onChange={handleType}
          className="border border-[var(--line)] rounded px-3 py-1.5 text-sm"
        >
          <option value="">All types</option>
          <option value={search.type}>{search.type}</option>
        </select>
      )}
      {hasFilters && (
        <a
          href="/products"
          className="text-sm text-[var(--lagoon-deep)] underline self-center"
        >
          Clear filters
        </a>
      )}
    </div>
  )
}
