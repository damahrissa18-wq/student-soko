import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Minus,
  Plus,
  Ruler,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from 'lucide-react'
import Seo from '../components/Seo'
import ProductCard from '../components/ProductCard'
import { formatPrice, getProductById, products } from '../data/products'
import { absoluteUrl } from '../config/site'

export default function ProductPage({
  onQuickAdd,
  onAdd,
  getStock,
  lowStockThreshold,
}) {
  const { productId } = useParams()
  const product = getProductById(productId)

  const initialSize = useMemo(() => {
    if (!product) return ''
    return (
      product.sizes.find((size) => (getStock?.(product.id, size) ?? 0) > 0) ||
      product.sizes[0]
    )
  }, [product, getStock])

  const [size, setSize] = useState(initialSize)
  const [color, setColor] = useState(product?.colors[0]?.name ?? '')
  const [qty, setQty] = useState(1)

  const stock = product ? (getStock?.(product.id, size) ?? 0) : 0
  const totalStock = product
    ? product.sizes.reduce(
        (sum, option) => sum + (getStock?.(product.id, option) ?? 0),
        0,
      )
    : 0

  if (!product) {
    return (
      <main className="px-4 py-24 text-center sm:px-6 lg:px-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-flame">
          404
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold">
          That piece is not in the drop.
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-smoke">
          It may have sold out or moved. Head back to the shop and see what is
          available now.
        </p>
        <Link
          to="/#shop"
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-cream transition hover:bg-flame"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to the shop
        </Link>
      </main>
    )
  }

  const soldOut = stock <= 0
  const lowStock = !soldOut && stock <= lowStockThreshold
  const maxQty = Math.min(10, Math.max(1, stock))
  const effectiveQty = Math.min(qty, maxQty)
  const selectedColor = product.colors.find((option) => option.name === color)
  const related = products
    .filter((item) => item.id !== product.id && item.category === product.category)
    .slice(0, 3)
  const relatedFallback =
    related.length > 0
      ? related
      : products.filter((item) => item.id !== product.id).slice(0, 3)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: absoluteUrl(product.image),
    sku: product.id,
    brand: { '@type': 'Brand', name: 'StudentSoko' },
    offers: {
      '@type': 'Offer',
      url: absoluteUrl(`/product/${product.id}`),
      priceCurrency: 'KES',
      price: product.price,
      availability:
        totalStock > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
    },
  }

  const handleAdd = () => {
    if (soldOut) return
    onAdd(product, { size, color, qty: effectiveQty })
  }

  return (
    <>
      <Seo
        title={`${product.name} — ${formatPrice(product.price)}`}
        description={product.description}
        path={`/product/${product.id}`}
        image={product.image}
        type="product"
        jsonLd={jsonLd}
      />

      <main className="px-4 pb-20 pt-6 sm:px-6 sm:pt-10 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center gap-2 text-[11px] font-medium text-smoke">
            <Link to="/" className="transition hover:text-ink">
              Home
            </Link>
            <span aria-hidden="true">/</span>
            <Link to="/#shop" className="transition hover:text-ink">
              Shop
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-ink">{product.name}</span>
          </div>

          <div className="mt-6 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
            <div>
              <div className="relative overflow-hidden rounded-[2rem] bg-sand">
                <img
                  src={product.image}
                  alt={product.name}
                  className="aspect-[4/5] w-full object-cover sm:aspect-[5/4] lg:aspect-[4/5]"
                />
                {product.badge && (
                  <span className="absolute left-4 top-4 rounded-full bg-lime px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-ink">
                    {product.badge}
                  </span>
                )}
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[10px] text-smoke">
                <div className="rounded-2xl border border-ink/10 p-3">
                  <Truck className="mx-auto size-4 text-flame" aria-hidden="true" />
                  <p className="mt-1.5 font-semibold text-ink">24h campus</p>
                  <p>Nairobi delivery</p>
                </div>
                <div className="rounded-2xl border border-ink/10 p-3">
                  <Ruler className="mx-auto size-4 text-flame" aria-hidden="true" />
                  <p className="mt-1.5 font-semibold text-ink">True to size</p>
                  <p>Size guide below</p>
                </div>
                <div className="rounded-2xl border border-ink/10 p-3">
                  <ShieldCheck
                    className="mx-auto size-4 text-flame"
                    aria-hidden="true"
                  />
                  <p className="mt-1.5 font-semibold text-ink">7-day swaps</p>
                  <p>Tags still on</p>
                </div>
              </div>
            </div>

            <div className="lg:sticky lg:top-28 lg:self-start">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-flame">
                {product.category}
              </p>
              <h1 className="mt-2 font-display text-3xl font-bold leading-[1.03] tracking-tight sm:text-4xl">
                {product.name}
              </h1>

              <div className="mt-3 flex items-baseline gap-3">
                <span className="font-display text-2xl font-bold">
                  {formatPrice(product.price)}
                </span>
                {product.oldPrice && (
                  <span className="text-sm text-smoke line-through">
                    {formatPrice(product.oldPrice)}
                  </span>
                )}
              </div>

              <p className="mt-4 text-sm leading-relaxed text-ink/70">
                {product.description}
              </p>

              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-smoke">
                    Colour
                  </p>
                  <span className="text-[11px] font-semibold">
                    {selectedColor?.name}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {product.colors.map((option) => {
                    const active = option.name === color
                    return (
                      <button
                        key={option.name}
                        type="button"
                        onClick={() => setColor(option.name)}
                        aria-pressed={active}
                        className={`flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-medium transition ${
                          active
                            ? 'border-ink bg-ink text-cream'
                            : 'border-ink/15 bg-transparent text-ink/70 hover:border-ink/40'
                        }`}
                      >
                        <span
                          className="size-3.5 rounded-full border border-ink/20"
                          style={{ backgroundColor: option.hex }}
                        />
                        {option.name}
                        {active && <Check className="size-3" aria-hidden="true" />}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-smoke">
                    Size
                  </p>
                  <Link
                    to="/size-guide"
                    className="text-[11px] font-semibold text-smoke underline-offset-4 transition hover:text-ink hover:underline"
                  >
                    Size guide
                  </Link>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {product.sizes.map((option) => {
                    const available = (getStock?.(product.id, option) ?? 0) > 0
                    const active = option === size
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => {
                          setSize(option)
                          setQty(1)
                        }}
                        aria-pressed={active}
                        className={`min-w-12 rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition ${
                          active
                            ? 'border-ink bg-ink text-cream'
                            : available
                              ? 'border-ink/15 text-ink/75 hover:border-ink/45'
                              : 'cursor-not-allowed border-ink/10 text-ink/30 line-through'
                        }`}
                      >
                        {option}
                      </button>
                    )
                  })}
                </div>
                <p
                  className={`mt-2 text-[11px] font-semibold ${
                    soldOut || lowStock ? 'text-flame' : 'text-smoke'
                  }`}
                >
                  {soldOut
                    ? 'This size is sold out. Try another size.'
                    : lowStock
                      ? `Only ${stock} left in this size.`
                      : 'In stock and ready to ship.'}
                </p>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <div className="flex items-center rounded-full border border-ink/15">
                  <button
                    type="button"
                    onClick={() =>
                      setQty(Math.max(1, effectiveQty - 1))
                    }
                    disabled={effectiveQty <= 1 || soldOut}
                    className="grid size-10 place-items-center rounded-full transition hover:bg-ink hover:text-cream disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="size-4" aria-hidden="true" />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold">
                    {effectiveQty}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setQty(Math.min(maxQty, effectiveQty + 1))
                    }
                    disabled={effectiveQty >= maxQty || soldOut}
                    className="grid size-10 place-items-center rounded-full transition hover:bg-ink hover:text-cream disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink"
                    aria-label="Increase quantity"
                  >
                    <Plus className="size-4" aria-hidden="true" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={soldOut}
                  className="flex min-w-52 flex-1 items-center justify-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-cream transition hover:bg-flame disabled:cursor-not-allowed disabled:bg-ink/40 sm:flex-none"
                >
                  <ShoppingBag className="size-4" aria-hidden="true" />
                  {soldOut
                    ? 'Sold out'
                    : `Add to cart · ${formatPrice(product.price * effectiveQty)}`}
                  {!soldOut && (
                    <ArrowRight className="size-4" aria-hidden="true" />
                  )}
                </button>
              </div>

              <div className="mt-7 rounded-2xl border border-ink/10 bg-white/60 p-5">
                <h2 className="font-display text-sm font-bold">The details</h2>
                <ul className="mt-3 space-y-2">
                  {product.details.map((detail) => (
                    <li key={detail} className="flex gap-2 text-xs text-smoke">
                      <Check
                        className="mt-0.5 size-3.5 shrink-0 text-flame"
                        aria-hidden="true"
                      />
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>

              <p className="mt-4 text-[11px] leading-relaxed text-smoke">
                Pay with M-Pesa at checkout. Free campus delivery on orders over
                KSh 2,000, otherwise a flat KSh 150 delivery fee.
              </p>
            </div>
          </div>

          <section className="mt-16 border-t border-ink/10 pt-10">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-flame">
                  Complete the fit
                </p>
                <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">
                  You might also like.
                </h2>
              </div>
              <Link
                to="/#shop"
                className="hidden items-center gap-2 text-xs font-semibold text-smoke transition hover:text-ink sm:inline-flex"
              >
                Shop all
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 lg:grid-cols-3">
              {relatedFallback.map((item) => (
                <ProductCard
                  key={item.id}
                  product={item}
                  onQuickAdd={onQuickAdd}
                  getStock={getStock}
                  lowStockThreshold={lowStockThreshold}
                />
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  )
}
