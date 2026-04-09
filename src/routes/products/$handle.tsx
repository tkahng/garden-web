import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
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

function buildOptionGroups(
  variants: ProductVariantResponse[],
): [string, string[]][] {
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
  const safeIndex = Math.min(activeIndex, images.length - 1)
  return (
    <div className="flex flex-col gap-3">
      <div className="island-shell aspect-[4/5] w-full overflow-hidden rounded-2xl bg-[rgba(79,184,178,0.08)]">
        {images.length > 0 ? (
          <img
            data-testid="featured-image"
            src={images[safeIndex].url}
            alt={images[safeIndex].altText ?? ''}
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
              <img
                src={img.url}
                alt={img.altText ?? ''}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── ProductInfo ──────────────────────────────────────────────────────────────

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
  const kicker = [product.vendor, product.productType]
    .filter(Boolean)
    .join(' · ')

  const optionGroups = useMemo(
    () => buildOptionGroups(product.variants),
    [product.variants],
  )

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
                      onClick={() =>
                        setSelectedOptions({
                          ...selectedOptions,
                          [name]: value,
                        })
                      }
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
                      onClick={() =>
                        setSelectedOptions({
                          ...selectedOptions,
                          [name]: value,
                        })
                      }
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
        >
          <ReactMarkdown>{product.description}</ReactMarkdown>
        </div>
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

// ─── ProductDetailPage ────────────────────────────────────────────────────────

function ProductDetailPage() {
  const product = Route.useLoaderData()
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0)
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >(() =>
    Object.fromEntries(
      product.variants[0]?.optionValues.map((v) => [
        v.optionName,
        v.valueLabel,
      ]) ?? [],
    ),
  )
  const activeVariant =
    product.variants.find((v) =>
      v.optionValues.every(
        (ov) => selectedOptions[ov.optionName] === ov.valueLabel,
      ),
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
