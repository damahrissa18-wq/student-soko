import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Plus } from 'lucide-react'
import { formatPrice } from '../data/products'

const badgeStyles = {
  'Best seller': 'bg-lime text-ink',
  New: 'bg-flame text-cream',
  'Low stock': 'bg-ink text-cream',
  'Sold out': 'bg-ink text-cream',
}

export default function ProductCard({
  product,
  onQuickAdd,
  getStock,
  lowStockThreshold = 3,
}) {
  const [wished, setWished] = useState(false)
  const totalStock = product.sizes.reduce(
    (sum, size) => sum + (getStock?.(product.id, size) ?? 0),
    0,
  )
  const soldOut = totalStock === 0
  const lowStock = !soldOut && totalStock <= lowStockThreshold
  const badge = soldOut ? 'Sold out' : lowStock ? 'Low stock' : product.badge

  return (
    <article className="group">
      <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-sand">
        <Link
          to={`/product/${product.id}`}
          className="block h-full w-full"
          aria-label={`View ${product.name}`}
        >
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />
        </Link>

        {badge && (
          <span
            className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] sm:text-[10px] ${badgeStyles[badge] || 'bg-ink text-cream'}`}
          >
            {badge}
          </span>
        )}

        <button
          type="button"
          onClick={() => setWished((current) => !current)}
          aria-pressed={wished}
          aria-label={`${wished ? 'Remove' : 'Save'} ${product.name} ${wished ? 'from' : 'to'} wishlist`}
          className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-cream/90 text-ink backdrop-blur transition hover:bg-cream sm:size-9"
        >
          <Heart
            className={`size-4 transition ${wished ? 'fill-flame text-flame' : ''}`}
            aria-hidden="true"
          />
        </button>

        <button
          type="button"
          onClick={() => onQuickAdd(product)}
          disabled={soldOut}
          className="absolute inset-x-3 bottom-3 flex items-center justify-center gap-2 rounded-full bg-ink/90 py-2.5 text-xs font-semibold text-cream backdrop-blur transition hover:bg-flame disabled:cursor-not-allowed disabled:bg-ink/60 sm:translate-y-3 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:focus-visible:translate-y-0 sm:focus-visible:opacity-100"
        >
          <Plus className="size-3.5" aria-hidden="true" />
          {soldOut ? 'Sold out' : 'Quick add'}
        </button>
      </div>

      <div className="mt-3 flex items-start justify-between gap-2 px-0.5 sm:mt-4">
        <div className="min-w-0">
          <Link to={`/product/${product.id}`} className="block">
            <h3 className="font-display text-sm font-semibold leading-snug transition hover:text-flame sm:text-base">
              {product.name}
            </h3>
          </Link>
          <p className="mt-0.5 text-[11px] text-smoke">{product.category}</p>
          <div className="mt-2 flex items-center gap-1.5" aria-hidden="true">
            {product.colors.map((color) => (
              <span
                key={color.name}
                title={color.name}
                className="size-2.5 rounded-full border border-ink/15"
                style={{ backgroundColor: color.hex }}
              />
            ))}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-display text-sm font-bold sm:text-base">
            {formatPrice(product.price)}
          </p>
          {product.oldPrice && (
            <p className="text-[11px] text-smoke line-through">
              {formatPrice(product.oldPrice)}
            </p>
          )}
        </div>
      </div>
    </article>
  )
}
