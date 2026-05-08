import { useRecentlyViewed } from '#/hooks/useRecentlyViewed'
import { WishlistButton } from '#/components/WishlistButton'

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

export function RecentlyViewed({ exclude }: { exclude?: string } = {}) {
  const { items } = useRecentlyViewed()
  const visible = exclude ? items.filter((p) => p.handle !== exclude) : items

  if (visible.length === 0) return null

  return (
    <section className="mt-16">
      <h2 className="text-xl font-bold text-foreground mb-6">Recently viewed</h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {visible.map((product) => (
          <div key={product.id} className="relative group flex-shrink-0 w-44 sm:w-52">
            <a href={`/products/${product.handle}`} className="block">
              <div className="island-shell aspect-[3/4] overflow-hidden mb-2">
                {product.featuredImageUrl ? (
                  <img
                    src={product.featuredImageUrl}
                    alt={product.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-muted" />
                )}
              </div>
              <p className="text-sm font-semibold text-foreground leading-snug">{product.title}</p>
              {product.priceMin != null && (
                <p className="text-sm text-muted-foreground mt-0.5">{formatPrice(product.priceMin)}</p>
              )}
            </a>
            <div className="absolute top-2 right-2">
              <WishlistButton
                productId={product.id}
                className="bg-background/80 backdrop-blur-sm shadow-sm"
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
