# Header & Footer — Dawn-style Storefront Nav

**Date:** 2026-04-08  
**Branch:** feat/storefront

---

## Overview

Add a Dawn-inspired storefront header and footer to the garden-web app. Both components already exist as files (`src/components/Header.tsx`, `src/components/Footer.tsx`) but contain generic TanStack branding and are not wired into the root layout. This spec replaces their content with storefront-appropriate components and connects them in `__root.tsx`.

---

## Header

### Layout

Three-column flex row, `sticky top-0 z-50`, `backdrop-blur-lg`, `border-b border-[var(--line)]`, background `var(--header-bg)`.

| Zone  | Content |
|-------|---------|
| Left  | "The Garden Shop" wordmark as a `<Link to="/">` |
| Center | Nav links: Home (`/`), Products (`/products`), Collections (`/collections`), About (`/about`) |
| Right | Cart bag icon (non-functional `<button>` placeholder) + `ThemeToggle` |

### Active link styling

TanStack Router `activeProps` adds an underline or color change to the active nav link.

### Mobile behavior

- Center nav links hidden on small screens
- Hamburger icon shown on right (replaces cart + theme toggle area on mobile, or shown alongside them)
- Tapping hamburger opens a `Sheet` drawer (from `src/components/ui/sheet.tsx`) sliding in from the left
- Drawer contains: store name at top, stacked nav links, cart icon + ThemeToggle at the bottom

---

## Footer

### Layout

`border-t border-[var(--line)]`, background `var(--foam)` / `var(--header-bg)`.

**Desktop:** 3-column CSS grid  
**Mobile:** stacked single column

| Column | Content |
|--------|---------|
| 1 — Brand | "The Garden Shop" name, tagline ("Plants, seeds & tools for every garden."), social icon links (X, GitHub) |
| 2 — Shop | Heading "Shop", links: Products (`/products`), Collections (`/collections`) |
| 3 — Company | Heading "Company", links: About (`/about`), Home (`/`) |

**Bottom bar:** `border-t border-[var(--line)]`, copyright `© {year} The Garden Shop. All rights reserved.`

---

## Root layout wiring

`src/routes/__root.tsx` wraps `<Outlet />` with `<Header />` and `<Footer />` inside a flex column that fills the viewport height, pushing the footer to the bottom:

```tsx
<div className="flex min-h-screen flex-col">
  <Header />
  <Outlet />
  <Footer />
  {/* devtools */}
</div>
```

---

## Design tokens used

- `--sea-ink`, `--sea-ink-soft` — text
- `--lagoon-deep` — active/hover accent
- `--line` — borders
- `--header-bg`, `--foam` — backgrounds
- `--link-bg-hover` — hover state backgrounds

---

## Out of scope

- Cart functionality (icon is a non-functional placeholder)
- Search functionality
- Account/login icon
- Announcement bar
- Newsletter signup in footer
- Collections route (link points to `/collections` but that route does not yet exist — it will 404 gracefully)
