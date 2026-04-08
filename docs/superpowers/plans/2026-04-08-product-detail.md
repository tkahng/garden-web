# Product Detail Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `/products/:handle` product detail page with a Dawn-style two-column layout, image gallery, variant selectors, and a placeholder Add to Cart button.

**Architecture:** Single route file `src/routes/products/$handle.tsx` with co-located components (`ProductGallery`, `ProductInfo`, `ProductDetailPage`). `ProductDetailPage` owns `selectedOptions` state and derives `activeVariant`; both are passed as props to `ProductInfo`. `ProductGallery` receives `images`, `activeIndex`, and `onSelect` as props.

**Tech Stack:** React 18, TanStack Router v1, TypeScript, Tailwind CSS, Vitest + @testing-library/react

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `src/lib/api.ts` | Add `OptionValueLabel`, `ProductVariantResponse`, `ProductImageResponse`, `ProductDetailResponse` types + `getProduct` function |
| Modify | `src/lib/api.test.ts` | Add `getProduct` tests |
| Create | `src/routes/products/$handle.tsx` | Route + `ProductGallery`, `ProductInfo`, `ProductDetailPage` |
| Create | `src/routes/products/$handle.test.tsx` | Component unit tests |
| Auto-updated | `src/routeTree.gen.ts` | Updated by TanStack Router Vite plugin on `npm run dev` |

---

### Task 1: Add API types and getProduct function

**Files:**
- Modify: `src/lib/api.ts`
- Modify: `src/lib/api.test.ts`

- [ ] **Step 1: Add failing tests for `getProduct`**

Append to `src/lib/api.test.ts`:

```ts
import {
  getPage, listCollections, listCollectionProducts, getProduct,
  type ProductDetailResponse,
} from './api'
```

Replace the existing import line (currently only imports the first three functions) with the above.

Then append these tests at the end of the file:

```ts
describe('getProduct', () => {
  it('fetches the correct URL and returns the data field', async () => {
    const product: ProductDetailResponse = {
      id: 'p1',
      title: 'Heirloom Tomato Seeds',
      description: '<p>Rich flavor.</p>',
      handle: 'heirloom-tomato-seeds',
      vendor: 'Garden Co',
      productType: 'Seeds',
      variants: [],
      images: [],
      tags: ['organic'],
    }
    vi.stubGlobal('fetch', mockFetch({ data: product }))

    const result = await getProduct('heirloom-tomato-seeds')

    expect(fetch).toHaveBeenCalledWith(`${BASE}/api/v1/products/heirloom-tomato-seeds`)
    expect(result).toEqual(product)
  })

  it('throws on non-ok response', async () => {
    vi.stubGlobal('fetch', mockFetch({ error: 'Not Found' }, 404))
    await expect(getProduct('unknown')).rejects.toThrow('HTTP 404')
  })
})
```

- [ ] **Step 2: Run tests and verify they fail**

```bash
cd /Users/tkahng/github/tkahng/react/garden-web && npm test -- --reporter=verbose 2>&1 | tail -20
```

Expected: FAIL — `getProduct` is not exported from `./api`, and `ProductDetailResponse` type does not exist.

- [ ] **Step 3: Add types and getProduct to api.ts**

Append to `src/lib/api.ts` after the existing exports:

```ts
export interface OptionValueLabel {
  optionName: string
  valueLabel: string
}

export interface ProductVariantResponse {
  id: string
  title: string
  sku: string | null
  price: number
  compareAtPrice: number | null
  optionValues: OptionValueLabel[]
  fulfillmentType: string
  inventoryPolicy: string
  leadTimeDays: number
}

export interface ProductImageResponse {
  id: string
  url: string
  altText: string | null
  position: number
}

export interface ProductDetailResponse {
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

export function getProduct(handle: string): Promise<ProductDetailResponse> {
  return apiFetch(`/api/v1/products/${handle}`)
}
```

- [ ] **Step 4: Run tests and verify they pass**

```bash
cd /Users/tkahng/github/tkahng/react/garden-web && npm test -- --reporter=verbose 2>&1 | tail -20
```

Expected: All tests pass including the two new `getProduct` tests.

