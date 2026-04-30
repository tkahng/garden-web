import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useDocumentMeta } from '#/hooks/useDocumentMeta'
import { getBlog, listArticles } from '#/lib/api'
import type { BlogResponse, ArticleResponse } from '#/lib/api'

type Search = { page: number; tag?: string; q?: string }

export const Route = createFileRoute('/blogs/$blogHandle')({
  validateSearch: (search: Record<string, unknown>): Search => ({
    page: (() => {
      const n = Number(search.page)
      return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0
    })(),
    tag: typeof search.tag === 'string' ? search.tag : undefined,
    q: typeof search.q === 'string' ? search.q : undefined,
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ params, deps }) =>
    Promise.all([
      getBlog(params.blogHandle),
      listArticles(params.blogHandle, deps.page, 10, deps.tag, deps.q),
    ]),
  component: BlogDetailPage,
})

const PAGE_SIZE = 10

function BlogDetailPage() {
  const [blog, articlesData] = Route.useLoaderData() as [BlogResponse, { content: ArticleResponse[]; meta: { total: number } }]
  const { page, tag, q } = Route.useSearch()
  const { blogHandle } = Route.useParams()
  const navigate = useNavigate()
  const [searchInput, setSearchInput] = useState(q ?? '')

  const articles: ArticleResponse[] = articlesData?.content ?? []
  const total: number = articlesData?.meta?.total ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1

  useDocumentMeta(blog.title ?? 'Blog')

  function setPage(p: number) {
    void navigate({ to: '/blogs/$blogHandle', params: { blogHandle }, search: { page: p, tag, q }, replace: true })
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    void navigate({ to: '/blogs/$blogHandle', params: { blogHandle }, search: { page: 0, tag, q: searchInput || undefined }, replace: true })
  }

  function setTag(t: string | undefined) {
    void navigate({ to: '/blogs/$blogHandle', params: { blogHandle }, search: { page: 0, tag: t, q }, replace: true })
  }

  return (
    <main className="page-wrap py-12">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link to="/blogs" className="hover:text-foreground">Blog</Link>
        <span>/</span>
        <span className="text-foreground font-medium">{blog.title}</span>
      </nav>

      <h1 className="display-title mb-8 text-3xl font-bold text-foreground sm:text-4xl">{blog.title}</h1>

      {/* Search + tag filter */}
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <input
            type="search"
            placeholder="Search articles…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring w-52"
          />
          <button type="submit" className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-accent">
            Search
          </button>
          {q && (
            <button type="button" onClick={() => { setSearchInput(''); setTag(undefined); void navigate({ to: '/blogs/$blogHandle', params: { blogHandle }, search: { page: 0 }, replace: true }) }} className="text-xs text-muted-foreground hover:text-foreground">
              Clear
            </button>
          )}
        </form>
        {tag && (
          <span className="flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-medium">
            #{tag}
            <button onClick={() => setTag(undefined)} className="ml-1 text-muted-foreground hover:text-foreground">×</button>
          </span>
        )}
      </div>

      {articles.length === 0 ? (
        <p className="text-muted-foreground">No articles found.</p>
      ) : (
        <div className="space-y-6">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} blogHandle={blogHandle} onTagClick={setTag} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-2">
          <button
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium disabled:opacity-40 hover:bg-accent"
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground">{page + 1} / {totalPages}</span>
          <button
            disabled={page >= totalPages - 1}
            onClick={() => setPage(page + 1)}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium disabled:opacity-40 hover:bg-accent"
          >
            Next
          </button>
        </div>
      )}
    </main>
  )
}

function ArticleCard({ article, blogHandle, onTagClick }: {
  article: ArticleResponse
  blogHandle: string
  onTagClick: (tag: string) => void
}) {
  const featuredImage = article.images?.find((img) => img.id === article.featuredImageId) ?? article.images?.[0]

  return (
    <article className="island-shell flex flex-col gap-4 rounded-xl border border-border bg-card overflow-hidden sm:flex-row">
      {featuredImage?.url && (
        <Link to="/blogs/$blogHandle/$articleHandle" params={{ blogHandle, articleHandle: article.handle ?? '' }} search={{ page: 0 }} className="shrink-0">
          <img
            src={featuredImage.url}
            alt={featuredImage.altText ?? article.title}
            className="h-48 w-full object-cover sm:h-full sm:w-48"
          />
        </Link>
      )}
      <div className="flex flex-col gap-2 p-5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {article.authorName && <span>{article.authorName}</span>}
          {article.publishedAt && (
            <>
              {article.authorName && <span>·</span>}
              <span>{new Date(article.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </>
          )}
        </div>
        <Link
          to="/blogs/$blogHandle/$articleHandle"
          params={{ blogHandle, articleHandle: article.handle ?? '' }}
          search={{ page: 0 }}
          className="text-xl font-semibold text-foreground no-underline hover:text-primary"
        >
          {article.title}
        </Link>
        {article.excerpt && (
          <p className="line-clamp-3 text-sm text-muted-foreground">{article.excerpt}</p>
        )}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {article.tags.map((t) => (
              <button
                key={t}
                onClick={() => onTagClick(t)}
                className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium hover:bg-accent/80"
              >
                #{t}
              </button>
            ))}
          </div>
        )}
      </div>
    </article>
  )
}
