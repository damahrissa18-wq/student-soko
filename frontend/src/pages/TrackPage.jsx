import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  AlertCircle,
  CheckCircle2,
  Circle,
  Loader2,
  Mail,
  MapPin,
  Package,
  RefreshCw,
  Search,
  Truck,
} from 'lucide-react'
import Seo from '../components/Seo'
import { formatPrice } from '../data/products'
import { getOrder, lookupOrder, retryPayment } from '../lib/api'
import { getLastOrder, saveLastOrder } from '../lib/storage'
import { siteConfig, whatsappUrl } from '../config/site'

const FULFILLMENT_LABELS = {
  unfulfilled: 'Order received',
  processing: 'Being packed',
  shipped: 'On the way',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

const inputClass =
  'w-full rounded-xl border border-ink/15 bg-white/70 px-3.5 py-3 text-sm text-ink outline-none transition placeholder:text-smoke/50 focus:border-ink focus:ring-2 focus:ring-lime'

function formatDate(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('en-KE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Nairobi',
  }).format(new Date(value))
}

function timelineSteps(order) {
  const paid = order.status === 'paid'
  const status = order.fulfillmentStatus || 'unfulfilled'

  return [
    {
      key: 'placed',
      label: 'Order placed',
      detail: formatDate(order.createdAt),
      done: true,
    },
    {
      key: 'paid',
      label: paid ? 'Payment received' : 'Payment pending',
      detail: paid
        ? order.payment?.receiptNumber || 'M-Pesa confirmed'
        : 'Complete the M-Pesa prompt to secure your order.',
      done: paid,
    },
    {
      key: 'processing',
      label: 'Being packed',
      detail:
        ['processing', 'shipped', 'delivered'].includes(status) && paid
          ? 'We are checking and packing your pieces.'
          : 'Starts once your payment is confirmed.',
      done: ['processing', 'shipped', 'delivered'].includes(status) && paid,
    },
    {
      key: 'shipped',
      label: 'On the way',
      detail:
        status === 'shipped' || status === 'delivered'
          ? order.trackingNumber
            ? `Tracking: ${order.trackingNumber}`
            : 'Handed to our delivery team.'
          : 'Campus orders usually arrive within 24 hours.',
      done: ['shipped', 'delivered'].includes(status) && paid,
    },
    {
      key: 'delivered',
      label: 'Delivered',
      detail:
        status === 'delivered'
          ? 'Delivered. We hope it fits the campus era.'
          : 'We will email you when it lands.',
      done: status === 'delivered' && paid,
    },
  ]
}

