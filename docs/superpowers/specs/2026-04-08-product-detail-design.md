# Product Detail Page — Design Spec

**Date:** 2026-04-08  
**Branch:** feat/storefront  
**Theme:** Shopify Dawn-inspired

---

## Overview

A product detail page (PDP) at `/products/:handle` that fetches product data from the backend and renders it in a Dawn-style two-column layout. This page is read-only — no cart functionality, just a placeholder Add to Cart button.

---

## Route & Data Loading

**File:** `src/routes/products/$handle.tsx`

- TanStack Router file-based route, param `$handle`
- Loader calls `getProduct(handle)` → `GET /api/v1/products/{handle}`
- A 404 from the backend throws and bubbles to the root error boundary

**`src/lib/api.ts` additions:**

New types (mirroring backend DTOs exactly):

```ts
interface OptionValueLabel { optionName: string; valueLabel: string }

interface ProductVariantResponse {
  id: string
  title: string
  sku: string | null
  price: number          // BigDecimal serialized as JSON number by default
  compareAtPrice: number | null
  optionValues: OptionValueLabel[]
  fulfillmentType: string
  inventoryPolicy: string
  leadTimeDays: number
}

interface ProductImageResponse {
  id: string
  url: string
  altText: string | null
  position: number
}

interface ProductDetailResponse {
  id: string
  title: string
  description: string | null
  handle: string
  vendor: string | null
  productType: string | null
  variants: ProductVariantResponse[]
  images: ProductImageResponse[]
  tags: string[]
}
```

New function:

```ts
function getProduct(handle: string): Promise<ProductDetailResponse>
// GET /api/v1/products/{handle}
```

---

## Page Layout

```
<main class="page-wrap px-4 py-10">
  <div class="grid lg:grid-cols-2 gap-12">
    <ProductGallery />   ← left column
    <ProductInfo />      ← right column
  </div>
</main>
```

All components are co-located in the route file, following the pattern established in `src/routes/index.tsx`.

---

## Components

### `ProductGallery`

Props: `images: ProductImageResponse[]`, `activeIndex: number`, `onSelect: (i: number) => void`

- **Featured image**: tall aspect-ratio container (`aspect-[4/5]`), renders `<img>` if images exist, otherwise a lagoon-tinted placeholder div
- **Thumbnail strip**: horizontal flex row below the featured image; each thumbnail is a small square with `border-2` highlight on the active one; scrollable if many images

### `ProductInfo`

Props: full `ProductDetailResponse` + `selectedOptions: Record<string, string>` + `setSelectedOptions` + `activeVariant: ProductVariantResponse | undefined`

Renders top-to-bottom:

1. **Kicker line** — vendor and/or productType in `island-kicker` style (omitted if both null)
2. **Title** — `<h1>` with `display-title` class
3. **Price** — `activeVariant.price` formatted as currency; `compareAtPrice` shown with strikethrough if present; hidden entirely if no variants
4. **Option selectors** — one labeled group per unique option name; options whose name contains "color" (case-insensitive) render as circular swatches, all others as pill buttons; selected state shown with lagoon-deep border + tinted background
5. **Add to Cart** — full-width button, lagoon-deep fill, rounded-full, disabled + "Unavailable" label if no variants
6. **Description** — rendered via `dangerouslySetInnerHTML` (backend stores HTML); wrapped in `prose` Tailwind Typography class; omitted if null
7. **Tags** — small chips at the bottom; omitted if empty array

---

## Variant Selection Logic

State lives in `ProductDetailPage`, initialized from the first variant's option values:

```ts
const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(
  () => Object.fromEntries(
    variants[0]?.optionValues.map(v => [v.optionName, v.valueLabel]) ?? []
  )
)
```

Active variant derived on each render:

```ts
const activeVariant = variants.find(v =>
  v.optionValues.every(ov => selectedOptions[ov.optionName] === ov.valueLabel)
) ?? variants[0]
```

Gallery index state (`activeGalleryIndex`) is separate `useState(0)`. No automatic variant→image sync (backend doesn't link them).

---

## Error Handling & Edge Cases

| Scenario | Behavior |
|---|---|
| No images | Gallery shows lagoon-tinted placeholder box |
| No variants | Price hidden; Add to Cart disabled with "Unavailable" |
| Single variant (no options) | Option selector section not rendered |
| Product not found (404) | Loader throws → root error boundary |

---

## Out of Scope

- Cart / checkout functionality
- Inventory availability per option (greyed-out unavailable options)
- Quantity selector
- Recently viewed / related products
- URL-encoded variant selection (shareable variant URLs)
