import { Router } from 'express'
import { config } from '../config.js'
import { findColor, findProduct, findSize } from '../catalog.js'
import {
  createOrder,
  getOrderById,
  hasValidToken,
  toPublicOrder,
  updateOrder,
} from '../store/orders.js'
import { normalizeEmail, normalizePhone, validateCheckout } from '../validation.js'
import { initiateStkPush } from '../services/mpesa.js'
import { sendOrderConfirmationEmail } from '../services/orderEmails.js'
import { markOrderPaid } from '../services/orderPayments.js'

const router = Router()
const mockTimers = new Map()
const lookupAttempts = new Map()
const LOOKUP_WINDOW_MS = 10 * 60 * 1000
const LOOKUP_MAX_ATTEMPTS = 20

function buildItems(rawItems) {
  return rawItems.map(({ id, size, color, qty }) => {
    const product = findProduct(id)
    const selectedSize = findSize(product, size)
    const selectedColor = findColor(product, color)

    return {
      productId: product.id,
      variantKey: `${product.id}::${selectedSize}::${selectedColor.name}`,
      name: product.name,
      size: selectedSize,
      color: { name: selectedColor.name, hex: selectedColor.hex },
      unitPrice: product.price,
      qty,
      lineTotal: product.price * qty,
    }
  })
}

function allowLookup(ip) {
  const now = Date.now()
  const record = lookupAttempts.get(ip)

  if (!record || now - record.startedAt > LOOKUP_WINDOW_MS) {
    lookupAttempts.set(ip, { startedAt: now, count: 1 })
    return true
  }

  record.count += 1
  return record.count <= LOOKUP_MAX_ATTEMPTS
}

function summarizeEmail(result) {
  if (result.status === 'sent') {
    return { status: 'sent', message: 'Order confirmation email sent.' }
  }

  if (result.status === 'logged') {
    return {
      status: 'logged',
      message:
        'Demo mode: the order confirmation was logged to the server console instead of sent.',
    }
  }

  return {
    status: 'failed',
    message:
      'We could not send the order confirmation email, but your order is still confirmed.',
  }
}

function getAuthorizedOrder(request, response) {
  const order = getOrderById(request.params.id)

  if (!order || !hasValidToken(order, request.get('x-order-token'))) {
    response.status(404).json({ error: 'Order not found.' })
    return null
  }

  return order
}

function scheduleMockPayment(orderId) {
  const existingTimer = mockTimers.get(orderId)
  if (existingTimer) clearTimeout(existingTimer)

  const timer = setTimeout(async () => {
    mockTimers.delete(orderId)

    const order = getOrderById(orderId)
    if (!order || order.status === 'paid') return

    const receiptNumber = `MOCK${Math.random()
      .toString(36)
      .slice(2, 8)
      .toUpperCase()}`

    try {
      const paidOrder = await markOrderPaid(orderId, {
        receiptNumber,
        paidAt: new Date().toISOString(),
      })

      console.log(
        `[mpesa:mock] Payment confirmed for ${paidOrder?.id ?? orderId} (${receiptNumber})`,
      )
    } catch (error) {
      console.error(
        `[mpesa:mock] Could not finalize payment for ${orderId}:`,
        error.message,
      )
    }
  }, 5000)

  mockTimers.set(orderId, timer)
}

async function startPayment(order) {
  const result = await initiateStkPush(order)

  updateOrder(order.id, (draft) => {
    draft.status = 'pending_payment'
    draft.payment.status = 'pending'
    draft.payment.mode = result.mode
    draft.payment.checkoutRequestId = result.checkoutRequestId
    draft.payment.merchantRequestId = result.merchantRequestId
    draft.payment.message = result.customerMessage
  })

  if (result.mode === 'mock') {
    scheduleMockPayment(order.id)
  }

  return result
}

