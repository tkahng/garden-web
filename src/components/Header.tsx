import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ShoppingBagIcon, ListIcon } from '@phosphor-icons/react'
import ThemeToggle from './ThemeToggle'
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '#/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '#/components/ui/avatar'
import { useAuth } from '#/context/auth'
import { useAuthModal } from '#/context/auth-modal'

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
  const { user, isAuthenticated, logout } = useAuth()
  const { openAuthModal } = useAuthModal()
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const initials = user
    ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase()
    : ''

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
          {/* Cart */}
          <button
            type="button"
            aria-label="Open cart"
            className="rounded-lg p-2 text-[var(--sea-ink-soft)] transition hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)]"
            onClick={() => openAuthModal('login')}
          >
            <ShoppingBagIcon size={22} />
          </button>

          {/* User avatar / dropdown (authenticated only) */}
          {isAuthenticated && user && (
            <DropdownMenu open={userMenuOpen} onOpenChange={setUserMenuOpen}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="User menu"
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-[var(--lagoon-deep)] text-white text-xs font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              {userMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-4 top-16 z-50 w-56 rounded border border-[var(--line)] bg-[var(--header-bg)] shadow-lg"
                >
                  <div className="flex flex-col gap-0.5 px-2 py-2">
                    <span className="font-semibold text-sm">{`${user.firstName} ${user.lastName}`}</span>
                    <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
                  </div>
                  <div className="border-t border-[var(--line)]" />
                  <a
                    href="/account"
                    className="block px-2 py-2 text-xs hover:bg-accent"
                    role="menuitem"
                  >
                    Account
                  </a>
                </div>
              )}
            </DropdownMenu>
          )}

          {/* Mobile sign-in / sign-out (visible on mobile, hidden on desktop) */}
          <div className="md:hidden">
            {isAuthenticated ? (
              <button
                type="button"
                className="rounded-lg px-3 py-2.5 text-sm font-semibold text-[var(--sea-ink-soft)] transition hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)]"
                onClick={() => logout()}
              >
                Sign out
              </button>
            ) : (
              <Link
                to="/"
                className="rounded-lg px-3 py-2.5 text-sm font-semibold text-[var(--sea-ink-soft)] no-underline transition hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)]"
                onClick={() => openAuthModal('login')}
              >
                Sign in
              </Link>
            )}
          </div>

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
                <SheetDescription className="sr-only">Navigation menu</SheetDescription>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-1 px-4" aria-label="Mobile navigation">
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
                <div className="mt-4 border-t border-[var(--line)] pt-4">
                  {isAuthenticated ? (
                    <button
                      type="button"
                      className="rounded-lg px-3 py-2.5 text-sm font-semibold text-[var(--sea-ink-soft)] transition hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)]"
                      onClick={() => logout()}
                    >
                      Sign out
                    </button>
                  ) : (
                    <Link
                      to="/"
                      className="rounded-lg px-3 py-2.5 text-sm font-semibold text-[var(--sea-ink-soft)] no-underline transition hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)]"
                      onClick={() => openAuthModal('login')}
                    >
                      Sign in
                    </Link>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
