# Collections List & Detail Pages — Design Spec

**Date:** 2026-04-08
**Branch:** feat/collections

---

## Overview

Add two new routes to the garden-web storefront:

- `/collections` — paginated list of all collections
- `/collections/$handle` — detail page for a single collection, showing its products

---

## API

The frontend `src/lib/api.ts` already has:
- `listCollections(page, size)` → `PagedResult<CollectionSummaryResponse>`
- `listCollectionProducts(handle, page, size)` → `PagedResult<CollectionProductResponse>`
- `getCollection(handle)` → `CollectionDetailResponse` _(added during brainstorm)_

### Types in use

```ts
CollectionSummaryResponse  { id, title, handle }
CollectionDetailResponse   { id, title, handle, description: string | null, featuredImageUrl: string | null }
CollectionProductResponse  { id, productId, title, handle, position }
```

---

## Route: `/collections` — Collections List Page

**File:** `src/routes/collections/index.tsx`

### Search params
- `page: number` — 0-based page index, default `0`, validated same as products index

### Loader
```ts
listCollections(page, 20)
```

### Layout
- `<main class="page-wrap px-4 py-10">`
- `<header>`: "Collections" as `display-title` h1, subtitle showing total count
- `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` grid of collection cards
  - Each card: `island-shell feature-card rounded-2xl` with collection title and "Browse →" link to `/collections/$handle`
- `Pagination` component (imported from `../products/index`) if total > pageSize
- Empty state if no collections

---

## Route: `/collections/$handle` — Collection Detail Page

**File:** `src/routes/collections/$handle.tsx`

### Search params
- `page: number` — 0-based page index, default `0`

### Loader
```ts
Promise.all([
  getCollection(params.handle),
  listCollectionProducts(params.handle, page, 20),
])
```

### Layout
- **Banner image** (if `featuredImageUrl` present): full-width `aspect-[3/1]` `object-cover` image with `island-shell` rounded corners
- **Header:** `display-title` h1 with collection title
- **Description:** paragraph if `description` is present, styled `text-[var(--sea-ink-soft)]`
- **Product grid:** `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4` using `ProductCard` (imported from `../products/index`)
- **Empty state** if no products: centered message + link back to `/collections`
- **Pagination** if total > pageSize

---

## Component Reuse

| Component | Source | Used in |
|-----------|--------|---------|
| `Pagination` | `src/routes/products/index.tsx` | Both new routes |
| `ProductCard` | `src/routes/products/index.tsx` | Collection detail |

Both are already exported from their source files.

---

## Routing

TanStack Router uses file-based routing with a generated `routeTree.gen.ts`. After adding the new route files, `routeTree.gen.ts` must be regenerated (via `npm run dev` or the TanStack Router Vite plugin).

New entries expected in `routeTree.gen.ts`:
- `/collections/` → `src/routes/collections/index.tsx`
- `/collections/$handle` → `src/routes/collections/$handle.tsx`

---

## Tests

Each route file should have a companion test file mirroring the pattern of existing tests:
- `src/routes/collections/index.test.tsx`
- `src/routes/collections/$handle.test.tsx`

Tests should cover: renders with loader data, pagination visibility, empty state, banner image conditional rendering.
