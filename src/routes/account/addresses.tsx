import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useAuth } from '#/context/auth'
import { Skeleton } from '#/components/ui/skeleton'
import {
  listAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
} from '#/lib/account-api'
import type { AddressRequest, AddressResponse } from '#/lib/account-api'

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/account/addresses')({
  component: AddressesPage,
})

// ─── AddressSkeleton ──────────────────────────────────────────────────────────

export function AddressSkeleton() {
  return (
    <div data-testid="address-skeleton" className="flex flex-col gap-3">
      {[1, 2].map((i) => (
        <Skeleton key={i} className="h-28 w-full rounded-xl" />
      ))}
    </div>
  )
}

// ─── AddressForm ──────────────────────────────────────────────────────────────

export function AddressForm({
  initial,
  onSave,
  onCancel,
  isSaving,
}: {
  initial?: Partial<AddressRequest>
  onSave: (data: AddressRequest) => void
  onCancel: () => void
  isSaving: boolean
}) {
  const [fields, setFields] = useState<AddressRequest>({
    firstName: initial?.firstName ?? '',
    lastName: initial?.lastName ?? '',
    company: initial?.company ?? '',
    address1: initial?.address1 ?? '',
    address2: initial?.address2 ?? '',
    city: initial?.city ?? '',
    province: initial?.province ?? '',
    zip: initial?.zip ?? '',
    country: initial?.country ?? '',
    isDefault: initial?.isDefault ?? false,
  })

  function field(name: keyof AddressRequest) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setFields((prev) => ({ ...prev, [name]: e.target.value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave(fields)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-xl border border-border p-4"
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="addrFirstName" className="text-sm font-medium">
            First name
          </label>
          <input
            id="addrFirstName"
            aria-label="First name"
            required
            value={fields.firstName}
            onChange={field('firstName')}
            className="rounded-md border border-border px-3 py-2 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="addrLastName" className="text-sm font-medium">
            Last name
          </label>
          <input
            id="addrLastName"
            aria-label="Last name"
            required
            value={fields.lastName}
            onChange={field('lastName')}
            className="rounded-md border border-border px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="addrCompany" className="text-sm font-medium">
          Company <span className="text-muted-foreground">(optional)</span>
        </label>
        <input
          id="addrCompany"
          aria-label="Company"
          value={fields.company ?? ''}
          onChange={field('company')}
          className="rounded-md border border-border px-3 py-2 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="addrAddress1" className="text-sm font-medium">
          Address line 1
        </label>
        <input
          id="addrAddress1"
          aria-label="Address line 1"
          required
          value={fields.address1}
          onChange={field('address1')}
          className="rounded-md border border-border px-3 py-2 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="addrAddress2" className="text-sm font-medium">
          Address line 2 <span className="text-muted-foreground">(optional)</span>
        </label>
        <input
          id="addrAddress2"
          aria-label="Address line 2"
          value={fields.address2 ?? ''}
          onChange={field('address2')}
          className="rounded-md border border-border px-3 py-2 text-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="addrCity" className="text-sm font-medium">
            City
          </label>
          <input
            id="addrCity"
            aria-label="City"
            required
            value={fields.city}
            onChange={field('city')}
            className="rounded-md border border-border px-3 py-2 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="addrProvince" className="text-sm font-medium">
            Province / State <span className="text-muted-foreground">(optional)</span>
          </label>
          <input
            id="addrProvince"
            aria-label="Province"
            value={fields.province ?? ''}
            onChange={field('province')}
            className="rounded-md border border-border px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="addrZip" className="text-sm font-medium">
            ZIP / Postal code
          </label>
          <input
            id="addrZip"
            aria-label="ZIP"
            required
            value={fields.zip}
            onChange={field('zip')}
            className="rounded-md border border-border px-3 py-2 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="addrCountry" className="text-sm font-medium">
            Country
          </label>
          <input
            id="addrCountry"
            aria-label="Country"
            required
            value={fields.country}
            onChange={field('country')}
            className="rounded-md border border-border px-3 py-2 text-sm"
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={fields.isDefault ?? false}
          onChange={(e) => setFields((prev) => ({ ...prev, isDefault: e.target.checked }))}
        />
        Set as default
      </label>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {isSaving ? 'Saving…' : 'Save address'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-border px-5 py-2 text-sm font-semibold hover:bg-muted"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

// ─── AddressCard ──────────────────────────────────────────────────────────────

export function AddressCard({
  address,
  onEdit,
  onDelete,
}: {
  address: AddressResponse
  onEdit: () => void
  onDelete: () => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div className="rounded-xl border border-border p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5 text-sm">
          <p className="font-semibold">
            {address.firstName} {address.lastName}
            {address.isDefault && (
              <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                Default
              </span>
            )}
          </p>
          {address.company && <p className="text-muted-foreground">{address.company}</p>}
          <p>{address.address1}</p>
          {address.address2 && <p>{address.address2}</p>}
          <p>
            {address.city}
            {address.province ? `, ${address.province}` : ''} {address.zip}
          </p>
          <p>{address.country}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={onEdit}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Edit
          </button>
          {!confirmDelete ? (
            <button
              type="button"
              aria-label="Delete"
              onClick={() => setConfirmDelete(true)}
              className="text-sm text-destructive hover:opacity-80"
            >
              Delete
            </button>
          ) : (
            <div className="flex gap-1">
              <button
                type="button"
                aria-label="Confirm"
                onClick={onDelete}
                className="text-sm font-semibold text-destructive hover:opacity-80"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── AddressesPage ────────────────────────────────────────────────────────────

function AddressesPage() {
  const { authFetch } = useAuth()

  const [addresses, setAddresses] = useState<AddressResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | 'new' | null>(null)

  async function loadAddresses() {
    const data = await listAddresses(authFetch)
    setAddresses(data)
  }

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    listAddresses(authFetch)
      .then((data) => {
        if (!cancelled) setAddresses(data)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [authFetch])

  async function handleSave(data: AddressRequest, id?: string) {
    setIsSaving(true)
    try {
      if (id) {
        await updateAddress(authFetch, id, data)
      } else {
        await createAddress(authFetch, data)
      }
      await loadAddresses()
      setEditingId(null)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(id: string) {
    await deleteAddress(authFetch, id)
    await loadAddresses()
  }

  if (isLoading) return <AddressSkeleton />

  return (
    <div className="flex flex-col gap-4 max-w-lg">
      <h2 className="text-lg font-semibold">Addresses</h2>

      {addresses.length === 0 && editingId === null && (
        <p className="text-sm text-muted-foreground">
          No saved addresses. Add one to speed up checkout.
        </p>
      )}

      {addresses.map((addr) =>
        editingId === addr.id ? (
          <AddressForm
            key={addr.id}
            initial={addr as Partial<AddressRequest>}
            onSave={(data) => handleSave(data, addr.id)}
            onCancel={() => setEditingId(null)}
            isSaving={isSaving}
          />
        ) : (
          <AddressCard
            key={addr.id}
            address={addr}
            onEdit={() => setEditingId(addr.id!)}
            onDelete={() => handleDelete(addr.id!)}
          />
        ),
      )}

      {editingId === 'new' ? (
        <AddressForm
          onSave={(data) => handleSave(data)}
          onCancel={() => setEditingId(null)}
          isSaving={isSaving}
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditingId('new')}
          className="self-start rounded-full border border-border px-5 py-2 text-sm font-semibold hover:bg-muted"
        >
          Add address
        </button>
      )}
    </div>
  )
}
