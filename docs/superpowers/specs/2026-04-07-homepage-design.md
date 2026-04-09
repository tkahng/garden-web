# Homepage Design Spec

**Date:** 2026-04-07
**Scope:** Storefront homepage (`/`) for `garden-web` React SPA + dev seed data runner in the Java backend

---

## Overview

Replace the current placeholder `src/routes/index.tsx` with a Dawn-inspired storefront homepage. The page has four sections stacked top-to-bottom: Hero, Featured Collection products grid, Collections grid, and Footer (existing). Data is fetched in a single route loader using three parallel API calls.

---

## Layout

Follows Shopify's Dawn theme — strict top-to-bottom section stack, no carousels or split layouts:

1. **Hero** — full-width banner with headline, subtitle, and two CTAs
2. **Featured Collection** — 4-column product grid from the first collection in the API
3. **Collections Grid** — 3-column grid of all collections
4. **Footer** — existing `Footer.tsx` component, unchanged

---

## API Integration

### Environment

`.env` file at the project root:

```
VITE_API_BASE_URL=http://localhost:8080
```

### `src/lib/api.ts`

Thin typed fetch wrappers. All functions throw on non-OK responses.

```ts
const base = () => import.meta.env.VITE_API_BASE_URL

getPage(handle: string): Promise<PageResponse>
// GET {base}/api/v1/pages/{handle}

listCollections(page: number, size: number): Promise<PagedResult<CollectionSummaryResponse>>
// GET {base}/api/v1/collections?page={page}&size={size}

listCollectionProducts(handle: string, page: number, size: number): Promise<PagedResult<CollectionProductResponse>>
// GET {base}/api/v1/collections/{handle}/products?page={page}&size={size}
```

Response types mirror the backend DTOs exactly:

```ts
interface PageResponse {
  id: string
  title: string
  handle: string
  body: string
  metaTitle: string | null
  metaDescription: string | null
  publishedAt: string
}

interface CollectionSummaryResponse {
  id: string
  title: string
  handle: string
}

interface CollectionProductResponse {
  id: string
  productId: string
  title: string
  handle: string
  position: number
}

interface PagedResult<T> {
  content: T[]
  meta: PageMeta
}

interface PageMeta {
  page: number
  size: number
  totalElements: number
  totalPages: number
}
```

### Route Loader

Defined on the `/` route. Fires three requests in parallel:

```ts
const [homePage, collections, featuredProducts] = await Promise.all([
  getPage('home').catch(() => null),           // null if page not seeded
  listCollections(0, 20),
  listCollectionProducts(firstHandle, 0, 4),   // first collection's handle
])
```

The featured collection handle comes from the first item in the collections response. If collections is empty, `featuredProducts` defaults to an empty list.

---

## Components

All sections live in `src/routes/index.tsx`. No new files created unless the file grows unwieldy. Uses existing shadcn/ui components and design tokens — no one-off styles.

### HeroSection

- Kicker (`.island-kicker`): static fallback text, or a hardcoded kicker string
- Headline (`.display-title`): `homePage?.title ?? 'Welcome to Garden'`
- Subtitle: `homePage?.body ?? 'Plants, seeds, and tools for every garden.'`
- CTA 1: "Shop Now" → `/products`
- CTA 2: "View Collections" → `/collections`
- Wraps in `.island-shell` with ambient glow blobs matching the existing index page pattern

### FeaturedCollection

- Section kicker: `.island-kicker` — "Featured Collection"
- Heading: `collections[0].title` rendered with `.display-title`
- "View all →" link: `/collections/{collections[0].handle}`
- 4-column responsive grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`)
- Each product: shadcn `Card` — placeholder image area (no image URL in `CollectionProductResponse`), product title, link to `/products/{handle}`

### CollectionsGrid

- Section kicker: `.island-kicker` — "Collections"
- Heading: "Shop by Category"
- 3-column responsive grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`)
- Each collection: shadcn `Card` — title, "Browse →" link to `/collections/{handle}`

---

## Error Handling

| Failure | Behavior |
|---|---|
| `getPage('home')` returns 404 | `.catch(() => null)` — hero renders with static fallback copy |
| `listCollections` fails | TanStack Router `errorComponent` on the route |
| `listCollectionProducts` fails | Same — route-level error boundary |
| Collections list is empty | Featured Collection section is hidden; Collections Grid shows empty state using shadcn `Empty` from `ui/empty.tsx` |

---

## File Changes

| File | Change |
|---|---|
| `.env` | Add `VITE_API_BASE_URL=http://localhost:8080` |
| `.env.example` | Add `VITE_API_BASE_URL=` (no value) |
| `src/lib/api.ts` | New — typed fetch wrappers + response interfaces |
| `src/routes/index.tsx` | Replace placeholder with homepage route + loader + sections |

No new route files. No new component files unless `index.tsx` exceeds ~200 lines.

**Backend (`garden`):**

| File | Change |
|---|---|
| `src/main/java/io/k2dv/garden/DevDataSeeder.java` | New — `@Profile("local") ApplicationRunner` seed bean |

---

## Dev Seed Data Runner (Backend)

A `@Profile("local")` Spring Boot `ApplicationRunner` bean that populates the database with realistic dev data on startup, idempotently (no-op if data already exists).

**Location:** `src/main/java/io/k2dv/garden/DevDataSeeder.java`

**Activation:** Only runs when `spring.profiles.active=local` (already the dev profile per `application-local.properties`).

**Idempotency:** Checks `SELECT COUNT(*) FROM catalog.products` before inserting. Skips entirely if count > 0.

**Seed data:**

| Table | Rows | Detail |
|---|---|---|
| `content.pages` | 1 | handle=`home`, status=`PUBLISHED`, title="Welcome to Garden", body="Seasonal plants, seeds, and tools for every garden.", `published_at`=now |
| `catalog.products` | 8 | status=`ACTIVE`, each with 1 variant (price, sku) |
| `catalog.product_variants` | 8 | One per product, `price` varies, `fulfillment_type`=`MANUAL`, `inventory_policy`=`DENY` |
| `inventory.inventory_items` | 8 | One per variant, `requires_shipping`=true |
| `catalog.collections` | 3 | status=`ACTIVE`, `collection_type`=`MANUAL` — "Seeds & Bulbs" (`seeds-bulbs`), "Tools & Supplies" (`tools-supplies`), "Pots & Planters" (`pots-planters`) |
| `catalog.collection_products` | 8 | Products distributed across collections (3 / 3 / 2) |

**Implementation:** Uses `JdbcTemplate` with raw SQL inserts (no service layer — avoids auth/permission checks on internal seeding). UUIDs generated with `UUID.randomUUID()` in Java.

**No images seeded** — product cards render a placeholder area when no images are present.

---

## Out of Scope

- Product detail page (`/products/:handle`)
- Collection detail page (`/collections/:handle`)
- Cart / add-to-cart functionality
- Product images (not available in `CollectionProductResponse`)
- Pagination on homepage sections
- OpenAPI codegen (deferred)
