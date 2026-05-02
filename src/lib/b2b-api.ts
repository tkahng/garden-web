import type { components } from '#/schema'
import type { ApiClient } from '#/lib/client'
import { callApi, createPublicClient } from '#/lib/client'

// ─── Types from schema ────────────────────────────────────────────────────────

export type CompanyResponse = components['schemas']['CompanyResponse']
export type CreateCompanyRequest = components['schemas']['CreateCompanyRequest']
export type UpdateCompanyRequest = components['schemas']['UpdateCompanyRequest']
export type AddMemberRequest = components['schemas']['AddMemberRequest']
export type CompanyMemberResponse = components['schemas']['CompanyMemberResponse']
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
export type QuoteAcceptResponse = components['schemas']['QuoteAcceptResponse'] & {
  invoiceId?: string
  pendingApproval?: boolean
}
export type PagedResultQuoteRequestResponse =
  components['schemas']['PagedResultQuoteRequestResponse']
export type InvitationResponse = components['schemas']['InvitationResponse']
export type PriceListResponse = components['schemas']['PriceListResponse']
export type CustomerPriceEntryResponse = components['schemas']['CustomerPriceEntryResponse']
export type InvoiceResponse = components['schemas']['InvoiceResponse']
export type InvoicePaymentResponse = components['schemas']['InvoicePaymentResponse']
export type CreditAccountResponse = components['schemas']['CreditAccountResponse']

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

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'CANCELLED' | 'EXPIRED'

export type UpdateMemberRoleRequest = {
  role: 'MANAGER' | 'MEMBER'
}

export type UpdateSpendingLimitRequest = components['schemas']['UpdateSpendingLimitRequest']

export type CreateInvitationRequest = {
  email: string
  role?: 'MANAGER' | 'MEMBER'
  spendingLimit?: number
}

// ─── Company ──────────────────────────────────────────────────────────────────

export function listCompanies(client: ApiClient): Promise<CompanyResponse[]> {
  return callApi(client.GET('/api/v1/companies')) as Promise<CompanyResponse[]>
}

export function getCompany(client: ApiClient, id: string): Promise<CompanyResponse> {
  return callApi(client.GET('/api/v1/companies/{id}', { params: { path: { id } } }))
}

export function createCompany(
  client: ApiClient,
  data: CreateCompanyRequest,
): Promise<CompanyResponse> {
  return callApi(client.POST('/api/v1/companies', { body: data }))
}

export function updateCompany(
  client: ApiClient,
  id: string,
  data: UpdateCompanyRequest,
): Promise<CompanyResponse> {
  return callApi(client.PUT('/api/v1/companies/{id}', { params: { path: { id } }, body: data }))
}

// ─── Members ──────────────────────────────────────────────────────────────────

export function listMembers(
  client: ApiClient,
  companyId: string,
): Promise<CompanyMemberResponse[]> {
  return callApi(client.GET('/api/v1/companies/{id}/members', {
    params: { path: { id: companyId } },
  })) as Promise<CompanyMemberResponse[]>
}

export function addMember(
  client: ApiClient,
  companyId: string,
  data: AddMemberRequest,
): Promise<CompanyMemberResponse> {
  return callApi(client.POST('/api/v1/companies/{id}/members', {
    params: { path: { id: companyId } },
    body: data,
  }))
}

export function updateMemberRole(
  client: ApiClient,
  companyId: string,
  userId: string,
  data: UpdateMemberRoleRequest,
): Promise<CompanyMemberResponse> {
  return callApi(client.PUT('/api/v1/companies/{id}/members/{userId}/role', {
    params: { path: { id: companyId, userId } },
    body: data,
  }))
}

export function removeMember(
  client: ApiClient,
  companyId: string,
  userId: string,
): Promise<void> {
  return callApi(client.DELETE('/api/v1/companies/{id}/members/{userId}', {
    params: { path: { id: companyId, userId } },
  })) as Promise<void>
}

export function updateSpendingLimit(
  client: ApiClient,
  companyId: string,
  userId: string,
  spendingLimit: number | null,
): Promise<CompanyMemberResponse> {
  return callApi(client.PUT('/api/v1/companies/{id}/members/{userId}/spending-limit', {
    params: { path: { id: companyId, userId } },
    body: { spendingLimit: spendingLimit ?? undefined },
  }))
}

// ─── Invitations ──────────────────────────────────────────────────────────────

export function listInvitations(
  client: ApiClient,
  companyId: string,
): Promise<InvitationResponse[]> {
  return callApi(client.GET('/api/v1/companies/{id}/invitations', {
    params: { path: { id: companyId } },
  })) as Promise<InvitationResponse[]>
}

export function sendInvitation(
  client: ApiClient,
  companyId: string,
  data: CreateInvitationRequest,
): Promise<InvitationResponse> {
  return callApi(client.POST('/api/v1/companies/{id}/invitations', {
    params: { path: { id: companyId } },
    body: data,
  }))
}

export function cancelInvitation(
  client: ApiClient,
  companyId: string,
  invitationId: string,
): Promise<InvitationResponse> {
  return callApi(client.DELETE('/api/v1/companies/{id}/invitations/{invitationId}', {
    params: { path: { id: companyId, invitationId } },
  }))
}

