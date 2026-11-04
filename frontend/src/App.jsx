import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  BrowserRouter,
  Link,
  Route,
  Routes,
  useParams,
} from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import CartDrawer from './components/CartDrawer'
import CheckoutModal from './components/CheckoutModal'
import ProductModal from './components/ProductModal'
import Toast from './components/Toast'
import WhatsAppButton from './components/WhatsAppButton'
import ScrollToHash from './components/ScrollToHash'
import Seo from './components/Seo'
import HomePage from './pages/HomePage'
import ProductPage from './pages/ProductPage'
import TrackPage from './pages/TrackPage'
import AdminPage from './pages/AdminPage'
import UnsubscribePage from './pages/UnsubscribePage'
import {
  DeliveryPage,
  FaqPage,
  PrivacyPage,
  ReturnsPage,
  SizeGuidePage,
  TermsPage,
} from './pages/InfoPages'
import { getProductById, products, stockKey } from './data/products'
import { getCatalog } from './lib/api'
import { loadCart, saveCart } from './lib/storage'
import { initAnalytics, trackEvent } from './lib/analytics'

function NotFoundPage() {
  return (
    <>
      <Seo
        title="Page not found"
        description="That page is not part of the StudentSoko shop."
        path="/404"
        noindex
      />
      <main className="px-4 py-24 text-center sm:px-6 lg:px-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-flame">
          404
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold">
          This page is not in the drop.
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-smoke">
          The link may be old or mistyped. The shop is still right here.
        </p>
        <Link
          to="/"
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-cream transition hover:bg-flame"
        >
          Back to the shop
        </Link>
      </main>
    </>
  )
}

const fallbackStock = Object.fromEntries(
  products.flatMap((product) =>
    product.sizes.map((size) => [
      stockKey(product.id, size),
      Number(product.defaultStock) || 0,
    ]),
  ),
)

function ProductRoute(props) {
  const { productId } = useParams()

  return <ProductPage key={productId} {...props} />
}

export default function App() {
  const [cart, setCart] = useState(loadCart)
  const [stock, setStock] = useState(fallbackStock)
  const [lowStockThreshold, setLowStockThreshold] = useState(3)
  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [productModal, setProductModal] = useState(null)
  const [toast, setToast] = useState('')
  const toastTimer = useRef(null)

  const showToast = useCallback((message) => {
    setToast(message)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(''), 2600)
  }, [])

  useEffect(() => {
    initAnalytics()
    return () => window.clearTimeout(toastTimer.current)
  }, [])

  useEffect(() => {
    let cancelled = false

    getCatalog()
      .then((data) => {
        if (cancelled) return
        if (data.stock && typeof data.stock === 'object') {
          setStock({ ...fallbackStock, ...data.stock })
        }
        if (Number.isInteger(data.lowStockThreshold)) {
          setLowStockThreshold(data.lowStockThreshold)
        }
      })
      .catch(() => {
        // The storefront still works offline; checkout validates stock server-side.
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    saveCart(cart)
  }, [cart])

  const getStock = useCallback(
    (productId, size) => stock[stockKey(productId, size)] ?? 0,
    [stock],
  )

  const cartItems = useMemo(
    () =>
      Object.entries(cart)
        .map(([key, entry]) => {
          const product = getProductById(entry.productId)
          const color = product?.colors.find(
            (option) => option.name === entry.color,
          )

          if (!product || !color) return null

          return {
            key,
            product,
            size: entry.size,
            color,
            qty: entry.qty,
          }
        })
        .filter(Boolean),
    [cart],
  )

  const cartCount = cartItems.reduce((sum, item) => sum + item.qty, 0)

  const addToCart = useCallback(
    (product, { size, color, qty = 1 }) => {
      const key = `${product.id}::${size}::${color}`
      const available = getStock(product.id, size)
      const currentQty = cart[key]?.qty ?? 0

      if (available <= 0) {
        showToast(
          `${product.name} in ${size} is sold out — try another size.`,
        )
        return
      }

      if (currentQty >= available) {
        showToast(`Only ${available} in stock for this variant.`)
        return
      }

      const nextQty = Math.min(available, currentQty + qty)

      setCart((current) => ({
        ...current,
        [key]: {
          productId: product.id,
          size,
          color,
          qty: nextQty,
        },
      }))
      showToast(`${product.name} · ${size} · ${color} added to cart`)
      trackEvent('add_to_cart', {
        product: product.id,
        size,
        color,
        value: product.price * (nextQty - currentQty),
        currency: 'KES',
      })
    },
    [cart, getStock, showToast],
  )

  const updateQty = (key, delta) => {
    const entry = cart[key]
    if (!entry) return

    const available = getStock(entry.productId, entry.size)
    const nextQty = Math.min(available, entry.qty + delta)

    setCart((current) => {
      const next = { ...current }

      if (nextQty <= 0) {
        delete next[key]
      } else {
        next[key] = { ...entry, qty: nextQty }
      }

      return next
    })
  }

  const removeItem = (key) => {
    setCart((current) => {
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  const openCheckout = () => {
    if (cartItems.length === 0) return
    setCartOpen(false)
    setCheckoutOpen(true)
    trackEvent('begin_checkout')
  }

  const handleOrderPaid = useCallback(() => {
    setCart({})
    showToast('Payment received — your order is confirmed')
  }, [showToast])

  return (
    <BrowserRouter>
      <ScrollToHash />
      <div id="top">
        <a
          href="#shop"
          className="sr-only z-[90] rounded-full bg-ink px-4 py-2 text-sm text-cream focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to shop
        </a>

        <Navbar cartCount={cartCount} onOpenCart={() => setCartOpen(true)} />

        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                onQuickAdd={setProductModal}
                getStock={getStock}
                lowStockThreshold={lowStockThreshold}
              />
            }
          />
          <Route
            path="/product/:productId"
            element={
              <ProductRoute
                onQuickAdd={setProductModal}
                onAdd={addToCart}
                getStock={getStock}
                lowStockThreshold={lowStockThreshold}
              />
            }
          />
          <Route path="/track" element={<TrackPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/size-guide" element={<SizeGuidePage />} />
          <Route path="/delivery" element={<DeliveryPage />} />
          <Route path="/returns" element={<ReturnsPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/unsubscribe" element={<UnsubscribePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>

        <Footer />

        <CartDrawer
          open={cartOpen}
          items={cartItems}
          onClose={() => setCartOpen(false)}
          onCheckout={openCheckout}
          onUpdateQty={updateQty}
          onRemove={removeItem}
          getStock={getStock}
        />

        {productModal && (
          <ProductModal
            key={productModal.id}
            product={productModal}
            onClose={() => setProductModal(null)}
            onAdd={addToCart}
            getStock={getStock}
            lowStockThreshold={lowStockThreshold}
          />
        )}

        {checkoutOpen && (
          <CheckoutModal
            items={cartItems}
            onClose={() => setCheckoutOpen(false)}
            onPaid={handleOrderPaid}
          />
        )}

        <WhatsAppButton />
        <Toast message={toast} />
      </div>
    </BrowserRouter>
  )
}
