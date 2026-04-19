import type { components } from '#/schema'
import type { createAuthFetch } from '#/lib/api'

// ─── Types from schema ────────────────────────────────────────────────────────

export type CompanyResponse = components['schemas']['CompanyResponse']
export type CreateCompanyRequest = components['schemas']['CreateCompanyRequest']
export type UpdateCompanyRequest = components['schemas']['UpdateCompanyRequest']
export type AddMemberRequest = components['schemas']['AddMemberRequest']
export type QuoteCartResponse = components['schemas']['QuoteCartResponse']
export type QuoteCartItemResponse = components['schemas']['QuoteCartItemResponse']
export type AddQuoteCartItemRequest = components['schemas']['AddQuoteCartItemRequest']
export type UpdateQuoteCartItemRequest = components['schemas']['UpdateQuoteCartItemRequest']
export type QuoteRequestResponse = Omit<
  components['schemas']['QuoteRequestResponse'],
  'status'
> & { status?: QuoteStatus }
export type QuoteItemResponse = components['schemas']['QuoteItemResponse']
export type SubmitQuoteRequest = components['schemas']['SubmitQuoteRequest']
// Extended from schema — backend adds invoiceId and pendingApproval in newer versions
export type QuoteAcceptResponse = components['schemas']['QuoteAcceptResponse'] & {
  invoiceId?: string
  pendingApproval?: boolean
}

// Extend status to include PENDING_APPROVAL (added in newer backend version)
export type QuoteStatus =
  | 'PENDING'
  | 'ASSIGNED'
  | 'DRAFT'
  | 'SENT'
  | 'ACCEPTED'
  | 'PAID'
  | 'REJECTED'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'PENDING_APPROVAL'
export type PagedResultQuoteRequestResponse =
  components['schemas']['PagedResultQuoteRequestResponse']

// ─── Types not yet in generated schema ───────────────────────────────────────

export type CompanyMemberResponse = {
  membershipId?: string
  userId?: string
  email?: string
  firstName?: string
  lastName?: string
  role?: 'OWNER' | 'MANAGER' | 'MEMBER'
  spendingLimit?: number
  joinedAt?: string
}

export type UpdateMemberRoleRequest = {
  role: 'MANAGER' | 'MEMBER'
}

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'CANCELLED' | 'EXPIRED'

export type InvitationResponse = {
  id?: string
  companyId?: string
  companyName?: string
  email?: string
  role?: 'MANAGER' | 'MEMBER'
  spendingLimit?: number
  token?: string
  invitedBy?: string
  status?: InvitationStatus
  expiresAt?: string
  createdAt?: string
}

export type CreateInvitationRequest = {
  email: string
  role?: 'MANAGER' | 'MEMBER'
  spendingLimit?: number
}

export type InvoiceStatus = 'ISSUED' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'VOID'

export type InvoicePaymentResponse = {
  id?: string
  invoiceId?: string
  amount?: number
  paymentReference?: string
  notes?: string
  paidAt?: string
  createdAt?: string
}

export type InvoiceResponse = {
  id?: string
  companyId?: string
  orderId?: string
  quoteId?: string
  status?: InvoiceStatus
  totalAmount?: number
  paidAmount?: number
  outstandingAmount?: number
  currency?: string
  issuedAt?: string
  dueAt?: string
  payments?: InvoicePaymentResponse[]
  createdAt?: string
  updatedAt?: string
}

// ─── Auth fetch type alias ────────────────────────────────────────────────────

type AuthFetch = ReturnType<typeof createAuthFetch>

// ─── Company ──────────────────────────────────────────────────────────────────

export async function listCompanies(fetch: AuthFetch): Promise<CompanyResponse[]> {
  return fetch<CompanyResponse[]>('/api/v1/companies')
}

export async function getCompany(fetch: AuthFetch, id: string): Promise<CompanyResponse> {
  return fetch<CompanyResponse>(`/api/v1/companies/${id}`)
}

