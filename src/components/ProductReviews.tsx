import { useState, useEffect, useCallback } from 'react'
import { StarRating } from '#/components/StarRating'
import { useAuth } from '#/context/auth'
import { useAuthModal } from '#/context/auth-modal'
import { getProductReviews, createReview } from '#/lib/review-api'
import type { ReviewResponse } from '#/lib/review-api'
import type { ReviewSummaryResponse } from '#/lib/api'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function ReviewCard({ review }: { review: ReviewResponse }) {
  return (
    <div className="border-b border-border py-5 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <StarRating rating={review.rating ?? 0} size={14} />
        <span className="text-xs text-muted-foreground">{formatDate(review.createdAt ?? '')}</span>
      </div>
      {review.title && (
        <p className="text-sm font-semibold text-foreground">{review.title}</p>
      )}
      {review.body && (
        <p className="text-sm text-muted-foreground">{review.body}</p>
      )}
      <p className="text-xs text-muted-foreground/70">
        {review.reviewerName}
        {review.verifiedPurchase && (
          <span className="ml-2 text-green-600 font-medium">Verified purchase</span>
        )}
      </p>
    </div>
  )
}

function WriteReviewForm({
  productId,
  onSubmitted,
}: {
  productId: string
  onSubmitted: () => void
}) {
  const { authFetch } = useAuth()
  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0) { setError('Please select a rating'); return }
    setIsSubmitting(true)
    setError(null)
    try {
      await createReview(productId, { rating, title: title || undefined, body: body || undefined }, authFetch)
      onSubmitted()
    } catch {
      setError('Failed to submit review. You may have already reviewed this product.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-xl border border-border p-5">
      <h4 className="text-sm font-semibold text-foreground">Write a review</h4>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">Rating</label>
        <StarRating rating={rating} size={22} interactive onRate={setRating} />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">Title (optional)</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          placeholder="Summarize your experience"
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">Review (optional)</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          maxLength={2000}
          placeholder="Share your thoughts…"
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <button
        type="submit"
        disabled={isSubmitting}
        className="self-start rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-60"
      >
        {isSubmitting ? 'Submitting…' : 'Submit review'}
      </button>
    </form>
  )
}

export function ProductReviews({
  productId,
  reviewSummary,
}: {
  productId: string
  reviewSummary: ReviewSummaryResponse | null
}) {
  const { isAuthenticated } = useAuth()
  const { openAuthModal } = useAuthModal()
  const [reviews, setReviews] = useState<ReviewResponse[]>([])
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const pageSize = 5

  const loadReviews = useCallback(async (p: number) => {
    setIsLoading(true)
    try {
      const data = await getProductReviews(productId, p, pageSize)
      setReviews(data.content)
      setTotal(data.meta.total ?? 0)
      setPage(p)
    } catch {
      // silent
    } finally {
      setIsLoading(false)
    }
  }, [productId])

  useEffect(() => { loadReviews(0) }, [loadReviews])

  function handleWriteReview() {
    if (!isAuthenticated) { openAuthModal('login'); return }
    setShowForm(true)
  }

  function handleReviewSubmitted() {
    setShowForm(false)
    loadReviews(0)
  }

  const avgRating = reviewSummary?.averageRating ?? null
  const reviewCount = reviewSummary?.reviewCount ?? 0

  return (
    <section className="mt-16">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold text-foreground">
            Reviews {reviewCount > 0 && `(${reviewCount})`}
          </h2>
          {avgRating !== null && reviewCount > 0 && (
            <div className="flex items-center gap-2">
              <StarRating rating={avgRating} size={16} />
              <span className="text-sm text-muted-foreground">
                {avgRating.toFixed(1)} out of 5
              </span>
            </div>
          )}
        </div>
        {!showForm && (
          <button
            type="button"
            onClick={handleWriteReview}
            className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:border-primary hover:text-primary transition"
          >
            Write a review
          </button>
        )}
      </div>

      {showForm && (
        <div className="mb-8">
          <WriteReviewForm productId={productId} onSubmitted={handleReviewSubmitted} />
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6">
          No reviews yet. Be the first to share your experience!
        </p>
      ) : (
        <div>
          {reviews.map((r) => <ReviewCard key={r.id} review={r} />)}
          {total > pageSize && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                disabled={page === 0}
                onClick={() => loadReviews(page - 1)}
                className="px-4 py-1.5 text-sm border border-border rounded disabled:opacity-40 hover:border-primary"
              >
                Prev
              </button>
              <span className="text-sm text-muted-foreground">
                Page {page + 1} of {Math.ceil(total / pageSize)}
              </span>
              <button
                disabled={(page + 1) * pageSize >= total}
                onClick={() => loadReviews(page + 1)}
                className="px-4 py-1.5 text-sm border border-border rounded disabled:opacity-40 hover:border-primary"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
