import { createFileRoute, Outlet, Link, useRouterState } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { useAuth } from '#/context/auth'
import { useAuthModal } from '#/context/auth-modal'

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/account')({
  component: AccountLayout,
})

// ─── Nav items ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { to: '/account/profile', label: 'Profile' },
  { to: '/account/addresses', label: 'Addresses' },
  { to: '/account/notifications', label: 'Notifications' },
  { to: '/account/orders', label: 'Orders' },
  { to: '/account/returns', label: 'Returns' },
  { to: '/account/quick-order', label: 'Quick Order' },
  { to: '/account/company', label: 'Company' },
  { to: '/account/pricing', label: 'Pricing' },
  { to: '/account/invoices', label: 'Invoices' },
  { to: '/account/quotes', label: 'Quotes' },
  { to: '/account/quotes/pending-approvals', label: 'Approvals' },
  { to: '/account/quote-cart', label: 'Quote Cart' },
] as const

// ─── AccountLayout ────────────────────────────────────────────────────────────

function AccountLayout() {
  const { isAuthenticated } = useAuth()
  const { openAuthModal } = useAuthModal()
  const navigate = Route.useNavigate()
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  const redirected = useRef(false)

  useEffect(() => {
    if (!isAuthenticated && !redirected.current) {
      redirected.current = true
      navigate({ to: '/' })
      openAuthModal('login')
    }
  }, [isAuthenticated, navigate, openAuthModal])

  if (!isAuthenticated) return null

  return (
    <main className="page-wrap px-4 py-10">
      <h1 className="mb-8 text-2xl font-bold">Account</h1>
      <div className="flex gap-10">
        {/* Sidebar */}
        <nav className="flex w-44 shrink-0 flex-col gap-1">
          {NAV_ITEMS.map(({ to, label }) => {
            const isActive = pathname === to || pathname.startsWith(to)
            return (
              <Link
                key={to}
                to={to}
                className={[
                  'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                ].join(' ')}
              >
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Page content */}
        <div className="flex-1 min-w-0">
          <Outlet />
        </div>
      </div>
    </main>
  )
}
