# Auth Feature Design

**Date:** 2026-04-08  
**Branch:** feat/auth  
**Status:** Approved

---

## Overview

Add authenticated user support to the Garden Shop storefront. Auth is a prerequisite for cart functionality: the backend cart endpoints require an authenticated user. Guest users who click the cart or "Add to cart" are prompted to log in via a modal — no page navigation.

---

## Architecture

### State Shape

Stored in React Context, mirrored to `localStorage`:

```ts
{
  user: User | null        // id, email, firstName, lastName, status, roles
  accessToken: string | null
  refreshToken: string | null
}
```

### AuthContext (`src/context/auth.tsx`)

Provides:
- `user: User | null`
- `isAuthenticated: boolean`
- `login(email, password): Promise<void>`
- `register(email, password, firstName, lastName): Promise<void>`
- `logout(): Promise<void>`
- `refreshTokens(): Promise<void>`

On app boot, reads from `localStorage` and rehydrates. On token expiry, auto-calls `/api/v1/auth/refresh`; if that fails, clears state and opens the auth modal.

### AuthModalContext (`src/context/auth-modal.tsx`)

Provides:
- `openAuthModal(tab?: 'login' | 'register' | 'forgot-password' | 'verify-email'): void`
- `closeAuthModal(): void`
- `activeTab: string`

Decoupled from `AuthContext` so any component (Header cart icon, "Add to cart" button) can trigger the modal without knowing about tokens.

### api.ts Changes

- `apiFetch` gains an optional `token` parameter; authenticated requests send `Authorization: Bearer <accessToken>`
- New `authFetch` wrapper handles 401s: attempts token refresh, retries original request once; if refresh fails, calls `logout()` and opens auth modal

---

## Auth Modal UI

Single `AuthModal` component (`src/components/AuthModal.tsx`), rendered once in `__root.tsx`. Uses the existing `Dialog` UI component. Contains four tab views:

### Login Tab
- Fields: email, password
- Calls `AuthContext.login()`
- Inline error on failure
- "Forgot password?" → switches to forgot-password tab
- "Don't have an account?" → switches to register tab

### Register Tab
- Fields: email, password, firstName, lastName
- Calls `AuthContext.register()`
- On success: shows toast ("Check your email to verify your account"), switches to login tab

### Forgot Password Tab
- Field: email only
- Calls `POST /api/v1/auth/request-password-reset`
- Shows inline success message after submission
- "Back to login" link

### Verify Email Tab
- Informational only (no form)
- Shown after register, or reachable from `/auth/verify-email?token=...` route
- Tells user to check their email

All tabs use existing `Input`, `Label`, `Button`, and `Field` components from `src/components/ui/`.

---

## Header Changes

### Guest State
- Cart icon `onClick` calls `openAuthModal('login')` (future: opens cart sheet when logged in)

### Authenticated State
- Cart icon stays (future: opens cart sheet)
- User avatar/initials button appears to the right of the cart icon
- Initials: `firstName[0] + lastName[0]`, displayed in existing `Avatar` component
- Clicking avatar opens `DropdownMenu` containing:
  - User's name + email (non-interactive header row)
  - "Account" (placeholder link, no route yet)
  - Separator
  - "Sign out" → calls `AuthContext.logout()`

### Mobile Nav Sheet
- Guest: "Sign in" link at the bottom of the nav list
- Authenticated: "Sign out" at the bottom

---

## Routes

### `/auth/verify-email`
- File: `src/routes/auth/verify-email.tsx`
- Reads `token` query param
- Shows loading state → calls `GET /api/v1/auth/verify-email?token=<token>` → shows success or error
- No auth required

### `/auth/reset-password`
- File: `src/routes/auth/reset-password.tsx`
- Reads `token` query param
- Shows "new password" form
- Calls `POST /api/v1/auth/confirm-password-reset/{token}`
- On success: redirects to home with auth modal open on login tab

---

## Token Refresh

`authFetch` in `api.ts`:
1. Makes request with `Authorization: Bearer <accessToken>`
2. On 401: calls `POST /api/v1/auth/refresh` with stored `refreshToken`
3. Updates context + `localStorage` with new tokens
4. Retries original request once
5. If refresh fails: calls `logout()`, opens auth modal

---

## Out of Scope

- Cart sheet UI (separate feature, depends on this)
- Account/profile page (placeholder link in dropdown only)
- Social/OAuth login
- Admin role-based access control
- Email verification deep-link confirmation (server handles it; UI only shows informational state)
