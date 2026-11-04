import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { config } from '../config.js'

const orders = new Map()
const ORDER_ID_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

loadOrders()

function loadOrders() {
  try {
    const raw = fs.readFileSync(config.storeFile, 'utf8')
    const savedOrders = JSON.parse(raw)

    if (!Array.isArray(savedOrders)) return

    for (const order of savedOrders) {
      if (!order?.id) continue

      order.fulfillmentStatus = order.fulfillmentStatus ?? 'unfulfilled'
      order.trackingNumber = order.trackingNumber ?? null
      order.fulfillmentUpdatedAt = order.fulfillmentUpdatedAt ?? null
      order.stockAdjustedAt = order.stockAdjustedAt ?? null
      order.emails = {
        orderConfirmationSentAt: null,
        paymentReceiptSentAt: null,
        abandonedCartSentAt: null,
        shippedEmailSentAt: null,
        ...(order.emails ?? {}),
      }

      orders.set(order.id, order)
    }

    console.log(`[store] Loaded ${orders.size} order(s) from ${config.storeFile}`)
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('[store] Could not read saved orders:', error.message)
    }
  }
}

function persistOrders() {
  try {
    fs.mkdirSync(path.dirname(config.storeFile), { recursive: true })
    const temporaryFile = `${config.storeFile}.tmp`
    fs.writeFileSync(
      temporaryFile,
      JSON.stringify([...orders.values()], null, 2),
      'utf8',
    )
    fs.renameSync(temporaryFile, config.storeFile)
  } catch (error) {
    console.error('[store] Could not save orders:', error.message)
  }
}

function createOrderId() {
  let id

  do {
    id = 'SS-'
    for (let index = 0; index < 6; index += 1) {
      id += ORDER_ID_ALPHABET[crypto.randomInt(ORDER_ID_ALPHABET.length)]
    }
  } while (orders.has(id))

  return id
}

export function createOrder({ customer, items, subtotal, deliveryFee, total }) {
  const now = new Date().toISOString()
  const order = {
    id: createOrderId(),
    token: crypto.randomBytes(32).toString('base64url'),
    status: 'pending_payment',
    fulfillmentStatus: 'unfulfilled',
    trackingNumber: null,
    fulfillmentUpdatedAt: null,
    stockAdjustedAt: null,
    customer,
    items,
    subtotal,
    deliveryFee,
    total,
    payment: {
      method: 'mpesa',
      status: 'pending',
      mode: null,
      checkoutRequestId: null,
      merchantRequestId: null,
      receiptNumber: null,
      paidAt: null,
      phoneNumber: customer.phone,
      message: null,
    },
    emails: {
      orderConfirmationSentAt: null,
      paymentReceiptSentAt: null,
      abandonedCartSentAt: null,
      shippedEmailSentAt: null,
    },
    createdAt: now,
    updatedAt: now,
  }

  orders.set(order.id, order)
  persistOrders()
  return order
}

export function getOrderById(id) {
  return orders.get(id) ?? null
}

export function getAllOrders() {
  return [...orders.values()].sort((a, b) =>
    String(b.createdAt).localeCompare(String(a.createdAt)),
  )
}

export function getOrderByCheckoutRequestId(checkoutRequestId) {
  if (!checkoutRequestId) return null

  for (const order of orders.values()) {
    if (order.payment?.checkoutRequestId === checkoutRequestId) return order
  }

  return null
}

export function updateOrder(id, updater) {
  const current = orders.get(id)
  if (!current) return null

  const draft = structuredClone(current)
  const updated = updater(draft) ?? draft
  updated.updatedAt = new Date().toISOString()

  orders.set(id, updated)
  persistOrders()
  return updated
}

export function hasValidToken(order, token) {
  if (!order?.token || !token) return false

  const expected = Buffer.from(order.token)
  const received = Buffer.from(String(token))

  return (
    expected.length === received.length &&
    crypto.timingSafeEqual(expected, received)
  )
}

export function toPublicOrder(order) {
  const { token: _token, payment, emails, ...rest } = order

  return {
    ...rest,
    payment: {
      method: payment.method,
      status: payment.status,
      mode: payment.mode,
      receiptNumber: payment.receiptNumber,
      paidAt: payment.paidAt,
      phoneNumber: payment.phoneNumber,
      message: payment.message,
    },
    emails: {
      orderConfirmationSentAt: emails?.orderConfirmationSentAt ?? null,
      paymentReceiptSentAt: emails?.paymentReceiptSentAt ?? null,
      abandonedCartSentAt: emails?.abandonedCartSentAt ?? null,
      shippedEmailSentAt: emails?.shippedEmailSentAt ?? null,
    },
  }
}

export function toAdminOrder(order) {
  const { token: _token, ...rest } = order
  return rest
}
