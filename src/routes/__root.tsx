import { Outlet, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import Header from '#/components/Header'
import Footer from '#/components/Footer'
import AuthModal from '#/components/AuthModal'
import { AuthModalProvider } from '#/context/auth-modal'
import { AuthProvider } from '#/context/auth'
import { CartProvider } from '#/context/cart'

import '../styles.css'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <AuthModalProvider>
      <AuthProvider>
        <CartProvider>
          <div className="flex min-h-screen flex-col">
            <Header />
            <div className="flex-1">
              <Outlet />
            </div>
            <Footer />
          </div>
          <AuthModal />
          <TanStackDevtools
            config={{
              position: 'bottom-right',
            }}
            plugins={[
              {
                name: 'TanStack Router',
                render: <TanStackRouterDevtoolsPanel />,
              },
            ]}
          />
        </CartProvider>
      </AuthProvider>
    </AuthModalProvider>
  )
}
