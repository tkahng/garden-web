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
import { authRequestPasswordReset } from '#/lib/api'

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
