import crypto from 'node:crypto'
import { Order } from '../models/order.js'

const ORDER_ID_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const ORDER_PROJECTION = { _id: 0, __v: 0 }
const MAX_ID_ATTEMPTS = 10
const MAX_UPDATE_ATTEMPTS = 5

function toPlainOrder(document) {
  const order = document.toObject()
  delete order._id
  delete order.__v
  return order
}

function createOrderId() {
  let id = 'SS-'

  for (let index = 0; index < 6; index += 1) {
    id += ORDER_ID_ALPHABET[crypto.randomInt(ORDER_ID_ALPHABET.length)]
  }

  return id
}

function isDuplicateKeyError(error) {
  return error?.code === 11000
}

export async function createOrder({
  customer,
  items,
  subtotal,
  deliveryFee,
  total,
}) {
  const now = new Date()

  for (let attempt = 0; attempt < MAX_ID_ATTEMPTS; attempt += 1) {
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

    try {
      const created = await Order.create(order)
      return toPlainOrder(created)
    } catch (error) {
      // A duplicate order id is astronomically unlikely, but retrying keeps
      // creation safe under concurrency instead of failing the checkout.
      if (!isDuplicateKeyError(error)) throw error
    }
  }

  throw new Error('Could not allocate a unique order number. Please retry.')
}

export async function getOrderById(id) {
  if (!id) return null
  return Order.findOne({ id: String(id) }).select(ORDER_PROJECTION).lean()
}

export async function getAllOrders() {
  return Order.find({}).select(ORDER_PROJECTION).sort({ createdAt: -1 }).lean()
}

export async function getOrderByCheckoutRequestId(checkoutRequestId) {
  if (!checkoutRequestId) return null

  return Order.findOne({ 'payment.checkoutRequestId': checkoutRequestId })
    .select(ORDER_PROJECTION)
    .lean()
}

export async function updateOrder(id, updater) {
  for (let attempt = 0; attempt < MAX_UPDATE_ATTEMPTS; attempt += 1) {
    const document = await Order.findOne({ id: String(id) })
    if (!document) return null

    const draft = document.toObject()
    delete draft._id
    delete draft.__v

    const updated = updater(draft) ?? draft
    updated.updatedAt = new Date()

    document.set(updated)

    try {
      await document.save()
      return toPlainOrder(document)
    } catch (error) {
      // Two requests updated the same order at once (for example the M-Pesa
      // callback and the abandoned-cart sweeper). Re-read and re-apply.
      if (error.name === 'VersionError') continue
      throw error
    }
  }

  throw new Error(
    `Could not update order ${id} because it kept changing. Please retry.`,
  )
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
