import { ArrowRight, BadgeCheck, RefreshCw, Truck, Wallet } from 'lucide-react'

const perks = [
  {
    icon: Truck,
    title: '24-hour campus delivery',
    text: 'Order before 4PM and pick it up at your hostel or a campus pickup point the next day.',
  },
  {
    icon: BadgeCheck,
    title: 'Checked before it ships',
    text: 'Every piece is inspected, measured and photographed. What you see is what you get.',
  },
  {
    icon: Wallet,
    title: 'Student-first pricing',
    text: 'Straight from our printer in Nairobi. No middlemen, no inflated bookstore markups.',
  },
  {
    icon: RefreshCw,
    title: '7-day easy swaps',
    text: 'Wrong size? Swap it within a week. Keep the tags on and hit us up — no long story.',
  },
]

export default function Perks() {
  return (
    <section id="why" className="scroll-mt-24 px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-ink px-5 py-12 text-cream sm:rounded-[2.5rem] sm:px-10 sm:py-16 lg:px-14">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-16">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-lime">
              The Soko promise
            </p>
            <h2 className="mt-3 max-w-md font-display text-3xl font-bold leading-[1.05] tracking-tight sm:text-4xl lg:text-5xl">
              Good merch. Fair prices. Zero stress.
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-cream/60 sm:text-base">
              We started StudentSoko because campus merch was either ugly,
              overpriced, or both. So we built the version we wanted to shop.
            </p>
            <a
              href="#shop"
              className="group mt-7 inline-flex items-center gap-2 border-b border-lime/40 pb-1 text-sm font-semibold text-lime transition hover:border-lime"
            >
              Shop the current drop
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </a>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {perks.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition hover:border-lime/30 hover:bg-white/[0.06]"
              >
                <span className="grid size-10 place-items-center rounded-xl bg-lime text-ink">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-display text-sm font-semibold sm:text-base">
                  {title}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-cream/55 sm:text-[13px]">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
