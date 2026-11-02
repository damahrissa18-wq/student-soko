import { CheckCircle2 } from 'lucide-react'

export default function Toast({ message }) {
  if (!message) return null

  return (
    <div
      role="status"
      className="fixed bottom-5 left-1/2 z-[85] flex w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 animate-[toast-in_0.28s_ease-out] items-center gap-2 rounded-full bg-ink px-5 py-3 text-xs font-medium text-cream shadow-2xl sm:text-sm"
    >
      <CheckCircle2 className="size-4 shrink-0 text-lime" aria-hidden="true" />
      <span className="truncate">{message}</span>
    </div>
  )
}
