# Header & Footer — Dawn-style Storefront Nav Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the existing placeholder Header and Footer with Dawn-inspired storefront components and wire them into the root layout.

**Architecture:** Rewrite `Header.tsx` (sticky, 3-zone: logo / nav / icons, mobile Sheet drawer) and `Footer.tsx` (3-column grid: brand + Shop links + Company links), then wrap `<Outlet />` with them in `__root.tsx`. Footer uses plain `<a>` tags; Header uses TanStack Router `<Link>` for active-state styling.

**Tech Stack:** React, TanStack Router (`Link`, `activeProps`), `@phosphor-icons/react` (ShoppingBagIcon, ListIcon), `Sheet` from `src/components/ui/sheet.tsx`, Vitest + @testing-library/react.

---

## File Map

| Action | Path | Responsibility |
|--------|------|---------------|
| Modify | `src/routes/__root.tsx` | Wrap `<Outlet />` with `<Header />` and `<Footer />` |
| Modify | `src/components/Footer.tsx` | Dawn-style 3-column footer |
| Create | `src/components/Footer.test.tsx` | Unit tests for Footer |
| Modify | `src/components/Header.tsx` | Dawn-style header: logo / nav / cart + theme toggle, mobile drawer |
| Create | `src/components/Header.test.tsx` | Unit tests for Header |

---

## Task 1: Wire Header and Footer into root layout

**Files:**
- Modify: `src/routes/__root.tsx`

- [ ] **Step 1: Update `__root.tsx` to import and render Header + Footer**

Replace the entire file content with:

```tsx
import { Outlet, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import Header from '#/components/Header'
import Footer from '#/components/Footer'

import '../styles.css'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <>
      <div className="flex min-h-screen flex-col">
        <Header />
        <Outlet />
        <Footer />
      </div>
      <TanStackDevtools
        config={{
          position: 'bottom-right',
        }}
        plugins={[
          {
            name: 'TanStack Router',
            render: <TanStackRouterDevtoolsPanel />,
          },
        ]}
      />
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/routes/__root.tsx
git commit -m "feat: wire Header and Footer into root layout"
```

---

## Task 2: Rewrite Footer

**Files:**
- Modify: `src/components/Footer.tsx`
- Create: `src/components/Footer.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/components/Footer.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Footer from './Footer'

describe('Footer', () => {
  it('renders the store name', () => {
    render(<Footer />)
    expect(screen.getByText('The Garden Shop')).toBeInTheDocument()
  })

  it('renders the brand tagline', () => {
    render(<Footer />)
    expect(screen.getByText(/Plants, seeds & tools/i)).toBeInTheDocument()
  })

  it('renders Shop column with Products and Collections links', () => {
    render(<Footer />)
    expect(screen.getByRole('link', { name: 'Products' })).toHaveAttribute('href', '/products')
    expect(screen.getByRole('link', { name: 'Collections' })).toHaveAttribute('href', '/collections')
  })

  it('renders Company column with About and Home links', () => {
    render(<Footer />)
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about')
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/')
  })

  it('renders copyright with current year', () => {
    render(<Footer />)
    const year = new Date().getFullYear()
    expect(screen.getByText(new RegExp(`© ${year}`))).toBeInTheDocument()
  })

  it('renders social links for X and GitHub', () => {
    render(<Footer />)
    expect(screen.getByRole('link', { name: /Follow.*on X/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /GitHub/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/components/Footer.test.tsx
```

Expected: FAIL — the current Footer does not have the required structure.

- [ ] **Step 3: Rewrite `src/components/Footer.tsx`**

