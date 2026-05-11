import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { subscribeNewsletter } from '#/lib/api'

function NewsletterForm({ source }: { source: string }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) return
    setStatus('loading')
    try {
      const res = await subscribeNewsletter(trimmed, source)
      setStatus('success')
      setMessage(res.alreadySubscribed ? "You're already subscribed." : "You're in! Thanks for subscribing.")
      setEmail('')
    } catch {
      setStatus('error')
      setMessage('Something went wrong. Please try again.')
    }
  }

  if (status === 'success') {
    return <p className="text-sm text-primary font-medium">{message}</p>
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          disabled={status === 'loading'}
          className="flex-1 min-w-0 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          {status === 'loading' ? 'Joining…' : 'Join'}
        </button>
      </div>
      {status === 'error' && (
        <p className="text-xs text-destructive">{message}</p>
      )}
    </form>
  )
}

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-background px-4 py-12">
      <div className="page-wrap">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Col 1 — Brand */}
          <div>
            <p className="text-base font-bold text-foreground">The Garden Shop</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Plants, seeds & tools for every garden.
            </p>
            <div className="mt-5 flex items-center gap-2">
              <a
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Follow The Garden Shop on X"
                className="rounded-lg p-2 text-muted-foreground transition hover:bg-accent hover:text-foreground"
              >
                <svg viewBox="0 0 16 16" aria-hidden="true" width="18" height="18">
                  <path
                    fill="currentColor"
                    d="M12.6 1h2.2L10 6.48 15.64 15h-4.41L7.78 9.82 3.23 15H1l5.14-5.84L.72 1h4.52l3.12 4.73L12.6 1zm-.77 12.67h1.22L4.57 2.26H3.26l8.57 11.41z"
                  />
                </svg>
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                aria-label="The Garden Shop on GitHub"
                className="rounded-lg p-2 text-muted-foreground transition hover:bg-accent hover:text-foreground"
              >
                <svg viewBox="0 0 16 16" aria-hidden="true" width="18" height="18">
                  <path
                    fill="currentColor"
                    d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"
                  />
                </svg>
              </a>
            </div>
          </div>

          {/* Col 2 — Shop */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Shop
            </p>
            <ul className="mt-4 space-y-3">
              <li>
                <Link
                  to="/products"
                  search={{ page: 0 }}
                  className="text-sm text-foreground no-underline transition hover:text-primary"
                >
                  Products
                </Link>
              </li>
              <li>
                <Link
                  to="/collections"
                  search={{ page: 0 }}
                  className="text-sm text-foreground no-underline transition hover:text-primary"
                >
                  Collections
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3 — Company */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Company
            </p>
            <ul className="mt-4 space-y-3">
              <li>
                <Link
                  to="/about"
                  className="text-sm text-foreground no-underline transition hover:text-primary"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  to="/"
                  className="text-sm text-foreground no-underline transition hover:text-primary"
                >
                  Home
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4 — Newsletter */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Stay in the loop
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              New arrivals, seasonal picks, and garden tips — straight to your inbox.
            </p>
            <NewsletterForm source="footer" />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 border-t border-border pt-6">
          <p className="text-sm text-muted-foreground">
            &copy; {year} The Garden Shop. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
