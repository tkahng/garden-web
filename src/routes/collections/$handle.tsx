import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { getCollection, listCollectionProducts } from '#/lib/api'
import { useDocumentMeta } from '#/hooks/useDocumentMeta'
import type {
  CollectionDetailResponse,
  CollectionProductResponse,
  ProductSummaryResponse,
} from '#/lib/api'
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

export function CollectionHeader({
  collection,
}: {
  collection: CollectionDetailResponse
}) {
  return (
    <div className="mb-8">
      {collection.featuredImageUrl && (
        <div
          data-testid="collection-banner"
          className="island-shell mb-6 aspect-[3/1] w-full overflow-hidden"
        >
          <img
            src={collection.featuredImageUrl}
            alt={collection.title}
            className="h-full w-full object-cover"
          />
        </div>
      )}
      <h1 className="display-title text-3xl font-bold text-foreground sm:text-4xl">
        {collection.title}
      </h1>
      {collection.description && (
        <p
          data-testid="collection-description"
          className="mt-3 text-base text-muted-foreground"
        >
          {collection.description}
        </p>
      )}
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toProductSummary(
  cp: CollectionProductResponse,
): ProductSummaryResponse {
  return {
    id: cp.productId,
    title: cp.title,
    handle: cp.handle,
    vendor: undefined,
    featuredImageUrl: cp.featuredImageUrl,
    priceMin: undefined,
    priceMax: undefined,
    compareAtPriceMin: undefined,
    compareAtPriceMax: undefined,
  }
}

// ─── CollectionDetailPage ─────────────────────────────────────────────────────

function CollectionDetailPage() {
  const [collection, products] = Route.useLoaderData()
  useDocumentMeta(collection.metaTitle ?? collection.title, collection.metaDescription)
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
          <p className="text-muted-foreground">
            No products in this collection.
          </p>
          <a
            href="/collections"
            className="text-sm text-primary underline mt-2 inline-block"
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
        page={meta.page ?? 0}
        total={meta.total ?? 0}
        pageSize={meta.pageSize ?? 20}
        onPage={handlePage}
      />
    </main>
  )
}