function OrderDetails({ order, token, onRefresh }) {
  const [phone, setPhone] = useState(order.customer.phone)
  const [retrying, setRetrying] = useState(false)
  const [polling, setPolling] = useState(false)
  const [error, setError] = useState('')
  const pollTimers = useRef([])
  const paid = order.status === 'paid'
  const steps = timelineSteps(order)
  const whatsapp = whatsappUrl(
    `Hi StudentSoko! I need help with order ${order.id}.`,
  )

  useEffect(
    () => () => {
      pollTimers.current.forEach((timer) => window.clearTimeout(timer))
    },
    [],
  )

  const pollUntilSettled = useCallback(async () => {
    for (let attempt = 0; attempt < 30; attempt += 1) {
      await new Promise((resolve) => {
        const timer = window.setTimeout(resolve, 3000)
        pollTimers.current.push(timer)
      })

      try {
        const data = await getOrder(order.id, token)
        onRefresh(data.order)

        if (data.order.status === 'paid') {
          setPolling(false)
          setError('')
          return
        }

        if (data.order.status === 'payment_failed') {
          setPolling(false)
          setError(
            data.order.payment?.message ||
              'The M-Pesa payment was not completed. Try again.',
          )
          return
        }
      } catch {
        // Keep polling through transient network errors.
      }
    }

    setPolling(false)
    setError(
      "We haven't received M-Pesa confirmation yet. If you approved the payment, check your email for the receipt.",
    )
  }, [onRefresh, order.id, token])

  const handleRetry = async () => {
    if (retrying || polling) return
    setError('')

    if (phone.replace(/\D/g, '').length < 9) {
      setError('Enter the M-Pesa number, e.g. 0712 345 678.')
      return
    }

    setRetrying(true)

    try {
      const data = await retryPayment(order.id, token, phone)
      onRefresh(data.order)
      setPolling(true)
      setRetrying(false)
      pollUntilSettled()
    } catch (requestError) {
      setRetrying(false)
      setError(requestError.message)
      if (requestError.order) onRefresh(requestError.order)
    }
  }

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-6">
        <div className="rounded-3xl border border-ink/10 bg-white/70 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-smoke">
                Order
              </p>
              <p className="mt-1 font-display text-2xl font-bold tracking-tight">
                {order.id}
              </p>
            </div>
            <div className="text-right">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em] ${
                  order.fulfillmentStatus === 'cancelled'
                    ? 'bg-flame/10 text-flame'
                    : paid
                      ? 'bg-lime/50 text-ink'
                      : 'bg-sand text-ink'
                }`}
              >
                {paid ? <CheckCircle2 className="size-3" /> : <Circle className="size-3" />}
                {FULFILLMENT_LABELS[order.fulfillmentStatus] || 'Order received'}
              </span>
              <p className="mt-1.5 text-[11px] text-smoke">
                Placed {formatDate(order.createdAt)}
              </p>
            </div>
          </div>

          <ol className="mt-6 space-y-0">
            {steps.map((step, index) => (
              <li key={step.key} className="relative flex gap-3 pb-6 last:pb-0">
                {index < steps.length - 1 && (
                  <span
                    className={`absolute left-[11px] top-6 h-full w-0.5 ${
                      step.done ? 'bg-lime' : 'bg-ink/10'
                    }`}
                    aria-hidden="true"
                  />
                )}
                <span
                  className={`relative z-10 mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border-2 ${
                    step.done
                      ? 'border-ink bg-lime text-ink'
                      : 'border-ink/15 bg-cream text-smoke'
                  }`}
                >
                  {step.done ? (
                    <CheckCircle2 className="size-3.5" />
                  ) : (
                    <Circle className="size-2.5" />
                  )}
                </span>
                <div>
                  <p className="text-sm font-semibold">{step.label}</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-smoke">
                    {step.detail}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          {!paid && order.status !== 'cancelled' && (
            <div className="mt-5 rounded-2xl bg-sand/60 p-4">
              <p className="text-xs font-semibold">Payment not completed yet.</p>
              <p className="mt-1 text-[11px] leading-relaxed text-smoke">
                Your order is saved. Enter the M-Pesa number and we will send a
                new STK Push prompt.
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <input
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className={inputClass}
                  aria-label="M-Pesa phone number"
                  placeholder="0712 345 678"
                />
                <button
                  type="button"
                  onClick={handleRetry}
                  disabled={retrying || polling}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-ink px-5 py-3 text-xs font-semibold text-cream transition hover:bg-flame disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {retrying || polling ? (
                    <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <RefreshCw className="size-3.5" aria-hidden="true" />
                  )}
                  {polling ? 'Waiting for M-Pesa' : 'Resume payment'}
                </button>
              </div>
              {error && (
                <p className="mt-2 flex items-start gap-1.5 text-[11px] font-medium text-flame">
                  <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                  {error}
                </p>
              )}
            </div>
          )}

          {order.status === 'cancelled' && (
            <p className="mt-4 rounded-xl bg-flame/10 px-3.5 py-2.5 text-xs text-flame">
              This order was cancelled. Contact support if you have already paid.
            </p>
          )}
        </div>

        <div className="rounded-3xl border border-ink/10 bg-white/70 p-5 sm:p-6">
          <h2 className="flex items-center gap-2 font-display text-base font-bold">
            <Package className="size-4 text-flame" aria-hidden="true" />
            Your pieces
          </h2>
          <ul className="mt-4 divide-y divide-ink/10">
            {order.items.map((item, index) => (
              <li key={`${item.productId}-${item.size}-${index}`} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{item.name}</p>
                  <p className="mt-0.5 text-[11px] text-smoke">
                    {item.size ? `${item.size} · ` : ''}
                    {item.color?.name ? `${item.color.name} · ` : ''}
                    Qty {item.qty}
                  </p>
                </div>
                <p className="text-xs font-semibold">
                  {formatPrice(item.lineTotal)}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-4 space-y-1.5 border-t border-ink/10 pt-4 text-xs">
            <div className="flex justify-between text-smoke">
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-smoke">
              <span>Delivery</span>
              <span>
                {order.deliveryFee === 0
                  ? 'Free'
                  : formatPrice(order.deliveryFee)}
              </span>
            </div>
            <div className="flex justify-between pt-1.5 font-display text-base font-bold">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-3xl border border-ink/10 bg-white/70 p-5 sm:p-6">
          <h2 className="font-display text-base font-bold">Delivery details</h2>
          <div className="mt-4 space-y-3 text-sm">
            <p className="font-semibold">{order.customer.name}</p>
            <p className="flex gap-2 text-xs leading-relaxed text-smoke">
              <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              {order.customer.address}
            </p>
            <p className="flex gap-2 text-xs text-smoke">
              <Truck className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              {order.customer.phone}
            </p>
            <p className="flex gap-2 text-xs text-smoke">
              <Mail className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              {order.customer.email}
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-ink/10 bg-sand/50 p-5 text-xs leading-relaxed text-smoke sm:p-6">
          <h2 className="font-display text-sm font-bold text-ink">
            Need a hand?
          </h2>
          <p className="mt-2">
            Reply to your order email or message us with your order number and we
            will sort it out.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={`mailto:${siteConfig.email}?subject=${encodeURIComponent(`Order ${order.id}`)}`}
              className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 font-semibold text-cream transition hover:bg-flame"
            >
              <Mail className="size-3.5" aria-hidden="true" />
              Email support
            </a>
            {whatsapp && (
              <a
                href={whatsapp}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-ink/20 px-4 py-2.5 font-semibold text-ink transition hover:border-ink"
              >
                WhatsApp
              </a>
            )}
          </div>
        </div>

        <Link
          to="/#shop"
          className="block rounded-2xl border border-ink/15 px-4 py-3 text-center text-xs font-semibold transition hover:border-ink hover:bg-ink hover:text-cream"
        >
          Continue shopping
        </Link>
      </div>
    </div>
  )
}

export default function TrackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const orderParam = searchParams.get('order') ?? ''
  const tokenParam = searchParams.get('token') ?? ''
  const savedOrder = getLastOrder()

  const [form, setForm] = useState({
    orderId: orderParam || savedOrder?.id || '',
    email: savedOrder?.email || '',
  })
  const [order, setOrder] = useState(null)
  const [token, setToken] = useState('')
  const [status, setStatus] = useState(
    orderParam && tokenParam ? 'loading' : 'idle',
  )
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const loadOrder = useCallback((nextOrder) => {
    setOrder(nextOrder)
  }, [])

  useEffect(() => {
    if (!orderParam || !tokenParam) return

    let cancelled = false

    getOrder(orderParam, tokenParam)
      .then((data) => {
        if (cancelled) return
        setOrder(data.order)
        setToken(tokenParam)
        setStatus('loaded')
        saveLastOrder({
          id: data.order.id,
          token: tokenParam,
          email: data.order.customer.email,
          createdAt: data.order.createdAt,
        })
      })
      .catch((requestError) => {
        if (cancelled) return
        setStatus('error')
        setError(requestError.message)
      })

    return () => {
      cancelled = true
    }
  }, [orderParam, tokenParam])

  const handleLookup = async (event) => {
    event.preventDefault()
    if (status === 'loading') return

    const localErrors = {}
    if (!form.orderId.trim()) localErrors.orderId = 'Enter your order number.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      localErrors.email = 'Enter the email used at checkout.'
    }

    if (Object.keys(localErrors).length > 0) {
      setFieldErrors(localErrors)
      return
    }

    setFieldErrors({})
    setError('')
    setStatus('loading')

    try {
      const data = await lookupOrder({
        orderId: form.orderId.trim(),
        email: form.email.trim(),
      })
      setOrder(data.order)
      setToken(data.token)
      setStatus('loaded')
      saveLastOrder({
        id: data.order.id,
        token: data.token,
        email: data.order.customer.email,
        createdAt: data.order.createdAt,
      })
      navigate(
        `/track?order=${encodeURIComponent(data.order.id)}&token=${encodeURIComponent(data.token)}`,
        { replace: true },
      )
    } catch (requestError) {
      setStatus('error')
      setError(requestError.message)
      setFieldErrors(requestError.fields ?? {})
    }
  }

  if (status === 'loading' && !order) {
    return (
      <main className="px-4 py-24 text-center sm:px-6 lg:px-8">
        <Seo
          title="Tracking your order"
          description="Check your StudentSoko order status."
          path="/track"
          noindex
        />
        <Loader2
          className="mx-auto size-8 animate-spin text-flame"
          aria-hidden="true"
        />
        <p className="mt-4 text-sm text-smoke">Finding your order...</p>
      </main>
    )
  }

  return (
    <main className="px-4 pb-20 pt-10 sm:px-6 sm:pt-14 lg:px-8">
      <Seo
        title={order ? `Order ${order.id}` : 'Track your order'}
        description="Check payment, packing and delivery updates for your StudentSoko order."
        path="/track"
        noindex
      />

      <div className="mx-auto max-w-5xl">
        <div className="max-w-2xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-flame">
            Order tracking
          </p>
          <h1 className="mt-3 font-display text-4xl font-bold leading-[1.02] tracking-tight sm:text-5xl">
            Where's my order?
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-smoke sm:text-base">
            Use the order number and email from your confirmation, or open the
            private tracking link in your email.
          </p>
        </div>

        {!order && (
          <form
            onSubmit={handleLookup}
            className="mt-8 rounded-3xl border border-ink/10 bg-white/70 p-5 sm:p-7"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="track-order"
                  className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-smoke"
                >
                  Order number
                </label>
                <input
                  id="track-order"
                  value={form.orderId}
                  onChange={(event) => {
                    setForm((current) => ({
                      ...current,
                      orderId: event.target.value,
                    }))
                    setFieldErrors((current) => {
                      const next = { ...current }
                      delete next.orderId
                      return next
                    })
                  }}
                  placeholder="SS-ABC123"
                  className={inputClass}
                />
                {fieldErrors.orderId && (
                  <p className="mt-1.5 text-[11px] font-medium text-flame">
                    {fieldErrors.orderId}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="track-email"
                  className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-smoke"
                >
                  Email used at checkout
                </label>
                <input
                  id="track-email"
                  type="email"
                  value={form.email}
                  onChange={(event) => {
                    setForm((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                    setFieldErrors((current) => {
                      const next = { ...current }
                      delete next.email
                      return next
                    })
                  }}
                  placeholder="you@student.ac.ke"
                  className={inputClass}
                />
                {fieldErrors.email && (
                  <p className="mt-1.5 text-[11px] font-medium text-flame">
                    {fieldErrors.email}
                  </p>
                )}
              </div>
            </div>

            {error && (
              <p className="mt-3 flex items-start gap-2 rounded-xl bg-flame/10 px-3.5 py-2.5 text-[11px] font-medium text-flame">
                <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-cream transition hover:bg-flame disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === 'loading' ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Search className="size-4" aria-hidden="true" />
              )}
              Find my order
            </button>
          </form>
        )}

        {order && (
          <>
            <OrderDetails order={order} token={token} onRefresh={loadOrder} />
            <button
              type="button"
              onClick={() => {
                setOrder(null)
                setToken('')
                setStatus('idle')
                setError('')
                navigate('/track', { replace: true })
              }}
              className="mt-6 text-xs font-semibold text-smoke underline-offset-4 transition hover:text-ink hover:underline"
            >
              Look up a different order
            </button>
          </>
        )}

        {!order && error && status === 'error' && (
          <p className="mt-4 text-xs text-smoke">
            Tip: your order number starts with SS- and is in your confirmation
            email. Still stuck?{' '}
            <a href={`mailto:${siteConfig.email}`} className="font-semibold text-flame">
              Contact support
            </a>
            .
          </p>
        )}
      </div>
    </main>
  )
}
