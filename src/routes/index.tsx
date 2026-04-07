import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent } from '#/components/ui/card'
import {
  getPage,
  listCollections,
  listCollectionProducts,
  type PageResponse,
  type CollectionSummaryResponse,
  type CollectionProductResponse,
} from '#/lib/api'

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/')({
  loader: async () => {
    const collections = await listCollections(0, 20)
    const firstHandle = collections.content[0]?.handle

    const [homePage, featuredProducts] = await Promise.all([
      getPage('home').catch(() => null),
      firstHandle ? listCollectionProducts(firstHandle, 0, 4) : Promise.resolve({ content: [], meta: { page: 0, pageSize: 4, total: 0 } }),
    ])

    return { homePage, collections: collections.content, featuredProducts: featuredProducts.content }
  },
  component: HomePage,
})

function HomePage() {
  const { homePage, collections, featuredProducts } = Route.useLoaderData()
  return (
    <main>
      <HeroSection page={homePage} />
      {collections.length > 0 && (
        <FeaturedCollection collection={collections[0]} products={featuredProducts} />
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
        <div className="pointer-events-none absolute -left-20 -top-24 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(79,184,178,0.32),transparent_66%)]" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(47,106,74,0.18),transparent_66%)]" />
        <p className="island-kicker mb-3">The Garden Shop</p>
        <h1 className="display-title mb-4 max-w-2xl text-4xl font-bold leading-[1.02] tracking-tight text-[var(--sea-ink)] sm:text-6xl">
          {title}
        </h1>
        <p className="mb-8 max-w-xl text-base text-[var(--sea-ink-soft)] sm:text-lg">{body}</p>
        <div className="flex flex-wrap gap-3">
          <a
            href="/products"
            className="rounded-full border border-[rgba(50,143,151,0.3)] bg-[rgba(79,184,178,0.14)] px-5 py-2.5 text-sm font-semibold text-[var(--lagoon-deep)] no-underline transition hover:-translate-y-0.5 hover:bg-[rgba(79,184,178,0.24)]"
          >
            Shop Now
          </a>
          <a
            href="/collections"
            className="rounded-full border border-[rgba(23,58,64,0.2)] bg-white/50 px-5 py-2.5 text-sm font-semibold text-[var(--sea-ink)] no-underline transition hover:-translate-y-0.5 hover:border-[rgba(23,58,64,0.35)]"
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
  products: CollectionProductResponse[]
}) {
  return (
    <section className="page-wrap px-4 py-8">
      <div className="mb-6 flex items-baseline justify-between">
        <div>
          <p className="island-kicker mb-1">Featured Collection</p>
          <h2 className="display-title text-2xl font-bold text-[var(--sea-ink)] sm:text-3xl">
            {collection.title}
          </h2>
        </div>
        <a
          href={`/collections/${collection.handle}`}
          className="text-sm font-semibold text-[var(--lagoon-deep)] no-underline hover:underline"
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
            <Card className="island-shell feature-card h-full rounded-2xl border-[var(--line)] transition">
              <div className="flex h-36 items-center justify-center rounded-t-2xl bg-[rgba(79,184,178,0.08)]">
                <div className="h-14 w-14 rounded-full bg-[rgba(79,184,178,0.2)]" />
              </div>
              <CardContent className="p-4">
                <p className="text-sm font-semibold text-[var(--sea-ink)]">{product.title}</p>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>
    </section>
  )
}

// ─── CollectionsGrid ──────────────────────────────────────────────────────────

export function CollectionsGrid({ collections }: { collections: CollectionSummaryResponse[] }) {
  if (collections.length === 0) {
    return (
      <section className="page-wrap px-4 py-8">
        <p className="text-sm text-[var(--sea-ink-soft)]">No collections available yet.</p>
      </section>
    )
  }

  return (
    <section className="page-wrap px-4 py-8">
      <p className="island-kicker mb-1">Collections</p>
      <h2 className="display-title mb-6 text-2xl font-bold text-[var(--sea-ink)] sm:text-3xl">
        Shop by Category
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((collection) => (
          <Card
            key={collection.id}
            className="island-shell feature-card rounded-2xl border-[var(--line)]"
          >
            <CardContent className="flex flex-col items-center p-8 text-center">
              <div className="mb-4 h-14 w-14 rounded-full bg-[rgba(79,184,178,0.2)]" />
              <p className="mb-3 text-base font-bold text-[var(--sea-ink)]">{collection.title}</p>
              <a
                href={`/collections/${collection.handle}`}
                className="text-sm font-semibold text-[var(--lagoon-deep)] no-underline hover:underline"
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
