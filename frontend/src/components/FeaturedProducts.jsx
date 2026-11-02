import { useState } from 'react'
import { filters, products } from '../data/products'
import ProductCard from './ProductCard'

export default function FeaturedProducts({ onAdd }) {
  const [activeFilter, setActiveFilter] = useState('All')

  const visibleProducts =
    activeFilter === 'All'
      ? products
      : products.filter((product) => product.category === activeFilter)

  return (
    <section id="shop" className="scroll-mt-24 pb-16 sm:pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-flame">
              Fresh off the rack
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold leading-[1.05] tracking-tight sm:text-4xl lg:text-5xl">
              New drops, student prices.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-smoke sm:text-right">
            Small-batch merch, printed and quality-checked in Nairobi. When it's
            gone, it's gone.
          </p>
        </div>

        <div className="no-scrollbar mt-7 flex items-center gap-2 overflow-x-auto pb-1">
          {filters.map((filter) => {
            const isActive = filter === activeFilter
            return (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                aria-pressed={isActive}
                className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition sm:text-sm ${
                  isActive
                    ? 'border-ink bg-ink text-cream'
                    : 'border-ink/15 bg-transparent text-ink/65 hover:border-ink/40 hover:text-ink'
                }`}
              >
                {filter}
              </button>
            )
          })}
          <span className="ml-auto hidden shrink-0 text-xs text-smoke sm:block">
            {visibleProducts.length}{' '}
            {visibleProducts.length === 1 ? 'piece' : 'pieces'}
          </span>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 lg:grid-cols-3">
          {visibleProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAdd={onAdd}
            />
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <a
            href="#collections"
            className="inline-flex items-center gap-2 rounded-full border border-ink/20 px-6 py-3 text-sm font-semibold transition hover:border-ink hover:bg-ink hover:text-cream"
          >
            Browse every collection
          </a>
        </div>
      </div>
    </section>
  )
}
