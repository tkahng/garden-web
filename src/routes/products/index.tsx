import { createFileRoute } from '@tanstack/react-router'
import type { ProductSummaryResponse } from '#/lib/api'

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
