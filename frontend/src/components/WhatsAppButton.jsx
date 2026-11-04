import { MessageCircle } from 'lucide-react'
import { whatsappUrl } from '../config/site'

export default function WhatsAppButton() {
  const href = whatsappUrl()

  if (!href) return null

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with StudentSoko on WhatsApp"
      className="fixed bottom-5 right-5 z-40 grid size-13 place-items-center rounded-full bg-lime text-ink shadow-[0_5px_0_0_#121212] transition hover:-translate-y-0.5 hover:bg-cream focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
    >
      <MessageCircle className="size-6" aria-hidden="true" />
    </a>
  )
}
