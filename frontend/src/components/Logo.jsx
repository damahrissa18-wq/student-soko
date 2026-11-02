import { ShoppingBag } from 'lucide-react'

export default function Logo({ onClick }) {
  return (
    <a
      href="#top"
      onClick={onClick}
      className="group flex shrink-0 items-center gap-2.5"
      aria-label="StudentSoko home"
    >
      <span className="grid size-10 place-items-center rounded-xl bg-lime text-ink shadow-[0_4px_0_0_#121212] transition-transform duration-200 group-hover:-rotate-6">
        <ShoppingBag className="size-5" strokeWidth={2.5} />
      </span>
      <span className="font-display text-xl font-bold tracking-tight">
        Student<span className="text-flame">Soko</span>
      </span>
    </a>
  )
}
