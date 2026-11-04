import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Check,
  Minus,
  Plus,
  ShoppingBag,
  X,
} from 'lucide-react'
import { formatPrice } from '../data/products'

export default function ProductModal({
  product,
  onClose,
  onAdd,
  getStock,
  lowStockThreshold = 3,
}) {
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

  useEffect(() => {
    if (!product) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [product, onClose])

  if (!product) return null

  const soldOut = stock <= 0
  const lowStock = !soldOut && stock <= lowStockThreshold
  const maxQty = Math.min(10, Math.max(1, stock))
  const effectiveQty = Math.min(qty, maxQty)
  const selectedColor = product.colors.find((item) => item.name === color)

  const handleAdd = () => {
    if (soldOut) return

    onAdd(product, { size, color, qty: effectiveQty })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[78]">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-ink/55 backdrop-blur-sm"
        aria-label="Close product options"
      />

      <div className="pointer-events-none absolute inset-0 flex items-end justify-center sm:items-center sm:p-6">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="product-modal-title"
          className="pointer-events-auto relative max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl bg-cream shadow-2xl sm:rounded-3xl"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-10 grid size-9 place-items-center rounded-full bg-cream/90 text-ink shadow-sm backdrop-blur transition hover:bg-ink hover:text-cream"
            aria-label="Close product options"
          >
            <X className="size-4" aria-hidden="true" />
          </button>

          <div className="grid sm:grid-cols-[0.9fr_1.1fr]">
            <div className="relative aspect-[4/3] overflow-hidden bg-sand sm:aspect-auto sm:min-h-0">
              <img
                src={product.image}
                alt={product.name}
                className="h-full w-full object-cover"
              />
              {product.badge && (
                <span className="absolute left-4 top-4 rounded-full bg-lime px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-ink">
                  {product.badge}
                </span>
              )}
            </div>

            <div className="p-5 sm:p-7">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-flame">
                {product.category}
              </p>
              <h2
                id="product-modal-title"
                className="mt-1 font-display text-2xl font-bold tracking-tight"
              >
                {product.name}
              </h2>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="font-display text-lg font-bold">
                  {formatPrice(product.price)}
                </span>
                {product.oldPrice && (
                  <span className="text-xs text-smoke line-through">
                    {formatPrice(product.oldPrice)}
                  </span>
                )}
              </div>

              <p className="mt-3 text-xs leading-relaxed text-smoke sm:text-sm">
                {product.description}
              </p>

              <div className="mt-5">
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
                        className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
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

              <div className="mt-5">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-smoke">
                    Size
                  </p>
                  <span
                    className={`text-[11px] font-semibold ${
                      soldOut
                        ? 'text-flame'
                        : lowStock
                          ? 'text-flame'
                          : 'text-smoke'
                    }`}
                  >
                    {soldOut
                      ? 'Sold out in this size'
                      : lowStock
                        ? `Only ${stock} left`
                        : 'In stock'}
                  </span>
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
                        className={`min-w-11 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
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
              </div>

              <div className="mt-5 flex items-center justify-between gap-3">
                <div className="flex items-center rounded-full border border-ink/15">
                  <button
                    type="button"
                    onClick={() =>
                      setQty(Math.max(1, effectiveQty - 1))
                    }
                    disabled={effectiveQty <= 1 || soldOut}
                    className="grid size-9 place-items-center rounded-full transition hover:bg-ink hover:text-cream disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="size-3.5" aria-hidden="true" />
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
                    className="grid size-9 place-items-center rounded-full transition hover:bg-ink hover:text-cream disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink"
                    aria-label="Increase quantity"
                  >
                    <Plus className="size-3.5" aria-hidden="true" />
                  </button>
                </div>
                <p className="text-xs font-semibold">
                  {formatPrice(product.price * effectiveQty)}
                </p>
              </div>

              <button
                type="button"
                onClick={handleAdd}
                disabled={soldOut}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3.5 text-sm font-semibold text-cream transition hover:bg-flame disabled:cursor-not-allowed disabled:bg-ink/40"
              >
                <ShoppingBag className="size-4" aria-hidden="true" />
                {soldOut ? 'Sold out' : 'Add to cart'}
                {!soldOut && <ArrowRight className="size-4" aria-hidden="true" />}
              </button>

              <Link
                to={`/product/${product.id}`}
                onClick={onClose}
                className="mt-3 block text-center text-[11px] font-semibold text-smoke underline-offset-4 transition hover:text-ink hover:underline"
              >
                View full product details
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
