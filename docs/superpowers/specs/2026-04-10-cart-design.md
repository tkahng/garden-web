# Cart Feature Design

**Date:** 2026-04-10  
**Branch:** feat/cart

---

## Overview

Add a shopping cart backed by the existing server-side cart API. Cart state is shared across the app via a `CartContext`. The cart is accessible at a dedicated `/cart` route. All cart operations require authentication; unauthenticated users are prompted to sign in.

---

## API Client (`src/lib/cart-api.ts`)

Create an `openapi-fetch` client typed against `src/schema.d.ts` using `createClient<paths>`. Export five functions, each accepting the `authFetch` instance from `AuthContext` so JWT handling and token refresh are delegated to the existing auth machinery.

```
getCart(fetch)                          → CartResponse
addCartItem(fetch, variantId, qty?)     → CartResponse
updateCartItem(fetch, itemId, qty)      → CartResponse
removeCartItem(fetch, itemId)           → CartResponse
abandonCart(fetch)                      → void
```

All cart endpoints are auth-gated at the API level. The `authFetch` instance handles the `Authorization: Bearer <token>` header and silent token refresh automatically.

**Types used from schema:**
- `CartResponse` — `{ id, status, items, createdAt }`
- `CartItemResponse` — `{ id, variantId, quantity, unitPrice, product }`
- `CartItemProductInfo` — `{ productId, productTitle, variantTitle, imageUrl }`
- `AddCartItemRequest` — `{ variantId: string, quantity?: number }`
- `UpdateCartItemRequest` — `{ quantity?: number }`

---

## CartContext (`src/context/cart.tsx`)

A `CartProvider` sits inside `AuthProvider` in `__root.tsx`. It reads `authFetch` and `isAuthenticated` from `AuthContext`.

**State shape:**
```ts
interface CartState {
  cart: CartResponse | null
  isLoading: boolean
}
```

**Exposed via context:**
```ts
interface CartContextValue {
  cart: CartResponse | null
  isLoading: boolean
  itemCount: number                                           // derived: sum of item quantities
  addItem: (variantId: string, qty?: number) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
  updateQuantity: (itemId: string, qty: number) => Promise<void>
  abandon: () => Promise<void>
}
```

**Lifecycle:**
- On mount when `isAuthenticated` is true: fetch cart, store in state.
- When `isAuthenticated` flips true: fetch cart.
- When `isAuthenticated` flips false: clear cart state.
- Each mutation (`addItem`, `removeItem`, `updateQuantity`, `abandon`) calls the API and updates state from the returned `CartResponse`. `abandon` clears state after success.

---

## Cart Page (`src/routes/cart/index.tsx`)

Dedicated route at `/cart`. Reads from `useCart()`.

**Three render states:**

1. **Loading** — skeleton placeholder rows while `isLoading` is true.
2. **Empty** — friendly empty state message with a "Continue shopping" `<Link to="/products">`.
3. **Items present** — a list of cart item rows, each showing:
   - Product image (`product.imageUrl`, with a placeholder fallback if absent)
   - Product title (`product.productTitle`) and variant title (`product.variantTitle`)
   - Unit price and line total (`unitPrice × quantity`)
   - Quantity controls: − and + buttons calling `updateQuantity`; minimum quantity is 1
   - Remove button calling `removeItem`
   - Cart subtotal (sum of all line totals) at the bottom
   - "Abandon cart" button calling `abandon` at the bottom

---

## Integration Points

### `src/routes/products/$handle.tsx`
- The "Add to cart" button reads `useCart().addItem` and `useCart().isLoading`.
- If the user is **not** authenticated: call `openAuthModal('login')` instead of adding to cart.
- If authenticated: call `addItem(activeVariant.id)`.
- Disable the button while `isLoading` is true.

### `src/components/Header.tsx`
- The cart icon (`ShoppingBagIcon`) currently opens the auth modal as a placeholder.
- Replace with a `<Link to="/cart">` button.
- Show a numeric badge on the icon when `useCart().itemCount > 0`.

### `src/routes/__root.tsx`
- Add `<CartProvider>` as a child of `<AuthProvider>`, wrapping the rest of the tree.

---

## File Inventory

| File | Action |
|------|--------|
| `src/lib/cart-api.ts` | Create — openapi-fetch client + 5 cart functions |
| `src/context/cart.tsx` | Create — CartContext, CartProvider, useCart |
| `src/routes/cart/index.tsx` | Create — /cart page |
| `src/routes/products/$handle.tsx` | Edit — wire up "Add to cart" button |
| `src/components/Header.tsx` | Edit — cart icon → link with badge |
| `src/routes/__root.tsx` | Edit — add CartProvider |

---

## Out of Scope

- Checkout flow (no checkout API endpoint is being wired up in this iteration)
- Guest cart (all operations require auth, enforced by the API)
- Optimistic updates (mutations wait for server response before updating state)
- Cart persistence across devices beyond what the server already provides
