import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useAuth } from '#/context/auth'
import {
  getGiftCardBalance,
  getGiftCardTransactions,
} from '#/lib/account-api'
import type { GiftCardValidationResponse, GiftCardTransaction } from '#/lib/account-api'

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/account/gift-cards')({
  component: GiftCardsPage,
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// ─── GiftCardsPage ────────────────────────────────────────────────────────────

function GiftCardsPage() {
  const { authFetch } = useAuth()
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [balance, setBalance] = useState<GiftCardValidationResponse | null>(null)
  const [transactions, setTransactions] = useState<GiftCardTransaction[]>([])

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) return
    setIsLoading(true)
    setError(null)
    setBalance(null)
    setTransactions([])
    try {
      const [bal, txs] = await Promise.all([
        getGiftCardBalance(authFetch, trimmed),
        getGiftCardTransactions(authFetch, trimmed).catch(() => [] as GiftCardTransaction[]),
      ])
      if (!bal.valid) {
        setError(bal.message ?? 'Gift card not found or invalid.')
      } else {
        setBalance(bal)
        setTransactions(txs)
      }
    } catch {
      setError('Gift card not found.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <div>
        <h2 className="text-lg font-semibold">Gift card balance</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Enter a gift card code to check its balance and transaction history.
        </p>
      </div>

      {/* Code input */}
      <form onSubmit={(e) => void handleLookup(e)} className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="e.g. GIFT-ABCD-1234"
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono focus:border-primary focus:outline-none"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !code.trim()}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {isLoading ? 'Checking…' : 'Check'}
        </button>
      </form>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* Balance card */}
      {balance && (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-border px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Current balance
                </span>
                <span className="text-3xl font-bold">
                  {formatPrice(balance.currentBalance ?? 0, balance.currency ?? 'USD')}
                </span>
              </div>
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                Active
              </span>
            </div>
            <p className="mt-2 text-xs font-mono text-muted-foreground">{balance.code}</p>
          </div>

          {/* Transaction history */}
          {transactions.length > 0 && (
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-semibold">Transaction history</h3>
              <div className="rounded-xl border border-border divide-y divide-border">
                {transactions.map((tx) => {
                  const isDebit = (tx.delta ?? 0) < 0
                  return (
                    <div key={tx.id} className="flex items-center justify-between px-4 py-3 text-sm">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-muted-foreground">
                          {tx.note ?? (isDebit ? 'Redeemed' : 'Loaded')}
                        </span>
                        {tx.createdAt && (
                          <span className="text-xs text-muted-foreground">{formatDate(tx.createdAt)}</span>
                        )}
                      </div>
                      <span className={`font-semibold tabular-nums ${isDebit ? 'text-destructive' : 'text-green-600'}`}>
                        {isDebit ? '' : '+'}
                        {formatPrice(tx.delta ?? 0, balance.currency ?? 'USD')}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {transactions.length === 0 && (
            <p className="text-sm text-muted-foreground">No transactions yet.</p>
          )}
        </div>
      )}
    </div>
  )
}
