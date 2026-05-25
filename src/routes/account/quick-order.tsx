import { createFileRoute } from '@tanstack/react-router'
import { useState, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { useCart } from '#/context/cart'
import { useAuth } from '#/context/auth'
import { lookupBySku } from '#/lib/b2b-api'
import type { VariantLookupResponse } from '#/lib/b2b-api'
import { importCsvToCart } from '#/lib/cart-api'
import type { BulkAddToCartLineResult } from '#/lib/cart-api'

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/account/quick-order')({
  component: QuickOrderPage,
})

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderRow {
  id: number
  sku: string
  qty: string
  resolved: VariantLookupResponse | null
  status: 'idle' | 'loading' | 'found' | 'not_found'
}

function formatPrice(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

// ─── QuickOrderPage ───────────────────────────────────────────────────────────

let nextId = 1

export function makeRow(): OrderRow {
  return { id: nextId++, sku: '', qty: '1', resolved: null, status: 'idle' }
}

export function QuickOrderPage() {
  const { isAuthenticated } = useAuth()
  const { addItem } = useCart()
  const [rows, setRows] = useState<OrderRow[]>([makeRow(), makeRow(), makeRow()])
  const [isAdding, setIsAdding] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importResults, setImportResults] = useState<BulkAddToCartLineResult[] | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const updateRow = useCallback((id: number, patch: Partial<OrderRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }, [])

  async function handleSkuBlur(row: OrderRow) {
    const sku = row.sku.trim()
    if (!sku) return
    updateRow(row.id, { status: 'loading', resolved: null })
    try {
      const found = await lookupBySku(sku)
      updateRow(row.id, { status: 'found', resolved: found })
    } catch {
      updateRow(row.id, { status: 'not_found', resolved: null })
    }
  }

  async function handleAddAllToCart() {
    const validRows = rows.filter((r) => r.resolved?.variantId && parseInt(r.qty) > 0)
    if (validRows.length === 0) {
      toast.error('No valid SKUs to add.')
      return
    }
    setIsAdding(true)
    let added = 0
    let failed = 0
    for (const row of validRows) {
      try {
        await addItem(row.resolved!.variantId!, parseInt(row.qty))
        added++
      } catch {
        failed++
      }
    }
    setIsAdding(false)
    if (added > 0) toast.success(`${added} item${added > 1 ? 's' : ''} added to cart`)
    if (failed > 0) toast.error(`${failed} item${failed > 1 ? 's' : ''} failed to add`)
    if (added > 0) {
      setRows([makeRow(), makeRow(), makeRow()])
    }
  }

  async function handleCsvUpload(file: File) {
    if (!isAuthenticated) {
      toast.error('Please sign in to upload an order.')
      return
    }
    setIsImporting(true)
    setImportResults(null)
    try {
      const result = await importCsvToCart(file)
      setImportResults(result.results ?? [])
      const added = (result.results ?? []).filter((r) => r.status === 'ADDED').length
      if (added > 0) toast.success(`${added} item${added > 1 ? 's' : ''} added to cart`)
      else toast.info('No items were added. Check the results below.')
    } catch {
      toast.error('Failed to import CSV.')
    } finally {
      setIsImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const validCount = rows.filter((r) => r.resolved?.variantId && parseInt(r.qty) > 0).length

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold">Quick Order</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Enter SKUs and quantities to add multiple items to your cart at once.
        </p>
      </div>

      {/* Table header */}
      <div className="hidden sm:grid grid-cols-[2fr_1fr_3fr_auto] gap-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">
        <span>SKU</span>
        <span>Qty</span>
        <span>Product</span>
        <span />
      </div>

      {/* Rows */}
      <div className="flex flex-col gap-3">
        {rows.map((row) => (
          <div key={row.id} className="grid grid-cols-[2fr_1fr_3fr_auto] items-center gap-3">
            {/* SKU */}
            <input
              type="text"
              value={row.sku}
              onChange={(e) => updateRow(row.id, { sku: e.target.value, status: 'idle', resolved: null })}
              onBlur={() => void handleSkuBlur(row)}
              placeholder="SKU-001"
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />

            {/* Qty */}
            <input
              type="number"
              min={1}
              value={row.qty}
              onChange={(e) => updateRow(row.id, { qty: e.target.value })}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />

            {/* Product info */}
            <div className="flex items-center gap-2 min-w-0">
              {row.status === 'loading' && (
                <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              )}
              {row.status === 'found' && row.resolved && (
                <div className="flex items-center gap-2 min-w-0">
                  {row.resolved.featuredImageUrl && (
                    <img
                      src={row.resolved.featuredImageUrl}
                      alt=""
                      className="h-8 w-8 shrink-0 rounded object-cover border border-border"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {row.resolved.productTitle}
                    </p>
                    {row.resolved.variantTitle && row.resolved.variantTitle !== 'Default Title' && (
                      <p className="text-xs text-muted-foreground">{row.resolved.variantTitle}</p>
                    )}
                    {row.resolved.price != null && (
                      <p className="text-xs text-muted-foreground">{formatPrice(row.resolved.price)}</p>
                    )}
                  </div>
                </div>
              )}
              {row.status === 'not_found' && (
                <p className="text-sm text-destructive">SKU not found</p>
              )}
            </div>

            {/* Remove */}
            <button
              type="button"
              onClick={() => setRows((prev) => prev.filter((r) => r.id !== row.id))}
              className="text-muted-foreground hover:text-destructive transition-colors text-lg leading-none"
              aria-label="Remove row"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setRows((prev) => [...prev, makeRow()])}
          className="rounded-full border border-border px-5 py-2 text-sm font-semibold text-muted-foreground hover:border-primary hover:text-foreground"
        >
          + Add row
        </button>

        <button
          type="button"
          disabled={isAdding || validCount === 0 || !isAuthenticated}
          onClick={handleAddAllToCart}
          className="rounded-full bg-primary px-6 py-2 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isAdding ? 'Adding…' : `Add ${validCount > 0 ? validCount : ''} item${validCount !== 1 ? 's' : ''} to cart`}
        </button>
      </div>

      {/* CSV upload */}
      <div className="border-t border-border pt-6 space-y-3">
        <div>
          <p className="text-sm font-medium">Bulk import via CSV</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Two columns: <code className="font-mono">sku</code> and <code className="font-mono">quantity</code>. Header row optional.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            data-testid="csv-file-input"
            className="text-sm text-muted-foreground file:mr-3 file:rounded-full file:border file:border-border file:bg-background file:px-4 file:py-1.5 file:text-xs file:font-semibold hover:file:border-primary"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void handleCsvUpload(file)
            }}
            disabled={isImporting || !isAuthenticated}
          />
          {isImporting && (
            <span className="text-sm text-muted-foreground">Importing…</span>
          )}
        </div>

        {/* Import results */}
        {importResults != null && importResults.length > 0 && (
          <div className="rounded-lg border border-border overflow-hidden" data-testid="import-results">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">SKU</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Qty</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Product</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {importResults.map((r, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 font-mono text-xs">{r.sku}</td>
                    <td className="px-3 py-2">{r.quantity}</td>
                    <td className="px-3 py-2 text-muted-foreground">{r.productTitle ?? '—'}</td>
                    <td className="px-3 py-2">
                      {r.status === 'ADDED' && (
                        <span className="text-xs font-medium text-green-700 dark:text-green-400">Added</span>
                      )}
                      {r.status === 'NOT_FOUND' && (
                        <span className="text-xs font-medium text-destructive">Not found</span>
                      )}
                      {r.status === 'ERROR' && (
                        <span className="text-xs font-medium text-orange-600 dark:text-orange-400" title={r.message ?? undefined}>Error</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {importResults != null && importResults.length === 0 && (
          <p className="text-sm text-muted-foreground">No rows were processed from the CSV.</p>
        )}
      </div>
    </div>
  )
}
