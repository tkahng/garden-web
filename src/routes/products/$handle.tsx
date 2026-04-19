import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import { toast } from 'sonner'
import { getProduct } from '#/lib/api'
import { useCart } from '#/context/cart'
import { useAuth } from '#/context/auth'
import { useAuthModal } from '#/context/auth-modal'
import { addToQuoteCart } from '#/lib/b2b-api'
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
      <div className="island-shell aspect-[4/5] w-full overflow-hidden bg-muted">
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

// ─── ProductInfo ──────────────────────────────────────────────────────────────

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
      <div className="flex items-center gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Quantity
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Decrease quantity"
            disabled={quantity <= 1}
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

      {/* Add to Cart / Add to Quote Cart */}
      {activeVariant?.price != null ? (
        <div className="flex flex-col gap-2">
          <button
            disabled={isAddingToCart}
            onClick={onAddToCart}
            className="w-full bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isAddingToCart ? 'Adding…' : 'Add to cart'}
          </button>
          <button
            disabled={activeVariant == null || isAddingToQuoteCart}
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
      {addError != null && (
        <p data-testid="add-error" className="text-sm text-red-600">
          {addError}
        </p>
      )}

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
      {product.tags.length > 0 && (
        <div data-testid="product-tags" className="flex flex-wrap gap-2">
          {product.tags.map((tag) => (
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

// ─── ProductDetailPage ────────────────────────────────────────────────────────

function ProductDetailPage() {
  const product = Route.useLoaderData()
  const { isAuthenticated, authFetch } = useAuth()
  const { openAuthModal } = useAuthModal()
  const { addItem } = useCart()
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
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)
  const [isAddingToQuote, setIsAddingToQuote] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const activeVariant =
    product.variants.find((v) =>
      v.optionValues.every(
        (ov) => selectedOptions[ov.optionName] === ov.valueLabel,
      ),
    ) ?? product.variants[0]

  async function handleAddToCart() {
    if (!isAuthenticated) {
      openAuthModal('login')
      return
    }
    setIsAdding(true)
    setAddError(null)
    try {
      await addItem(activeVariant.id, quantity)
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
          images={product.images}
          activeIndex={activeGalleryIndex}
          onSelect={setActiveGalleryIndex}
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
        />
      </div>
    </main>
  )
}
