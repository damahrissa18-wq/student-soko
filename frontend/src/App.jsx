import { useCallback, useEffect, useRef, useState } from 'react'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Marquee from './components/Marquee'
import Categories from './components/Categories'
import FeaturedProducts from './components/FeaturedProducts'
import Perks from './components/Perks'
import Testimonials from './components/Testimonials'
import DropSignup from './components/DropSignup'
import Footer from './components/Footer'
import CartDrawer from './components/CartDrawer'
import Toast from './components/Toast'
import { products } from './data/products'

export default function App() {
  const [cart, setCart] = useState({})
  const [cartOpen, setCartOpen] = useState(false)
  const [toast, setToast] = useState('')
  const toastTimer = useRef(null)

  const cartItems = Object.entries(cart)
    .map(([id, qty]) => ({
      product: products.find((product) => product.id === id),
      qty,
    }))
    .filter((item) => item.product)

  const cartCount = cartItems.reduce((sum, item) => sum + item.qty, 0)

  const addToCart = useCallback((product) => {
    setCart((current) => ({
      ...current,
      [product.id]: (current[product.id] || 0) + 1,
    }))
    setToast(`${product.name} added to cart`)

    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(''), 2400)
  }, [])

  useEffect(() => () => window.clearTimeout(toastTimer.current), [])

  const updateQty = (id, delta) => {
    setCart((current) => {
      const next = { ...current, [id]: (current[id] || 0) + delta }
      if (next[id] <= 0) delete next[id]
      return next
    })
  }

  const removeItem = (id) => {
    setCart((current) => {
      const next = { ...current }
      delete next[id]
      return next
    })
  }

  return (
    <div id="top">
      <a
        href="#shop"
        className="sr-only z-[90] rounded-full bg-ink px-4 py-2 text-sm text-cream focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to shop
      </a>

      <Navbar cartCount={cartCount} onOpenCart={() => setCartOpen(true)} />

      <main>
        <Hero onAdd={addToCart} />
        <Marquee />
        <Categories />
        <FeaturedProducts onAdd={addToCart} />
        <Perks />
        <Testimonials />
        <DropSignup />
      </main>

      <Footer />

      <CartDrawer
        open={cartOpen}
        items={cartItems}
        onClose={() => setCartOpen(false)}
        onUpdateQty={updateQty}
        onRemove={removeItem}
      />
      <Toast message={toast} />
    </div>
  )
}
