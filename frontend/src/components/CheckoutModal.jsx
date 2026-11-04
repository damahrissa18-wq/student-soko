import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Lock,
  Mail,
  RefreshCw,
  Smartphone,
  X,
} from 'lucide-react'
import { formatPrice } from '../data/products'
import { FREE_DELIVERY_AT, getDeliveryFee } from '../data/shop'
import { createOrder, getOrder, retryPayment } from '../lib/api'
import { saveLastOrder } from '../lib/storage'
import { trackEvent } from '../lib/analytics'

const POLL_INTERVAL = 3000
const MAX_POLL_ATTEMPTS = 40

const INITIAL_FORM = { name: '', email: '', phone: '', address: '' }

const inputClass = (hasError) =>
  `w-full rounded-xl border bg-white/70 px-3.5 py-3 text-sm text-ink outline-none transition placeholder:text-smoke/50 focus:border-ink focus:ring-2 focus:ring-lime ${
    hasError ? 'border-flame ring-2 ring-flame/15' : 'border-ink/15'
  }`

function Field({ id, label, hint, error, children }) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-smoke"
      >
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-[11px] font-medium text-flame">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-[11px] text-smoke">{hint}</p>
      ) : null}
    </div>
  )
}

function EmailNotice({ status, email, receipt = false }) {
  if (!status) return null

  const content =
    status.status === 'logged'
      ? 'Demo mode: emails are logged to the server console instead of delivered.'
      : status.status === 'failed'
        ? receipt
          ? `We could not send the payment receipt to ${email}. Your payment is still confirmed.`
          : `We could not send the confirmation email to ${email}. Your order is still confirmed.`
        : status.status === 'pending'
          ? `Payment receipt is on its way to ${email}.`
          : receipt
            ? `Payment receipt sent to ${email}.`
            : `Order confirmation sent to ${email}.`

  return (
    <div
      className={`mt-5 flex max-w-md items-start gap-2 rounded-xl px-3.5 py-2.5 text-left text-[11px] leading-relaxed ${
        status.status === 'failed'
          ? 'bg-flame/10 text-flame'
          : 'bg-sand/70 text-smoke'
      }`}
    >
      <Mail className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
      <span>{content}</span>
    </div>
  )
}

function OrderSummary({ items }) {
  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.qty,
    0,
  )
  const deliveryFee = getDeliveryFee(subtotal)
  const count = items.reduce((sum, item) => sum + item.qty, 0)

  return (
    <aside className="rounded-2xl border border-ink/10 bg-sand/40 p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-bold">Your bag</h3>
        <span className="text-[11px] font-semibold text-smoke">
          {count} {count === 1 ? 'piece' : 'pieces'}
        </span>
      </div>

      <ul className="mt-3 space-y-3">
        {items.map(({ key, product, qty, size, color }) => (
          <li key={key} className="flex items-center gap-3">
            <img
              src={product.image}
              alt=""
              className="h-14 w-12 shrink-0 rounded-lg object-cover"
              loading="lazy"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-xs font-semibold">
                {product.name}
              </p>
              <p className="mt-0.5 text-[11px] text-smoke">
                {size} · {color.name} · Qty {qty}
              </p>
            </div>
            <p className="shrink-0 text-xs font-bold">
              {formatPrice(product.price * qty)}
            </p>
          </li>
        ))}
      </ul>

      <div className="mt-4 space-y-2 border-t border-ink/10 pt-4 text-sm">
        <div className="flex items-center justify-between text-xs">
          <span className="text-smoke">Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-smoke">Delivery</span>
          <span>
            {deliveryFee === 0 ? (
              <span className="font-semibold text-flame">Free</span>
            ) : (
              formatPrice(deliveryFee)
            )}
          </span>
        </div>
        <p className="text-[11px] text-smoke">
          Free campus delivery over {formatPrice(FREE_DELIVERY_AT)}.
        </p>
        <div className="flex items-center justify-between border-t border-ink/10 pt-3">
          <span className="font-semibold">Total</span>
          <span className="font-display text-lg font-bold">
            {formatPrice(subtotal + deliveryFee)}
          </span>
        </div>
      </div>
    </aside>
  )
}

