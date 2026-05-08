import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '#/context/auth'
import { toast } from 'sonner'
import { Skeleton } from '#/components/ui/skeleton'
import {
  listOrderTemplates,
  deleteOrderTemplate,
  loadOrderTemplate,
} from '#/lib/account-api'
import type { OrderTemplateResponse } from '#/lib/account-api'

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/account/order-templates')({
  component: OrderTemplatesPage,
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// ─── TemplateCard ─────────────────────────────────────────────────────────────

function TemplateCard({
  template,
  onLoad,
  onDelete,
}: {
  template: OrderTemplateResponse
  onLoad: (id: string) => void
  onDelete: (id: string) => void
}) {
  const items = template.items ?? []
  const totalQty = items.reduce((sum, i) => sum + (i.quantity ?? 0), 0)

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold">{template.name}</span>
          <span className="text-xs text-muted-foreground">
            {items.length} {items.length === 1 ? 'item' : 'items'} · {totalQty} units
            {template.createdAt && ` · Saved ${formatDate(template.createdAt)}`}
          </span>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={() => template.id && onLoad(template.id)}
            className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
          >
            Load to cart
          </button>
          <button
            type="button"
            onClick={() => template.id && onDelete(template.id)}
            className="rounded-full border border-destructive/40 px-4 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10"
          >
            Delete
          </button>
        </div>
      </div>

      {items.length > 0 && (
        <div className="flex flex-col gap-1 border-t border-border pt-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground truncate">
                {item.variantTitle ?? item.variantId}
              </span>
              <span className="text-xs text-muted-foreground shrink-0 ml-2">
                × {item.quantity}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── OrderTemplatesPage ───────────────────────────────────────────────────────

function OrderTemplatesPage() {
  const { authFetch } = useAuth()
  const navigate = useNavigate()
  const [templates, setTemplates] = useState<OrderTemplateResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const refresh = useCallback(() => {
    listOrderTemplates(authFetch)
      .then(setTemplates)
      .finally(() => setIsLoading(false))
  }, [authFetch])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function handleLoad(id: string) {
    setLoadingId(id)
    try {
      await loadOrderTemplate(authFetch, id)
      toast.success('Cart loaded from template.')
      await navigate({ to: '/cart' })
    } catch {
      toast.error('Failed to load template to cart.')
    } finally {
      setLoadingId(null)
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await deleteOrderTemplate(authFetch, id)
      setTemplates((prev) => prev.filter((t) => t.id !== id))
      toast.success('Template deleted.')
    } catch {
      toast.error('Failed to delete template.')
    } finally {
      setDeletingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Order templates</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Saved carts you can reload for repeat orders. Create templates from your cart.
          </p>
        </div>
      </div>

      {templates.length === 0 ? (
        <div className="rounded-xl border border-border px-6 py-10 text-center text-sm text-muted-foreground">
          No saved templates yet.
          <br />
          Go to your cart and use "Save as template" to create one.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {templates.map((t) => (
            <div
              key={t.id}
              className={loadingId === t.id || deletingId === t.id ? 'opacity-50 pointer-events-none' : ''}
            >
              <TemplateCard
                template={t}
                onLoad={handleLoad}
                onDelete={handleDelete}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