export async function createCompany(
  fetch: AuthFetch,
  data: CreateCompanyRequest,
): Promise<CompanyResponse> {
  return fetch<CompanyResponse>('/api/v1/companies', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateCompany(
  fetch: AuthFetch,
  id: string,
  data: UpdateCompanyRequest,
): Promise<CompanyResponse> {
  return fetch<CompanyResponse>(`/api/v1/companies/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

// ─── Members ──────────────────────────────────────────────────────────────────

export async function listMembers(
  fetch: AuthFetch,
  companyId: string,
): Promise<CompanyMemberResponse[]> {
  return fetch<CompanyMemberResponse[]>(`/api/v1/companies/${companyId}/members`)
}

export async function addMember(
  fetch: AuthFetch,
  companyId: string,
  data: AddMemberRequest,
): Promise<CompanyMemberResponse> {
  return fetch<CompanyMemberResponse>(`/api/v1/companies/${companyId}/members`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateMemberRole(
  fetch: AuthFetch,
  companyId: string,
  userId: string,
  data: UpdateMemberRoleRequest,
): Promise<CompanyMemberResponse> {
  return fetch<CompanyMemberResponse>(
    `/api/v1/companies/${companyId}/members/${userId}/role`,
    { method: 'PUT', body: JSON.stringify(data) },
  )
}

export async function removeMember(
  fetch: AuthFetch,
  companyId: string,
  userId: string,
): Promise<void> {
  return fetch<void>(`/api/v1/companies/${companyId}/members/${userId}`, {
    method: 'DELETE',
  })
}

// ─── Invitations ──────────────────────────────────────────────────────────────

export async function listInvitations(
  fetch: AuthFetch,
  companyId: string,
): Promise<InvitationResponse[]> {
  return fetch<InvitationResponse[]>(`/api/v1/companies/${companyId}/invitations`)
}

export async function sendInvitation(
  fetch: AuthFetch,
  companyId: string,
  data: CreateInvitationRequest,
): Promise<InvitationResponse> {
  return fetch<InvitationResponse>(`/api/v1/companies/${companyId}/invitations`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function cancelInvitation(
  fetch: AuthFetch,
  companyId: string,
  invitationId: string,
): Promise<InvitationResponse> {
  return fetch<InvitationResponse>(
    `/api/v1/companies/${companyId}/invitations/${invitationId}`,
    { method: 'DELETE' },
  )
}

export async function getInvitationByToken(token: string): Promise<InvitationResponse> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? ''
  const res = await fetch(`${baseUrl}/api/v1/invitations/${token}`)
  if (!res.ok) throw new Error(String(res.status))
  const json = await res.json()
  return json.data
}

export async function acceptInvitation(
  fetch: AuthFetch,
  token: string,
): Promise<InvitationResponse> {
  return fetch<InvitationResponse>(`/api/v1/invitations/${token}/accept`, {
    method: 'POST',
  })
}

// ─── Quote cart ───────────────────────────────────────────────────────────────

export async function getQuoteCart(fetch: AuthFetch): Promise<QuoteCartResponse> {
  return fetch<QuoteCartResponse>('/api/v1/quote-cart')
}

export async function addToQuoteCart(
  fetch: AuthFetch,
  data: AddQuoteCartItemRequest,
): Promise<QuoteCartResponse> {
  return fetch<QuoteCartResponse>('/api/v1/quote-cart/items', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateQuoteCartItem(
  fetch: AuthFetch,
  itemId: string,
  data: UpdateQuoteCartItemRequest,
): Promise<QuoteCartResponse> {
  return fetch<QuoteCartResponse>(`/api/v1/quote-cart/items/${itemId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function removeQuoteCartItem(
  fetch: AuthFetch,
  itemId: string,
): Promise<QuoteCartResponse> {
  return fetch<QuoteCartResponse>(`/api/v1/quote-cart/items/${itemId}`, {
    method: 'DELETE',
  })
}

// ─── Quotes ───────────────────────────────────────────────────────────────────

export async function listQuotes(
  fetch: AuthFetch,
  params?: { page?: number; size?: number },
): Promise<PagedResultQuoteRequestResponse> {
  const qs = new URLSearchParams()
  if (params?.page !== undefined) qs.set('page', String(params.page))
  if (params?.size !== undefined) qs.set('size', String(params.size))
  const query = qs.toString()
  return fetch<PagedResultQuoteRequestResponse>(
    `/api/v1/quotes${query ? `?${query}` : ''}`,
  )
}

export async function getQuote(
  fetch: AuthFetch,
  id: string,
): Promise<QuoteRequestResponse> {
  return fetch<QuoteRequestResponse>(`/api/v1/quotes/${id}`)
}

export async function submitQuote(
  fetch: AuthFetch,
  data: SubmitQuoteRequest,
): Promise<QuoteRequestResponse> {
  return fetch<QuoteRequestResponse>('/api/v1/quotes', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function acceptQuote(
  fetch: AuthFetch,
  id: string,
): Promise<QuoteAcceptResponse> {
  return fetch<QuoteAcceptResponse>(`/api/v1/quotes/${id}/accept`, { method: 'POST' })
}

export async function cancelQuote(
  fetch: AuthFetch,
  id: string,
): Promise<QuoteRequestResponse> {
  return fetch<QuoteRequestResponse>(`/api/v1/quotes/${id}/cancel`, { method: 'POST' })
}

export async function listPendingApprovals(
  fetch: AuthFetch,
  params?: { page?: number; size?: number },
): Promise<PagedResultQuoteRequestResponse> {
  const qs = new URLSearchParams()
  if (params?.page !== undefined) qs.set('page', String(params.page))
  if (params?.size !== undefined) qs.set('size', String(params.size))
  const query = qs.toString()
  return fetch<PagedResultQuoteRequestResponse>(
    `/api/v1/quotes/pending-approvals${query ? `?${query}` : ''}`,
  )
}

export async function approveQuote(
  fetch: AuthFetch,
  id: string,
): Promise<QuoteAcceptResponse> {
  return fetch<QuoteAcceptResponse>(`/api/v1/quotes/${id}/approve`, { method: 'POST' })
}

export async function rejectApproval(
  fetch: AuthFetch,
  id: string,
): Promise<QuoteRequestResponse> {
  return fetch<QuoteRequestResponse>(`/api/v1/quotes/${id}/reject-approval`, { method: 'POST' })
}

export function getQuotePdfUrl(id: string): string {
  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? ''
  return `${baseUrl}/api/v1/quotes/${id}/pdf`
}

// ─── Price lists ─────────────────────────────────────────────────────────────

export type PriceListResponse = {
  id?: string
  companyId?: string
  name?: string
  currency?: string
  priority?: number
  startsAt?: string
  endsAt?: string
  createdAt?: string
  updatedAt?: string
}

export type CustomerPriceEntryResponse = {
  variantId?: string
  productTitle?: string
  productHandle?: string
  variantTitle?: string
  sku?: string
  retailPrice?: number
  contractPrice?: number
  minQty?: number
}

export async function listPriceLists(
  fetch: AuthFetch,
  companyId: string,
): Promise<PriceListResponse[]> {
  return fetch<PriceListResponse[]>(`/api/v1/companies/${companyId}/price-lists`)
}

export async function listPriceListEntries(
  fetch: AuthFetch,
  companyId: string,
  priceListId: string,
): Promise<CustomerPriceEntryResponse[]> {
  return fetch<CustomerPriceEntryResponse[]>(
    `/api/v1/companies/${companyId}/price-lists/${priceListId}/entries`,
  )
}

// ─── Invoices ─────────────────────────────────────────────────────────────────

export async function listInvoices(
  fetch: AuthFetch,
  companyId: string,
): Promise<InvoiceResponse[]> {
  return fetch<InvoiceResponse[]>(`/api/v1/companies/${companyId}/invoices`)
}

