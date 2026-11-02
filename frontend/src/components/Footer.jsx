import { Mail } from 'lucide-react'
import Logo from './Logo'

const year = new Date().getFullYear()

const columns = [
  {
    title: 'Shop',
    links: [
      { label: 'Hoodies', href: '#shop' },
      { label: 'Tees', href: '#shop' },
      { label: 'Caps', href: '#shop' },
      { label: 'Bags & totes', href: '#shop' },
      { label: 'Gift cards', href: '#collections' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'Our story', href: '#why' },
      { label: 'Campus reps', href: '#why' },
      { label: 'Pop-ups', href: '#collections' },
      { label: 'Reviews', href: '#reviews' },
    ],
  },
  {
    title: 'Help',
    links: [
      { label: 'Delivery & pickup', href: '#why' },
      { label: 'Size guide', href: '#shop' },
      { label: 'Returns & swaps', href: '#why' },
      { label: 'Contact us', href: 'mailto:hello@studentsoko.co.ke' },
    ],
  },
]

const socials = [
  { label: 'Instagram', short: 'IG', href: 'https://instagram.com' },
  { label: 'X', short: 'X', href: 'https://x.com' },
  { label: 'YouTube', short: 'YT', href: 'https://youtube.com' },
  { label: 'Facebook', short: 'FB', href: 'https://facebook.com' },
]

export default function Footer() {
  return (
    <footer className="bg-ink text-cream">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr] lg:gap-12">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-4 text-sm leading-relaxed text-cream/55">
              The campus marketplace for merch that actually gets you. Designed,
              printed and delivered in Nairobi.
            </p>

            <div className="mt-6 flex items-center gap-2">
              {socials.map(({ label, short, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`StudentSoko on ${label}`}
                  className="grid size-9 place-items-center rounded-full border border-white/15 font-display text-[10px] font-bold text-cream/70 transition hover:border-lime hover:bg-lime hover:text-ink"
                >
                  {short}
                </a>
              ))}
            </div>

            <a
              href="mailto:hello@studentsoko.co.ke"
              className="mt-5 inline-flex items-center gap-2 text-xs text-cream/55 transition hover:text-lime"
            >
              <Mail className="size-4" aria-hidden="true" />
              hello@studentsoko.co.ke
            </a>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="font-display text-[11px] font-bold uppercase tracking-[0.18em] text-cream/40">
                {column.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-cream/65 transition hover:text-lime"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-5 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cream/40">
              We accept
            </span>
            {['M-PESA', 'VISA', 'Mastercard', 'Cash on delivery'].map(
              (method) => (
                <span
                  key={method}
                  className="rounded-md border border-white/15 px-2 py-1 text-[10px] font-semibold text-cream/60"
                >
                  {method}
                </span>
              ),
            )}
          </div>
          <p className="text-[11px] text-cream/40">
            © {year} StudentSoko · Made in Nairobi, Kenya
          </p>
        </div>
      </div>
    </footer>
  )
}