- [ ] **Step 5: Commit**

```bash
cd /Users/tkahng/github/tkahng/react/garden-web && git add src/lib/api.ts src/lib/api.test.ts && git commit -m "feat: add ProductDetailResponse types and getProduct API function"
```

---

### Task 2: ProductGallery component

**Files:**
- Create: `src/routes/products/$handle.tsx`
- Create: `src/routes/products/$handle.test.tsx`

- [ ] **Step 1: Create the test file with failing gallery tests**

Create `src/routes/products/$handle.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { ProductImageResponse } from '#/lib/api'
import { ProductGallery } from './$handle'

const mockImages: ProductImageResponse[] = [
  { id: 'img1', url: 'https://example.com/img1.jpg', altText: 'Front view', position: 1 },
  { id: 'img2', url: 'https://example.com/img2.jpg', altText: 'Side view', position: 2 },
]

describe('ProductGallery', () => {
  it('renders a placeholder when images array is empty', () => {
    render(<ProductGallery images={[]} activeIndex={0} onSelect={vi.fn()} />)
    expect(screen.getByTestId('gallery-placeholder')).toBeInTheDocument()
  })

  it('renders the featured image at activeIndex', () => {
    render(<ProductGallery images={mockImages} activeIndex={1} onSelect={vi.fn()} />)
    const featured = screen.getByTestId('featured-image')
    expect(featured).toHaveAttribute('src', 'https://example.com/img2.jpg')
    expect(featured).toHaveAttribute('alt', 'Side view')
  })

  it('does not render thumbnail strip for a single image', () => {
    render(<ProductGallery images={[mockImages[0]]} activeIndex={0} onSelect={vi.fn()} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('renders a thumbnail button per image when multiple images exist', () => {
    render(<ProductGallery images={mockImages} activeIndex={0} onSelect={vi.fn()} />)
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(2)
  })

  it('calls onSelect with the correct index when a thumbnail is clicked', () => {
    const onSelect = vi.fn()
    render(<ProductGallery images={mockImages} activeIndex={0} onSelect={onSelect} />)
    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[1])
    expect(onSelect).toHaveBeenCalledWith(1)
  })
})
```

- [ ] **Step 2: Run tests and verify they fail**

```bash
cd /Users/tkahng/github/tkahng/react/garden-web && npm test -- --reporter=verbose 2>&1 | tail -20
```

Expected: FAIL — `ProductGallery` is not exported from `./$handle` (file doesn't exist yet).

- [ ] **Step 3: Create the route file with ProductGallery**

Create `src/routes/products/$handle.tsx`:

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { getProduct } from '#/lib/api'
import type {
  ProductDetailResponse,
  ProductVariantResponse,
  ProductImageResponse,
} from '#/lib/api'

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/products/$handle')({
  loader: ({ params }) => getProduct(params.handle),
  component: ProductDetailPage,
})

// ─── ProductGallery ───────────────────────────────────────────────────────────