export default function CheckoutModal({ items, onClose, onPaid }) {
  const [form, setForm] = useState(INITIAL_FORM)
  const [stage, setStage] = useState('form')
  const [submitting, setSubmitting] = useState(false)
  const [retrying, setRetrying] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [order, setOrder] = useState(null)
  const [token, setToken] = useState('')
  const [paymentMode, setPaymentMode] = useState('mpesa')
  const [emailStatus, setEmailStatus] = useState(null)
  const paidNotified = useRef(false)

  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.qty,
    0,
  )
  const deliveryFee = getDeliveryFee(subtotal)
  const total = subtotal + deliveryFee
  const isWaiting = stage === 'waiting'
  const canClose = !submitting && !isWaiting

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !isWaiting && !submitting) onClose()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isWaiting, submitting, onClose])

  useEffect(() => {
    if (stage !== 'waiting' || !order?.id || !token) return

    let cancelled = false
    let timerId = null
    let attempts = 0

    const poll = async () => {
      try {
        const data = await getOrder(order.id, token)
        if (cancelled) return

        setOrder(data.order)

        if (data.order.status === 'paid') {
          setStage('paid')
          if (!paidNotified.current) {
            paidNotified.current = true
            trackEvent('purchase', {
              value: data.order.total,
              currency: 'KES',
            })
            onPaid?.()
          }
          return
        }

        if (data.order.status === 'payment_failed') {
          setStage('failed')
          setError(
            data.order.payment?.message ||
              'The M-Pesa payment was not completed. Please try again.',
          )
          return
        }
      } catch {
        // Ignore transient polling errors and keep trying.
      }

      attempts += 1

      if (attempts >= MAX_POLL_ATTEMPTS) {
        setStage('failed')
        setError(
          "We haven't received M-Pesa confirmation yet. If you approved the payment, check your email for the receipt. Otherwise, try the payment again.",
        )
        return
      }

      timerId = window.setTimeout(poll, POLL_INTERVAL)
    }

    timerId = window.setTimeout(poll, 2500)

    return () => {
      cancelled = true
      window.clearTimeout(timerId)
    }
  }, [stage, order?.id, token, onPaid])

  const updateField = (field) => (event) => {
    const { value } = event.target
    setForm((current) => ({ ...current, [field]: value }))
    setFieldErrors((current) => {
      if (!current[field]) return current
      const next = { ...current }
      delete next[field]
      return next
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (submitting) return

    const customer = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
    }

    const localErrors = {}

    if (customer.name.length < 2) {
      localErrors.name = 'Enter your full name.'
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
      localErrors.email = 'Enter a valid email address.'
    }

    if (customer.phone.replace(/\D/g, '').length < 9) {
      localErrors.phone = 'Enter the M-Pesa number, e.g. 0712 345 678.'
    }

    if (customer.address.length < 5) {
      localErrors.address = 'Add your hostel, hall or delivery address.'
    }

    if (Object.keys(localErrors).length > 0) {
      setFieldErrors(localErrors)
      return
    }

    setSubmitting(true)
    setError('')
    setFieldErrors({})

    try {
      const data = await createOrder({
        customer,
        items: items.map(({ product, qty, size, color }) => ({
          id: product.id,
          size,
          color: color.name,
          qty,
        })),
      })

      setOrder(data.order)
      setToken(data.token)
      setPaymentMode(data.payment?.mode ?? 'mpesa')
      setEmailStatus(data.email ?? null)
      saveLastOrder({
        id: data.order.id,
        token: data.token,
        email: data.order.customer.email,
        createdAt: new Date().toISOString(),
      })

      if (data.order.status === 'paid') {
        setStage('paid')
        if (!paidNotified.current) {
          paidNotified.current = true
          trackEvent('purchase', {
            value: data.order.total,
            currency: 'KES',
          })
          onPaid?.()
        }
      } else if (data.order.status === 'payment_failed') {
        setStage('failed')
        setError(
          data.order.payment?.message ||
            data.payment?.message ||
            'We could not start the M-Pesa payment. Please try again.',
        )
      } else {
        setStage('waiting')
      }
    } catch (requestError) {
      setError(requestError.message)
      setFieldErrors(requestError.fields ?? {})
    } finally {
      setSubmitting(false)
    }
  }

  const handleRetry = async () => {
    if (!order || retrying) return

    if (form.phone.replace(/\D/g, '').length < 9) {
      setError('Enter the M-Pesa number, e.g. 0712 345 678.')
      return
    }

    setRetrying(true)
    setError('')

    try {
      const data = await retryPayment(order.id, token, form.phone.trim())
      setOrder(data.order)
      setPaymentMode(data.payment?.mode ?? paymentMode)

      if (data.order.status === 'paid') {
        setStage('paid')
        if (!paidNotified.current) {
          paidNotified.current = true
          trackEvent('purchase', {
            value: data.order.total,
            currency: 'KES',
          })
          onPaid?.()
        }
      } else {
        setStage('waiting')
      }
    } catch (requestError) {
      if (requestError.order) setOrder(requestError.order)
      setError(requestError.message)
      setStage('failed')
    } finally {
      setRetrying(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[80]">
      <button
        type="button"
        onClick={canClose ? onClose : undefined}
        className="absolute inset-0 h-full w-full cursor-default bg-ink/55 backdrop-blur-sm"
        aria-label="Close checkout"
        tabIndex={canClose ? 0 : -1}
      />

      <div className="pointer-events-none absolute inset-0 flex items-end justify-center sm:items-center sm:p-6">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="checkout-title"
          className="pointer-events-auto relative flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl bg-cream shadow-2xl sm:rounded-3xl"
        >
          <div className="flex items-start justify-between border-b border-ink/10 px-5 py-4 sm:px-7">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-flame">
                Secure checkout
              </p>
              <h2
                id="checkout-title"
                className="mt-1 font-display text-xl font-bold"
              >
                {stage === 'paid'
                  ? 'Payment received'
                  : stage === 'waiting'
                    ? 'Confirm on your phone'
                    : 'Complete your order'}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={!canClose}
              className="grid size-9 shrink-0 place-items-center rounded-full border border-ink/15 transition hover:bg-ink hover:text-cream disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-ink"
              aria-label="Close checkout"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {stage === 'form' && (
              <div className="grid gap-6 px-5 py-5 sm:px-7 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8 lg:py-6">
                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      id="checkout-name"
                      label="Full name"
                      error={fieldErrors.name}
                    >
                      <input
                        id="checkout-name"
                        type="text"
                        autoComplete="name"
                        value={form.name}
                        onChange={updateField('name')}
                        placeholder="Amina Otieno"
                        className={inputClass(fieldErrors.name)}
                        required
                      />
                    </Field>

                    <Field
                      id="checkout-phone"
                      label="M-Pesa number"
                      hint="The STK prompt goes to this number."
                      error={fieldErrors.phone}
                    >
                      <input
                        id="checkout-phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        value={form.phone}
                        onChange={updateField('phone')}
                        placeholder="0712 345 678"
                        className={inputClass(fieldErrors.phone)}
                        required
                      />
                    </Field>
                  </div>

                  <Field
                    id="checkout-email"
                    label="Email address"
                    hint="We send the order confirmation and M-Pesa receipt here."
                    error={fieldErrors.email}
                  >
                    <input
                      id="checkout-email"
                      type="email"
                      autoComplete="email"
                      value={form.email}
                      onChange={updateField('email')}
                      placeholder="you@studentsoko.co.ke"
                      className={inputClass(fieldErrors.email)}
                      required
                    />
                  </Field>

                  <Field
                    id="checkout-address"
                    label="Delivery address"
                    error={fieldErrors.address}
                  >
                    <textarea
                      id="checkout-address"
                      rows={3}
                      autoComplete="street-address"
                      value={form.address}
                      onChange={updateField('address')}
                      placeholder="Hostel or hall, room number, campus / estate"
                      className={`${inputClass(fieldErrors.address)} resize-none`}
                      required
                    />
                  </Field>

                  {error && (
                    <div
                      role="alert"
                      className="flex items-start gap-2 rounded-xl bg-flame/10 px-3.5 py-3 text-xs font-medium text-flame"
                    >
                      <AlertCircle
                        className="mt-0.5 size-4 shrink-0"
                        aria-hidden="true"
                      />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="rounded-2xl border border-ink/10 bg-sand/50 p-4">
                    <p className="flex items-start gap-2 text-[11px] leading-relaxed text-smoke">
                      <Lock
                        className="mt-0.5 size-3.5 shrink-0 text-flame"
                        aria-hidden="true"
                      />
                      <span>
                        You'll get an order confirmation email right away, then
                        a payment receipt as soon as M-Pesa confirms. Enter your
                        PIN only in the official M-Pesa prompt.
                      </span>
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3.5 text-sm font-semibold text-cream transition hover:bg-flame disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {submitting ? (
                      <Loader2
                        className="size-4 animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <Smartphone className="size-4" aria-hidden="true" />
                    )}
                    {submitting
                      ? 'Placing your order...'
                      : `Pay ${formatPrice(total)} with M-Pesa`}
                    {!submitting && (
                      <ArrowRight className="size-4" aria-hidden="true" />
                    )}
                  </button>
                </form>

                <div className="lg:sticky lg:top-0 lg:self-start">
                  <OrderSummary items={items} />
                </div>
              </div>
            )}

            {stage === 'waiting' && (
              <div className="flex flex-col items-center px-5 py-10 text-center sm:px-10 sm:py-14">
                <span className="grid size-20 place-items-center rounded-full bg-lime">
                  <Smartphone className="size-9" aria-hidden="true" />
                </span>
                <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.18em] text-flame">
                  M-Pesa payment
                </p>
                <h3 className="mt-2 font-display text-2xl font-bold sm:text-3xl">
                  Check your phone
                </h3>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-smoke">
                  We sent a payment request for{' '}
                  <strong className="text-ink">{formatPrice(order?.total)}</strong>{' '}
                  to{' '}
                  <strong className="text-ink">
                    {order?.payment?.phoneNumber || form.phone}
                  </strong>
                  . Enter your M-Pesa PIN to confirm order{' '}
                  <strong className="text-ink">{order?.id}</strong>.
                </p>
                <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-xs font-semibold text-cream">
                  <Loader2
                    className="size-4 animate-spin text-lime"
                    aria-hidden="true"
                  />
                  Waiting for confirmation
                </div>
                <p className="mt-4 max-w-sm text-[11px] leading-relaxed text-smoke">
                  Payment usually confirms in under a minute. Keep this window
                  open — your receipt will be emailed to{' '}
                  {order?.customer?.email}.
                </p>

                {paymentMode === 'mock' && (
                  <p className="mt-4 max-w-sm rounded-xl bg-lime/40 px-3.5 py-2.5 text-[11px] leading-relaxed text-ink">
                    Sandbox mode: this payment auto-confirms in a few seconds. No
                    real money moves.
                  </p>
                )}

                <EmailNotice
                  status={emailStatus}
                  email={order?.customer?.email}
                />

                <button
                  type="button"
                  onClick={handleRetry}
                  disabled={retrying}
                  className="mt-5 inline-flex items-center gap-2 rounded-full border border-ink/20 px-5 py-2.5 text-xs font-semibold transition hover:border-ink hover:bg-ink hover:text-cream disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw
                    className={`size-3.5 ${retrying ? 'animate-spin' : ''}`}
                    aria-hidden="true"
                  />
                  {retrying ? 'Sending...' : 'Resend the prompt'}
                </button>
              </div>
            )}

            {stage === 'paid' && (
              <div className="flex flex-col items-center px-5 py-10 text-center sm:px-10 sm:py-14">
                <span className="grid size-20 place-items-center rounded-full bg-lime">
                  <CheckCircle2 className="size-9" aria-hidden="true" />
                </span>
                <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.18em] text-flame">
                  Payment received
                </p>
                <h3 className="mt-2 font-display text-2xl font-bold sm:text-3xl">
                  You're all set.
                </h3>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-smoke">
                  We received{' '}
                  <strong className="text-ink">
                    {formatPrice(order?.total)}
                  </strong>{' '}
                  for order <strong className="text-ink">{order?.id}</strong>.
                  Your receipt is on its way to{' '}
                  <strong className="text-ink">{order?.customer?.email}</strong>.
                </p>

                <div className="mt-7 w-full max-w-sm rounded-2xl border border-ink/10 bg-sand/40 p-4 text-left">
                  <div className="flex items-center justify-between gap-4 text-xs">
                    <span className="text-smoke">Order</span>
                    <span className="font-semibold">{order?.id}</span>
                  </div>
                  <div className="mt-2.5 flex items-center justify-between gap-4 text-xs">
                    <span className="text-smoke">
                      {paymentMode === 'mock' ? 'Sandbox receipt' : 'M-Pesa receipt'}
                    </span>
                    <span className="font-semibold">
                      {order?.payment?.receiptNumber || 'Processing'}
                    </span>
                  </div>
                  <div className="mt-2.5 flex items-center justify-between gap-4 text-xs">
                    <span className="text-smoke">Total paid</span>
                    <span className="font-display text-base font-bold">
                      {formatPrice(order?.total)}
                    </span>
                  </div>
                </div>

                <EmailNotice
                  status={
                    order?.emails?.paymentReceiptSentAt
                      ? {
                          status:
                            emailStatus?.status === 'logged' ? 'logged' : 'sent',
                        }
                      : { status: 'pending' }
                  }
                  email={order?.customer?.email}
                  receipt
                />

                <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row">
                  <Link
                    to={`/track?order=${encodeURIComponent(order?.id ?? '')}&token=${encodeURIComponent(token)}`}
                    onClick={onClose}
                    className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-cream transition hover:bg-flame"
                  >
                    Track this order
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex items-center gap-2 rounded-full border border-ink/20 px-6 py-3 text-sm font-semibold text-ink transition hover:border-ink hover:bg-ink hover:text-cream"
                  >
                    Back to shopping
                  </button>
                </div>
              </div>
            )}

            {stage === 'failed' && (
              <div className="flex flex-col items-center px-5 py-10 text-center sm:px-10 sm:py-14">
                <span className="grid size-20 place-items-center rounded-full bg-flame/10 text-flame">
                  <AlertCircle className="size-9" aria-hidden="true" />
                </span>
                <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.18em] text-flame">
                  Payment not completed
                </p>
                <h3 className="mt-2 font-display text-2xl font-bold sm:text-3xl">
                  Let's try that again.
                </h3>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-smoke">
                  {error ||
                    'The M-Pesa payment was not completed. Your order is saved — you can retry the payment below.'}
                </p>
                {order?.id && (
                  <p className="mt-2 text-[11px] text-smoke">
                    Order <strong className="text-ink">{order.id}</strong> is
                    still reserved. If money left your account, your receipt will
                    still arrive by email.
                  </p>
                )}

                <div className="mt-6 w-full max-w-sm rounded-2xl border border-ink/10 bg-sand/40 p-4 text-left">
                  <Field
                    id="checkout-retry-phone"
                    label="M-Pesa number"
                    hint="Use a different number here if the first one was wrong."
                  >
                    <input
                      id="checkout-retry-phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      value={form.phone}
                      onChange={updateField('phone')}
                      placeholder="0712 345 678"
                      className={inputClass(false)}
                    />
                  </Field>
                  <button
                    type="button"
                    onClick={handleRetry}
                    disabled={retrying}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3 text-sm font-semibold text-cream transition hover:bg-flame disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {retrying ? (
                      <Loader2
                        className="size-4 animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <RefreshCw className="size-4" aria-hidden="true" />
                    )}
                    {retrying ? 'Sending prompt...' : 'Try M-Pesa again'}
                  </button>
                </div>

                <EmailNotice
                  status={emailStatus}
                  email={order?.customer?.email}
                />

                <button
                  type="button"
                  onClick={onClose}
                  className="mt-5 text-xs font-semibold text-smoke underline-offset-4 transition hover:text-ink hover:underline"
                >
                  Close checkout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