router.post('/', async (request, response) => {
  const { fields, value } = validateCheckout(request.body)

  if (!value) {
    return response.status(400).json({
      error: 'Please check your details and try again.',
      fields,
    })
  }

  const items = buildItems(value.items)
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0)
  const deliveryFee =
    subtotal >= config.delivery.freeAt ? 0 : config.delivery.fee
  const total = subtotal + deliveryFee

  let order = createOrder({
    customer: value.customer,
    items,
    subtotal,
    deliveryFee,
    total,
  })

  const confirmation = await sendOrderConfirmationEmail(order).catch(
    (error) => {
      console.error(
        `[email] Order confirmation failed for ${order.id}:`,
        error.message,
      )
      return { status: 'failed', sent: false, error: error.message }
    },
  )

  let paymentStarted = false
  let paymentError = null

  try {
    await startPayment(order)
    paymentStarted = true
  } catch (error) {
    paymentError = error.message
    console.error(
      `[mpesa] Could not start payment for ${order.id}:`,
      error.message,
    )

    order = updateOrder(order.id, (draft) => {
      draft.status = 'payment_failed'
      draft.payment.status = 'failed'
      draft.payment.mode = config.mpesa.mock ? 'mock' : 'mpesa'
      draft.payment.message =
        'We could not start the M-Pesa payment. Please try again.'
    })
  }

  order = getOrderById(order.id)

  return response.status(201).json({
    order: toPublicOrder(order),
    token: order.token,
    email: summarizeEmail(confirmation),
    payment: {
      started: paymentStarted,
      mode: order.payment.mode ?? (config.mpesa.mock ? 'mock' : 'mpesa'),
      message: paymentError
        ? 'We could not start the M-Pesa payment. Please try again.'
        : (order.payment.message ?? null),
    },
  })
})

router.post('/lookup', (request, response) => {
  const ip = request.ip || request.socket?.remoteAddress || 'unknown'

  if (!allowLookup(ip)) {
    return response.status(429).json({
      error: 'Too many order lookups. Please wait a few minutes and try again.',
    })
  }

  const orderId = String(request.body?.orderId ?? '')
    .trim()
    .toUpperCase()
  const email = normalizeEmail(request.body?.email)

  if (!orderId || !email) {
    return response.status(400).json({
      error: 'Enter the order number and the email used at checkout.',
      fields: {
        ...(orderId ? {} : { orderId: 'Enter your order number.' }),
        ...(email ? {} : { email: 'Enter the email used at checkout.' }),
      },
    })
  }

  const order = getOrderById(orderId)

  if (!order || order.customer.email !== email) {
    return response.status(404).json({
      error:
        'We could not find an order with that number and email. Check both and try again.',
    })
  }

  return response.json({
    order: toPublicOrder(order),
    token: order.token,
  })
})

router.get('/:id', (request, response) => {
  const order = getAuthorizedOrder(request, response)
  if (!order) return

  return response.json({ order: toPublicOrder(order) })
})

router.post('/:id/pay', async (request, response) => {
  const order = getAuthorizedOrder(request, response)
  if (!order) return

  if (order.status === 'paid') {
    return response.json({
      order: toPublicOrder(order),
      payment: { started: false, mode: order.payment.mode, paid: true },
    })
  }

  let phone = order.customer.phone
  const requestedPhone = request.body?.phone

  if (requestedPhone != null) {
    const normalized = normalizePhone(requestedPhone)

    if (!normalized) {
      return response.status(400).json({
        error: 'Enter a valid Kenyan phone number.',
        fields: { phone: 'Enter a valid Kenyan phone number.' },
      })
    }

    phone = normalized
  }

  if (phone !== order.customer.phone) {
    updateOrder(order.id, (draft) => {
      draft.customer.phone = phone
      draft.payment.phoneNumber = phone
    })
  }

  const freshOrder = getOrderById(order.id)

  try {
    const result = await startPayment(freshOrder)

    return response.json({
      order: toPublicOrder(getOrderById(order.id)),
      payment: {
        started: true,
        mode: result.mode,
        message: result.customerMessage,
      },
    })
  } catch (error) {
    console.error(
      `[mpesa] Could not retry payment for ${order.id}:`,
      error.message,
    )

    updateOrder(order.id, (draft) => {
      draft.status = 'payment_failed'
      draft.payment.status = 'failed'
      draft.payment.message =
        'We could not start the M-Pesa payment. Please try again.'
    })

    return response.status(502).json({
      error: 'We could not start the M-Pesa payment. Please try again.',
      order: toPublicOrder(getOrderById(order.id)),
    })
  }
})

export default router
