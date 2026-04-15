import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '#/components/ui/dialog'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Button } from '#/components/ui/button'
import { useAuth } from '#/context/auth'
import { useAuthModal } from '#/context/auth-modal'
import { authRequestPasswordReset, getGoogleOAuthUrl } from '#/lib/api'

export default function AuthModal() {
  const { isOpen, activeTab, closeAuthModal, openAuthModal } = useAuthModal()

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) closeAuthModal() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {activeTab === 'login' && 'Sign in'}
            {activeTab === 'register' && 'Create account'}
            {activeTab === 'forgot-password' && 'Reset password'}
            {activeTab === 'verify-email' && 'Verify your email'}
          </DialogTitle>
          <DialogDescription className="sr-only">Authentication</DialogDescription>
        </DialogHeader>
        {activeTab === 'login' && (
          <LoginView
            onForgotPassword={() => openAuthModal('forgot-password')}
            onRegister={() => openAuthModal('register')}
            onSuccess={closeAuthModal}
          />
        )}
        {activeTab === 'register' && (
          <RegisterView onSuccess={closeAuthModal} />
        )}
        {activeTab === 'forgot-password' && (
          <ForgotPasswordView onBack={() => openAuthModal('login')} />
        )}
        {activeTab === 'verify-email' && <VerifyEmailView />}
      </DialogContent>
    </Dialog>
  )
}

function LoginView({
  onForgotPassword,
  onRegister,
  onSuccess,
}: {
  onForgotPassword: () => void
  onRegister: () => void
  onSuccess: () => void
}) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
      onSuccess()
    } catch {
      setError('Invalid email or password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="login-email">Email</Label>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="login-password">Password</Label>
        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={loading}>
        Sign in
      </Button>
      <div className="relative flex items-center gap-2">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>
      <Button type="button" variant="outline" onClick={() => { window.location.href = getGoogleOAuthUrl() }}>
        <GoogleIcon />
        Continue with Google
      </Button>
      <div className="flex flex-col gap-1 text-center text-sm text-muted-foreground">
        <button type="button" className="underline hover:text-foreground" onClick={onForgotPassword}>
          Forgot password?
        </button>
        <button type="button" className="underline hover:text-foreground" onClick={onRegister}>
          Don't have an account? Register
        </button>
      </div>
    </form>
  )
}

function RegisterView({ onSuccess }: { onSuccess: () => void }) {
  const { register } = useAuth()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await register(email, password, firstName, lastName)
      onSuccess()
    } catch {
      setError('Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="register-first-name">First name</Label>
        <Input
          id="register-first-name"
          type="text"
          autoComplete="given-name"
          required
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="register-last-name">Last name</Label>
        <Input
          id="register-last-name"
          type="text"
          autoComplete="family-name"
          required
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="register-email">Email</Label>
        <Input
          id="register-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="register-password">Password</Label>
        <Input
          id="register-password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={loading}>
        Create account
      </Button>
      <div className="relative flex items-center gap-2">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>
      <Button type="button" variant="outline" onClick={() => { window.location.href = getGoogleOAuthUrl() }}>
        <GoogleIcon />
        Continue with Google
      </Button>
    </form>
  )
}

function ForgotPasswordView({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await authRequestPasswordReset(email)
      setSent(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm">Check your email for a password reset link.</p>
        <button type="button" className="text-sm underline hover:text-foreground" onClick={onBack}>
          Back to login
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="forgot-email">Email</Label>
        <Input
          id="forgot-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={loading}>
        Send reset link
      </Button>
      <button type="button" className="text-sm underline hover:text-foreground" onClick={onBack}>
        Back to login
      </button>
    </form>
  )
}

function VerifyEmailView() {
  return (
    <div className="flex flex-col gap-2 text-sm">
      <p>Check your email to verify your account.</p>
      <p className="text-muted-foreground">
        We sent a verification link to your email address. Click the link to activate your account.
      </p>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}
