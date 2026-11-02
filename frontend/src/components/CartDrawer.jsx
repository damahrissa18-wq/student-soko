import { useEffect, useState } from 'react'
import {
  ArrowRight,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  Truck,
  X,
} from 'lucide-react'
import { formatPrice } from '../data/products'

const FREE_DELIVERY_AT = 2000

export default function CartDrawer({
  open,
  items,
  onClose,
  onUpdateQty,
  onRemove,
}) {
  const [checkoutNotice, setCheckoutNotice] = useState(false)

  useEffect(() => {
    if (!open) return

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
  }, [open, onClose])

  if (!open) return null

  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.qty,
    0,
  )
  const remaining = Math.max(0, FREE_DELIVERY_AT - subtotal)
  const progress = Math.min(100, (subtotal / FREE_DELIVERY_AT) * 100)

  return (
    <div className="fixed inset-0 z-[75]">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-ink/50 backdrop-blur-sm"
        aria-label="Close cart"
      />

      <aside
        className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-cream shadow-2xl"
        aria-label="Shopping cart"
      >
        <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
          <h2 className="font-display text-lg font-bold">
            Your cart{' '}
            <span className="text-sm font-medium text-smoke">
              ({items.reduce((sum, item) => sum + item.qty, 0)})
            </span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-full border border-ink/15 transition hover:bg-ink hover:text-cream"
            aria-label="Close cart"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <span className="grid size-16 place-items-center rounded-full bg-sand">
              <ShoppingBag className="size-7" aria-hidden="true" />
            </span>
            <h3 className="mt-5 font-display text-xl font-bold">
              Your cart is empty
            </h3>
            <p className="mt-2 max-w-xs text-sm text-smoke">
              The next drop won't wait around. Go find something that fits your
              campus era.
            </p>
            <a
              href="#shop"
              onClick={onClose}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-flame px-6 py-3 text-sm font-semibold text-cream transition hover:bg-ink"
            >
              Shop the drop
              <ArrowRight className="size-4" aria-hidden="true" />
            </a>
          </div>
        ) : (
          <>
            <div className="border-b border-ink/10 px-5 py-4">
              <div className="rounded-2xl border border-ink/10 bg-sand/60 p-3.5">
                <p className="flex items-center gap-2 text-xs font-medium">
                  <Truck className="size-4 shrink-0 text-flame" aria-hidden="true" />
                  {remaining > 0 ? (
                    <span>
                      Add{' '}
                      <strong className="font-bold">
                        {formatPrice(remaining)}
                      </strong>{' '}
                      for free campus delivery
                    </span>
                  ) : (
                    <span>You've unlocked free campus delivery.</span>
                  )}
                </p>
                <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-ink/10">
                  <div
                    className="h-full rounded-full bg-flame transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>

            <ul className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
              {items.map(({ product, qty }) => (
                <li key={product.id} className="flex gap-3">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-24 w-20 shrink-0 rounded-xl object-cover"
                    loading="lazy"
                  />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-display text-sm font-semibold leading-snug">
                          {product.name}
                        </p>
                        <p className="mt-0.5 text-[11px] text-smoke">
                          {product.category} · One size
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemove(product.id)}
                        className="grid size-7 shrink-0 place-items-center rounded-full text-smoke transition hover:bg-ink/5 hover:text-flame"
                        aria-label={`Remove ${product.name} from cart`}
                      >
                        <Trash2 className="size-3.5" aria-hidden="true" />
                      </button>
                    </div>

                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center rounded-full border border-ink/15">
                        <button
                          type="button"
                          onClick={() => onUpdateQty(product.id, -1)}
                          className="grid size-7 place-items-center rounded-full transition hover:bg-ink hover:text-cream"
                          aria-label={`Decrease quantity of ${product.name}`}
                        >
                          <Minus className="size-3" aria-hidden="true" />
                        </button>
                        <span className="w-6 text-center text-xs font-semibold">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQty(product.id, 1)}
                          className="grid size-7 place-items-center rounded-full transition hover:bg-ink hover:text-cream"
                          aria-label={`Increase quantity of ${product.name}`}
                        >
                          <Plus className="size-3" aria-hidden="true" />
                        </button>
                      </div>
                      <p className="font-display text-sm font-bold">
                        {formatPrice(product.price * qty)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="border-t border-ink/10 px-5 py-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-smoke">Subtotal</span>
                <span className="font-display text-xl font-bold">
                  {formatPrice(subtotal)}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-smoke">
                Delivery is calculated at checkout. Free over KSh 2,000.
              </p>

              <button
                type="button"
                onClick={() => setCheckoutNotice(true)}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3.5 text-sm font-semibold text-cream transition hover:bg-flame"
              >
                Checkout
                <ArrowRight className="size-4" aria-hidden="true" />
              </button>

              {checkoutNotice && (
                <p
                  className="mt-3 rounded-xl bg-lime/50 px-3 py-2.5 text-center text-[11px] font-medium text-ink"
                  role="status"
                >
                  Checkout launches with the next build. Your cart is saved for
                  this session.
                </p>
              )}

              <button
                type="button"
                onClick={onClose}
                className="mt-2 w-full py-2 text-xs font-semibold text-smoke underline-offset-4 transition hover:text-ink hover:underline"
              >
                Continue shopping
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  )
}