export function ProductGallery({
  images,
  activeIndex,
  onSelect,
}: {
  images: ProductImageResponse[]
  activeIndex: number
  onSelect: (i: number) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="island-shell aspect-[4/5] w-full overflow-hidden rounded-2xl bg-[rgba(79,184,178,0.08)]">
        {images.length > 0 ? (
          <img
            data-testid="featured-image"
            src={images[activeIndex].url}
            alt={images[activeIndex].altText ?? ''}
            className="h-full w-full object-cover"
          />
        ) : (
          <div data-testid="gallery-placeholder" className="h-full w-full" />
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => onSelect(i)}
              aria-label={img.altText ?? `Image ${i + 1}`}
              className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition ${
                i === activeIndex
                  ? 'border-[var(--lagoon-deep)]'
                  : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <img src={img.url} alt={img.altText ?? ''} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── ProductInfo (placeholder) ────────────────────────────────────────────────

export function ProductInfo(_props: {
  product: ProductDetailResponse
  selectedOptions: Record<string, string>
  setSelectedOptions: (opts: Record<string, string>) => void
  activeVariant: ProductVariantResponse | undefined
}) {
  return <div />
}

// ─── ProductDetailPage ────────────────────────────────────────────────────────

function ProductDetailPage() {
  const product = Route.useLoaderData()
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(
    () =>
      Object.fromEntries(
        product.variants[0]?.optionValues.map((v) => [v.optionName, v.valueLabel]) ?? [],
      ),
  )
  const activeVariant =
    product.variants.find((v) =>
      v.optionValues.every((ov) => selectedOptions[ov.optionName] === ov.valueLabel),
    ) ?? product.variants[0]

  return (
    <main className="page-wrap px-4 py-10">
      <div className="grid gap-12 lg:grid-cols-2">
        <ProductGallery
          images={product.images}
          activeIndex={activeGalleryIndex}
          onSelect={setActiveGalleryIndex}
        />
        <ProductInfo
          product={product}
          selectedOptions={selectedOptions}
          setSelectedOptions={setSelectedOptions}
          activeVariant={activeVariant}
        />
      </div>
    </main>
  )
}
```

- [ ] **Step 4: Run tests and verify they pass**

```bash
cd /Users/tkahng/github/tkahng/react/garden-web && npm test -- --reporter=verbose 2>&1 | tail -20
```

Expected: All 5 `ProductGallery` tests pass.

- [ ] **Step 5: Commit**

```bash
cd /Users/tkahng/github/tkahng/react/garden-web && git add src/routes/products/ && git commit -m "feat: add ProductGallery component with featured image and thumbnail strip"
```

---

### Task 3: ProductInfo — static rendering

**Files:**
- Modify: `src/routes/products/$handle.tsx` (fill in `ProductInfo`)
- Modify: `src/routes/products/$handle.test.tsx` (add static rendering tests)

- [ ] **Step 1: Add failing tests for static ProductInfo rendering**

Append to `src/routes/products/$handle.test.tsx`:

```tsx
import type { ProductDetailResponse, ProductVariantResponse } from '#/lib/api'
import { ProductInfo } from './$handle'
```

Add this import at the top (merge with the existing import line for `ProductGallery`):

```tsx
import { ProductGallery, ProductInfo } from './$handle'
```

Then append these tests at the end of the file:

```tsx
const mockVariants: ProductVariantResponse[] = [
  {
    id: 'v1',
    title: 'S / Lagoon',
    sku: 'SKU-001',
    price: 19.99,
    compareAtPrice: 24.99,
    optionValues: [
      { optionName: 'Size', valueLabel: 'S' },
      { optionName: 'Color', valueLabel: 'Lagoon' },
    ],
    fulfillmentType: 'PHYSICAL',
    inventoryPolicy: 'DENY',
    leadTimeDays: 0,
  },
  {
    id: 'v2',
    title: 'M / Lagoon',
    sku: 'SKU-002',
    price: 21.99,
    compareAtPrice: null,
    optionValues: [
      { optionName: 'Size', valueLabel: 'M' },
      { optionName: 'Color', valueLabel: 'Lagoon' },
    ],
    fulfillmentType: 'PHYSICAL',
    inventoryPolicy: 'DENY',
    leadTimeDays: 0,
  },
]

const mockProduct: ProductDetailResponse = {
  id: 'p1',
  title: 'Heirloom Tomato Seeds',
  description: '<p>Rich flavor.</p>',
  handle: 'heirloom-tomato-seeds',
  vendor: 'Garden Co',
  productType: 'Seeds',
  variants: mockVariants,
  images: mockImages,
  tags: ['organic', 'heirloom'],
}

const defaultProps = {
  product: mockProduct,
  selectedOptions: { Size: 'S', Color: 'Lagoon' },
  setSelectedOptions: vi.fn(),
  activeVariant: mockVariants[0],
}

describe('ProductInfo — static rendering', () => {
  it('renders the product title in an h1', () => {
    render(<ProductInfo {...defaultProps} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Heirloom Tomato Seeds')
  })

  it('renders vendor and productType in the kicker', () => {
    render(<ProductInfo {...defaultProps} />)
    expect(screen.getByText(/Garden Co/)).toBeInTheDocument()
    expect(screen.getByText(/Seeds/)).toBeInTheDocument()
  })

  it('omits the kicker when vendor and productType are both null', () => {
    const props = {
      ...defaultProps,
      product: { ...mockProduct, vendor: null, productType: null },
    }
    render(<ProductInfo {...props} />)
    expect(screen.queryByTestId('product-kicker')).not.toBeInTheDocument()
  })

  it('renders the description as HTML', () => {
    render(<ProductInfo {...defaultProps} />)
    expect(screen.getByTestId('product-description')).toContainHTML('<p>Rich flavor.</p>')
  })

  it('omits the description section when description is null', () => {
    const props = { ...defaultProps, product: { ...mockProduct, description: null } }
    render(<ProductInfo {...props} />)
    expect(screen.queryByTestId('product-description')).not.toBeInTheDocument()
  })

  it('renders each tag as a chip', () => {
    render(<ProductInfo {...defaultProps} />)
    expect(screen.getByText('organic')).toBeInTheDocument()
    expect(screen.getByText('heirloom')).toBeInTheDocument()
  })

  it('omits the tags section when tags array is empty', () => {
    const props = { ...defaultProps, product: { ...mockProduct, tags: [] } }
    render(<ProductInfo {...props} />)
    expect(screen.queryByTestId('product-tags')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests and verify they fail**

```bash
cd /Users/tkahng/github/tkahng/react/garden-web && npm test -- --reporter=verbose 2>&1 | tail -30
```

Expected: FAIL — `ProductInfo` renders `<div />` so all assertions fail.

- [ ] **Step 3: Replace ProductInfo placeholder with static implementation**

Replace the `ProductInfo` function in `src/routes/products/$handle.tsx` with:

```tsx
export function ProductInfo({
  product,
  selectedOptions,
  setSelectedOptions,
  activeVariant,
}: {
  product: ProductDetailResponse
  selectedOptions: Record<string, string>
  setSelectedOptions: (opts: Record<string, string>) => void
  activeVariant: ProductVariantResponse | undefined
}) {
  const hasKicker = product.vendor != null || product.productType != null
  const kicker = [product.vendor, product.productType].filter(Boolean).join(' · ')

  const optionGroups = buildOptionGroups(product.variants)

  return (
    <div className="flex flex-col gap-6">
      {/* Kicker */}
      {hasKicker && (
        <p data-testid="product-kicker" className="island-kicker text-sm">
          {kicker}
        </p>
      )}

      {/* Title */}
      <h1 className="display-title text-3xl font-bold leading-tight text-[var(--sea-ink)] sm:text-4xl">
        {product.title}
      </h1>

      {/* Price */}
      {activeVariant != null && (
        <div className="flex items-baseline gap-3">
          <span className="text-2xl font-bold text-[var(--sea-ink)]">
            {formatPrice(activeVariant.price)}
          </span>
          {activeVariant.compareAtPrice != null && (
            <span className="text-base text-[var(--sea-ink-soft)] line-through">
              {formatPrice(activeVariant.compareAtPrice)}
            </span>
          )}
        </div>
      )}

      {/* Option selectors */}
      {optionGroups.length > 0 && (
        <div className="flex flex-col gap-4">
          {optionGroups.map(([name, values]) => (
            <div key={name}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--sea-ink-soft)]">
                {name}
              </p>
              <div className="flex flex-wrap gap-2">
                {values.map((value) => {
                  const isSelected = selectedOptions[name] === value
                  const isColorOption = name.toLowerCase().includes('color')
                  return isColorOption ? (
                    <button
                      key={value}
                      onClick={() => setSelectedOptions({ ...selectedOptions, [name]: value })}
                      aria-label={value}
                      title={value}
                      className={`h-8 w-8 rounded-full border-2 transition ${
                        isSelected
                          ? 'border-[var(--lagoon-deep)] ring-2 ring-[var(--lagoon-deep)] ring-offset-2'
                          : 'border-[var(--line)] hover:border-[var(--lagoon-deep)]'
                      }`}
                      style={{ backgroundColor: resolveColor(value) }}
                    />
                  ) : (
                    <button
                      key={value}
                      onClick={() => setSelectedOptions({ ...selectedOptions, [name]: value })}
                      className={`rounded-lg border-2 px-3 py-1.5 text-sm font-semibold transition ${
                        isSelected
                          ? 'border-[var(--lagoon-deep)] bg-[rgba(79,184,178,0.12)] text-[var(--sea-ink)]'
                          : 'border-[var(--line)] bg-white text-[var(--sea-ink-soft)] hover:border-[var(--lagoon-deep)]'
                      }`}
                    >
                      {value}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add to Cart */}
      <button
        disabled={activeVariant == null}
        className="w-full rounded-full bg-[var(--lagoon-deep)] px-6 py-3.5 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {activeVariant == null ? 'Unavailable' : 'Add to cart'}
      </button>

      {/* Description */}
      {product.description != null && (
        <div
          data-testid="product-description"
          className="prose prose-sm max-w-none text-[var(--sea-ink-soft)]"
          dangerouslySetInnerHTML={{ __html: product.description }}
        />
      )}

      {/* Tags */}
      {product.tags.length > 0 && (
        <div data-testid="product-tags" className="flex flex-wrap gap-2">
          {product.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-[var(--line)] bg-[rgba(79,184,178,0.08)] px-3 py-1 text-xs font-medium text-[var(--sea-ink-soft)]"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
```

Also add these two helper functions above `ProductGallery` in the file (after the imports):

```tsx
// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

const COLOR_MAP: Record<string, string> = {
  lagoon: '#4fb8b2',
  'lagoon deep': '#328f97',
  palm: '#2f6a4a',
  sand: '#e7f0e8',
  foam: '#f3faf5',
  white: '#ffffff',
  black: '#173a40',
  green: '#2f6a4a',
  teal: '#4fb8b2',
}

function resolveColor(value: string): string {
  return COLOR_MAP[value.toLowerCase()] ?? '#cde8e5'
}

function buildOptionGroups(variants: ProductVariantResponse[]): [string, string[]][] {
  const map = new Map<string, string[]>()
  for (const variant of variants) {
    for (const ov of variant.optionValues) {
      if (!map.has(ov.optionName)) map.set(ov.optionName, [])
      const values = map.get(ov.optionName)!
      if (!values.includes(ov.valueLabel)) values.push(ov.valueLabel)
    }
  }
  return Array.from(map.entries())
}
```

- [ ] **Step 4: Run tests and verify they pass**

```bash
cd /Users/tkahng/github/tkahng/react/garden-web && npm test -- --reporter=verbose 2>&1 | tail -30
```

Expected: All `ProductInfo — static rendering` tests pass (7 tests).

- [ ] **Step 5: Commit**

```bash
cd /Users/tkahng/github/tkahng/react/garden-web && git add src/routes/products/ && git commit -m "feat: add ProductInfo static rendering (title, vendor, description, tags)"
```

---

### Task 4: ProductInfo — variant selection, price, and option selectors

**Files:**
- Modify: `src/routes/products/$handle.test.tsx` (add variant/option tests)

The implementation for price and options was already added in Task 3's `ProductInfo`. This task adds tests to verify that behavior.

- [ ] **Step 1: Add failing tests for price and variant selection**

Append to `src/routes/products/$handle.test.tsx`:

```tsx
describe('ProductInfo — price and variant selection', () => {
  it('renders the price from activeVariant', () => {
    render(<ProductInfo {...defaultProps} />)
    expect(screen.getByText('$19.99')).toBeInTheDocument()
  })

  it('renders compareAtPrice with line-through class when present', () => {
    render(<ProductInfo {...defaultProps} />)
    const comparePrice = screen.getByText('$24.99')
    expect(comparePrice).toBeInTheDocument()
    expect(comparePrice).toHaveClass('line-through')
  })

  it('hides the price section when activeVariant is undefined', () => {
    render(<ProductInfo {...defaultProps} activeVariant={undefined} />)
    expect(screen.queryByText('$19.99')).not.toBeInTheDocument()
  })

  it('renders an option group label for each unique option name', () => {
    render(<ProductInfo {...defaultProps} />)
    expect(screen.getByText('SIZE')).toBeInTheDocument()
    expect(screen.getByText('COLOR')).toBeInTheDocument()
  })

  it('renders pill buttons for non-color option values', () => {
    render(<ProductInfo {...defaultProps} />)
    expect(screen.getByRole('button', { name: 'S' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'M' })).toBeInTheDocument()
  })

  it('renders color option values as swatch buttons with aria-label', () => {
    render(<ProductInfo {...defaultProps} />)
    expect(screen.getByRole('button', { name: 'Lagoon' })).toBeInTheDocument()
  })

  it('calls setSelectedOptions with the updated selection when a pill is clicked', () => {
    const setSelectedOptions = vi.fn()
    render(<ProductInfo {...defaultProps} setSelectedOptions={setSelectedOptions} />)
    fireEvent.click(screen.getByRole('button', { name: 'M' }))
    expect(setSelectedOptions).toHaveBeenCalledWith({ Size: 'M', Color: 'Lagoon' })
  })

  it('renders "Add to cart" button when activeVariant is defined', () => {
    render(<ProductInfo {...defaultProps} />)
    expect(screen.getByRole('button', { name: 'Add to cart' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add to cart' })).not.toBeDisabled()
  })

  it('renders disabled "Unavailable" button when activeVariant is undefined', () => {
    render(<ProductInfo {...defaultProps} activeVariant={undefined} />)
    expect(screen.getByRole('button', { name: 'Unavailable' })).toBeDisabled()
  })
})
```

- [ ] **Step 2: Run tests and verify they pass**

The implementation was already added as part of Task 3. These tests verify it works correctly.

```bash
cd /Users/tkahng/github/tkahng/react/garden-web && npm test -- --reporter=verbose 2>&1 | tail -40
```

Expected: All 9 `ProductInfo — price and variant selection` tests pass.

If any test fails, diagnose carefully:
- `compareAtPrice` line-through: verify the `line-through` Tailwind class is on the `<span>` element (not inline style)
- Color swatch button: verify it uses `aria-label={value}` so `getByRole('button', { name: 'Lagoon' })` finds it

- [ ] **Step 4: Commit**

```bash
cd /Users/tkahng/github/tkahng/react/garden-web && git add src/routes/products/$handle.test.tsx && git commit -m "test: add price, variant selection, and option selector tests for ProductInfo"
```

---

### Task 5: Wire ProductDetailPage and regenerate routeTree

**Files:**
- Modify: `src/routes/products/$handle.tsx` (verify `ProductDetailPage` is complete)
- Auto-update: `src/routeTree.gen.ts`

The `ProductDetailPage` component and route loader were scaffolded in Task 2. This task verifies the complete implementation and regenerates the route tree.

- [ ] **Step 1: Verify ProductDetailPage is complete**

Confirm `src/routes/products/$handle.tsx` contains the full `ProductDetailPage` function from Task 2 (with `activeGalleryIndex` state, `selectedOptions` state, `activeVariant` derivation, and the two-column grid layout). No changes needed if Task 2 was completed correctly.

- [ ] **Step 2: Start dev server to trigger routeTree regeneration**

```bash
cd /Users/tkahng/github/tkahng/react/garden-web && npm run dev &
sleep 5 && kill %1
```

After the server starts, TanStack Router's Vite plugin will detect `src/routes/products/$handle.tsx` and update `src/routeTree.gen.ts` automatically.

- [ ] **Step 3: Verify the route was added to routeTree.gen.ts**

```bash
grep "products" /Users/tkahng/github/tkahng/react/garden-web/src/routeTree.gen.ts
```

Expected output includes a line referencing `/products/$handle`, e.g.:
```
import { Route as productsHandleImport } from './routes/products/$handle'
```

- [ ] **Step 4: Run all tests to confirm nothing is broken**

```bash
cd /Users/tkahng/github/tkahng/react/garden-web && npm test -- --reporter=verbose 2>&1 | tail -30
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
cd /Users/tkahng/github/tkahng/react/garden-web && git add src/routeTree.gen.ts && git commit -m "feat: add /products/:handle route for product detail page"
```
