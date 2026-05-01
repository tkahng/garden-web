import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useDocumentMeta } from '#/hooks/useDocumentMeta'
import { listBlogs } from '#/lib/api'
import type { BlogResponse } from '#/lib/api'

const PAGE_SIZE = 20

type Search = { page: number }

export const Route = createFileRoute('/blogs/')({
  validateSearch: (search: Record<string, unknown>): Search => ({
    page: (() => {
      const n = Number(search.page)
      return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0
    })(),
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => listBlogs(deps.page, PAGE_SIZE),
  component: BlogsPage,
})

function BlogsPage() {
  const data = Route.useLoaderData()
  const { page } = Route.useSearch()
  const navigate = useNavigate()
  const blogs: BlogResponse[] = data?.content ?? []
  const total: number = (data?.meta as { total?: number } | undefined)?.total ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1

  useDocumentMeta('Blog')

  function setPage(p: number) {
    void navigate({ to: '/blogs', search: { page: p }, replace: true })
  }

  return (
    <main className="page-wrap py-12">
      <h1 className="display-title mb-8 text-3xl font-bold text-foreground sm:text-4xl">Blog</h1>

      {blogs.length === 0 ? (
        <p className="text-muted-foreground">No blogs yet.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {blogs.map((blog) => (
            <Link
              key={blog.id}
              to="/blogs/$blogHandle"
              params={{ blogHandle: blog.handle ?? '' }}
              search={{ page: 0 }}
              className="island-shell group flex flex-col gap-2 rounded-xl border border-border bg-card p-6 no-underline transition hover:shadow-md"
            >
              <h2 className="text-lg font-semibold text-foreground transition group-hover:text-primary">
                {blog.title}
              </h2>
              <p className="text-xs text-muted-foreground">
                {blog.createdAt ? new Date(blog.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
              </p>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-4">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 0}
            className="px-4 py-2 border border-border rounded text-sm disabled:opacity-40"
          >
            Prev
          </button>
          <span className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page >= totalPages - 1}
            className="px-4 py-2 border border-border rounded text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </main>
  )
}
