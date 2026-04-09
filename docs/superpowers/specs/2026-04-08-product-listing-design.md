# Product Listing Page — Design Spec

**Date:** 2026-04-08
**Branch:** feat/storefront
**Theme:** Shopify Dawn-inspired

---

## Overview

A product listing page at `/products` that fetches a paginated, filterable list of products from the backend and renders them as Dawn-style portrait cards. Filters and pagination are URL-driven so they are shareable and work with the browser back button.

---

## Route & Data Loading

**File:** `src/routes/products/index.tsx`

This route coexists with `src/routes/products/$handle.tsx` — TanStack Router correctly maps `/products` to `index.tsx` and `/products/:handle` to `$handle.tsx`.

**Search params** (validated via `validateSearch`):

```ts
{ q?: string; vendor?: string; type?: string; page?: number }
```

- `q` → `titleContains` filter
- `vendor` → `vendor` filter
- `type` → `productType` filter
- `page` → zero-based page index, defaults to `0`, clamped to `0` if negative

The loader reads validated search params and calls `listProducts` which maps to:

```
GET /api/v1/products?titleContains={q}&vendor={vendor}&productType={type}&page={page}&size=20
```

**`src/lib/api.ts` additions:**

Update `ProductSummaryResponse` to match the backend record:

```ts
export interface ProductSummaryResponse {
  id: string
  title: string
  handle: string
  vendor: string | null
  featuredImageUrl: string | null
  priceMin: number | null
  priceMax: number | null
  compareAtPriceMin: number | null
  compareAtPriceMax: number | null
}
```

Add `listProducts` function:

```ts
export function listProducts(
  params: { q?: string; vendor?: string; type?: string; page?: number; size?: number }
): Promise<PagedResult<ProductSummaryResponse>>
// GET /api/v1/products with titleContains, vendor, productType, page, size query params
// Omits undefined params from the query string
```

---

## Components

All components are co-located in `src/routes/products/index.tsx`, following the pattern established by `index.tsx` (homepage) and `$handle.tsx` (PDP).

### `ProductListingPage`

Root component. Calls `Route.useLoaderData()` and `Route.useSearch()`. Renders `FilterBar`, `ProductGrid`, and `Pagination` in a single-column layout inside `page-wrap`.

### `FilterBar`

Props: `search: { q?: string; vendor?: string; type?: string }`, `onSearch: (updates: Partial<Search>) => void`

Renders a horizontal flex row:
- **Title search input** — text input bound to `q`, debounced 300ms. Placeholder: "Search products…"
- **Vendor dropdown** — `<select>` for `vendor`. Only rendered when a vendor value is already present in the URL (no backend endpoint for distinct vendor values yet). Includes an "All vendors" empty option.
- **Product type dropdown** — same pattern as vendor, keyed to `type`.
- **Clear filters link** — rendered when any of `q`, `vendor`, or `type` is set. Navigates to `/products` with no search params.

Changing any filter resets `page` to `0`.

### `ProductCard`

Props: `product: ProductSummaryResponse`

Rendered as an `<a href="/products/{handle}">` wrapping the full card. Structure:

1. **Image area** — `aspect-[3/4]` container. Renders `<img src={featuredImageUrl}>` if present, otherwise a lagoon-tinted placeholder div. `island-shell` class on the wrapper.
2. **Title** — bold, `text-[var(--sea-ink)]`
3. **Vendor** — muted small text `text-[var(--sea-ink-soft)]`, omitted if null
4. **Price** — formatted with `Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })`:
   - Omitted entirely if `priceMin` is null
   - Single price if `priceMin === priceMax`: `$X`
   - Range if they differ: `$X – $Y`
   - Compare-at strikethrough (`compareAtPriceMin` formatted, `line-through` class) shown when `compareAtPriceMin != null && compareAtPriceMin > priceMin`

### `Pagination`

Props: `page: number`, `total: number`, `pageSize: number`, `onPage: (page: number) => void`

Renders:
- **Prev** button — disabled when `page === 0`
- **"Page N of M"** label — `N = page + 1`, `M = Math.ceil(total / pageSize)`
- **Next** button — disabled when on the last page
- Hidden entirely when `total <= pageSize` (only one page)

`onPage` navigates by updating the `page` search param while keeping other params intact.

---

## Page Layout

```
<main class="page-wrap px-4 py-10">
  <header>               ← title + product count
  <FilterBar />
  <ProductGrid />        ← grid of ProductCard, 2 cols mobile / 3 cols sm / 4 cols lg
  <Pagination />
</main>
```

The page header shows "Products" as an `h1` and the total result count as muted text (e.g. "24 products").

---

## Error Handling & Edge Cases

| Scenario | Behavior |
|---|---|
| No products match filters | Empty state: "No products found." + "Clear filters" link |
| `featuredImageUrl` is null | Lagoon-tinted placeholder div in the image area |
| `priceMin` is null | Price section omitted from card |
| `priceMin === priceMax` | Single price displayed |
| `priceMin !== priceMax` | Price range `$X – $Y` displayed |
| `compareAtPriceMin > priceMin` | Compare-at shown with strikethrough |
| `page` param negative or NaN | Clamped to `0` in `validateSearch` |
| Page beyond total | Backend returns empty content; UI shows empty state |
| Vendor/type dropdown with no known values | Dropdowns hidden (no backend endpoint for distinct values) |

---

## Out of Scope

- Sorting options (backend sorts by `createdAt` descending, fixed)
- Distinct vendor/type values from backend (no API endpoint exists)
- Collection-filtered product lists (handled by the future collection detail page)
- Infinite scroll or "load more" pagination
