import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useDocumentMeta } from '#/hooks/useDocumentMeta'
import { useJsonLd } from '#/hooks/useJsonLd'
import ReactMarkdown from 'react-markdown'
import { toast } from 'sonner'
import { getProduct } from '#/lib/api'
import { useCart } from '#/context/cart'
import { useGuestCart } from '#/context/guest-cart'
import { useAuth } from '#/context/auth'
import { useAuthModal } from '#/context/auth-modal'
import { addToQuoteCart, getVariantTiers } from '#/lib/b2b-api'
import type { VariantPriceTiersResponse } from '#/lib/b2b-api'
import { WishlistButton } from '#/components/WishlistButton'
import { ProductReviews } from '#/components/ProductReviews'
import { RelatedProducts } from '#/components/RelatedProducts'
import { RecentlyViewed } from '#/components/RecentlyViewed'
import { useRecentlyViewed } from '#/hooks/useRecentlyViewed'
import {
  MagnifyingGlassPlusIcon,
  XIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
} from '@phosphor-icons/react'
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
    for (const ov of variant.optionValues ?? []) {
      const name = ov.optionName ?? ''
      const label = ov.valueLabel ?? ''
      if (!map.has(name)) map.set(name, [])
      const values = map.get(name)!
      if (!values.includes(label)) values.push(label)
    }
  }
  return Array.from(map.entries())
}

// ─── ProductGallery ───────────────────────────────────────────────────────────

