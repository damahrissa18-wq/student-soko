import { findColor, findProduct, findSize } from './catalog.js'
import { getStock } from './store/inventory.js'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_QUANTITY_PER_ITEM = 10
const MAX_ITEMS = 20

export function normalizePhone(value) {
  let digits = String(value ?? '').replace(/[\s().-]/g, '')

  if (digits.startsWith('+')) digits = digits.slice(1)
  if (digits.startsWith('0')) digits = `254${digits.slice(1)}`
  if (digits.startsWith('7') || digits.startsWith('1')) {
    digits = `254${digits}`
  }

  return /^254(7\d{8}|1\d{8})$/.test(digits) ? digits : null
}

export function normalizeEmail(value) {
  const email = String(value ?? '').trim().toLowerCase()
  return EMAIL_PATTERN.test(email) && email.length <= 254 ? email : null
}

export async function validateCheckout(payload) {
  const fields = {}
  const rawCustomer = payload?.customer ?? {}

  const name = String(rawCustomer.name ?? '').trim()
  if (name.length < 2 || name.length > 120) {
    fields.name = 'Enter your full name.'
  }

  const email = normalizeEmail(rawCustomer.email)
  if (!email) {
    fields.email = 'Enter a valid email address.'
  }

  const phone = normalizePhone(rawCustomer.phone)
  if (!phone) {
    fields.phone = 'Enter a valid Kenyan phone number, e.g. 0712 345 678.'
  }

  const address = String(rawCustomer.address ?? '').trim()
  if (address.length < 5 || address.length > 300) {
    fields.address = 'Add your hostel, hall or delivery address.'
  }

  const rawItems = Array.isArray(payload?.items) ? payload.items : []
  if (rawItems.length === 0) {
    fields.items = 'Your cart is empty.'
  }

  if (rawItems.length > MAX_ITEMS) {
    fields.items = 'Your cart has too many different items.'
  }

  const mergedItems = new Map()

  for (const rawItem of rawItems) {
    const id = typeof rawItem?.id === 'string' ? rawItem.id : null
    const qty = Number(rawItem?.qty)
    const product = id ? findProduct(id) : null

    if (!product) {
      fields.items = 'One of the items in your cart is no longer available.'
      continue
    }

    const size = findSize(product, rawItem?.size)
    if (!size) {
      fields.items = `Choose a size for ${product.name}.`
      continue
    }

    const color = findColor(product, rawItem?.color)
    if (!color) {
      fields.items = `Choose a colour for ${product.name}.`
      continue
    }

    if (!Number.isInteger(qty) || qty < 1) {
      fields.items = `Choose between 1 and ${MAX_QUANTITY_PER_ITEM} of each item.`
      continue
    }

    if (qty > MAX_QUANTITY_PER_ITEM) {
      fields.items = `Choose between 1 and ${MAX_QUANTITY_PER_ITEM} of each item.`
      continue
    }

    const variant = `${product.id}::${size}::${color.name}`
    const existing = mergedItems.get(variant)

    if (existing) {
      existing.qty += qty
    } else {
      mergedItems.set(variant, {
        id: product.id,
        size,
        color: color.name,
        colorHex: color.hex,
        qty,
        product,
      })
    }
  }

  for (const item of mergedItems.values()) {
    const available = await getStock(item.id, item.size)

    if (available <= 0) {
      fields.items = `${item.product.name} in ${item.size} is sold out.`
      continue
    }

    if (item.qty > MAX_QUANTITY_PER_ITEM) {
      fields.items = `Choose between 1 and ${MAX_QUANTITY_PER_ITEM} of each item.`
      item.qty = MAX_QUANTITY_PER_ITEM
      continue
    }

    if (item.qty > available) {
      fields.items = `Only ${available} left of ${item.product.name} in ${item.size}.`
    }
  }

  if (Object.keys(fields).length > 0) {
    return { fields, value: null }
  }

  return {
    fields,
    value: {
      customer: { name, email, phone, address },
      items: [...mergedItems.values()].map((item) => ({
        id: item.id,
        size: item.size,
        color: item.color,
        qty: item.qty,
      })),
    },
  }
}
