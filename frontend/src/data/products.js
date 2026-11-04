import catalogData from '../../../shared/products.json'

// The storefront and the API both read shared/products.json so prices,
// variants and default stock stay in sync.
export const products = catalogData.products

const productById = new Map(products.map((product) => [product.id, product]))

export function getProductById(id) {
  return productById.get(id) ?? null
}

const categoryTiles = [
  {
    name: 'Hoodies',
    image: '/images/hoodie.jpg',
    className: 'col-span-2 min-h-[280px] lg:col-span-2 lg:row-span-2 lg:min-h-0',
  },
  {
    name: 'Tees',
    image: '/images/tees.jpg',
    className: 'min-h-[180px] lg:min-h-0',
  },
  {
    name: 'Caps',
    image: '/images/cap.jpg',
    className: 'min-h-[180px] lg:min-h-0',
  },
  {
    name: 'Bags',
    countLabel: 'Bags & totes',
    image: '/images/tote.jpg',
    className: 'min-h-[180px] lg:min-h-0',
  },
  {
    name: 'Backpacks',
    image: '/images/backpack.jpg',
    className: 'min-h-[180px] lg:min-h-0',
  },
  {
    name: 'Notebooks',
    image: '/images/notebook.jpg',
    className: 'col-span-2 min-h-[180px] lg:col-span-2 lg:min-h-0',
  },
  {
    name: 'Suitcases',
    image: '/images/suitcase.jpg',
    className: 'min-h-[180px] lg:min-h-0',
  },
  {
    name: 'Fresh fits',
    image: '/images/tee-model.jpg',
    className: 'min-h-[180px] lg:min-h-0',
    href: '/product/campus-fit-tee',
    countLabel: 'Shop the look',
  },
]

export const categories = categoryTiles.map((tile) => {
  if (tile.countLabel) return { ...tile, count: tile.countLabel }

  const count = products.filter(
    (product) => product.category === tile.name,
  ).length

  return {
    ...tile,
    count: `${count} ${count === 1 ? 'style' : 'styles'}`,
  }
})

export const filters = [
  'All',
  'Hoodies',
  'Tees',
  'Caps',
  'Bags',
  'Backpacks',
  'Notebooks',
  'Suitcases',
]

export const formatPrice = (value) => `KSh ${Number(value).toLocaleString('en-KE')}`

export const stockKey = (productId, size) => `${productId}::${size}`
