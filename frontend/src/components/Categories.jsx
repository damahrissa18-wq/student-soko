import { ArrowUpRight } from 'lucide-react'
import { categories } from '../data/products'

export default function Categories() {
  return (
    <section id="collections" className="scroll-mt-24 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-flame">
              Shop by vibe
            </p>
            <h2 className="mt-2 max-w-xl font-display text-3xl font-bold leading-[1.05] tracking-tight sm:text-4xl lg:text-5xl">
              Find your campus uniform.
            </h2>
          </div>
          <a
            href="#shop"
            className="group inline-flex items-center gap-2 rounded-full border border-ink/20 px-5 py-2.5 text-xs font-semibold transition hover:border-ink hover:bg-ink hover:text-cream sm:text-sm"
          >
            View all collections
            <ArrowUpRight
              className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              aria-hidden="true"
            />
          </a>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:auto-rows-[200px] lg:grid-cols-4">
          {categories.map((category) => (
            <a
              key={category.name}
              href="#shop"
              className={`group relative overflow-hidden rounded-3xl bg-sand focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-flame ${category.className}`}
            >
              <img
                src={category.image}
                alt={`${category.name} collection`}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-transparent"
                aria-hidden="true"
              />

              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 sm:p-5">
                <div>
                  <h3 className="font-display text-lg font-bold text-cream sm:text-xl">
                    {category.name}
                  </h3>
                  <p className="mt-0.5 text-[11px] text-cream/70 sm:text-xs">
                    {category.count}
                  </p>
                </div>
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-cream text-ink transition group-hover:bg-lime">
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
