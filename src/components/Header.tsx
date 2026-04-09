import { Link } from '@tanstack/react-router'
import { ShoppingBagIcon, ListIcon } from '@phosphor-icons/react'
import ThemeToggle from './ThemeToggle'
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '#/components/ui/sheet'

const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Products', to: '/products' },
  { label: 'Collections', to: '/collections' },
  { label: 'About', to: '/about' },
] as const

const navLinkClass =
  'text-sm font-semibold text-[var(--sea-ink-soft)] no-underline transition hover:text-[var(--sea-ink)]'
const navLinkActiveClass =
  'text-sm font-semibold text-[var(--sea-ink)] no-underline transition border-b-2 border-[var(--lagoon-deep)]'

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--header-bg)] px-4 backdrop-blur-lg">
      <div className="page-wrap flex h-16 items-center justify-between gap-4">
        {/* Left — store wordmark */}
        <Link
          to="/"
          className="flex-shrink-0 text-base font-bold text-[var(--sea-ink)] no-underline"
        >
          The Garden Shop
        </Link>

        {/* Center — desktop nav */}
        <nav className="hidden items-center gap-6 md:flex" aria-label="Main navigation">
          {NAV_LINKS.map(({ label, to }) => (
            <Link
              key={to}
              to={to}
              className={navLinkClass}
              activeProps={{ className: navLinkActiveClass }}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Right — actions */}
        <div className="flex items-center gap-2">
          {/* Cart (placeholder) */}
          <button
            type="button"
            aria-label="Open cart"
            className="rounded-lg p-2 text-[var(--sea-ink-soft)] transition hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)]"
          >
            <ShoppingBagIcon size={22} />
          </button>

          <ThemeToggle />

          {/* Mobile hamburger */}
          <Sheet>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label="Open navigation menu"
                className="rounded-lg p-2 text-[var(--sea-ink-soft)] transition hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)] md:hidden"
              >
                <ListIcon size={22} />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-[var(--header-bg)]">
              <SheetHeader>
                <SheetTitle className="text-base font-bold text-[var(--sea-ink)]">
                  The Garden Shop
                </SheetTitle>
              </SheetHeader>
              <nav
                className="mt-6 flex flex-col gap-1 px-4"
                aria-label="Mobile navigation"
              >
                {NAV_LINKS.map(({ label, to }) => (
                  <Link
                    key={to}
                    to={to}
                    className="rounded-lg px-3 py-2.5 text-sm font-semibold text-[var(--sea-ink-soft)] no-underline transition hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)]"
                    activeProps={{
                      className:
                        'rounded-lg px-3 py-2.5 text-sm font-semibold text-[var(--sea-ink)] no-underline bg-[var(--link-bg-hover)]',
                    }}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
