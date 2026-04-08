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
