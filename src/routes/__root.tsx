import { Outlet, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { ErrorBoundary } from 'react-error-boundary'
import { Toaster } from 'sonner'
import Header from '#/components/Header'
import Footer from '#/components/Footer'
import AuthModal from '#/components/AuthModal'
import NewsletterPopup from '#/components/NewsletterPopup'
import { AuthModalProvider } from '#/context/auth-modal'
import { AuthProvider } from '#/context/auth'
import { CartProvider } from '#/context/cart'
import { GuestCartProvider } from '#/context/guest-cart'
import { WishlistProvider } from '#/context/wishlist'

import '../styles.css'

export const Route = createRootRoute({
  component: RootComponent,
})

function AppErrorFallback() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
      <p className="text-muted-foreground">An unexpected error occurred.</p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="rounded-full bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
      >
        Reload page
      </button>
    </div>
  )
}

function RootComponent() {
  return (
    <AuthModalProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
          <GuestCartProvider>
            <ErrorBoundary FallbackComponent={AppErrorFallback}>
              <Toaster />
              <div className="flex min-h-screen flex-col">
                <Header />
                <div className="flex-1">
                  <Outlet />
                </div>
                <Footer />
              </div>
              <AuthModal />
              <NewsletterPopup />
            </ErrorBoundary>
            {!import.meta.env.PROD && (
              <TanStackDevtools
                config={{ position: 'bottom-right' }}
                plugins={[{ name: 'TanStack Router', render: <TanStackRouterDevtoolsPanel /> }]}
              />
            )}
          </GuestCartProvider>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </AuthModalProvider>
  )
}
