import { Link } from 'react-router-dom'
import { Mail, MessageCircle } from 'lucide-react'
import Logo from './Logo'
import { siteConfig, whatsappUrl } from '../config/site'

const year = new Date().getFullYear()

const columns = [
  {
    title: 'Shop',
    links: [
      { label: 'Hoodies', to: '/#shop' },
      { label: 'Tees', to: '/#shop' },
      { label: 'Caps', to: '/#shop' },
      { label: 'Backpacks', to: '/#shop' },
      { label: 'Notebooks', to: '/#shop' },
      { label: 'Suitcases', to: '/#shop' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'Our story', to: '/#why' },
      { label: 'Reviews', to: '/#reviews' },
      { label: 'Size guide', to: '/size-guide' },
      { label: 'Privacy', to: '/privacy' },
      { label: 'Terms', to: '/terms' },
    ],
  },
  {
    title: 'Help',
    links: [
      { label: 'Track order', to: '/track' },
      { label: 'Delivery & pickup', to: '/delivery' },
      { label: 'Returns & swaps', to: '/returns' },
      { label: 'FAQ', to: '/faq' },
      { label: 'Contact us', href: `mailto:${siteConfig.email}` },
    ],
  },
]

export default function Footer() {
  const whatsapp = whatsappUrl()

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

            {siteConfig.socials.length > 0 && (
              <div className="mt-6 flex flex-wrap items-center gap-2">
                {siteConfig.socials.map(({ label, short, href }) => (
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
            )}

            <div className="mt-5 flex flex-col gap-2">
              <a
                href={`mailto:${siteConfig.email}`}
                className="inline-flex items-center gap-2 text-xs text-cream/55 transition hover:text-lime"
              >
                <Mail className="size-4" aria-hidden="true" />
                {siteConfig.email}
              </a>
              {whatsapp && (
                <a
                  href={whatsapp}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-xs text-cream/55 transition hover:text-lime"
                >
                  <MessageCircle className="size-4" aria-hidden="true" />
                  WhatsApp support
                </a>
              )}
            </div>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="font-display text-[11px] font-bold uppercase tracking-[0.18em] text-cream/40">
                {column.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    {link.href ? (
                      <a
                        href={link.href}
                        className="text-sm text-cream/65 transition hover:text-lime"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        to={link.to}
                        className="text-sm text-cream/65 transition hover:text-lime"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-5 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cream/40">
              Checkout
            </span>
            <span className="rounded-md border border-white/15 px-2 py-1 text-[10px] font-semibold text-cream/60">
              M-PESA
            </span>
            <span className="text-[10px] text-cream/35">
              Secure STK Push · No card details stored
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-cream/40">
            <Link to="/delivery" className="transition hover:text-lime">
              Delivery
            </Link>
            <Link to="/returns" className="transition hover:text-lime">
              Returns
            </Link>
            <Link to="/privacy" className="transition hover:text-lime">
              Privacy
            </Link>
            <span>
              © {year} StudentSoko · Made in Nairobi, Kenya
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
