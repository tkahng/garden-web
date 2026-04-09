import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type {
  ProductImageResponse,
  ProductDetailResponse,
  ProductVariantResponse,
} from '#/lib/apiFetch'
import { ProductGallery, ProductInfo } from './$handle'

const mockImages: ProductImageResponse[] = [
  {
    id: 'img1',
    url: 'https://example.com/img1.jpg',
    altText: 'Front view',
    position: 1,
  },
  {
    id: 'img2',
    url: 'https://example.com/img2.jpg',
    altText: 'Side view',
    position: 2,
  },
]

describe('ProductGallery', () => {
  it('renders a placeholder when images array is empty', () => {
    render(<ProductGallery images={[]} activeIndex={0} onSelect={vi.fn()} />)
    expect(screen.getByTestId('gallery-placeholder')).toBeInTheDocument()
  })

  it('renders the featured image at activeIndex', () => {
    render(
      <ProductGallery images={mockImages} activeIndex={1} onSelect={vi.fn()} />,
    )
    const featured = screen.getByTestId('featured-image')
    expect(featured).toHaveAttribute('src', 'https://example.com/img2.jpg')
    expect(featured).toHaveAttribute('alt', 'Side view')
  })

  it('does not render thumbnail strip for a single image', () => {
    render(
      <ProductGallery
        images={[mockImages[0]]}
        activeIndex={0}
        onSelect={vi.fn()}
      />,
    )
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('renders a thumbnail button per image when multiple images exist', () => {
    render(
      <ProductGallery images={mockImages} activeIndex={0} onSelect={vi.fn()} />,
    )
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(2)
  })

  it('calls onSelect with the correct index when a thumbnail is clicked', () => {
    const onSelect = vi.fn()
    render(
      <ProductGallery
        images={mockImages}
        activeIndex={0}
        onSelect={onSelect}
      />,
    )
    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[1])
    expect(onSelect).toHaveBeenCalledWith(1)
  })
})

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
  description: '**Rich** flavor.',
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
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Heirloom Tomato Seeds',
    )
  })

  it('renders vendor and productType in the kicker', () => {
    render(<ProductInfo {...defaultProps} />)
    expect(screen.getByText(/Garden Co/)).toBeInTheDocument()
    const kicker = screen.getByTestId('product-kicker')
    expect(kicker).toHaveTextContent('Seeds')
  })

  it('omits the kicker when vendor and productType are both null', () => {
    const props = {
      ...defaultProps,
      product: { ...mockProduct, vendor: null, productType: null },
    }
    render(<ProductInfo {...props} />)
    expect(screen.queryByTestId('product-kicker')).not.toBeInTheDocument()
  })

  it('renders the description as markdown', () => {
    render(<ProductInfo {...defaultProps} />)
    const desc = screen.getByTestId('product-description')
    expect(desc).toBeInTheDocument()
    expect(desc.querySelector('strong')).toHaveTextContent('Rich')
    expect(desc).toHaveTextContent('flavor.')
  })

  it('omits the description section when description is null', () => {
    const props = {
      ...defaultProps,
      product: { ...mockProduct, description: null },
    }
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
    expect(screen.getByText('Size')).toBeInTheDocument()
    expect(screen.getByText('Color')).toBeInTheDocument()
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
    render(
      <ProductInfo {...defaultProps} setSelectedOptions={setSelectedOptions} />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'M' }))
    expect(setSelectedOptions).toHaveBeenCalledWith({
      Size: 'M',
      Color: 'Lagoon',
    })
  })

  it('renders "Add to cart" button when activeVariant is defined', () => {
    render(<ProductInfo {...defaultProps} />)
    expect(
      screen.getByRole('button', { name: 'Add to cart' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Add to cart' }),
    ).not.toBeDisabled()
  })

  it('renders disabled "Unavailable" button when activeVariant is undefined', () => {
    render(<ProductInfo {...defaultProps} activeVariant={undefined} />)
    expect(screen.getByRole('button', { name: 'Unavailable' })).toBeDisabled()
  })
})
