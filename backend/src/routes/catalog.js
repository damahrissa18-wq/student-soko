import { Router } from 'express'
import { config } from '../config.js'
import { catalog, publicProduct } from '../catalog.js'
import { getStockMap } from '../store/inventory.js'

const router = Router()

router.get('/', (_request, response) => {
  response.json({
    products: catalog.map(publicProduct),
    stock: getStockMap(),
    lowStockThreshold: config.inventory.lowStockThreshold,
  })
})

export default router
