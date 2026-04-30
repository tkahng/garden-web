import { createFileRoute, Link } from '@tanstack/react-router'
import { useDocumentMeta } from '#/hooks/useDocumentMeta'
import { listBlogs } from '#/lib/api'
import type { BlogResponse } from '#/lib/api'

export const Route = createFileRoute('/blogs/')({
  loader: () => listBlogs(0, 20),
  component: BlogsPage,
})

function BlogsPage() {
  const data = Route.useLoaderData()
  const blogs: BlogResponse[] = data?.content ?? []

  useDocumentMeta('Blog')

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
    </main>
  )
}
