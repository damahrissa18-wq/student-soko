const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

class ApiError extends Error {
  constructor(message, { status, fields, order } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fields = fields
    this.order = order
  }
}

async function request(path, options = {}) {
  let response

  try {
    response = await fetch(`${API_BASE}${path}`, options)
  } catch {
    throw new ApiError(
      'Could not reach the server. Make sure the backend is running and try again.',
    )
  }

  let data = null

  try {
    data = await response.json()
  } catch {
    // The server may return an empty body on some errors.
  }

  if (!response.ok) {
    throw new ApiError(
      data?.error || 'Something went wrong. Please try again.',
      {
        status: response.status,
        fields: data?.fields,
        order: data?.order,
      },
    )
  }

  return data
}

function jsonOptions(method, body) {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }
}

export function createOrder({ customer, items }) {
  return request('/api/orders', jsonOptions('POST', { customer, items }))
}

export function getOrder(id, token) {
  return request(`/api/orders/${encodeURIComponent(id)}`, {
    headers: { 'x-order-token': token },
  })
}

export function lookupOrder({ orderId, email }) {
  return request('/api/orders/lookup', jsonOptions('POST', { orderId, email }))
}

export function retryPayment(id, token, phone) {
  return request(`/api/orders/${encodeURIComponent(id)}/pay`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-order-token': token,
    },
    body: JSON.stringify({ phone }),
  })
}

export function getCatalog() {
  return request('/api/catalog')
}

export function subscribeToDrop({ email, name, source }) {
  return request('/api/newsletter', jsonOptions('POST', { email, name, source }))
}

export function unsubscribeFromDrop(token) {
  return request(
    `/api/newsletter/unsubscribe?token=${encodeURIComponent(token)}`,
  )
}

async function adminRequest(token, path, options = {}) {
  return request(`/api/admin${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  })
}

export const adminApi = {
  ping: (token) => adminRequest(token, '/ping'),
  overview: (token) => adminRequest(token, '/overview'),
  orders: (token, params = {}) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, value]) => value),
    ).toString()
    return adminRequest(token, `/orders${query ? `?${query}` : ''}`)
  },
  updateOrder: (token, orderId, body) =>
    adminRequest(
      token,
      `/orders/${encodeURIComponent(orderId)}`,
      jsonOptions('PATCH', body),
    ),
  inventory: (token) => adminRequest(token, '/inventory'),
  updateStock: (token, body) =>
    adminRequest(token, '/inventory', jsonOptions('PATCH', body)),
  subscribers: (token) => adminRequest(token, '/subscribers'),
}

export { ApiError }
