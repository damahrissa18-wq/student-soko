import { Star } from 'lucide-react'

const items = [
  'Free campus delivery',
  'New drops every Friday',
  'Student-owned',
  'Easy 7-day swaps',
  'Pay with M-Pesa',
]

function MarqueeGroup() {
  return (
    <div className="flex shrink-0 items-center">
      {items.map((item) => (
        <span key={item} className="flex items-center">
          <span className="px-5 font-display text-xs font-semibold uppercase tracking-[0.2em] sm:px-8 sm:text-sm">
            {item}
          </span>
          <Star
            className="size-3 shrink-0 fill-lime text-lime sm:size-3.5"
            aria-hidden="true"
          />
        </span>
      ))}
    </div>
  )
}

export default function Marquee() {
  return (
    <div
      className="overflow-hidden border-y border-cream/10 bg-ink py-4 text-cream"
      aria-hidden="true"
    >
      <div className="flex w-max animate-marquee">
        <MarqueeGroup />
        <MarqueeGroup />
      </div>
    </div>
  )
}
