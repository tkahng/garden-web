import type { components } from '#/schema'
import type { ApiClient } from '#/lib/client'
import { callApi } from '#/lib/client'

// ─── Exported types ───────────────────────────────────────────────────────────

export type AccountResponse = components['schemas']['AccountResponse']
export type UpdateAccountRequest = components['schemas']['UpdateAccountRequest']
export type AddressRequest = components['schemas']['AddressRequest']
export type AddressResponse = components['schemas']['AddressResponse']
export type OrderResponse = components['schemas']['OrderResponse']
export type OrderItemResponse = components['schemas']['OrderItemResponse']
export type OrderItemProductInfo = components['schemas']['OrderItemProductInfo']
export type PagedResultOrderResponse = components['schemas']['PagedResultOrderResponse']
export type PageMeta = components['schemas']['PageMeta']

// ─── Account ──────────────────────────────────────────────────────────────────

export function getAccount(client: ApiClient): Promise<AccountResponse> {
  return callApi(client.GET('/api/v1/account'))
}

export function updateAccount(
  client: ApiClient,
  data: UpdateAccountRequest,
): Promise<AccountResponse> {
  return callApi(client.PUT('/api/v1/account', { body: data }))
}

// ─── Addresses ────────────────────────────────────────────────────────────────

export function listAddresses(client: ApiClient): Promise<AddressResponse[]> {
  return callApi(client.GET('/api/v1/account/addresses')) as Promise<AddressResponse[]>
}

export function createAddress(client: ApiClient, data: AddressRequest): Promise<AddressResponse> {
  return callApi(client.POST('/api/v1/account/addresses', { body: data }))
}

export function updateAddress(
  client: ApiClient,
  id: string,
  data: AddressRequest,
): Promise<AddressResponse> {
  return callApi(client.PUT('/api/v1/account/addresses/{id}', {
    params: { path: { id } },
    body: data,
  }))
}

export function deleteAddress(client: ApiClient, id: string): Promise<void> {
  return callApi(client.DELETE('/api/v1/account/addresses/{id}', {
    params: { path: { id } },
  })) as Promise<void>
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export function listOrders(
  client: ApiClient,
  params?: { page?: number; size?: number },
): Promise<PagedResultOrderResponse> {
  return callApi(client.GET('/api/v1/storefront/orders', {
    params: { query: { page: params?.page, size: params?.size } },
  }))
}

export function getOrder(client: ApiClient, id: string): Promise<OrderResponse> {
  return callApi(client.GET('/api/v1/storefront/orders/{id}', {
    params: { path: { id } },
  }))
}

export function cancelOrder(client: ApiClient, id: string): Promise<OrderResponse> {
  return callApi(client.PUT('/api/v1/storefront/orders/{id}/cancel', {
    params: { path: { id } },
  }))
}

export function requestRefund(client: ApiClient, id: string): Promise<OrderResponse> {
  return callApi(client.POST('/api/v1/storefront/orders/{id}/refund', {
    params: { path: { id } },
  }))
}

export type CartResponse = components['schemas']['CartResponse']
export type CheckoutResponse = components['schemas']['CheckoutResponse']
export type FulfillmentResponse = components['schemas']['FulfillmentResponse']
export type ReturnRequestResponse = components['schemas']['ReturnRequestResponse']
export type SubmitReturnRequest = components['schemas']['SubmitReturnRequest']
export type PagedResultReturnRequestResponse = components['schemas']['PagedResultReturnRequestResponse']

export function reorder(client: ApiClient, id: string): Promise<CartResponse> {
  return callApi(client.POST('/api/v1/storefront/orders/{id}/reorder', {
    params: { path: { id } },
  }))
}

export function approveOrder(client: ApiClient, id: string): Promise<CheckoutResponse> {
  return callApi(client.POST('/api/v1/storefront/orders/{id}/approve', {
    params: { path: { id } },
  }))
}

export function rejectApproval(client: ApiClient, id: string): Promise<OrderResponse> {
  return callApi(client.POST('/api/v1/storefront/orders/{id}/reject-approval', {
    params: { path: { id } },
  }))
}

export function listPendingApprovals(
  client: ApiClient,
  companyId: string,
  params?: { page?: number; size?: number },
): Promise<PagedResultOrderResponse> {
  return callApi(client.GET('/api/v1/storefront/orders/pending-approvals', {
    params: { query: { companyId, page: params?.page, size: params?.size } },
  }))
}

export function submitReturn(
  client: ApiClient,
  orderId: string,
  data: SubmitReturnRequest,
): Promise<ReturnRequestResponse> {
  return callApi(client.POST('/api/v1/storefront/returns/orders/{orderId}', {
    params: { path: { orderId } },
    body: data,
  }))
}

export function listReturns(
  client: ApiClient,
  params?: { page?: number; size?: number },
): Promise<PagedResultReturnRequestResponse> {
  return callApi(client.GET('/api/v1/storefront/returns', {
    params: { query: { page: params?.page, size: params?.size } },
  }))
}

export function getReturn(client: ApiClient, id: string): Promise<ReturnRequestResponse> {
  return callApi(client.GET('/api/v1/storefront/returns/{id}', {
    params: { path: { id } },
  }))
}

export function listFulfillments(
  client: ApiClient,
  orderId: string,
): Promise<FulfillmentResponse[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (client as any).GET('/api/v1/storefront/orders/{id}/fulfillments', {
    params: { path: { id: orderId } },
  }).then((res: { data?: { data?: FulfillmentResponse[] }; error?: unknown }) => {
    if (res.error) throw res.error
    return res.data?.data ?? []
  })
}

// ─── Order templates ──────────────────────────────────────────────────────────

export interface OrderTemplateItemResponse {
  id?: string
  variantId?: string
  variantTitle?: string
  quantity?: number
}

export interface OrderTemplateResponse {
  id?: string
  userId?: string
  name?: string
  items?: OrderTemplateItemResponse[]
  createdAt?: string
  updatedAt?: string
}

export function listOrderTemplates(client: ApiClient): Promise<OrderTemplateResponse[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (client as any).GET('/api/v1/storefront/order-templates')
    .then((res: { data?: { data?: OrderTemplateResponse[] }; error?: unknown }) => {
      if (res.error) throw res.error
      return res.data?.data ?? []
    })
}

export function createOrderTemplate(
  client: ApiClient,
  name: string,
  items: Array<{ variantId: string; quantity: number }>,
): Promise<OrderTemplateResponse> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (client as any).POST('/api/v1/storefront/order-templates', {
    body: { name, items },
  }).then((res: { data?: { data?: OrderTemplateResponse }; error?: unknown }) => {
    if (res.error) throw res.error
    return res.data?.data ?? {}
  })
}

