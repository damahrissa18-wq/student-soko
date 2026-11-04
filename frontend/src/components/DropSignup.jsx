import { useState } from 'react'
import { ArrowRight, CheckCircle2, Loader2, Mail } from 'lucide-react'
import { subscribeToDrop } from '../lib/api'
import { trackEvent } from '../lib/analytics'

export default function DropSignup() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()

    const trimmed = email.trim()
    if (!trimmed || status === 'submitting') return

    setStatus('submitting')
    setMessage('')

    try {
      const data = await subscribeToDrop({
        email: trimmed,
        source: 'drop-signup',
      })
      setSubmitted(true)
      setStatus('success')
      setMessage(data.message)
      trackEvent('newsletter_signup', { source: 'drop-signup' })
    } catch (error) {
      setStatus('error')
      setMessage(error.message)
    }
  }

  return (
    <section className="px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-flame px-6 py-12 text-cream sm:rounded-[2.5rem] sm:px-10 sm:py-16 lg:px-14">
        <div
          className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-lime/30 blur-2xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-24 left-1/3 size-64 rounded-full bg-ink/20 blur-2xl"
          aria-hidden="true"
        />

        <div className="relative grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-14">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-cream/70">
              The drop list
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold leading-[1.02] tracking-tight sm:text-4xl lg:text-5xl">
              First dibs on the next drop.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-cream/80 sm:text-base">
              One email a week. New merch, restocks and campus pop-ups. No spam,
              ever — and you can leave whenever.
            </p>
          </div>

          <div>
            {submitted ? (
              <div
                className="flex items-start gap-3 rounded-2xl border border-cream/25 bg-ink/20 p-5"
                role="status"
              >
                <CheckCircle2
                  className="mt-0.5 size-6 shrink-0 text-lime"
                  aria-hidden="true"
                />
                <div>
                  <p className="font-display text-base font-semibold">
                    You're on the list.
                  </p>
                  <p className="mt-1 text-sm text-cream/75">
                    {message ||
                      "Watch your inbox on Friday — we'll send the drop link before it goes public."}
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <label htmlFor="drop-email" className="sr-only">
                  Email address
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="relative flex-1">
                    <Mail
                      className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-cream/50"
                      aria-hidden="true"
                    />
                    <input
                      id="drop-email"
                      type="email"
                      required
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value)
                        if (status === 'error') setStatus('idle')
                      }}
                      placeholder="you@student.ac.ke"
                      className="w-full rounded-full border border-cream/30 bg-cream/10 py-3.5 pl-11 pr-4 text-sm text-cream placeholder:text-cream/50 focus:border-lime focus:outline-none focus:ring-2 focus:ring-lime/60"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={status === 'submitting'}
                    className="group inline-flex items-center justify-center gap-2 rounded-full bg-lime px-6 py-3.5 text-sm font-bold text-ink transition hover:bg-cream disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {status === 'submitting' ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <ArrowRight
                        className="size-4 transition-transform group-hover:translate-x-1"
                        aria-hidden="true"
                      />
                    )}
                    {status === 'submitting' ? 'Joining...' : 'Join the list'}
                  </button>
                </div>
              </form>
            )}

            {status === 'error' && message && (
              <p
                role="alert"
                className="mt-3 rounded-xl bg-ink/25 px-3.5 py-2.5 text-[11px] font-medium text-cream"
              >
                {message}
              </p>
            )}

            <p className="mt-3 text-[11px] text-cream/60">
              One email a week. Unsubscribe in one click.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
