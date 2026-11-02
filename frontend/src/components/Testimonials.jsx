import { Star } from 'lucide-react'

const reviews = [
  {
    quote:
      'Ordered a hoodie on Tuesday, wore it to a 2PM lecture on Wednesday. The quality is crazy good for the price.',
    name: 'Wanjiku M.',
    detail: '3rd year · University of Nairobi',
    initials: 'WM',
    avatar: 'bg-lime text-ink',
  },
  {
    quote:
      "Finally merch that doesn't look like it was printed in a basement. The fit is unreal and delivery was fast.",
    name: 'Brian O.',
    detail: 'Final year · JKUAT',
    initials: 'BO',
    avatar: 'bg-flame text-cream',
  },
  {
    quote:
      'The tote is now my whole personality. Packaging was cute, the quality is solid, and support replied in minutes.',
    name: 'Amina K.',
    detail: '2nd year · Kenyatta University',
    initials: 'AK',
    avatar: 'bg-ink text-cream',
  },
]

export default function Testimonials() {
  return (
    <section id="reviews" className="scroll-mt-24 pb-16 sm:pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-flame">
              Word on campus
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold leading-[1.05] tracking-tight sm:text-4xl lg:text-5xl">
              Students don't gatekeep.
            </h2>
          </div>
          <div className="flex items-center gap-3 rounded-full border border-ink/10 bg-white px-4 py-2.5">
            <div className="flex items-center gap-0.5 text-flame" aria-hidden="true">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star key={index} className="size-3.5 fill-current" />
              ))}
            </div>
            <span className="font-display text-sm font-bold">4.9</span>
            <span className="text-xs text-smoke">from 600+ reviews</span>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {reviews.map((review) => (
            <figure
              key={review.name}
              className="flex h-full flex-col rounded-3xl border border-ink/10 bg-white p-6"
            >
              <div
                className="flex items-center gap-0.5 text-flame"
                aria-label="5 out of 5 stars"
              >
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={index}
                    className="size-4 fill-current"
                    aria-hidden="true"
                  />
                ))}
              </div>
              <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-ink/75 sm:text-[15px]">
                “{review.quote}”
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3 border-t border-ink/10 pt-4">
                <span
                  className={`grid size-10 place-items-center rounded-full text-xs font-bold ${review.avatar}`}
                  aria-hidden="true"
                >
                  {review.initials}
                </span>
                <div>
                  <p className="font-display text-sm font-semibold">
                    {review.name}
                  </p>
                  <p className="text-[11px] text-smoke">{review.detail}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
