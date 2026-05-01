import { createFileRoute, Link } from '@tanstack/react-router'
import ReactMarkdown from 'react-markdown'
import { useDocumentMeta } from '#/hooks/useDocumentMeta'
import { getArticle } from '#/lib/api'
import type { ArticleResponse } from '#/lib/api'

export const Route = createFileRoute('/blogs/$blogHandle/$articleHandle')({
  loader: ({ params }) => getArticle(params.blogHandle, params.articleHandle),
  component: ArticleDetailPage,
})

function ArticleDetailPage() {
  const article = Route.useLoaderData() as ArticleResponse
  const { blogHandle } = Route.useParams()

  useDocumentMeta(
    article.metaTitle ?? article.title ?? 'Article',
    article.metaDescription ?? article.excerpt ?? undefined,
  )

  const featuredImage = article.images?.find((img) => img.id === article.featuredImageId) ?? article.images?.[0]

  return (
    <main className="page-wrap py-12">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link to="/blogs" search={{ page: 0 }} className="hover:text-foreground">Blog</Link>
        <span>/</span>
        <Link to="/blogs/$blogHandle" params={{ blogHandle }} search={{ page: 0 }} className="hover:text-foreground">
          Articles
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium line-clamp-1">{article.title}</span>
      </nav>

      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <header className="mb-8 space-y-4">
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {article.tags.map((t) => (
                <Link
                  key={t}
                  to="/blogs/$blogHandle"
                  params={{ blogHandle }}
                  search={{ page: 0, tag: t, q: undefined }}
                  className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium no-underline hover:bg-accent/80"
                >
                  #{t}
                </Link>
              ))}
            </div>
          )}
          <h1 className="display-title text-3xl font-bold text-foreground sm:text-4xl leading-tight">
            {article.title}
          </h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {article.authorName && <span>{article.authorName}</span>}
            {article.publishedAt && (
              <>
                {article.authorName && <span>·</span>}
                <time dateTime={article.publishedAt}>
                  {new Date(article.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </time>
              </>
            )}
          </div>
        </header>

        {/* Featured image */}
        {featuredImage?.url && (
          <div className="island-shell mb-8 overflow-hidden rounded-xl">
            <img
              src={featuredImage.url}
              alt={featuredImage.altText ?? article.title}
              className="w-full object-cover max-h-[480px]"
            />
          </div>
        )}

        {/* Body */}
        {article.body && (
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <ReactMarkdown>{article.body}</ReactMarkdown>
          </div>
        )}

        {/* Footer nav */}
        <div className="mt-12 border-t border-border pt-6">
          <Link
            to="/blogs/$blogHandle"
            params={{ blogHandle }}
            search={{ page: 0, tag: undefined, q: undefined }}
            className="text-sm font-medium text-primary hover:underline"
          >
            ← Back to articles
          </Link>
        </div>
      </div>
    </main>
  )
}