export function ProductGallery({
  images,
  activeIndex,
  onSelect,
  onZoom,
}: {
  images: ProductImageResponse[]
  activeIndex: number
  onSelect: (i: number) => void
  onZoom: (i: number) => void
}) {
  const safeIndex = Math.min(activeIndex, images.length - 1)
  return (
    <div className="flex flex-col gap-3">
      <div
        className="island-shell group relative aspect-[4/5] w-full overflow-hidden bg-muted"
        onClick={() => images.length > 0 && onZoom(safeIndex)}
        style={{ cursor: images.length > 0 ? 'zoom-in' : 'default' }}
      >
        {images.length > 0 ? (
          <>
            <img
              data-testid="featured-image"
              src={images[safeIndex].url}
              alt={images[safeIndex].altText ?? ''}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute bottom-3 right-3 rounded-full bg-black/40 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100">
              <MagnifyingGlassPlusIcon size={16} weight="bold" />
            </div>
          </>
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
              className={`h-16 w-16 flex-shrink-0 overflow-hidden border-2 transition ${
                i === activeIndex
                  ? 'border-primary'
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

// ─── ProductLightbox ──────────────────────────────────────────────────────────

function ProductLightbox({
  images,
  startIndex,
  onClose,
}: {
  images: ProductImageResponse[]
  startIndex: number
  onClose: () => void
}) {
  const [idx, setIdx] = useState(startIndex)
  const canPrev = idx > 0
  const canNext = idx < images.length - 1

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') setIdx((i) => Math.max(0, i - 1))
      if (e.key === 'ArrowRight') setIdx((i) => Math.min(images.length - 1, i + 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [images.length, onClose])

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
      className="fixed inset-0 z-50 flex flex-col bg-black/95"
      onClick={onClose}
    >
      {/* Close */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close image viewer"
        className="absolute right-4 top-4 z-10 rounded-full p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
      >
        <XIcon size={24} />
      </button>

      {/* Counter */}
      {images.length > 1 && (
        <p className="absolute left-1/2 top-4 -translate-x-1/2 text-sm text-white/50">
          {idx + 1} / {images.length}
        </p>
      )}

      {/* Image area */}
      <div
        className="relative flex flex-1 items-center justify-center px-16"
        onClick={(e) => e.stopPropagation()}
      >
        {canPrev && (
          <button
            type="button"
            onClick={() => setIdx((i) => i - 1)}
            aria-label="Previous image"
            className="absolute left-3 rounded-full p-3 text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeftIcon size={26} />
          </button>
        )}

        <img
          key={images[idx].url}
          src={images[idx].url ?? ''}
          alt={images[idx].altText ?? ''}
          className="max-h-[80vh] max-w-full select-none object-contain"
          draggable={false}
        />

        {canNext && (
          <button
            type="button"
            onClick={() => setIdx((i) => i + 1)}
            aria-label="Next image"
            className="absolute right-3 rounded-full p-3 text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <ArrowRightIcon size={26} />
          </button>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div
          className="flex justify-center gap-2 overflow-x-auto px-4 pb-6 pt-3"
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((img, i) => (
            <button
              key={img.id ?? i}
              type="button"
              onClick={() => setIdx(i)}
              aria-label={img.altText ?? `Image ${i + 1}`}
              className={`h-14 w-14 shrink-0 overflow-hidden rounded border-2 transition ${
                i === idx
                  ? 'border-white opacity-100'
                  : 'border-transparent opacity-40 hover:opacity-70'
              }`}
            >
              <img
                src={img.url ?? ''}
                alt=""
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body,
  )
}

// ─── ProductInfo ──────────────────────────────────────────────────────────────

function PriceTiersTable({
  tiers,
  variantId,
}: {
  tiers: VariantPriceTiersResponse[]
  variantId: string | undefined
}) {
  const variantTiers = tiers.find((t) => t.variantId === variantId)?.tiers ?? []
  if (variantTiers.length === 0) return null
  return (
    <div className="rounded-lg border border-border bg-muted/40 px-4 py-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Volume pricing
      </p>
      <table className="w-full text-sm">
        <tbody>
          {variantTiers.map((tier) => (
            <tr key={tier.minQty} className="border-t border-border first:border-t-0">
              <td className="py-1 text-muted-foreground">
                {tier.minQty === 1 ? '1+ units' : `${tier.minQty}+ units`}
              </td>
              <td className="py-1 text-right font-semibold text-foreground">
                {tier.price != null ? formatPrice(tier.price) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function ProductInfo({
  product,
  selectedOptions,
  setSelectedOptions,
  activeVariant,
  quantity,
  onQuantityChange,
  onAddToCart,
  isAddingToCart = false,
  addError,
  onAddToQuoteCart,
  isAddingToQuoteCart = false,
  atcRef,
  priceTiers,
}: {
  product: ProductDetailResponse
  selectedOptions: Record<string, string>
  setSelectedOptions: (opts: Record<string, string>) => void
  activeVariant: ProductVariantResponse | undefined
  quantity: number
  onQuantityChange: (qty: number) => void
  onAddToCart?: () => void
  isAddingToCart?: boolean
  addError?: string | null
  onAddToQuoteCart?: () => void
  isAddingToQuoteCart?: boolean
  atcRef?: React.RefObject<HTMLDivElement | null>
  priceTiers?: VariantPriceTiersResponse[]
}) {
  const hasKicker = product.vendor != null || product.productType != null
  const kicker = [product.vendor, product.productType]
    .filter(Boolean)
    .join(' · ')

  const optionGroups = useMemo(
    () => buildOptionGroups(product.variants ?? []),
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
      <h1 className="display-title text-3xl font-bold leading-tight text-foreground sm:text-4xl">
        {product.title}
      </h1>

      {/* Price */}
      {activeVariant != null && activeVariant.price != null && (
        <div className="flex items-baseline gap-3">
          <span className="text-2xl font-bold text-foreground">
            {formatPrice(activeVariant.price)}
          </span>
          {activeVariant.compareAtPrice != null && (
            <span className="text-base text-muted-foreground line-through">
              {formatPrice(activeVariant.compareAtPrice)}
            </span>
          )}
        </div>
      )}

      {priceTiers != null && priceTiers.length > 0 && (
        <PriceTiersTable tiers={priceTiers} variantId={activeVariant?.id} />
      )}

      {/* Option selectors */}
      {optionGroups.length > 0 && (
        <div className="flex flex-col gap-4">
          {optionGroups.map(([name, values]) => (
            <div key={name}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
                          ? 'border-primary ring-2 ring-primary ring-offset-2'
                          : 'border-border hover:border-primary'
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
                          ? 'border-primary bg-primary/10 text-foreground'
                          : 'border-border bg-background text-muted-foreground hover:border-primary'
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

      {/* Quantity */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Quantity
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Decrease quantity"
              disabled={quantity <= (activeVariant?.minimumOrderQty ?? 1)}
              onClick={() => onQuantityChange(quantity - 1)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40 hover:border-primary"
            >
              −
            </button>
            <span className="w-8 text-center text-sm font-semibold">
              {quantity}
            </span>
            <button
              type="button"
              aria-label="Increase quantity"
              onClick={() => onQuantityChange(quantity + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-sm font-bold hover:border-primary"
            >
              +
            </button>
          </div>
        </div>
        {(activeVariant?.minimumOrderQty ?? 1) > 1 && (
          <p className="text-xs text-muted-foreground">
            Minimum order: {activeVariant!.minimumOrderQty} units
          </p>
        )}
      </div>

      {/* Add to Cart / Add to Quote Cart */}
      <div ref={atcRef}>
        {activeVariant?.price != null ? (
          <div className="flex flex-col gap-2">
            <button
              disabled={isAddingToCart || !activeVariant?.id}
              onClick={onAddToCart}
              className="w-full bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isAddingToCart ? 'Adding…' : 'Add to cart'}
            </button>
            <button
              disabled={!activeVariant?.id || isAddingToQuoteCart}
              onClick={onAddToQuoteCart}
              className="w-full border border-border px-6 py-3 text-sm font-semibold transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isAddingToQuoteCart ? 'Adding…' : 'Add to quote cart'}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <button
              disabled={activeVariant == null || isAddingToQuoteCart}
              onClick={onAddToQuoteCart}
              className="w-full bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {activeVariant == null
                ? 'Unavailable'
                : isAddingToQuoteCart
                  ? 'Adding…'
                  : 'Add to quote cart'}
            </button>
            <p className="text-xs text-muted-foreground text-center">
              This item is available by quote only.
            </p>
          </div>
        )}
      </div>
      {addError != null && (
        <p data-testid="add-error" className="text-sm text-red-600">
          {addError}
        </p>
      )}

      {/* Wishlist */}
      <div className="flex items-center gap-2">
        <WishlistButton productId={product.id ?? ''} />
        <span className="text-sm text-muted-foreground">Save to wishlist</span>
      </div>

      {/* Description */}
      {product.description != null && (
        <div
          data-testid="product-description"
          className="prose prose-sm max-w-none text-muted-foreground"
        >
          <ReactMarkdown>{product.description}</ReactMarkdown>
        </div>
      )}

      {/* Tags */}
      {(product.tags ?? []).length > 0 && (
        <div data-testid="product-tags" className="flex flex-wrap gap-2">
          {(product.tags ?? []).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Schema.org helpers ───────────────────────────────────────────────────────

function buildProductSchema(product: ProductDetailResponse): Record<string, unknown> {
  const images = (product.images ?? []).map((i) => i.url).filter(Boolean)
  const offers = (product.variants ?? []).map((v) => ({
    '@type': 'Offer',
    priceCurrency: 'USD',
    price: v.price ?? 0,
    availability: 'https://schema.org/InStock',
    url: window.location.href,
  }))

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.metaDescription ?? product.description ?? undefined,
    image: images.length > 0 ? images : undefined,
    brand: product.vendor ? { '@type': 'Brand', name: product.vendor } : undefined,
    offers: offers.length === 1 ? offers[0] : offers,
  }
}

// ─── StickyAtcBar ─────────────────────────────────────────────────────────────

function StickyAtcBar({
  image,
  title,
  price,
  onAddToCart,
  isAdding,
  disabled,
}: {
  image: ProductImageResponse | undefined
  title: string
  price: number | null
  onAddToCart?: () => void
  isAdding: boolean
  disabled: boolean
}) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(id)
  }, [])

  return createPortal(
    <div
      aria-label="Quick add to cart"
      className={`fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-md transition-transform duration-300 ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="page-wrap flex items-center gap-4 px-4 py-3">
        {image?.url && (
          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-md border border-border">
            <img
              src={image.url}
              alt={image.altText ?? title}
              className="h-full w-full object-cover"
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{title}</p>
          {price != null && (
            <p className="text-sm text-muted-foreground">{formatPrice(price)}</p>
          )}
        </div>
        <button
          disabled={isAdding || disabled}
          onClick={onAddToCart}
          className="shrink-0 bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isAdding ? 'Adding…' : 'Add to cart'}
        </button>
      </div>
    </div>,
    document.body,
  )
}

// ─── ProductDetailPage ────────────────────────────────────────────────────────

function ProductDetailPage() {
  const product = Route.useLoaderData()
  const featuredImage = product.images?.[0]?.url ?? null
  useDocumentMeta(
    product.metaTitle ?? product.title,
    product.metaDescription,
    { image: featuredImage, type: 'product', url: window.location.href },
  )
  useJsonLd(buildProductSchema(product))
  const { record } = useRecentlyViewed()
  useEffect(() => {
    if (!product.id || !product.handle) return
    record({
      id: product.id,
      handle: product.handle,
      title: product.title ?? '',
      priceMin: product.variants?.[0]?.price ?? null,
      featuredImageUrl: product.images?.[0]?.url ?? null,
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id])
  const { isAuthenticated, authFetch } = useAuth()
  const { openAuthModal } = useAuthModal()
  const { cart, addItem } = useCart()
  const { addItem: addGuestItem } = useGuestCart()
  const [priceTiers, setPriceTiers] = useState<VariantPriceTiersResponse[]>([])

  useEffect(() => {
    const companyId = cart?.companyId
    if (!isAuthenticated || !companyId || !product.handle) return
    getVariantTiers(authFetch, product.handle, companyId)
      .then(setPriceTiers)
      .catch(() => setPriceTiers([]))
  }, [isAuthenticated, cart?.companyId, product.handle, authFetch])
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const atcRef = useRef<HTMLDivElement>(null)
  const [atcPastTop, setAtcPastTop] = useState(false)

  useEffect(() => {
    const el = atcRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        setAtcPastTop(!entry.isIntersecting && entry.boundingClientRect.top < 0)
      },
      { threshold: 0 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >(() =>
    Object.fromEntries(
      (product.variants?.[0]?.optionValues ?? []).map((v) => [
        v.optionName ?? '',
        v.valueLabel ?? '',
      ]),
    ),
  )
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)
  const [isAddingToQuote, setIsAddingToQuote] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const activeVariant =
    (product.variants ?? []).find((v) =>
      (v.optionValues ?? []).every(
        (ov) => selectedOptions[ov.optionName ?? ''] === ov.valueLabel,
      ),
    ) ?? product.variants?.[0]

  useEffect(() => {
    const moq = activeVariant?.minimumOrderQty ?? 1
    setQuantity((prev) => Math.max(prev, moq))
  }, [activeVariant?.id, activeVariant?.minimumOrderQty])

  async function handleAddToCart() {
    if (!activeVariant?.id) {
      setAddError('Please select a variant before adding to cart.')
      return
    }
    setIsAdding(true)
    setAddError(null)
    try {
      if (isAuthenticated) {
        await addItem(activeVariant.id, quantity)
      } else {
        await addGuestItem(activeVariant.id, quantity)
      }
    } catch {
      setAddError('Failed to add item to cart. Please try again.')
    } finally {
      setIsAdding(false)
    }
  }

  async function handleAddToQuoteCart() {
    if (!isAuthenticated) {
      openAuthModal('login')
      return
    }
    if (!activeVariant?.id) return
    setIsAddingToQuote(true)
    try {
      await addToQuoteCart(authFetch, { variantId: activeVariant.id, quantity })
      toast.success('Added to quote cart', {
        action: {
          label: 'View cart',
          onClick: () => { window.location.href = '/account/quote-cart' },
        },
      })
    } catch {
      toast.error('Failed to add to quote cart.')
    } finally {
      setIsAddingToQuote(false)
    }
  }

  return (
    <main className="page-wrap px-4 py-10">
      <div className="grid gap-12 lg:grid-cols-2">
        <ProductGallery
          images={product.images ?? []}
          activeIndex={activeGalleryIndex}
          onSelect={setActiveGalleryIndex}
          onZoom={setLightboxIndex}
        />
        <ProductInfo
          product={product}
          selectedOptions={selectedOptions}
          setSelectedOptions={setSelectedOptions}
          activeVariant={activeVariant}
          quantity={quantity}
          onQuantityChange={setQuantity}
          onAddToCart={handleAddToCart}
          isAddingToCart={isAdding}
          addError={addError}
          onAddToQuoteCart={handleAddToQuoteCart}
          isAddingToQuoteCart={isAddingToQuote}
          atcRef={atcRef}
          priceTiers={priceTiers}
        />
      </div>
      <ProductReviews productId={product.id ?? ''} reviewSummary={product.reviewSummary ?? null} />
      <RelatedProducts handle={product.handle ?? ''} />
      <RecentlyViewed exclude={product.handle ?? undefined} />
      {lightboxIndex !== null && (
        <ProductLightbox
          images={product.images ?? []}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
      {atcPastTop && activeVariant?.price != null && (
        <StickyAtcBar
          image={product.images?.[0]}
          title={product.title ?? ''}
          price={activeVariant.price}
          onAddToCart={handleAddToCart}
          isAdding={isAdding}
          disabled={!activeVariant?.id}
        />
      )}
    </main>
  )
}
