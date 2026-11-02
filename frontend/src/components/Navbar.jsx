import { useEffect, useState } from 'react'
import { ArrowRight, Menu, ShoppingBag, Sparkles, X } from 'lucide-react'
import Logo from './Logo'

const links = [
  { label: 'Shop', href: '#shop' },
  { label: 'Collections', href: '#collections' },
  { label: 'Why Soko', href: '#why' },
  { label: 'Reviews', href: '#reviews' },
]

export default function Navbar({ cartCount, onOpenCart }) {
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!menuOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

  return (
    <>
      <div className="bg-ink text-cream">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-2.5 text-center text-[11px] font-medium tracking-wide sm:text-xs">
          <Sparkles className="size-3.5 shrink-0 text-lime" aria-hidden="true" />
          <span>Free campus delivery on orders over KSh 2,000</span>
          <span className="hidden text-cream/40 sm:inline">·</span>
          <span className="hidden text-cream/70 sm:inline">
            New drop every Friday
          </span>
        </div>
      </div>

      <header className="sticky top-0 z-50 border-b border-ink/10 bg-cream/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:h-20 lg:px-8">
          <Logo />

          <nav className="hidden items-center gap-8 lg:flex" aria-label="Main">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="group relative text-sm font-medium text-ink/65 transition-colors hover:text-ink"
              >
                {link.label}
                <span className="absolute -bottom-1.5 left-0 h-0.5 w-0 rounded-full bg-flame transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onOpenCart}
              className="relative grid size-10 place-items-center rounded-full border border-ink/15 text-ink transition hover:border-ink hover:bg-ink hover:text-cream"
              aria-label={`Open cart, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`}
            >
              <ShoppingBag className="size-[18px]" aria-hidden="true" />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-flame px-1 text-[10px] font-bold leading-5 text-cream">
                  {cartCount}
                </span>
              )}
            </button>

            <a
              href="#shop"
              className="hidden items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-cream transition hover:bg-flame sm:inline-flex"
            >
              Shop the drop
              <ArrowRight className="size-4" aria-hidden="true" />
            </a>

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="grid size-10 place-items-center rounded-full border border-ink/15 transition hover:bg-ink hover:text-cream lg:hidden"
              aria-label="Open menu"
              aria-expanded={menuOpen}
            >
              <Menu className="size-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-[70] flex flex-col bg-cream lg:hidden">
          <div className="flex h-16 items-center justify-between border-b border-ink/10 px-4">
            <Logo onClick={() => setMenuOpen(false)} />
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="grid size-10 place-items-center rounded-full border border-ink/15 transition hover:bg-ink hover:text-cream"
              aria-label="Close menu"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>

          <nav
            className="flex flex-1 flex-col justify-center px-6"
            aria-label="Mobile"
          >
            {links.map((link, index) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="group flex items-center justify-between border-b border-ink/10 py-4"
              >
                <span className="font-display text-3xl font-semibold tracking-tight transition-colors group-hover:text-flame">
                  {link.label}
                </span>
                <span className="font-display text-xs font-medium text-smoke">
                  0{index + 1}
                </span>
              </a>
            ))}
          </nav>

          <div className="p-6">
            <a
              href="#shop"
              onClick={() => setMenuOpen(false)}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-flame py-4 text-sm font-semibold text-cream transition hover:bg-ink"
            >
              Shop the drop
              <ArrowRight className="size-4" aria-hidden="true" />
            </a>
            <div className="mt-5 flex items-center justify-between text-xs text-smoke">
              <span>Nairobi, Kenya</span>
              <span>@studentsoko</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
