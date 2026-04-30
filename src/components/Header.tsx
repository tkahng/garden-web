import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { ListIcon, MagnifyingGlassIcon } from '@phosphor-icons/react'
import ThemeToggle from './ThemeToggle'
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '#/components/ui/sheet'
import { Avatar, AvatarFallback } from '#/components/ui/avatar'
import { useAuth } from '#/context/auth'
import { useAuthModal } from '#/context/auth-modal'
import { CartDrawer } from '#/components/CartDrawer'

const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Products', to: '/products' },
  { label: 'Collections', to: '/collections' },
  { label: 'Blog', to: '/blogs' },
  { label: 'About', to: '/about' },
] as const

const navLinkClass =
  'text-sm font-semibold text-muted-foreground no-underline transition hover:text-foreground'
const navLinkActiveClass =
  'text-sm font-semibold text-foreground no-underline transition border-b-2 border-primary'

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth()
  const { openAuthModal } = useAuthModal()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)
  const avatarButtonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus()
  }, [searchOpen])

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = searchValue.trim()
    if (!q) return
    setSearchOpen(false)
    setSearchValue('')
    void navigate({ to: '/search', search: { q } })
  }

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (
        avatarButtonRef.current &&
        !avatarButtonRef.current.contains(e.target as Node) &&
        panelRef.current &&
        !panelRef.current.contains(e.target as Node)
      ) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [])

  const initials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    : ''

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 px-4 backdrop-blur-lg">
      <div className="page-wrap flex h-16 items-center justify-between gap-4">
        {/* Left — store wordmark */}
        <Link
          to="/"
          className="flex-shrink-0 text-base font-bold text-foreground no-underline"
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
          {/* Search */}
          {searchOpen ? (
            <form onSubmit={handleSearchSubmit} className="flex items-center">
              <input
                ref={searchInputRef}
                type="search"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Escape' && setSearchOpen(false)}
                onBlur={() => { if (!searchValue) setSearchOpen(false) }}
                placeholder="Search…"
                className="w-44 rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </form>
          ) : (
            <button
              type="button"
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
              className="rounded-lg p-2 text-muted-foreground transition hover:bg-accent hover:text-foreground"
            >
              <MagnifyingGlassIcon size={20} />
            </button>
          )}

          {/* Cart drawer */}
          <CartDrawer />

          {/* User avatar / sign-in */}
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                ref={avatarButtonRef}
                type="button"
                aria-label="User menu"
                onClick={() => setUserMenuOpen((v) => !v)}
                className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </button>
              {userMenuOpen && (
                <div
                  ref={panelRef}
                  role="menu"
                  className="absolute right-0 top-full z-50 w-56 rounded border border-border bg-background shadow-lg"
                >
                  <div className="flex flex-col gap-0.5 px-2 py-2">
                    <span className="font-semibold text-sm">{`${user.firstName} ${user.lastName}`}</span>
                    <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
                  </div>
                  <div className="border-t border-border" />
                  <a
                    href="/account"
                    className="block px-2 py-2 text-xs hover:bg-accent"
                    role="menuitem"
                  >
                    Account
                  </a>
                  <button
                    type="button"
                    role="menuitem"
                    className="block w-full px-2 py-2 text-left text-xs hover:bg-accent"
                    onClick={() => {
                      setUserMenuOpen(false)
                      logout()
                    }}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              aria-label="Sign in"
              onClick={() => openAuthModal('login')}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-accent hover:text-foreground"
            >
              Sign in
            </button>
          )}

          <ThemeToggle />

          {/* Mobile hamburger */}
          <Sheet>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label="Open navigation menu"
                className="rounded-lg p-2 text-muted-foreground transition hover:bg-accent hover:text-foreground md:hidden"
              >
                <ListIcon size={22} />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-background">
              <SheetHeader>
                <SheetTitle className="text-base font-bold text-foreground">
                  The Garden Shop
                </SheetTitle>
                <SheetDescription className="sr-only">Navigation menu</SheetDescription>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-1 px-4" aria-label="Mobile navigation">
                {NAV_LINKS.map(({ label, to }) => (
                  <Link
                    key={to}
                    to={to}
                    className="rounded-lg px-3 py-2.5 text-sm font-semibold text-muted-foreground no-underline transition hover:bg-accent hover:text-foreground"
                    activeProps={{
                      className:
                        'rounded-lg px-3 py-2.5 text-sm font-semibold text-foreground no-underline bg-accent',
                    }}
                  >
                    {label}
                  </Link>
                ))}
                <div className="mt-4 border-t border-border pt-4">
                  {isAuthenticated ? (
                    <button
                      type="button"
                      className="rounded-lg px-3 py-2.5 text-sm font-semibold text-muted-foreground transition hover:bg-accent hover:text-foreground"
                      onClick={() => logout()}
                    >
                      Sign out
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="rounded-lg px-3 py-2.5 text-sm font-semibold text-muted-foreground transition hover:bg-accent hover:text-foreground"
                      onClick={() => openAuthModal('login')}
                    >
                      Sign in
                    </button>
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
