# Product Listing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a paginated, filterable product listing page at `/products` using Dawn-style portrait cards, URL-driven search params, and inline filter bar.

**Architecture:** Co-locate all components (`ProductCard`, `FilterBar`, `Pagination`, `ProductListingPage`) in `src/routes/products/index.tsx` and export them for unit testing. The route uses `validateSearch` + `loaderDeps` + `loader` so filters and pagination are URL-driven and shareable. API client additions live in `src/lib/api.ts`.

**Tech Stack:** React 18, TanStack Router v1 (file-based), Tailwind CSS + garden CSS variables, Vitest + @testing-library/react (fireEvent, no userEvent)

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/lib/api.ts` | Modify | Add `ProductSummaryResponse` type + `listProducts` function |
| `src/lib/api.test.ts` | Modify | Add `listProducts` tests |
| `src/routes/products/index.tsx` | Create | Route + all four components |
| `src/routes/products/index.test.tsx` | Create | Unit tests for `ProductCard`, `FilterBar`, `Pagination` |

---

### Task 1: Add `ProductSummaryResponse` and `listProducts` to api.ts

**Files:**
- Modify: `src/lib/api.ts`
- Modify: `src/lib/api.test.ts`

- [ ] **Step 1: Write the failing tests**

Append a new `describe('listProducts', ...)` block to `src/lib/api.test.ts`. Update the import at the top of the file to add `listProducts` and `ProductSummaryResponse`:

```ts
import {
  getPage, listCollections, listCollectionProducts, getProduct, listProducts,
  type ProductDetailResponse, type ProductSummaryResponse,
} from './api'
```

Then append at the bottom of `src/lib/api.test.ts`:

```ts
describe('listProducts', () => {
  const summary: ProductSummaryResponse = {
    id: 'p1',
    title: 'Heirloom Tomato Seeds',
    handle: 'heirloom-tomato-seeds',
    vendor: 'Garden Co',
    featuredImageUrl: 'https://cdn.example.com/img.jpg',
    priceMin: 9.99,
    priceMax: 19.99,
    compareAtPriceMin: 24.99,
    compareAtPriceMax: 24.99,
  }

  it('fetches /api/v1/products with no query string when no params provided', async () => {
    const response = { data: { content: [], meta: { page: 0, pageSize: 20, total: 0 } } }
    vi.stubGlobal('fetch', mockFetch(response))

    await listProducts({})

    expect(fetch).toHaveBeenCalledWith(`${BASE}/api/v1/products`)
  })

  it('maps q to titleContains in the query string', async () => {
    const response = { data: { content: [], meta: { page: 0, pageSize: 20, total: 0 } } }
    vi.stubGlobal('fetch', mockFetch(response))

    await listProducts({ q: 'tomato' })

    expect(fetch).toHaveBeenCalledWith(`${BASE}/api/v1/products?titleContains=tomato`)
  })

  it('maps vendor and type to their respective query params', async () => {
    const response = { data: { content: [], meta: { page: 0, pageSize: 20, total: 0 } } }
    vi.stubGlobal('fetch', mockFetch(response))

    await listProducts({ vendor: 'Garden Co', type: 'Seeds' })

    const url = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string
    expect(url).toContain('vendor=Garden+Co')
    expect(url).toContain('productType=Seeds')
  })

  it('includes page and size when provided', async () => {
    const response = { data: { content: [], meta: { page: 2, pageSize: 20, total: 100 } } }
    vi.stubGlobal('fetch', mockFetch(response))

    await listProducts({ page: 2, size: 20 })

    expect(fetch).toHaveBeenCalledWith(`${BASE}/api/v1/products?page=2&size=20`)
  })

  it('omits undefined params from the query string', async () => {
    const response = { data: { content: [], meta: { page: 0, pageSize: 20, total: 1 } } }
    vi.stubGlobal('fetch', mockFetch(response))

    await listProducts({ page: 0 })

    expect(fetch).toHaveBeenCalledWith(`${BASE}/api/v1/products?page=0`)
  })

  it('returns the paged result with content and meta', async () => {
    const response = { data: { content: [summary], meta: { page: 0, pageSize: 20, total: 1 } } }
    vi.stubGlobal('fetch', mockFetch(response))

    const result = await listProducts({})

    expect(result.content).toHaveLength(1)
    expect(result.content[0].handle).toBe('heirloom-tomato-seeds')
    expect(result.meta.total).toBe(1)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/tkahng/github/tkahng/react/garden-web
npx vitest run src/lib/api.test.ts 2>&1 | tail -20
```

Expected: FAIL — `listProducts` is not exported / `ProductSummaryResponse` not found.

- [ ] **Step 3: Add `ProductSummaryResponse` type to api.ts**

In `src/lib/api.ts`, add the interface after `ProductDetailResponse` (still in the types section, before the `// Internal helpers` comment):

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

- [ ] **Step 4: Add `listProducts` function to api.ts**

Append after `getProduct` in the `// Public API functions` section of `src/lib/api.ts`:

```ts
export function listProducts(params: {
  q?: string
  vendor?: string
  type?: string
  page?: number
  size?: number
}): Promise<PagedResult<ProductSummaryResponse>> {
  const qs = new URLSearchParams()
  if (params.q !== undefined) qs.set('titleContains', params.q)
  if (params.vendor !== undefined) qs.set('vendor', params.vendor)
  if (params.type !== undefined) qs.set('productType', params.type)
  if (params.page !== undefined) qs.set('page', String(params.page))
  if (params.size !== undefined) qs.set('size', String(params.size))
  const query = qs.toString()
  return apiFetch(`/api/v1/products${query ? `?${query}` : ''}`)
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx vitest run src/lib/api.test.ts 2>&1 | tail -10
```

Expected: All tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/api.ts src/lib/api.test.ts
git commit -m "feat: add ProductSummaryResponse type and listProducts api function"
```

---

### Task 2: Create `ProductCard` component

**Files:**
- Create: `src/routes/products/index.tsx`
- Create: `src/routes/products/index.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/routes/products/index.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ProductSummaryResponse } from '#/lib/api'
import { ProductCard } from './index'

const base: ProductSummaryResponse = {
  id: 'p1',
  title: 'Heirloom Tomato Seeds',
  handle: 'heirloom-tomato-seeds',
  vendor: 'Garden Co',
  featuredImageUrl: null,
  priceMin: null,
  priceMax: null,
  compareAtPriceMin: null,
  compareAtPriceMax: null,
}

describe('ProductCard', () => {
  it('renders a placeholder when featuredImageUrl is null', () => {
    render(<ProductCard product={base} />)
    expect(screen.getByTestId('card-placeholder')).toBeInTheDocument()
  })

  it('renders the product image when featuredImageUrl is set', () => {
    const product = { ...base, featuredImageUrl: 'https://cdn.example.com/img.jpg' }
    render(<ProductCard product={product} />)
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', 'https://cdn.example.com/img.jpg')
    expect(img).toHaveAttribute('alt', 'Heirloom Tomato Seeds')
  })

  it('renders the product title', () => {
    render(<ProductCard product={base} />)
    expect(screen.getByText('Heirloom Tomato Seeds')).toBeInTheDocument()
  })

  it('renders the vendor when set', () => {
    render(<ProductCard product={base} />)
    expect(screen.getByText('Garden Co')).toBeInTheDocument()
  })

  it('omits vendor when null', () => {
    render(<ProductCard product={{ ...base, vendor: null }} />)
    expect(screen.queryByText('Garden Co')).not.toBeInTheDocument()
  })

  it('omits price section when priceMin is null', () => {
    render(<ProductCard product={base} />)
    expect(screen.queryByText(/\$/)).not.toBeInTheDocument()
  })

  it('renders a single price when priceMin equals priceMax', () => {
    render(<ProductCard product={{ ...base, priceMin: 19.99, priceMax: 19.99 }} />)
    expect(screen.getByText('$19.99')).toBeInTheDocument()
  })

  it('renders a price range when priceMin differs from priceMax', () => {
    render(<ProductCard product={{ ...base, priceMin: 9.99, priceMax: 19.99 }} />)
    expect(screen.getByText('$9.99 – $19.99')).toBeInTheDocument()
  })

  it('renders compare-at price with line-through when compareAtPriceMin > priceMin', () => {
    render(<ProductCard product={{ ...base, priceMin: 9.99, priceMax: 9.99, compareAtPriceMin: 14.99, compareAtPriceMax: 14.99 }} />)
    const compareAt = screen.getByText('$14.99')
    expect(compareAt).toHaveClass('line-through')
  })

  it('does not render compare-at when compareAtPriceMin equals priceMin', () => {
    render(<ProductCard product={{ ...base, priceMin: 9.99, priceMax: 9.99, compareAtPriceMin: 9.99, compareAtPriceMax: 9.99 }} />)
    // only one $9.99 element (no compare-at)
    expect(screen.getAllByText('$9.99')).toHaveLength(1)
  })

  it('wraps the card in a link to the product handle', () => {
    render(<ProductCard product={base} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/products/heirloom-tomato-seeds')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/routes/products/index.test.tsx 2>&1 | tail -20
```

Expected: FAIL — module `./index` does not export `ProductCard`.

- [ ] **Step 3: Create `src/routes/products/index.tsx` with the `ProductCard` component**

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useRef } from 'react'
import { listProducts } from '#/lib/api'
import type { ProductSummaryResponse } from '#/lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────

type Search = { q?: string; vendor?: string; type?: string; page: number }

// ─── Route (completed in Task 5) ─────────────────────────────────────────────

export const Route = createFileRoute('/products/')({
  component: () => null,
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

// ─── ProductCard ──────────────────────────────────────────────────────────────

export function ProductCard({ product }: { product: ProductSummaryResponse }) {
  return (
    <a href={`/products/${product.handle}`} className="group block">
      <div className="island-shell aspect-[3/4] overflow-hidden mb-3">
        {product.featuredImageUrl ? (
          <img
            src={product.featuredImageUrl}
            alt={product.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            data-testid="card-placeholder"
            className="w-full h-full bg-[var(--lagoon)] opacity-20"
          />
        )}
      </div>
      <p className="font-bold text-[var(--sea-ink)] text-sm leading-snug">{product.title}</p>
      {product.vendor && (
        <p className="text-xs text-[var(--sea-ink-soft)] mt-0.5">{product.vendor}</p>
      )}
      {product.priceMin !== null && (
        <div className="mt-1 text-sm flex items-center gap-2">
          <span>
            {product.priceMin === product.priceMax
              ? formatPrice(product.priceMin)
              : `${formatPrice(product.priceMin)} – ${formatPrice(product.priceMax!)}`}
          </span>
          {product.compareAtPriceMin !== null &&
            product.compareAtPriceMin > product.priceMin && (
              <span className="line-through text-[var(--sea-ink-soft)]">
                {formatPrice(product.compareAtPriceMin)}
              </span>
            )}
        </div>
      )}
    </a>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/routes/products/index.test.tsx 2>&1 | tail -10
```

Expected: All `ProductCard` tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/routes/products/index.tsx src/routes/products/index.test.tsx
git commit -m "feat: add ProductCard component for product listing"
```

---

### Task 3: Add `FilterBar` component

**Files:**
- Modify: `src/routes/products/index.tsx` (append `FilterBar`)
- Modify: `src/routes/products/index.test.tsx` (append FilterBar tests)

- [ ] **Step 1: Write the failing tests**

Append to `src/routes/products/index.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FilterBar } from './index'

describe('FilterBar', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the search input with placeholder', () => {
    render(<FilterBar search={{}} onSearch={vi.fn()} />)
    expect(screen.getByPlaceholderText('Search products…')).toBeInTheDocument()
  })

  it('calls onSearch with q after 300ms debounce', () => {
    const onSearch = vi.fn()
    render(<FilterBar search={{}} onSearch={onSearch} />)
    fireEvent.change(screen.getByPlaceholderText('Search products…'), {
      target: { value: 'tomato' },
    })
    expect(onSearch).not.toHaveBeenCalled()
    vi.advanceTimersByTime(300)
    expect(onSearch).toHaveBeenCalledWith({ q: 'tomato', page: 0 })
  })

  it('passes q as undefined when input is cleared', () => {
    const onSearch = vi.fn()
    render(<FilterBar search={{ q: 'tomato' }} onSearch={onSearch} />)
    fireEvent.change(screen.getByPlaceholderText('Search products…'), {
      target: { value: '' },
    })
    vi.advanceTimersByTime(300)
    expect(onSearch).toHaveBeenCalledWith({ q: undefined, page: 0 })
  })

  it('does not render vendor dropdown when vendor is not in search', () => {
    render(<FilterBar search={{}} onSearch={vi.fn()} />)
    expect(screen.queryByText('All vendors')).not.toBeInTheDocument()
  })

  it('renders vendor dropdown when vendor is in search', () => {
    render(<FilterBar search={{ vendor: 'Garden Co' }} onSearch={vi.fn()} />)
    expect(screen.getByText('All vendors')).toBeInTheDocument()
    expect(screen.getByText('Garden Co')).toBeInTheDocument()
  })

  it('calls onSearch when vendor is cleared via dropdown', () => {
    const onSearch = vi.fn()
    render(<FilterBar search={{ vendor: 'Garden Co' }} onSearch={onSearch} />)
    fireEvent.change(screen.getByDisplayValue('Garden Co'), { target: { value: '' } })
    expect(onSearch).toHaveBeenCalledWith({ vendor: undefined, page: 0 })
  })

  it('does not render type dropdown when type is not in search', () => {
    render(<FilterBar search={{}} onSearch={vi.fn()} />)
    expect(screen.queryByText('All types')).not.toBeInTheDocument()
  })

  it('renders type dropdown when type is in search', () => {
    render(<FilterBar search={{ type: 'Seeds' }} onSearch={vi.fn()} />)
    expect(screen.getByText('All types')).toBeInTheDocument()
    expect(screen.getByText('Seeds')).toBeInTheDocument()
  })

  it('does not render clear filters link when no filters active', () => {
    render(<FilterBar search={{}} onSearch={vi.fn()} />)
    expect(screen.queryByText('Clear filters')).not.toBeInTheDocument()
  })

  it('renders clear filters link when q is set', () => {
    render(<FilterBar search={{ q: 'tomato' }} onSearch={vi.fn()} />)
    const link = screen.getByText('Clear filters')
    expect(link).toHaveAttribute('href', '/products')
  })

  it('renders clear filters link when vendor is set', () => {
    render(<FilterBar search={{ vendor: 'Garden Co' }} onSearch={vi.fn()} />)
    expect(screen.getByText('Clear filters')).toBeInTheDocument()
  })
})
```

Note: The `describe`, `it`, `expect`, `vi`, `beforeEach`, `afterEach` imports are already at the top of the test file from Task 2 — update the import line to add the new identifiers, and add `fireEvent` to the `@testing-library/react` import if not already there. The final combined import block at the top of the test file should be:

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { ProductSummaryResponse } from '#/lib/api'
import { ProductCard, FilterBar } from './index'
```

- [ ] **Step 2: Run tests to verify the new ones fail**

```bash
npx vitest run src/routes/products/index.test.tsx 2>&1 | tail -20
```

Expected: ProductCard tests PASS, FilterBar tests FAIL — `FilterBar` is not exported.

- [ ] **Step 3: Add `FilterBar` to `src/routes/products/index.tsx`**

Append after the `ProductCard` function:

```tsx
// ─── FilterBar ────────────────────────────────────────────────────────────────

export function FilterBar({
  search,
  onSearch,
}: {
  search: { q?: string; vendor?: string; type?: string }
  onSearch: (updates: Partial<Search>) => void
}) {
  const [inputValue, setInputValue] = useState(search.q ?? '')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    setInputValue(value)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      onSearch({ q: value || undefined, page: 0 })
    }, 300)
  }

  function handleVendor(e: React.ChangeEvent<HTMLSelectElement>) {
    onSearch({ vendor: e.target.value || undefined, page: 0 })
  }

  function handleType(e: React.ChangeEvent<HTMLSelectElement>) {
    onSearch({ type: e.target.value || undefined, page: 0 })
  }

  const hasFilters = !!(search.q || search.vendor || search.type)

  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <input
        type="text"
        placeholder="Search products…"
        value={inputValue}
        onChange={handleInput}
        className="border border-[var(--line)] rounded px-3 py-1.5 text-sm"
      />
      {search.vendor !== undefined && (
        <select
          value={search.vendor}
          onChange={handleVendor}
          className="border border-[var(--line)] rounded px-3 py-1.5 text-sm"
        >
          <option value="">All vendors</option>
          <option value={search.vendor}>{search.vendor}</option>
        </select>
      )}
      {search.type !== undefined && (
        <select
          value={search.type}
          onChange={handleType}
          className="border border-[var(--line)] rounded px-3 py-1.5 text-sm"
        >
          <option value="">All types</option>
          <option value={search.type}>{search.type}</option>
        </select>
      )}
      {hasFilters && (
        <a
          href="/products"
          className="text-sm text-[var(--lagoon-deep)] underline self-center"
        >
          Clear filters
        </a>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/routes/products/index.test.tsx 2>&1 | tail -10
```

Expected: All ProductCard + FilterBar tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/routes/products/index.tsx src/routes/products/index.test.tsx
git commit -m "feat: add FilterBar component with 300ms debounced search"
```

---

### Task 4: Add `Pagination` component

**Files:**
- Modify: `src/routes/products/index.tsx` (append `Pagination`)
- Modify: `src/routes/products/index.test.tsx` (append Pagination tests)

- [ ] **Step 1: Write the failing tests**

Update the import in `src/routes/products/index.test.tsx` to add `Pagination`:

```tsx
import { ProductCard, FilterBar, Pagination } from './index'
```

Then append the following describe block at the bottom of `src/routes/products/index.test.tsx`:

```tsx
describe('Pagination', () => {
  it('renders null when total is less than or equal to pageSize', () => {
    const { container } = render(
      <Pagination page={0} total={10} pageSize={20} onPage={vi.fn()} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders null when total exactly equals pageSize', () => {
    const { container } = render(
      <Pagination page={0} total={20} pageSize={20} onPage={vi.fn()} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders when total exceeds pageSize', () => {
    render(<Pagination page={0} total={21} pageSize={20} onPage={vi.fn()} />)
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument()
  })

  it('disables Prev button on the first page', () => {
    render(<Pagination page={0} total={40} pageSize={20} onPage={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Prev' })).toBeDisabled()
  })

  it('enables Prev button on pages after the first', () => {
    render(<Pagination page={1} total={40} pageSize={20} onPage={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Prev' })).not.toBeDisabled()
  })

  it('disables Next button on the last page', () => {
    render(<Pagination page={1} total={40} pageSize={20} onPage={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
  })

  it('enables Next button when not on the last page', () => {
    render(<Pagination page={0} total={40} pageSize={20} onPage={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Next' })).not.toBeDisabled()
  })

  it('calls onPage with page - 1 when Prev is clicked', () => {
    const onPage = vi.fn()
    render(<Pagination page={1} total={60} pageSize={20} onPage={onPage} />)
    fireEvent.click(screen.getByRole('button', { name: 'Prev' }))
    expect(onPage).toHaveBeenCalledWith(0)
  })

  it('calls onPage with page + 1 when Next is clicked', () => {
    const onPage = vi.fn()
    render(<Pagination page={0} total={60} pageSize={20} onPage={onPage} />)
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(onPage).toHaveBeenCalledWith(1)
  })

  it('shows correct page label: Page N of M', () => {
    render(<Pagination page={2} total={60} pageSize={20} onPage={vi.fn()} />)
    expect(screen.getByText('Page 3 of 3')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify the new ones fail**

```bash
npx vitest run src/routes/products/index.test.tsx 2>&1 | tail -20
```

Expected: ProductCard + FilterBar tests PASS, Pagination tests FAIL — `Pagination` is not exported.

- [ ] **Step 3: Add `Pagination` to `src/routes/products/index.tsx`**

Append after the `FilterBar` function:

```tsx
// ─── Pagination ───────────────────────────────────────────────────────────────

export function Pagination({
  page,
  total,
  pageSize,
  onPage,
}: {
  page: number
  total: number
  pageSize: number
  onPage: (page: number) => void
}) {
  const totalPages = Math.ceil(total / pageSize)
  if (total <= pageSize) return null

  return (
    <div className="flex items-center justify-center gap-4 mt-10">
      <button
        onClick={() => onPage(page - 1)}
        disabled={page === 0}
        className="px-4 py-2 border border-[var(--line)] rounded text-sm disabled:opacity-40"
      >
        Prev
      </button>
      <span className="text-sm text-[var(--sea-ink-soft)]">
        Page {page + 1} of {totalPages}
      </span>
      <button
        onClick={() => onPage(page + 1)}
        disabled={page >= totalPages - 1}
        className="px-4 py-2 border border-[var(--line)] rounded text-sm disabled:opacity-40"
      >
        Next
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/routes/products/index.test.tsx 2>&1 | tail -10
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/routes/products/index.tsx src/routes/products/index.test.tsx
git commit -m "feat: add Pagination component"
```

---

### Task 5: Wire `ProductListingPage` and complete the route definition

**Files:**
- Modify: `src/routes/products/index.tsx` (add `ProductListingPage`, replace placeholder route)

- [ ] **Step 1: Replace the placeholder route and add `ProductListingPage` in `src/routes/products/index.tsx`**

Replace the placeholder route at the top of the file:

```tsx
// OLD (remove this):
export const Route = createFileRoute('/products/')({
  component: () => null,
})

// NEW (replace with this):
export const Route = createFileRoute('/products/')({
  validateSearch: (search: Record<string, unknown>): Search => ({
    q: typeof search.q === 'string' ? search.q : undefined,
    vendor: typeof search.vendor === 'string' ? search.vendor : undefined,
    type: typeof search.type === 'string' ? search.type : undefined,
    page: typeof search.page === 'number' ? Math.max(0, Math.floor(search.page)) : 0,
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) =>
    listProducts({
      q: deps.q,
      vendor: deps.vendor,
      type: deps.type,
      page: deps.page,
      size: 20,
    }),
  component: ProductListingPage,
})
```

Also update the imports at the top of the file to add `useNavigate`:

```tsx
import { createFileRoute, useNavigate } from '@tanstack/react-router'
```

Then append the `ProductListingPage` function at the bottom of `src/routes/products/index.tsx` (after `Pagination`):

```tsx
// ─── ProductListingPage ───────────────────────────────────────────────────────

function ProductListingPage() {
  const data = Route.useLoaderData()
  const search = Route.useSearch()
  const navigate = useNavigate({ from: '/products/' })

  function handleSearch(updates: Partial<Search>) {
    navigate({ search: (prev) => ({ ...prev, ...updates }) })
  }

  function handlePage(page: number) {
    navigate({ search: (prev) => ({ ...prev, page }) })
  }

  const { content: products, meta } = data

  return (
    <main className="page-wrap px-4 py-10">
      <header className="mb-6">
        <h1 className="display-title">Products</h1>
        <p className="text-sm text-[var(--sea-ink-soft)] mt-1">{meta.total} products</p>
      </header>
      <FilterBar search={search} onSearch={handleSearch} />
      {products.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-[var(--sea-ink-soft)]">No products found.</p>
          <a
            href="/products"
            className="text-sm text-[var(--lagoon-deep)] underline mt-2 inline-block"
          >
            Clear filters
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
      <Pagination
        page={meta.page}
        total={meta.total}
        pageSize={meta.pageSize}
        onPage={handlePage}
      />
    </main>
  )
}
```

- [ ] **Step 2: Run the full test suite**

```bash
npx vitest run 2>&1 | tail -20
```

Expected: All tests PASS. TypeScript compilation errors would also surface here.

- [ ] **Step 3: Regenerate routeTree**

The TanStack Router Vite plugin auto-generates `src/routeTree.gen.ts` when the dev server runs. Start it briefly to regenerate:

```bash
npx vite build 2>&1 | tail -10
```

If the build completes without errors, the route tree is correct. (The dev server `npm run dev` also regenerates it; a build is sufficient to verify.)

- [ ] **Step 4: Run all tests one final time**

```bash
npx vitest run 2>&1 | tail -15
```

Expected: All tests PASS, zero failures.

- [ ] **Step 5: Commit**

```bash
git add src/routes/products/index.tsx src/routeTree.gen.ts
git commit -m "feat: implement product listing page with filters and pagination"
```
