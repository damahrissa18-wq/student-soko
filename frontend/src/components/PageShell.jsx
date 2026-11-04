import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function PageShell({ eyebrow, title, intro, children }) {
  return (
    <main className="px-4 pb-20 pt-10 sm:px-6 sm:pt-14 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-smoke transition hover:text-ink"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Back to the shop
        </Link>

        <div className="mt-7 border-b border-ink/10 pb-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-flame">
            {eyebrow}
          </p>
          <h1 className="mt-3 font-display text-4xl font-bold leading-[1.02] tracking-tight sm:text-5xl">
            {title}
          </h1>
          {intro && (
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-smoke sm:text-base">
              {intro}
            </p>
          )}
        </div>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-ink/80">
          {children}
        </div>
      </div>
    </main>
  )
}