export function deleteOrderTemplate(client: ApiClient, id: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (client as any).DELETE(`/api/v1/storefront/order-templates/${id}`)
    .then((res: { error?: unknown }) => {
      if (res.error) throw res.error
    })
}

export function loadOrderTemplate(client: ApiClient, id: string): Promise<CartResponse> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (client as any).POST(`/api/v1/storefront/order-templates/${id}/load`)
    .then((res: { data?: { data?: CartResponse }; error?: unknown }) => {
      if (res.error) throw res.error
      return res.data?.data ?? {}
    })
}

// ─── Gift cards ───────────────────────────────────────────────────────────────

export type GiftCardValidationResponse = components['schemas']['GiftCardValidationResponse']

export interface GiftCardTransaction {
  id?: string
  giftCardId?: string
  delta?: number
  orderId?: string
  note?: string
  createdAt?: string
}

export function getGiftCardBalance(
  client: ApiClient,
  code: string,
): Promise<GiftCardValidationResponse> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (client as any).GET('/api/v1/storefront/gift-cards/balance', {
    params: { query: { code } },
  }).then((res: { data?: { data?: GiftCardValidationResponse }; error?: unknown }) => {
    if (res.error) throw res.error
    return res.data?.data ?? {}
  })
}

export function getGiftCardTransactions(
  client: ApiClient,
  code: string,
): Promise<GiftCardTransaction[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (client as any).GET('/api/v1/storefront/gift-cards/transactions', {
    params: { query: { code } },
  }).then((res: { data?: { data?: GiftCardTransaction[] }; error?: unknown }) => {
    if (res.error) throw res.error
    return res.data?.data ?? []
  })
}

// ─── Notification preferences ─────────────────────────────────────────────────

export type NotificationType =
  | 'ORDER_CONFIRMATION'
  | 'ORDER_SHIPPED'
  | 'ORDER_DELIVERED'
  | 'ORDER_CANCELLED'
  | 'QUOTE_UPDATE'
  | 'MARKETING'

export interface NotificationPreference {
  type: NotificationType
  enabled: boolean
}

export function getNotificationPreferences(client: ApiClient): Promise<NotificationPreference[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (client as any).GET('/api/v1/account/notification-preferences')
    .then((res: { data?: { data?: NotificationPreference[] }; error?: unknown }) => {
      if (res.error) throw res.error
      return res.data?.data ?? []
    })
}

export function updateNotificationPreferences(
  client: ApiClient,
  preferences: Partial<Record<NotificationType, boolean>>,
): Promise<NotificationPreference[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (client as any).PUT('/api/v1/account/notification-preferences', {
    body: { preferences },
  }).then((res: { data?: { data?: NotificationPreference[] }; error?: unknown }) => {
    if (res.error) throw res.error
    return res.data?.data ?? []
  })
}

// ─── Auth (authenticated) ─────────────────────────────────────────────────────

export function updatePassword(
  client: ApiClient,
  data: { currentPassword: string; newPassword: string },
): Promise<void> {
  return callApi(client.POST('/api/v1/auth/update-password', { body: data })) as Promise<void>
}

export function resendVerification(client: ApiClient, email: string): Promise<void> {
  return callApi(client.POST('/api/v1/auth/resend-verification', {
    body: { email },
  })) as Promise<void>
}
