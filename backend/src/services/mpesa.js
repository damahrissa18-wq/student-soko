import { config } from '../config.js'

const SAFARICOM_BASE_URLS = {
  sandbox: 'https://sandbox.safaricom.co.ke',
  production: 'https://api.safaricom.co.ke',
}

let cachedToken = null
let cachedTokenExpiresAt = 0

export class MpesaError extends Error {
  constructor(message) {
    super(message)
    this.name = 'MpesaError'
  }
}

function endpoint(pathname) {
  return `${SAFARICOM_BASE_URLS[config.mpesa.environment]}${pathname}`
}

function getTimestamp() {
  const now = new Date()
  const pad = (value) => String(value).padStart(2, '0')

  return [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds()),
  ].join('')
}

async function getAccessToken() {
  if (cachedToken && Date.now() < cachedTokenExpiresAt) {
    return cachedToken
  }

  const authorization = Buffer.from(
    `${config.mpesa.consumerKey}:${config.mpesa.consumerSecret}`,
  ).toString('base64')

  const response = await fetch(
    endpoint('/oauth/v1/generate?grant_type=client_credentials'),
    { headers: { Authorization: `Basic ${authorization}` } },
  )

  const data = await response.json().catch(() => ({}))

  if (!response.ok || !data.access_token) {
    throw new MpesaError(
      data.errorMessage ||
        `M-Pesa authentication failed (HTTP ${response.status}).`,
    )
  }

  cachedToken = data.access_token
  const lifetimeSeconds = Math.max(60, Number(data.expires_in) || 3599)
  cachedTokenExpiresAt = Date.now() + (lifetimeSeconds - 60) * 1000

  return cachedToken
}

export async function initiateStkPush(order) {
  if (config.mpesa.mock) {
    return {
      mode: 'mock',
      checkoutRequestId: `ws_CO_MOCK_${order.id}_${Date.now()}`,
      merchantRequestId: `mock-${Date.now()}`,
      customerMessage:
        'Sandbox mode: the payment request will confirm automatically in a few seconds.',
    }
  }

  const timestamp = getTimestamp()
  const password = Buffer.from(
    `${config.mpesa.shortcode}${config.mpesa.passkey}${timestamp}`,
  ).toString('base64')

  const token = await getAccessToken()

  const response = await fetch(
    endpoint('/mpesa/stkpush/v1/processrequest'),
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        BusinessShortCode: config.mpesa.shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: config.mpesa.transactionType,
        Amount: order.total,
        PartyA: order.customer.phone,
        PartyB: config.mpesa.shortcode,
        PhoneNumber: order.customer.phone,
        CallBackURL: config.mpesa.callbackUrl,
        AccountReference: order.id.slice(0, 12),
        TransactionDesc: `StudentsSoko ${order.id}`,
      }),
    },
  )

  const data = await response.json().catch(() => ({}))

  if (!response.ok || String(data.ResponseCode) !== '0') {
    throw new MpesaError(
      data.errorMessage ||
        data.ResponseDescription ||
        'M-Pesa could not start the payment.',
    )
  }

  return {
    mode: 'mpesa',
    checkoutRequestId: data.CheckoutRequestID,
    merchantRequestId: data.MerchantRequestID,
    customerMessage:
      data.CustomerMessage ||
      'Enter your M-Pesa PIN to approve the payment.',
  }
}

export function readCallback(body) {
  const callback = body?.Body?.stkCallback
  if (!callback?.CheckoutRequestID) return null

  const metadata = Object.fromEntries(
    (callback.CallbackMetadata?.Item ?? []).map((item) => [
      item.Name,
      item.Value,
    ]),
  )

  return {
    merchantRequestId: callback.MerchantRequestID ?? null,
    checkoutRequestId: callback.CheckoutRequestID,
    resultCode: Number(callback.ResultCode),
    resultDesc: callback.ResultDesc ?? 'Payment was not completed.',
    amount: metadata.Amount != null ? Number(metadata.Amount) : null,
    mpesaReceiptNumber: metadata.MpesaReceiptNumber ?? null,
    phoneNumber:
      metadata.PhoneNumber != null ? String(metadata.PhoneNumber) : null,
  }
}