export function getInvitationByToken(token: string): Promise<InvitationResponse> {
  return callApi(createPublicClient().GET('/api/v1/invitations/{token}', {
    params: { path: { token } },
  }))
}

export function acceptInvitation(
  client: ApiClient,
  token: string,
): Promise<InvitationResponse> {
  return callApi(client.POST('/api/v1/invitations/{token}/accept', {
    params: { path: { token } },
  }))
}

// ─── Quote cart ───────────────────────────────────────────────────────────────

export function getQuoteCart(client: ApiClient): Promise<QuoteCartResponse> {
  return callApi(client.GET('/api/v1/quote-cart'))
}

export function addToQuoteCart(
  client: ApiClient,
  data: AddQuoteCartItemRequest,
): Promise<QuoteCartResponse> {
  return callApi(client.POST('/api/v1/quote-cart/items', { body: data }))
}

export function updateQuoteCartItem(
  client: ApiClient,
  itemId: string,
  data: UpdateQuoteCartItemRequest,
): Promise<QuoteCartResponse> {
  return callApi(client.PUT('/api/v1/quote-cart/items/{itemId}', {
    params: { path: { itemId } },
    body: data,
  }))
}

export function removeQuoteCartItem(
  client: ApiClient,
  itemId: string,
): Promise<QuoteCartResponse> {
  return callApi(client.DELETE('/api/v1/quote-cart/items/{itemId}', {
    params: { path: { itemId } },
  }))
}

// ─── Quotes ───────────────────────────────────────────────────────────────────

export function listQuotes(
  client: ApiClient,
  params?: { page?: number; size?: number },
): Promise<PagedResultQuoteRequestResponse> {
  return callApi(client.GET('/api/v1/quotes', {
    params: { query: { page: params?.page, size: params?.size } },
  }))
}

export function getQuote(client: ApiClient, id: string): Promise<QuoteRequestResponse> {
  return callApi(client.GET('/api/v1/quotes/{id}', { params: { path: { id } } }))
}

export function submitQuote(
  client: ApiClient,
  data: SubmitQuoteRequest,
): Promise<QuoteRequestResponse> {
  return callApi(client.POST('/api/v1/quotes', { body: data }))
}

export function acceptQuote(client: ApiClient, id: string): Promise<QuoteAcceptResponse> {
  return callApi(client.POST('/api/v1/quotes/{id}/accept', { params: { path: { id } } }))
}

export function cancelQuote(client: ApiClient, id: string): Promise<QuoteRequestResponse> {
  return callApi(client.POST('/api/v1/quotes/{id}/cancel', { params: { path: { id } } }))
}

export function listPendingApprovals(
  client: ApiClient,
  params?: { page?: number; size?: number },
): Promise<PagedResultQuoteRequestResponse> {
  return callApi(client.GET('/api/v1/quotes/pending-approvals', {
    params: { query: { page: params?.page, size: params?.size } },
  }))
}

export function approveQuote(client: ApiClient, id: string): Promise<QuoteAcceptResponse> {
  return callApi(client.POST('/api/v1/quotes/{id}/approve', { params: { path: { id } } }))
}

export function rejectApproval(client: ApiClient, id: string): Promise<QuoteRequestResponse> {
  return callApi(client.POST('/api/v1/quotes/{id}/reject-approval', { params: { path: { id } } }))
}

export function getQuotePdfUrl(id: string): string {
  return `${import.meta.env.VITE_API_BASE_URL ?? ''}/api/v1/quotes/${id}/pdf`
}

// ─── Price lists ──────────────────────────────────────────────────────────────

export function listPriceLists(
  client: ApiClient,
  companyId: string,
): Promise<PriceListResponse[]> {
  return callApi(client.GET('/api/v1/companies/{id}/price-lists', {
    params: { path: { id: companyId } },
  })) as Promise<PriceListResponse[]>
}

export function listPriceListEntries(
  client: ApiClient,
  companyId: string,
  priceListId: string,
): Promise<CustomerPriceEntryResponse[]> {
  return callApi(client.GET('/api/v1/companies/{id}/price-lists/{priceListId}/entries', {
    params: { path: { id: companyId, priceListId } },
  })) as Promise<CustomerPriceEntryResponse[]>
}

// ─── Credit account ───────────────────────────────────────────────────────────

export function getCreditAccount(
  client: ApiClient,
  companyId: string,
): Promise<CreditAccountResponse | null> {
  return client.GET('/api/v1/companies/{id}/credit-account', {
    params: { path: { id: companyId } },
  }).then(({ data, error }) => {
    if (error) return null
    return (data as { data?: CreditAccountResponse } | undefined)?.data ?? null
  })
}

// ─── Invoices ─────────────────────────────────────────────────────────────────

export function listInvoices(
  client: ApiClient,
  companyId: string,
): Promise<InvoiceResponse[]> {
  return callApi(client.GET('/api/v1/companies/{id}/invoices', {
    params: { path: { id: companyId } },
  })) as Promise<InvoiceResponse[]>
}
