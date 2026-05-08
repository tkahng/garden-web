import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { subscribeNewsletter } from '#/lib/api'

const STORAGE_KEY = 'newsletter_dismissed'
const DELAY_MS = 5000

export default function NewsletterPopup() {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return
    const id = setTimeout(() => setOpen(true), DELAY_MS)
    return () => clearTimeout(id)
  }, [])

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, 'true')
    setOpen(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) return
    setStatus('loading')
    try {
      const res = await subscribeNewsletter(trimmed, 'popup')
      setStatus('success')
      setMessage(res.alreadySubscribed ? "You're already on the list!" : "You're in! Check your inbox soon.")
      localStorage.setItem(STORAGE_KEY, 'true')
    } catch {
      setStatus('error')
      setMessage('Something went wrong. Please try again.')
    }
  }

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Newsletter signup"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={dismiss}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-background p-8 shadow-2xl">
        <button
          onClick={dismiss}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground transition hover:bg-accent hover:text-foreground"
        >
          <svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true">
            <path
              fill="currentColor"
              d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06z"
            />
          </svg>
        </button>

        <p className="text-2xl font-bold text-foreground">Stay in the loop</p>
        <p className="mt-2 text-sm text-muted-foreground">
          New arrivals, seasonal picks, and garden tips — straight to your inbox. No spam, ever.
        </p>

        {status === 'success' ? (
          <div className="mt-6">
            <p className="text-sm font-medium text-primary">{message}</p>
            <button
              onClick={dismiss}
              className="mt-4 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              Continue shopping
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              disabled={status === 'loading'}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            />
            {status === 'error' && (
              <p className="text-xs text-destructive">{message}</p>
            )}
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              {status === 'loading' ? 'Joining…' : 'Subscribe'}
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="text-xs text-muted-foreground transition hover:text-foreground"
            >
              No thanks
            </button>
          </form>
        )}
      </div>
    </div>,
    document.body,
  )
}
