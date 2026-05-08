# Garden Web — Storefront

Customer-facing storefront for the Garden e-commerce platform. Built for B2B buyers as well as standard shoppers.

## Stack

- **React 19** · TypeScript · Vite
- **TanStack Router** (file-based routing) · **TanStack Query**
- **Tailwind CSS** · **shadcn/ui** components
- **openapi-fetch** for typed API calls against the Garden backend
- **Vitest** · **@testing-library/react** · **MSW** for testing

## What's in it

**Shopping**
- Product listing and detail pages with reviews, related products, and variant selection
- Collections with visibility rules
- Full-text search across products, articles, and collections
- Cart with quantity controls, discount codes, and gift card redemption
- Guest checkout and authenticated checkout via Stripe
- Shipping rate selection

**Account**
- Order history with fulfillment tracking and shipment links
- Return request submission
- Address book
- Email notification preferences (per notification type)
- Gift card balance and transaction history
- Saved order templates for repeat ordering

**B2B**
- Company creation and member invitation acceptance
- Quote cart, quote submission, quote tracking and acceptance
- Order approval routing for spending-limit enforcement
- Net terms checkout (no Stripe redirect for credit account holders)
- Invoice history and PDF download
- Contract pricing / price tier display
- Quick order by SKU

## Running locally

```bash
npm install
npm run dev        # runs on port 3000
```

Requires the Garden backend running on port 8080. Set `VITE_API_URL` in `.env` if the backend is elsewhere.

## Tests

```bash
npm test           # type-check + vitest
```

351 tests covering API functions, route pages, context, and components.

## Generating the API schema

```bash
npm run generate:schema   # requires backend running on :8080
```