```tsx
export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-[var(--line)] bg-[var(--foam)] px-4 py-12">
      <div className="page-wrap">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
          {/* Col 1 — Brand */}
          <div>
            <p className="text-base font-bold text-[var(--sea-ink)]">The Garden Shop</p>
            <p className="mt-2 text-sm text-[var(--sea-ink-soft)]">
              Plants, seeds & tools for every garden.
            </p>
            <div className="mt-5 flex items-center gap-2">
              <a
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Follow The Garden Shop on X"
                className="rounded-lg p-2 text-[var(--sea-ink-soft)] transition hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)]"
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
                className="rounded-lg p-2 text-[var(--sea-ink-soft)] transition hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)]"
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
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--sea-ink-soft)]">
              Shop
            </p>
            <ul className="mt-4 space-y-3">
              <li>
                <a
                  href="/products"
                  className="text-sm text-[var(--sea-ink)] no-underline transition hover:text-[var(--lagoon-deep)]"
                >
                  Products
                </a>
              </li>
              <li>
                <a
                  href="/collections"
                  className="text-sm text-[var(--sea-ink)] no-underline transition hover:text-[var(--lagoon-deep)]"
                >
                  Collections
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3 — Company */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--sea-ink-soft)]">
              Company
            </p>
            <ul className="mt-4 space-y-3">
              <li>
                <a
                  href="/about"
                  className="text-sm text-[var(--sea-ink)] no-underline transition hover:text-[var(--lagoon-deep)]"
                >
                  About
                </a>
              </li>
              <li>
                <a
                  href="/"
                  className="text-sm text-[var(--sea-ink)] no-underline transition hover:text-[var(--lagoon-deep)]"
                >
                  Home
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 border-t border-[var(--line)] pt-6">
          <p className="text-sm text-[var(--sea-ink-soft)]">
            &copy; {year} The Garden Shop. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/components/Footer.test.tsx
```

Expected: all 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/Footer.tsx src/components/Footer.test.tsx
git commit -m "feat: rewrite Footer as Dawn-style 3-column storefront footer"
```

---

## Task 3: Rewrite Header — desktop layout

**Files:**
- Modify: `src/components/Header.tsx`
- Create: `src/components/Header.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/components/Header.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Header from './Header'

// Mock TanStack Router Link as a plain anchor so tests run without a full router context
vi.mock('@tanstack/react-router', () => ({
  Link: ({
    to,
    children,
    className,
    activeProps: _activeProps,
  }: {
    to: string
    children: React.ReactNode
    className?: string
    activeProps?: unknown
  }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}))

describe('Header', () => {
  it('renders the store wordmark linking to /', () => {
    render(<Header />)
    const logo = screen.getByRole('link', { name: /The Garden Shop/i })
    expect(logo).toHaveAttribute('href', '/')
  })

  it('renders desktop nav link for Home', () => {
    render(<Header />)
    const homeLinks = screen.getAllByRole('link', { name: 'Home' })
    expect(homeLinks.length).toBeGreaterThanOrEqual(1)
  })

  it('renders desktop nav link for Products', () => {
    render(<Header />)
    expect(screen.getAllByRole('link', { name: 'Products' }).length).toBeGreaterThanOrEqual(1)
  })

  it('renders desktop nav link for Collections', () => {
    render(<Header />)
    expect(screen.getAllByRole('link', { name: 'Collections' }).length).toBeGreaterThanOrEqual(1)
  })

  it('renders desktop nav link for About', () => {
    render(<Header />)
    expect(screen.getAllByRole('link', { name: 'About' }).length).toBeGreaterThanOrEqual(1)
  })

  it('renders a cart button', () => {
    render(<Header />)
    expect(screen.getByRole('button', { name: /cart/i })).toBeInTheDocument()
  })

  it('renders the mobile menu button', () => {
    render(<Header />)
    expect(screen.getByRole('button', { name: /open.*menu/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/components/Header.test.tsx
```

Expected: FAIL — the current Header does not have the required structure.

- [ ] **Step 3: Rewrite `src/components/Header.tsx`**

```tsx
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
  'text-sm font-semibold text-[var(--sea-ink)] no-underline border-b-2 border-[var(--lagoon-deep)]'

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
                        'rounded-lg px-3 py-2.5 text-sm font-semibold text-[var(--sea-ink)] no-underline bg-[rgba(79,184,178,0.1)]',
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/components/Header.test.tsx
```

Expected: all 7 tests PASS.

- [ ] **Step 5: Run the full test suite to check for regressions**

```bash
npx vitest run
```

Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/Header.tsx src/components/Header.test.tsx
git commit -m "feat: rewrite Header as Dawn-style storefront header with mobile drawer"
```
