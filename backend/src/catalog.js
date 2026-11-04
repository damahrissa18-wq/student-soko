import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Single source of truth for products, prices, variants and default stock.
// The frontend imports the same file so the storefront and the API cannot drift.
const sharedFile = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../shared/products.json',
)

function loadCatalog() {
  try {
    const parsed = JSON.parse(fs.readFileSync(sharedFile, 'utf8'))
    if (!Array.isArray(parsed?.products) || parsed.products.length === 0) {
      throw new Error('shared/products.json does not contain a products array.')
    }
    return parsed.products
  } catch (error) {
    throw new Error(
      `Could not load the shared product catalog at ${sharedFile}: ${error.message}`,
    )
  }
}

export const catalog = loadCatalog()

const catalogById = new Map(catalog.map((product) => [product.id, product]))

export function findProduct(id) {
  return catalogById.get(id) ?? null
}

export function findSize(product, requestedSize) {
  if (!product) return null
  const size = String(requestedSize ?? '').trim()

  if (!size && product.sizes.length === 1) return product.sizes[0]

  return product.sizes.find((value) => value === size) ?? null
}

export function findColor(product, requestedColor) {
  if (!product) return null
  const color = String(requestedColor ?? '').trim()

  if (!color && product.colors.length === 1) return product.colors[0]

  return (
    product.colors.find(
      (value) => value.name.toLowerCase() === color.toLowerCase(),
    ) ?? null
  )
}

export function stockKey(productId, size) {
  return `${productId}::${size}`
}

export function variantKey(productId, size, colorName) {
  return `${productId}::${size}::${colorName}`
}

export function publicProduct(product) {
  return {
    id: product.id,
    name: product.name,
    category: product.category,
    price: product.price,
    oldPrice: product.oldPrice,
    image: product.image,
    badge: product.badge,
    description: product.description,
    details: product.details,
    sizes: product.sizes,
    colors: product.colors,
    defaultStock: product.defaultStock,
  }
}
