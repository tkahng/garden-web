import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { MagnifyingGlassIcon, ArrowRightIcon } from '@phosphor-icons/react'
import { search } from '#/lib/api'
import type { ProductSummaryResponse, CollectionSummaryResponse } from '#/lib/api'

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

type Item =
  | { type: 'product'; item: ProductSummaryResponse }
  | { type: 'collection'; item: CollectionSummaryResponse }

export function PredictiveSearch() {
  const go = useNavigate()
  const [value, setValue] = useState('')
  const [open, setOpen] = useState(false)
  const [products, setProducts] = useState<ProductSummaryResponse[]>([])
  const [collections, setCollections] = useState<CollectionSummaryResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const allItems: Item[] = [
    ...products.map((p): Item => ({ type: 'product', item: p })),
    ...collections.map((c): Item => ({ type: 'collection', item: c })),
  ]
  const showDropdown = open && value.trim().length >= 2

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const q = value.trim()
    if (q.length < 2) {
      setProducts([])
      setCollections([])
      setLoading(false)
      return
    }
    setLoading(true)
    debounceRef.current = setTimeout(() => {
      search({ q, limit: 5 })
        .then((res) => {
          setProducts(res.products?.content ?? [])
          setCollections((res.collections?.content ?? []).slice(0, 3))
          setActiveIndex(-1)
        })
        .catch(() => {
          setProducts([])
          setCollections([])
        })
        .finally(() => setLoading(false))
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [value])

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = value.trim()
    if (!q) return
    setOpen(false)
    setValue('')
    void go({ to: '/search', search: { q } })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      setOpen(false)
      if (!value) inputRef.current?.blur()
      return
    }
    if (!showDropdown) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, allItems.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      const entry = allItems[activeIndex]
      setOpen(false)
      setValue('')
      if (entry.type === 'product') {
        void go({ to: '/products/$handle', params: { handle: entry.item.handle ?? '' } })
      } else {
        void go({ to: '/collections/$handle', params: { handle: entry.item.handle ?? '' }, search: { page: 0 } })
      }
    }
  }

  function closeAndClear() {
    setOpen(false)
    setValue('')
  }

  return (
    <div ref={containerRef} className="relative">
      <form onSubmit={handleSubmit}>
        <div className="relative flex items-center">
          <MagnifyingGlassIcon
            size={15}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            ref={inputRef}
            type="search"
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search…"
            aria-label="Search products"
            aria-expanded={showDropdown}
            aria-autocomplete="list"
            className="h-8 w-44 rounded-lg border border-border bg-background pl-8 pr-3 text-sm transition-all focus:w-64 focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </form>

      {showDropdown && (
        <div
          role="listbox"
          aria-label="Search suggestions"
          className="absolute right-0 top-full z-50 mt-1.5 w-80 overflow-hidden rounded-xl border border-border bg-background shadow-xl"
        >
          {loading && <DropdownSkeleton />}

          {!loading && allItems.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              No results for &ldquo;{value}&rdquo;
            </p>
          )}

          {!loading && products.length > 0 && (
            <section>
              <p className="px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Products
              </p>
              {products.map((p, i) => (
                <Link
                  key={p.id}
                  to="/products/$handle"
                  params={{ handle: p.handle ?? '' }}
                  onClick={closeAndClear}
                  role="option"
                  aria-selected={activeIndex === i}
                  className={`flex items-center gap-3 px-4 py-2 text-inherit no-underline transition hover:bg-accent ${activeIndex === i ? 'bg-accent' : ''}`}
                >
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {p.featuredImageUrl ? (
                      <img
                        src={p.featuredImageUrl}
                        alt={p.title ?? ''}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full" />
                    )}
                  </div>
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium text-foreground">
                      {p.title}
                    </span>
                    {p.priceMin != null && (
                      <span className="text-xs text-muted-foreground">
                        {fmt(p.priceMin)}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </section>
          )}

          {!loading && collections.length > 0 && (
            <section className={products.length > 0 ? 'border-t border-border' : ''}>
              <p className="px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Collections
              </p>
              {collections.map((c, i) => {
                const idx = products.length + i
                return (
                  <Link
                    key={c.id}
                    to="/collections/$handle"
                    params={{ handle: c.handle ?? '' }}
                    search={{ page: 0 }}
                    onClick={closeAndClear}
                    role="option"
                    aria-selected={activeIndex === idx}
                    className={`flex items-center gap-3 px-4 py-2 text-inherit no-underline transition hover:bg-accent ${activeIndex === idx ? 'bg-accent' : ''}`}
                  >
                    <div className="h-8 w-8 shrink-0 overflow-hidden rounded-md bg-muted">
                      {c.featuredImageUrl ? (
                        <img
                          src={c.featuredImageUrl}
                          alt={c.title ?? ''}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full" />
                      )}
                    </div>
                    <span className="truncate text-sm font-medium text-foreground">
                      {c.title}
                    </span>
                  </Link>
                )
              })}
            </section>
          )}

          <div className="border-t border-border">
            <Link
              to="/search"
              search={{ q: value.trim() }}
              onClick={closeAndClear}
              className="flex items-center justify-between px-4 py-3 text-sm font-medium text-primary no-underline transition hover:bg-accent"
            >
              <span>
                See all results for &ldquo;{value.trim()}&rdquo;
              </span>
              <ArrowRightIcon size={14} />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

function DropdownSkeleton() {
  return (
    <div className="flex flex-col gap-2 px-4 py-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex animate-pulse items-center gap-3">
          <div className="h-10 w-10 shrink-0 rounded-lg bg-muted" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-3/4 rounded bg-muted" />
            <div className="h-2.5 w-1/3 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  )
}
