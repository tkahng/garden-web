import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { listCollections } from '#/lib/api'
import type { CollectionSummaryResponse } from '#/lib/api'
import { Pagination } from '#/routes/products/index'

// ─── Types ────────────────────────────────────────────────────────────────────

type Search = { page: number }

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/collections/')({
  validateSearch: (search: Record<string, unknown>): Search => ({
    page: (() => {
      const raw = search.page
      const n = typeof raw === 'number' ? raw : Number(raw)
      return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0
    })(),
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => listCollections(deps.page, 20),
  component: CollectionsListPage,
})

// ─── CollectionCard ───────────────────────────────────────────────────────────

export function CollectionCard({
  collection,
}: {
  collection: CollectionSummaryResponse
}) {
  return (
    <div className="island-shell overflow-hidden border-border">
      {collection.featuredImageUrl && (
        <div className="h-32 w-full overflow-hidden">
          <img
            src={collection.featuredImageUrl}
            alt={collection.title}
            className="h-full w-full object-cover"
          />
        </div>
      )}
      <div className="flex flex-col items-center p-6 text-center">
        <p className="mb-3 text-base font-bold text-foreground">
          {collection.title}
        </p>
        <a
          href={`/collections/${collection.handle}`}
          className="text-sm font-semibold text-primary no-underline hover:underline"
        >
          Browse →
        </a>
      </div>
    </div>
  )
}

// ─── CollectionsListPage ──────────────────────────────────────────────────────

function CollectionsListPage() {
  const data = Route.useLoaderData()
  const navigate = useNavigate({ from: '/collections/' })

  function handlePage(page: number) {
    navigate({ search: (prev) => ({ ...prev, page }) })
  }

  const { content: collections, meta } = data

  return (
    <main className="page-wrap px-4 py-10">
      <header className="mb-6">
        <h1 className="display-title">Collections</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {meta.total} collections
        </p>
      </header>
      {collections.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-muted-foreground">No collections available.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
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
