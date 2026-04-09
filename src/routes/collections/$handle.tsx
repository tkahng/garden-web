import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { getCollection, listCollectionProducts } from '#/lib/api'
import type { CollectionDetailResponse, CollectionProductResponse } from '#/lib/api'
import { Pagination, ProductCard } from '#/routes/products/index'

// ─── Types ────────────────────────────────────────────────────────────────────

type Search = { page: number }

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/collections/$handle')({
  validateSearch: (search: Record<string, unknown>): Search => ({
    page: (() => {
      const raw = search.page
      const n = typeof raw === 'number' ? raw : Number(raw)
      return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0
    })(),
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ params, deps }) =>
    Promise.all([
      getCollection(params.handle),
      listCollectionProducts(params.handle, deps.page, 20),
    ]),
  component: CollectionDetailPage,
})

// ─── CollectionHeader ─────────────────────────────────────────────────────────

export function CollectionHeader({ collection }: { collection: CollectionDetailResponse }) {
  return (
    <div className="mb-8">
      {collection.featuredImageUrl && (
        <div
          data-testid="collection-banner"
          className="island-shell mb-6 aspect-[3/1] w-full overflow-hidden rounded-2xl"
        >
          <img
            src={collection.featuredImageUrl}
            alt={collection.title}
            className="h-full w-full object-cover"
          />
        </div>
      )}
      <h1 className="display-title text-3xl font-bold text-[var(--sea-ink)] sm:text-4xl">
        {collection.title}
      </h1>
      {collection.description && (
        <p
          data-testid="collection-description"
          className="mt-3 text-base text-[var(--sea-ink-soft)]"
        >
          {collection.description}
        </p>
      )}
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toProductSummary(cp: CollectionProductResponse) {
  return {
    id: cp.productId,
    title: cp.title,
    handle: cp.handle,
    vendor: null,
    featuredImageUrl: null,
    priceMin: null,
    priceMax: null,
    compareAtPriceMin: null,
    compareAtPriceMax: null,
  }
}

// ─── CollectionDetailPage ─────────────────────────────────────────────────────

function CollectionDetailPage() {
  const [collection, products] = Route.useLoaderData()
  const navigate = useNavigate({ from: '/collections/$handle' })

  function handlePage(page: number) {
    navigate({ search: (prev) => ({ ...prev, page }) })
  }

  const { content, meta } = products

  return (
    <main className="page-wrap px-4 py-10">
      <CollectionHeader collection={collection} />
      {content.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-[var(--sea-ink-soft)]">No products in this collection.</p>
          <a
            href="/collections"
            className="text-sm text-[var(--lagoon-deep)] underline mt-2 inline-block"
          >
            Back to collections
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {content.map((cp) => (
            <ProductCard key={cp.id} product={toProductSummary(cp)} />
          ))}
        </div>
      )}
      <Pagination
        page={meta.page}
        total={meta.total}
        pageSize={meta.pageSize}
        onPage={handlePage}
      />
    </main>
  )
}
