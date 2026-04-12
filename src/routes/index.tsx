import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent } from '#/components/ui/card'
import { getPage, listCollections, listCollectionProducts, getProduct, productDetailToSummary } from '#/lib/api'
import type {
  PageResponse,
  CollectionSummaryResponse,
  ProductSummaryResponse,
} from '#/lib/api'

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/')({
  loader: async () => {
    const collections = await listCollections(0, 20)
    const firstHandle = collections.content[0]?.handle

    const [homePage, collectionProducts] = await Promise.all([
      getPage('home').catch(() => null),
      firstHandle
        ? listCollectionProducts(firstHandle, 0, 4)
        : Promise.resolve({ content: [], meta: { page: 0, pageSize: 4, total: 0 } }),
    ])

    const featuredProducts = await Promise.all(
      collectionProducts.content.map((cp) =>
        getProduct(cp.handle).then(productDetailToSummary).catch(() => ({
          id: cp.productId,
          title: cp.title,
          handle: cp.handle,
          vendor: null,
          featuredImageUrl: null,
          priceMin: null,
          priceMax: null,
          compareAtPriceMin: null,
          compareAtPriceMax: null,
        } satisfies ProductSummaryResponse)),
      ),
    )

    return {
      homePage,
      collections: collections.content,
      featuredProducts,
    }
  },
  component: HomePage,
})

function HomePage() {
  const { homePage, collections, featuredProducts } = Route.useLoaderData()
  return (
    <main>
      <HeroSection page={homePage} />
      {collections.length > 0 && (
        <FeaturedCollection
          collection={collections[0]}
          products={featuredProducts}
        />
      )}
      <CollectionsGrid collections={collections} />
    </main>
  )
}

// ─── HeroSection ──────────────────────────────────────────────────────────────

export function HeroSection({ page }: { page: PageResponse | null }) {
  const title = page?.title ?? 'Welcome to Garden'
  const body = page?.body ?? 'Plants, seeds, and tools for every garden.'

  return (
    <section className="page-wrap px-4 pt-12 pb-8">
      <div className="island-shell rise-in relative overflow-hidden rounded-[2rem] px-6 py-10 sm:px-10 sm:py-14">
        <p className="island-kicker mb-3">The Garden Shop</p>
        <h1 className="display-title mb-4 max-w-2xl text-4xl font-bold leading-[1.02] tracking-tight text-foreground sm:text-6xl">
          {title}
        </h1>
        <p className="mb-8 max-w-xl text-base text-muted-foreground sm:text-lg">
          {body}
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="/products"
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground no-underline transition hover:-translate-y-0.5 hover:opacity-90"
          >
            Shop Now
          </a>
          <a
            href="/collections"
            className="rounded-full border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground no-underline transition hover:-translate-y-0.5 hover:bg-accent"
          >
            View Collections
          </a>
        </div>
      </div>
    </section>
  )
}

// ─── FeaturedCollection ───────────────────────────────────────────────────────

export function FeaturedCollection({
  collection,
  products,
}: {
  collection: CollectionSummaryResponse
  products: ProductSummaryResponse[]
}) {
  return (
    <section className="page-wrap px-4 py-8">
      <div className="mb-6 flex items-baseline justify-between">
        <div>
          <p className="island-kicker mb-1">Featured Collection</p>
          <h2 className="display-title text-2xl font-bold text-foreground sm:text-3xl">
            {collection.title}
          </h2>
        </div>
        <a
          href={`/collections/${collection.handle}`}
          className="text-sm font-semibold text-primary no-underline hover:underline"
        >
          View all →
        </a>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <a
            key={product.id}
            href={`/products/${product.handle}`}
            className="no-underline"
          >
            <Card className="island-shell h-full rounded-2xl border-border transition hover:-translate-y-0.5">
              <div className="flex h-36 items-center justify-center rounded-t-2xl bg-muted">
                <div className="h-14 w-14 rounded-full bg-border" />
              </div>
              <CardContent className="p-4">
                <p className="text-sm font-semibold text-foreground">
                  {product.title}
                </p>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>
    </section>
  )
}

// ─── CollectionsGrid ──────────────────────────────────────────────────────────

export function CollectionsGrid({
  collections,
}: {
  collections: CollectionSummaryResponse[]
}) {
  if (collections.length === 0) {
    return (
      <section className="page-wrap px-4 py-8">
        <p className="text-sm text-muted-foreground">
          No collections available yet.
        </p>
      </section>
    )
  }

  return (
    <section className="page-wrap px-4 py-8">
      <p className="island-kicker mb-1">Collections</p>
      <h2 className="display-title mb-6 text-2xl font-bold text-foreground sm:text-3xl">
        Shop by Category
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((collection) => (
          <Card
            key={collection.id}
            className="island-shell overflow-hidden rounded-2xl border-border"
          >
            {collection.featuredImageUrl && (
              <div className="h-32 w-full overflow-hidden">
                <img
                  src={collection.featuredImageUrl}
                  alt={collection.title}
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <CardContent className="flex flex-col items-center p-6 text-center">
              <p className="mb-3 text-base font-bold text-foreground">
                {collection.title}
              </p>
              <a
                href={`/collections/${collection.handle}`}
                className="text-sm font-semibold text-primary no-underline hover:underline"
              >
                Browse →
              </a>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
