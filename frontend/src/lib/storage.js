import { getProductById } from '../data/products'

const CART_KEY = 'studentsoko.cart.v2'
const LAST_ORDER_KEY = 'studentsoko.lastOrder.v1'

function readJson(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function loadCart() {
  if (typeof window === 'undefined') return {}

  const saved = readJson(CART_KEY, {})
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return {}

  const cart = {}

  for (const [key, item] of Object.entries(saved)) {
    if (!item || typeof item !== 'object') continue

    const product = getProductById(item.productId)
    const qty = Number(item.qty)

    if (!product || !Number.isInteger(qty) || qty < 1) continue
    if (!product.sizes.includes(item.size)) continue
    if (!product.colors.some((color) => color.name === item.color)) continue

    cart[key] = {
      productId: product.id,
      size: item.size,
      color: item.color,
      qty,
    }
  }

  return cart
}

export function saveCart(cart) {
  try {
    window.localStorage.setItem(CART_KEY, JSON.stringify(cart))
  } catch {
    // Storage can be unavailable in private browsing. The in-memory cart works.
  }
}

export function saveLastOrder(order) {
  try {
    window.localStorage.setItem(LAST_ORDER_KEY, JSON.stringify(order))
  } catch {
    // Ignore storage failures.
  }
}

export function getLastOrder() {
  if (typeof window === 'undefined') return null

  const saved = readJson(LAST_ORDER_KEY, null)
  if (!saved?.id || !saved?.token) return null

  return saved
}
