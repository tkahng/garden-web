import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useAuth } from '#/context/auth'
import { toast } from 'sonner'
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from '#/lib/account-api'
import type { NotificationPreference, NotificationType } from '#/lib/account-api'

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/account/notifications')({
  component: NotificationsPage,
})

// ─── Labels ───────────────────────────────────────────────────────────────────

const LABELS: Record<NotificationType, { title: string; description: string }> = {
  ORDER_CONFIRMATION: {
    title: 'Order confirmation',
    description: 'Receive an email when your order is placed.',
  },
  ORDER_SHIPPED: {
    title: 'Shipment notification',
    description: 'Get tracking details when your order ships.',
  },
  ORDER_DELIVERED: {
    title: 'Delivery confirmation',
    description: 'Know when your order has been delivered.',
  },
  ORDER_CANCELLED: {
    title: 'Order cancellation',
    description: 'Be notified if your order is cancelled.',
  },
  QUOTE_UPDATE: {
    title: 'Quote updates',
    description: 'Receive quote documents and status updates.',
  },
  MARKETING: {
    title: 'Marketing & promotions',
    description: 'Occasional product news and special offers.',
  },
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function PreferenceRow({
  pref,
  saving,
  onChange,
}: {
  pref: NotificationPreference
  saving: boolean
  onChange: (type: NotificationType, enabled: boolean) => void
}) {
  const label = LABELS[pref.type]

  return (
    <div className="flex items-start justify-between gap-4 py-4 border-b border-border last:border-0">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium">{label.title}</span>
        <span className="text-xs text-muted-foreground">{label.description}</span>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={pref.enabled}
        disabled={saving}
        onClick={() => onChange(pref.type, !pref.enabled)}
        className={[
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent',
          'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'disabled:cursor-not-allowed disabled:opacity-50',
          pref.enabled ? 'bg-primary' : 'bg-muted',
        ].join(' ')}
      >
        <span
          className={[
            'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg',
            'transform transition-transform',
            pref.enabled ? 'translate-x-5' : 'translate-x-0',
          ].join(' ')}
        />
      </button>
    </div>
  )
}

// ─── NotificationsPage ────────────────────────────────────────────────────────

export function NotificationsPage() {
  const { authFetch } = useAuth()
  const [prefs, setPrefs] = useState<NotificationPreference[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    getNotificationPreferences(authFetch)
      .then((data) => { if (!cancelled) setPrefs(data) })
      .finally(() => { if (!cancelled) setIsLoading(false) })
    return () => { cancelled = true }
  }, [authFetch])

  async function handleChange(type: NotificationType, enabled: boolean) {
    setSaving(true)
    setPrefs((prev) => prev.map((p) => p.type === type ? { ...p, enabled } : p))
    try {
      const updated = await updateNotificationPreferences(authFetch, { [type]: enabled })
      setPrefs(updated)
    } catch {
      setPrefs((prev) => prev.map((p) => p.type === type ? { ...p, enabled: !enabled } : p))
      toast.error('Failed to save preference.')
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-14 w-full animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 max-w-lg">
      <div>
        <h2 className="text-lg font-semibold">Email notifications</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Choose which emails you receive. Transactional emails like password resets are always sent.
        </p>
      </div>

      <div className="rounded-xl border border-border px-4">
        {prefs.map((pref) => (
          <PreferenceRow
            key={pref.type}
            pref={pref}
            saving={saving}
            onChange={handleChange}
          />
        ))}
      </div>
    </div>
  )
}
