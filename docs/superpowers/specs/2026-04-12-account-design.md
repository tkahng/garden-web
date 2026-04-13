# Account Feature Design

**Date:** 2026-04-12  
**Branch:** feat/account

---

## Overview

Add a `/account` page for authenticated users. The page uses a tabbed layout with three tabs: **Profile**, **Addresses**, and **Orders**. All content requires authentication; unauthenticated visitors are redirected to the home page with the auth modal opened on the login tab.

---

## API Client (`src/lib/account-api.ts`)

Create an `openapi-fetch` client typed against `src/schema.d.ts`. Export functions accepting the `authFetch` instance from `AuthContext`.

```
getAccount(fetch)                               → AccountResponse
updateAccount(fetch, data)                      → AccountResponse

listAddresses(fetch)                            → AddressResponse[]
createAddress(fetch, data)                      → AddressResponse
updateAddress(fetch, id, data)                  → AddressResponse
deleteAddress(fetch, id)                        → void

listOrders(fetch, params?)                      → PagedResultOrderResponse
getOrder(fetch, id)                             → OrderResponse
cancelOrder(fetch, id)                          → OrderResponse
```

**Endpoints:**
| Function | Method | Path |
|----------|--------|------|
| `getAccount` | GET | `/api/v1/account` |
| `updateAccount` | PUT | `/api/v1/account` |
| `listAddresses` | GET | `/api/v1/account/addresses` |
| `createAddress` | POST | `/api/v1/account/addresses` |
| `updateAddress` | PUT | `/api/v1/account/addresses/{id}` |
| `deleteAddress` | DELETE | `/api/v1/account/addresses/{id}` |
| `listOrders` | GET | `/api/v1/storefront/orders` |
| `getOrder` | GET | `/api/v1/storefront/orders/{id}` |
| `cancelOrder` | PUT | `/api/v1/storefront/orders/{id}/cancel` |

**Types from schema:**
- `AccountResponse` — `{ id, email, firstName, lastName, phone, status, emailVerifiedAt }`
- `UpdateAccountRequest` — `{ firstName?, lastName?, phone? }`
- `AddressRequest` — `{ firstName, lastName, company?, address1, address2?, city, province?, zip, country, isDefault? }`
- `AddressResponse` — `{ id, firstName, lastName, company?, address1, address2?, city, province?, zip, country, isDefault? }`
- `OrderResponse` — `{ id, userId, status, totalAmount, currency, stripeSessionId, items[], createdAt }`
- `OrderItemProductInfo` — `{ productId, productTitle, variantTitle, imageUrl }`
- `OrderItemResponse` — `{ id, variantId, quantity, unitPrice, product?: OrderItemProductInfo }`
- `PagedResultOrderResponse` — `{ content: OrderResponse[], page, size, totalElements, totalPages }`

---

## Route (`src/routes/account/index.tsx`)

Single route at `/account`. On mount, check `isAuthenticated` from `AuthContext`:
- **Not authenticated** → redirect to `/` and call `openAuthModal('login')`.
- **Authenticated** → render tabbed account page.

Tab state is stored in a URL search param (`?tab=profile|addresses|orders`), defaulting to `profile`. Switching tabs updates the param without a full navigation.

---

## Layout

```
┌─────────────────────────────────────────────┐
│  Account                                    │
│  [Profile] [Addresses] [Orders]             │  ← tab bar
├─────────────────────────────────────────────┤
│  <active tab content>                       │
└─────────────────────────────────────────────┘
```

Use existing `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` components from `src/components/ui/` if available; otherwise implement with plain buttons and conditional rendering.

---

## Profile Tab

Fetches account on mount via `getAccount`. Displays a form:

**Read-only fields:**
- Email (`AccountResponse.email`) — displayed as plain text, not editable

**Editable fields (inline edit form):**
- First name (`firstName`)
- Last name (`lastName`)
- Phone (`phone`)

**Behavior:**
- Form initializes with current values from `AccountResponse`.
- "Save" calls `updateAccount` with changed fields; shows inline success/error feedback.
- Status badge next to email: `UNVERIFIED` (yellow), `ACTIVE` (green), `SUSPENDED` (red).

---

## Addresses Tab

Fetches addresses on mount via `listAddresses`.

**List view:**
- Each address card shows: name, company (if set), address lines, city, province, zip, country.
- Default address marked with a "Default" badge.
- Per-card actions: "Edit" (opens edit form inline or in a dialog), "Delete" (calls `deleteAddress` with confirmation).
- "Add address" button opens a blank address form.

**Address form fields:**
- First name, Last name (required)
- Company (optional)
- Address line 1 (required), Address line 2 (optional)
- City (required), Province/State (optional), ZIP/Postal code (required), Country (required)
- "Set as default" checkbox (`isDefault`)

**Empty state:** "No saved addresses. Add one to speed up checkout."

---

## Orders Tab

Fetches orders on mount via `listOrders` (page=0, size=10). Paginated.

**List view:**
- Each order row shows: order ID (truncated), date (`createdAt`), status badge, total (`totalAmount currency`).
- Status badges: `PENDING_PAYMENT` (yellow), `PAID` (green), `CANCELLED` (gray), `REFUNDED` (blue).
- Clicking a row expands it inline (accordion) to show order detail.

**Order detail (expanded):**
- Items list: each item shows product image (`product.imageUrl`, with placeholder fallback), product title (`product.productTitle`), variant title (`product.variantTitle`), quantity, unit price, and line total (`unitPrice × quantity`).
- Order total.
- "Cancel order" button — visible only when `status === 'PENDING_PAYMENT'`. Calls `cancelOrder`; updates the row status on success.

**Pagination:**
- "Load more" button appends the next page (cursor-style append, not page navigation).

**Empty state:** "No orders yet. Start shopping!"

---

## Loading & Error States

Each tab manages its own `isLoading` and `error` state independently (no shared context — data is scoped to the account page and not needed elsewhere).

- **Loading:** skeleton placeholder for each section.
- **Error:** inline error message with a "Retry" button.

---

## Integration Points

### `src/components/Header.tsx`
- The "Account" link in the user dropdown already points to `/account` (line 129). No change needed.

### `src/routes/__root.tsx`
- No new providers needed; account page reads from existing `AuthContext`.

---

## File Inventory

| File | Action |
|------|--------|
| `src/lib/account-api.ts` | Create — openapi-fetch client + 9 account/address/order functions |
| `src/routes/account/index.tsx` | Create — /account page with tabbed layout |

---

## Out of Scope

- Password change (separate flow via `/auth/reset-password`)
- Email change
- Order refund initiation (refund is admin/server-side)
- Pagination controls beyond "load more" for orders
