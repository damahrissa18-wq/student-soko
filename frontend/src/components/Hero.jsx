import { ArrowRight, ArrowUpRight, Plus, Star, Truck } from 'lucide-react'
import { formatPrice, products } from '../data/products'

const stats = [
  ['24h', 'campus delivery'],
  ['48', 'partner campuses'],
  ['4.9/5', 'student rating'],
  ['7-day', 'easy swaps'],
]

const shoppers = [
  { initials: 'WM', className: 'bg-lime text-ink' },
  { initials: 'BO', className: 'bg-flame text-cream' },
  { initials: 'AK', className: 'bg-ink text-cream' },
  { initials: 'NJ', className: 'bg-sand text-ink' },
]

export default function Hero({ onAdd }) {
  const heroProduct = products[0]

  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute -left-40 top-10 size-[26rem] rounded-full bg-lime/35 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-32 bottom-10 size-80 rounded-full bg-flame/15 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 pb-12 pt-10 sm:pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12 lg:pb-16 lg:pt-16">
          <div>
            <div className="inline-flex items-center gap-2.5 rounded-full border border-ink/15 bg-cream px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] sm:text-[11px]">
              <span className="relative flex size-2" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-flame opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-flame" />
              </span>
              Student-owned · Nairobi
            </div>

            <h1 className="mt-6 font-display text-[2.9rem] font-bold leading-[0.95] tracking-[-0.04em] sm:text-6xl lg:text-7xl xl:text-[5.2rem]">
              Campus drip,
              <br />
              <span className="relative inline-block">
                <span
                  className="absolute inset-x-[-3%] bottom-[7%] h-[34%] -rotate-1 rounded-sm bg-lime"
                  aria-hidden="true"
                />
                <span className="relative">delivered.</span>
              </span>
            </h1>

            <p className="mt-6 max-w-md text-base leading-relaxed text-ink/65 sm:text-lg">
              Hoodies, tees and everyday merch made for lecture halls, hostels
              and everything in between. Order today, wear it on campus
              tomorrow.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#shop"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-flame px-7 py-4 text-sm font-semibold text-cream shadow-[0_14px_30px_-14px_rgba(255,77,28,0.9)] transition hover:bg-ink"
              >
                Shop the drop
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </a>
              <a
                href="#collections"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-ink/20 px-7 py-4 text-sm font-semibold text-ink transition hover:border-ink hover:bg-ink hover:text-cream"
              >
                Browse collections
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </a>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
              <div className="flex -space-x-2.5" aria-hidden="true">
                {shoppers.map((shopper) => (
                  <span
                    key={shopper.initials}
                    className={`grid size-9 place-items-center rounded-full border-2 border-cream text-[10px] font-bold ${shopper.className}`}
                  >
                    {shopper.initials}
                  </span>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <div
                    className="flex items-center gap-0.5 text-flame"
                    aria-hidden="true"
                  >
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star key={index} className="size-3.5 fill-current" />
                    ))}
                  </div>
                  <span className="ml-1 text-xs font-bold">4.9</span>
                </div>
                <p className="mt-0.5 text-xs text-smoke">
                  2,400+ students already stocked up
                </p>
              </div>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div
              className="absolute -inset-2.5 rotate-2 rounded-[2.2rem] bg-flame sm:-inset-4 sm:rounded-[2.6rem]"
              aria-hidden="true"
            />

            <div className="relative overflow-hidden rounded-[2rem] border border-ink/10 bg-sand">
              <img
                src="/images/hero-rack.jpg"
                alt="Fresh StudentSoko hoodies and tees hanging on a rack"
                className="h-[430px] w-full object-cover sm:h-[520px] lg:h-[560px]"
                fetchPriority="high"
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-ink/40 via-transparent to-transparent"
                aria-hidden="true"
              />
            </div>

            <div className="absolute -left-2 top-5 rotate-[-6deg] rounded-2xl border-2 border-ink bg-lime px-3.5 py-2.5 shadow-[4px_4px_0_0_#121212] sm:-left-4">
              <p className="font-display text-[10px] font-bold uppercase leading-none tracking-[0.14em] text-ink">
                New drop
              </p>
              <p className="mt-1 font-display text-sm font-bold leading-none text-ink">
                Friday, 6PM
              </p>
            </div>

            <div className="absolute -right-3 top-4 hidden size-28 place-items-center rounded-full border-2 border-ink bg-cream sm:grid lg:-right-5">
              <svg
                viewBox="0 0 120 120"
                className="absolute inset-0 size-full animate-[spin_20s_linear_infinite] p-1.5"
                aria-hidden="true"
              >
                <defs>
                  <path
                    id="sticker-circle"
                    d="M60,60 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0"
                  />
                </defs>
                <text className="fill-ink font-sans text-[8.5px] font-bold uppercase tracking-[0.14em]">
                  <textPath href="#sticker-circle">
                    Free campus delivery · Student prices ·
                  </textPath>
                </text>
              </svg>
              <span className="grid size-14 place-items-center rounded-full bg-lime">
                <Truck className="size-6" aria-hidden="true" />
              </span>
            </div>

            <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-ink/10 bg-cream/95 p-3 shadow-2xl backdrop-blur sm:inset-x-5 sm:bottom-5">
              <div className="flex items-center gap-3">
                <img
                  src={heroProduct.image}
                  alt=""
                  className="size-14 shrink-0 rounded-xl object-cover"
                  loading="lazy"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-flame">
                    This week's pick
                  </p>
                  <p className="truncate font-display text-sm font-semibold leading-tight">
                    {heroProduct.name}
                  </p>
                  <p className="mt-0.5 text-xs text-smoke">
                    <span className="font-semibold text-ink">
                      {formatPrice(heroProduct.price)}
                    </span>{' '}
                    <span className="line-through">
                      {formatPrice(heroProduct.oldPrice)}
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onAdd(heroProduct)}
                  className="grid size-10 shrink-0 place-items-center rounded-full bg-ink text-cream transition hover:bg-flame"
                  aria-label={`Add ${heroProduct.name} to cart`}
                >
                  <Plus className="size-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-y-6 border-t border-ink/10 py-8 sm:grid-cols-4 sm:gap-4 sm:py-9">
          {stats.map(([value, label]) => (
            <div key={label}>
              <dt className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                {value}
              </dt>
              <dd className="mt-0.5 text-xs text-smoke">{label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
