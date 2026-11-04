import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react'
import Seo from '../components/Seo'
import { unsubscribeFromDrop } from '../lib/api'

export default function UnsubscribePage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [status, setStatus] = useState(token ? 'loading' : 'missing')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) return

    let cancelled = false

    unsubscribeFromDrop(token)
      .then((data) => {
        if (cancelled) return
        setStatus('success')
        setMessage(data.message)
      })
      .catch((error) => {
        if (cancelled) return
        setStatus('error')
        setMessage(error.message)
      })

    return () => {
      cancelled = true
    }
  }, [token])

  return (
    <main className="px-4 py-24 sm:px-6 lg:px-8">
      <Seo
        title="Unsubscribe"
        description="Manage your StudentSoko drop-list subscription."
        path="/unsubscribe"
        noindex
      />
      <div className="mx-auto max-w-md rounded-3xl border border-ink/10 bg-white/70 p-7 text-center">
        {status === 'loading' && (
          <>
            <Loader2
              className="mx-auto size-9 animate-spin text-flame"
              aria-hidden="true"
            />
            <h1 className="mt-5 font-display text-2xl font-bold">
              Removing you...
            </h1>
            <p className="mt-2 text-sm text-smoke">
              Updating your drop-list preference.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <span className="mx-auto grid size-16 place-items-center rounded-full bg-lime">
              <CheckCircle2 className="size-8" aria-hidden="true" />
            </span>
            <h1 className="mt-5 font-display text-2xl font-bold">
              You're off the list.
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-smoke">{message}</p>
            <p className="mt-2 text-xs leading-relaxed text-smoke">
              Order confirmations and receipts will still be emailed if you shop
              with us again.
            </p>
          </>
        )}

        {(status === 'error' || status === 'missing') && (
          <>
            <span className="mx-auto grid size-16 place-items-center rounded-full bg-flame/10 text-flame">
              <AlertCircle className="size-8" aria-hidden="true" />
            </span>
            <h1 className="mt-5 font-display text-2xl font-bold">
              {status === 'missing'
                ? 'This link is missing a token.'
                : 'We could not update that.'}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-smoke">
              {message ||
                'Open the unsubscribe link from a StudentSoko email, or reply to one of our emails and we will remove you manually.'}
            </p>
          </>
        )}

        <Link
          to="/"
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-cream transition hover:bg-flame"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to the shop
        </Link>
      </div>
    </main>
  )
}
