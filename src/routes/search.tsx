import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { MagnifyingGlassIcon } from '@phosphor-icons/react'
import { search } from '#/lib/api'
import type { SearchResponse, ProductSummaryResponse, CollectionSummaryResponse, SearchArticleResult, SearchPageResult } from '#/lib/api'
import { useDocumentMeta } from '#/hooks/useDocumentMeta'

// ─── Route ────────────────────────────────────────────────────────────────────

type SearchParams = { q: string }

export const Route = createFileRoute('/search')({
  validateSearch: (raw: Record<string, unknown>): SearchParams => ({
    q: typeof raw.q === 'string' ? raw.q : '',
  }),
  component: SearchPage,
})

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatPrice(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

// ─── Result cards ─────────────────────────────────────────────────────────────

function ProductCard({ item }: { item: ProductSummaryResponse }) {
  return (
    <Link
      to="/products/$handle"
      params={{ handle: item.handle ?? '' }}
      className="flex items-center gap-3 rounded-xl border border-border p-3 hover:bg-accent transition"
    >
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
        {item.featuredImageUrl ? (
          <img src={item.featuredImageUrl} alt={item.title} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full" />
        )}
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-sm font-semibold truncate">{item.title}</span>
        {item.priceMin != null && (
          <span className="text-xs text-muted-foreground">{formatPrice(item.priceMin)}</span>
        )}
      </div>
    </Link>
  )
}

function CollectionCard({ item }: { item: CollectionSummaryResponse }) {
  return (
    <Link
      to="/collections/$handle"
      params={{ handle: item.handle ?? '' }}
      search={{ page: 0 }}
      className="flex items-center gap-3 rounded-xl border border-border p-3 hover:bg-accent transition"
    >
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
        {item.featuredImageUrl ? (
          <img src={item.featuredImageUrl} alt={item.title} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full" />
        )}
      </div>
      <span className="text-sm font-semibold truncate">{item.title}</span>
    </Link>
  )
}

function ArticleCard({ item }: { item: SearchArticleResult }) {
  if (!item.blogHandle) return null
  return (
    <a
      href={`/blogs/${item.blogHandle}/articles/${item.handle}`}
      className="flex flex-col gap-1 rounded-xl border border-border p-3 hover:bg-accent transition"
    >
      <span className="text-sm font-semibold">{item.title}</span>
      {item.excerpt && (
        <span className="text-xs text-muted-foreground line-clamp-2">{item.excerpt}</span>
      )}
    </a>
  )
}

function PageCard({ item }: { item: SearchPageResult }) {
  return (
    <a
      href={`/pages/${item.handle}`}
      className="flex flex-col gap-1 rounded-xl border border-border p-3 hover:bg-accent transition"
    >
      <span className="text-sm font-semibold">{item.title}</span>
    </a>
  )
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  if (count === 0) return null
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title} <span className="ml-1 text-muted-foreground/60">({count})</span>
      </h2>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  )
}

// ─── SearchPage ───────────────────────────────────────────────────────────────

function SearchPage() {
  const { q } = Route.useSearch()
  const navigate = useNavigate()
  const [inputValue, setInputValue] = useState(q)
  const [results, setResults] = useState<SearchResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useDocumentMeta(q ? `Search: ${q}` : 'Search', null)

  // Sync input when URL param changes (e.g. navigating back)
  useEffect(() => { setInputValue(q) }, [q])

  // Fetch when q changes
  useEffect(() => {
    if (!q.trim()) { setResults(null); return }
    setIsLoading(true)
    search({ q, size: 8 })
      .then(setResults)
      .catch(() => setResults(null))
      .finally(() => setIsLoading(false))
  }, [q])

  function handleInputChange(value: string) {
    setInputValue(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      navigate({ to: '/search', search: { q: value } })
    }, 350)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (debounceRef.current) clearTimeout(debounceRef.current)
    navigate({ to: '/search', search: { q: inputValue } })
  }

  const totalResults =
    (results?.products?.meta?.total ?? 0) +
    (results?.collections?.meta?.total ?? 0) +
    (results?.articles?.meta?.total ?? 0) +
    (results?.pages?.meta?.total ?? 0)

  return (
    <main className="page-wrap px-4 py-10 max-w-2xl">
      {/* Search input */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 mb-8">
        <div className="relative flex-1">
          <MagnifyingGlassIcon
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            autoFocus
            type="search"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Search products, collections, articles…"
            className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </form>

      {/* States */}
      {!q.trim() && (
        <p className="text-sm text-muted-foreground">Start typing to search.</p>
      )}

      {isLoading && (
        <p className="text-sm text-muted-foreground">Searching…</p>
      )}

      {!isLoading && q.trim() && results && totalResults === 0 && (
        <p className="text-sm text-muted-foreground">
          No results for <span className="font-semibold text-foreground">"{q}"</span>.
        </p>
      )}

      {/* Results */}
      {!isLoading && results && totalResults > 0 && (
        <div className="flex flex-col gap-8">
          <Section title="Products" count={results.products?.meta?.total ?? 0}>
            {results.products?.content?.map((p) => <ProductCard key={p.id} item={p} />)}
          </Section>

          <Section title="Collections" count={results.collections?.meta?.total ?? 0}>
            {results.collections?.content?.map((c) => <CollectionCard key={c.id} item={c} />)}
          </Section>

          <Section title="Articles" count={results.articles?.meta?.total ?? 0}>
            {results.articles?.content?.map((a) => <ArticleCard key={a.id} item={a} />)}
          </Section>

          <Section title="Pages" count={results.pages?.meta?.total ?? 0}>
            {results.pages?.content?.map((p) => <PageCard key={p.id} item={p} />)}
          </Section>
        </div>
      )}
    </main>
  )
}
