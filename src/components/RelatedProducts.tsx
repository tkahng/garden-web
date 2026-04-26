import { useState, useEffect } from 'react'
import { getRelatedProducts } from '#/lib/api'
import type { ProductSummaryResponse } from '#/lib/api'
import { WishlistButton } from '#/components/WishlistButton'

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

function RelatedProductCard({ product }: { product: ProductSummaryResponse }) {
  return (
    <div className="relative group flex-shrink-0 w-44 sm:w-52">
      <a href={`/products/${product.handle}`} className="block">
        <div className="island-shell aspect-[3/4] overflow-hidden mb-2">
          {product.featuredImageUrl ? (
            <img
              src={product.featuredImageUrl}
              alt={product.title}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-muted" />
          )}
        </div>
        <p className="text-sm font-semibold text-foreground leading-snug">{product.title}</p>
        {product.priceMin != null && (
          <p className="text-sm text-muted-foreground mt-0.5">{formatPrice(product.priceMin ?? 0)}</p>
        )}
      </a>
      <div className="absolute top-2 right-2">
        <WishlistButton productId={product.id ?? ''} className="bg-background/80 backdrop-blur-sm shadow-sm" />
      </div>
    </div>
  )
}

export function RelatedProducts({ handle }: { handle: string }) {
  const [products, setProducts] = useState<ProductSummaryResponse[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    getRelatedProducts(handle, 4)
      .then((data) => { if (!cancelled) setProducts(data) })
      .catch(() => { if (!cancelled) setProducts([]) })
      .finally(() => { if (!cancelled) setIsLoading(false) })
    return () => { cancelled = true }
  }, [handle])

  if (!isLoading && products.length === 0) return null

  return (
    <section className="mt-16">
      <h2 className="text-xl font-bold text-foreground mb-6">You may also like</h2>
      {isLoading ? (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-shrink-0 w-44 sm:w-52">
              <div className="aspect-[3/4] animate-pulse rounded-xl bg-muted mb-2" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {products.map((product) => (
            <RelatedProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  )
}
