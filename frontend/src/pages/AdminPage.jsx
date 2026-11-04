import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  Boxes,
  CheckCircle2,
  Loader2,
  LogOut,
  Package,
  RefreshCw,
  Search,
  ShoppingBag,
  Users,
} from 'lucide-react'
import Seo from '../components/Seo'
import { formatPrice } from '../data/products'
import { adminApi } from '../lib/api'

const TOKEN_KEY = 'studentsoko.adminToken'
const FULFILLMENT_OPTIONS = [
  ['unfulfilled', 'Unfulfilled'],
  ['processing', 'Processing'],
  ['shipped', 'Shipped'],
  ['delivered', 'Delivered'],
  ['cancelled', 'Cancelled'],
]

const inputClass =
  'w-full rounded-xl border border-ink/15 bg-white/70 px-3 py-2.5 text-xs text-ink outline-none transition placeholder:text-smoke/50 focus:border-ink focus:ring-2 focus:ring-lime'

function formatDate(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-KE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Nairobi',
  }).format(new Date(value))
}

function StatCard({ label, value, hint, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white/70 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-smoke">
          {label}
        </p>
        {Icon && <Icon className="size-4 text-flame" aria-hidden="true" />}
      </div>
      <p className="mt-2 font-display text-2xl font-bold tracking-tight">{value}</p>
      {hint && <p className="mt-0.5 text-[10px] text-smoke">{hint}</p>}
    </div>
  )
}

function Login({ onLogin }) {
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!token.trim() || loading) return

    setLoading(true)
    setError('')

    try {
      await adminApi.ping(token.trim())
      sessionStorage.setItem(TOKEN_KEY, token.trim())
      onLogin(token.trim())
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:py-24">
      <Seo
        title="Admin"
        description="StudentSoko admin dashboard."
        path="/admin"
        noindex
      />
      <div className="rounded-3xl border border-ink/10 bg-white/70 p-6 sm:p-8">
        <span className="grid size-12 place-items-center rounded-2xl bg-ink text-lime">
          <ShoppingBag className="size-5" aria-hidden="true" />
        </span>
        <h1 className="mt-5 font-display text-3xl font-bold tracking-tight">
          Store admin
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-smoke">
          Enter the admin token from the backend environment. It is kept in this
          browser tab only.
        </p>

        <form onSubmit={handleSubmit} className="mt-6">
          <label
            htmlFor="admin-token"
            className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-smoke"
          >
            Admin token
          </label>
          <input
            id="admin-token"
            type="password"
            autoComplete="current-password"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder="ADMIN_TOKEN"
            className={inputClass}
          />
          {error && (
            <p className="mt-2 flex items-start gap-1.5 text-[11px] font-medium text-flame">
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3 text-sm font-semibold text-cream transition hover:bg-flame disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {loading ? 'Checking...' : 'Open dashboard'}
          </button>
        </form>

        {import.meta.env.DEV && (
          <p className="mt-4 text-[10px] leading-relaxed text-smoke">
            Development fallback: <code>dev-admin-token</code>. Always set a
            private <code>ADMIN_TOKEN</code> in production.
          </p>
        )}
      </div>
    </div>
  )
}

function OrdersPanel({ orders, onChanged }) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [drafts, setDrafts] = useState({})
  const [savingId, setSavingId] = useState(null)
  const [notice, setNotice] = useState(null)

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase()

    return orders.filter((order) => {
      if (statusFilter && order.status !== statusFilter) return false
      if (!search) return true

      return [
        order.id,
        order.customer?.name,
        order.customer?.email,
        order.customer?.phone,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search))
    })
  }, [orders, query, statusFilter])

  const getDraft = (order) =>
    drafts[order.id] ?? {
      fulfillmentStatus: order.fulfillmentStatus ?? 'unfulfilled',
      trackingNumber: order.trackingNumber ?? '',
    }

  const updateDraft = (order, field, value) => {
    setDrafts((current) => ({
      ...current,
      [order.id]: { ...getDraft(order), [field]: value },
    }))
  }

  const saveOrder = async (order) => {
    if (savingId) return
    const draft = getDraft(order)
    setSavingId(order.id)
    setNotice(null)

    try {
      const data = await onChanged('updateOrder', order.id, {
        fulfillmentStatus: draft.fulfillmentStatus,
        trackingNumber: draft.trackingNumber,
      })

      setDrafts((current) => {
        const next = { ...current }
        delete next[order.id]
        return next
      })
      setNotice({
        type: 'success',
        text: `Order ${order.id} updated.${
          data.email?.message ? ` ${data.email.message}` : ''
        }`,
      })
    } catch (error) {
      setNotice({ type: 'error', text: error.message })
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-smoke"
              aria-hidden="true"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search order, name, email or phone"
              className={`${inputClass} pl-9`}
              aria-label="Search orders"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className={`${inputClass} sm:w-48`}
            aria-label="Filter by payment status"
          >
            <option value="">All payments</option>
            <option value="paid">Paid</option>
            <option value="pending_payment">Pending payment</option>
            <option value="payment_failed">Payment failed</option>
          </select>
        </div>
        <p className="text-[11px] text-smoke">
          {filtered.length} of {orders.length} orders
        </p>
      </div>

      {notice && (
        <p
          className={`mt-3 rounded-xl px-3.5 py-2.5 text-[11px] font-medium ${
            notice.type === 'error'
              ? 'bg-flame/10 text-flame'
              : 'bg-lime/50 text-ink'
          }`}
        >
          {notice.text}
        </p>
      )}

      <div className="mt-4 space-y-3">
        {filtered.length === 0 && (
          <p className="rounded-2xl border border-ink/10 bg-white/60 p-6 text-center text-xs text-smoke">
            No orders match this view.
          </p>
        )}

        {filtered.map((order) => {
          const draft = getDraft(order)
          const saving = savingId === order.id

          return (
            <article
              key={order.id}
              className="rounded-2xl border border-ink/10 bg-white/70 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-sm font-bold">{order.id}</h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] ${
                        order.status === 'paid'
                          ? 'bg-lime/60 text-ink'
                          : order.status === 'payment_failed'
                            ? 'bg-flame/10 text-flame'
                            : 'bg-sand text-ink'
                      }`}
                    >
                      {order.status.replace('_', ' ')}
                    </span>
                    <span className="rounded-full bg-ink px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-cream">
                      {order.fulfillmentStatus ?? 'unfulfilled'}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-smoke">
                    {order.customer.name} · {order.customer.email} ·{' '}
                    {order.customer.phone}
                  </p>
                  <p className="mt-0.5 text-[10px] text-smoke">
                    {formatDate(order.createdAt)} · {order.customer.address}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-base font-bold">
                    {formatPrice(order.total)}
                  </p>
                  <p className="text-[10px] text-smoke">
                    {order.payment?.receiptNumber || 'No receipt yet'}
                  </p>
                </div>
              </div>

              <div className="mt-3 grid gap-2 border-t border-ink/10 pt-3 text-[11px] sm:grid-cols-2">
                <div>
                  <p className="font-semibold text-ink">Items</p>
                  <ul className="mt-1 space-y-0.5 text-smoke">
                    {order.items.map((item, index) => (
                      <li key={`${item.productId}-${item.size}-${index}`}>
                        {item.qty} × {item.name}
                        {item.size ? ` · ${item.size}` : ''}
                        {item.color?.name ? ` · ${item.color.name}` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-[9px] font-bold uppercase tracking-[0.12em] text-smoke">
                      Fulfilment
                    </span>
                    <select
                      value={draft.fulfillmentStatus}
                      onChange={(event) =>
                        updateDraft(order, 'fulfillmentStatus', event.target.value)
                      }
                      className={inputClass}
                    >
                      {FULFILLMENT_OPTIONS.map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[9px] font-bold uppercase tracking-[0.12em] text-smoke">
                      Tracking number
                    </span>
                    <input
                      value={draft.trackingNumber}
                      onChange={(event) =>
                        updateDraft(order, 'trackingNumber', event.target.value)
                      }
                      placeholder="Optional"
                      className={inputClass}
                    />
                  </label>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-[10px] text-smoke">
                  {order.emails?.shippedEmailSentAt
                    ? `Shipping email sent ${formatDate(order.emails.shippedEmailSentAt)}`
                    : 'Shipping email goes out when you mark it shipped.'}
                </p>
                <button
                  type="button"
                  onClick={() => saveOrder(order)}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-[11px] font-semibold text-cream transition hover:bg-flame disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2 className="size-3 animate-spin" aria-hidden="true" />
                  ) : (
                    <CheckCircle2 className="size-3" aria-hidden="true" />
                  )}
                  {saving ? 'Saving...' : 'Save order'}
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}

function InventoryPanel({ inventory, lowStockThreshold, onSave }) {
  const [values, setValues] = useState({})
  const [savingKey, setSavingKey] = useState('')
  const [notice, setNotice] = useState(null)

  const keyFor = (productId, size) => `${productId}::${size}`

  const saveStock = async (productId, size, currentStock) => {
    const key = keyFor(productId, size)
    const raw = values[key]
    const quantity = Number(raw)

    if (raw === undefined || String(raw).trim() === '') return
    if (!Number.isInteger(quantity) || quantity < 0) {
      setNotice({ type: 'error', text: 'Stock must be a whole number.' })
      return
    }

    if (quantity === currentStock) return

    setSavingKey(key)
    setNotice(null)

    try {
      await onSave({ productId, size, stock: quantity })
      setValues((current) => {
        const next = { ...current }
        delete next[key]
        return next
      })
      setNotice({ type: 'success', text: `${size} stock updated.` })
    } catch (error) {
      setNotice({ type: 'error', text: error.message })
    } finally {
      setSavingKey('')
    }
  }

  return (
    <div>
      <p className="text-xs text-smoke">
        Low-stock alert threshold: {lowStockThreshold}. Changes are saved to the
        inventory store immediately.
      </p>
      {notice && (
        <p
          className={`mt-3 rounded-xl px-3.5 py-2.5 text-[11px] font-medium ${
            notice.type === 'error'
              ? 'bg-flame/10 text-flame'
              : 'bg-lime/50 text-ink'
          }`}
        >
          {notice.text}
        </p>
      )}

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {inventory.map((product) => (
          <div
            key={product.id}
            className="rounded-2xl border border-ink/10 bg-white/70 p-4"
          >
            <div className="flex items-center gap-3">
              <img
                src={product.image}
                alt=""
                className="size-11 rounded-xl object-cover"
              />
              <div className="min-w-0">
                <p className="truncate font-display text-sm font-bold">
                  {product.name}
                </p>
                <p className="text-[10px] text-smoke">{product.category}</p>
              </div>
            </div>

            <div className="mt-3 space-y-2">
              {product.sizes.map((item) => {
                const key = keyFor(product.id, item.size)
                const saving = savingKey === key

                return (
                  <div key={key} className="flex items-center gap-2">
                    <span className="w-20 shrink-0 text-xs font-semibold">
                      {item.size}
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={values[key] ?? item.stock}
                      onChange={(event) =>
                        setValues((current) => ({
                          ...current,
                          [key]: event.target.value,
                        }))
                      }
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault()
                          saveStock(product.id, item.size, item.stock)
                        }
                      }}
                      className={`${inputClass} py-2`}
                      aria-label={`${product.name} ${item.size} stock`}
                    />
                    <span
                      className={`w-16 shrink-0 text-[9px] font-bold uppercase ${
                        item.stock === 0
                          ? 'text-flame'
                          : item.lowStock
                            ? 'text-flame'
                            : 'text-smoke'
                      }`}
                    >
                      {item.stock === 0 ? 'Sold out' : item.lowStock ? 'Low' : 'OK'}
                    </span>
                    <button
                      type="button"
                      onClick={() => saveStock(product.id, item.size, item.stock)}
                      disabled={saving}
                      className="grid size-8 shrink-0 place-items-center rounded-full bg-ink text-cream transition hover:bg-flame disabled:opacity-50"
                      aria-label={`Save ${product.name} ${item.size} stock`}
                    >
                      {saving ? (
                        <Loader2 className="size-3 animate-spin" aria-hidden="true" />
                      ) : (
                        <CheckCircle2 className="size-3" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SubscribersPanel({ subscribers, active }) {
  return (
    <div>
      <p className="text-xs text-smoke">
        {active} active subscriber{active === 1 ? '' : 's'} · {subscribers.length}{' '}
        total signups
      </p>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-ink/10 bg-white/70">
        <table className="w-full min-w-[620px] text-left text-xs">
          <thead className="border-b border-ink/10 text-[9px] uppercase tracking-[0.12em] text-smoke">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {subscribers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-smoke">
                  No newsletter signups yet.
                </td>
              </tr>
            )}
            {subscribers.map((subscriber) => (
              <tr key={subscriber.id}>
                <td className="px-4 py-3 font-medium">
                  {subscriber.email}
                  {subscriber.name && (
                    <span className="block text-[10px] text-smoke">
                      {subscriber.name}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-smoke">{subscriber.source}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                      subscriber.status === 'subscribed'
                        ? 'bg-lime/60 text-ink'
                        : 'bg-sand text-smoke'
                    }`}
                  >
                    {subscriber.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-smoke">
                  {formatDate(subscriber.subscribedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function AdminPage() {
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY))
  const [loading, setLoading] = useState(Boolean(token))
  const [error, setError] = useState('')
  const [tab, setTab] = useState('orders')
  const [stats, setStats] = useState(null)
  const [orders, setOrders] = useState([])
  const [inventory, setInventory] = useState([])
  const [lowStockThreshold, setLowStockThreshold] = useState(3)
  const [subscribers, setSubscribers] = useState([])
  const [activeSubscribers, setActiveSubscribers] = useState(0)

  const logout = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY)
    setToken('')
    setStats(null)
    setOrders([])
    setInventory([])
    setSubscribers([])
    setError('')
  }, [])

  const loadDashboard = useCallback(async () => {
    if (!token) return

    try {
      const [overview, orderData, inventoryData, subscriberData] =
        await Promise.all([
          adminApi.overview(token),
          adminApi.orders(token),
          adminApi.inventory(token),
          adminApi.subscribers(token),
        ])

      setError('')
      setStats(overview.stats)
      setOrders(orderData.orders)
      setInventory(inventoryData.inventory)
      setLowStockThreshold(inventoryData.lowStockThreshold)
      setSubscribers(subscriberData.subscribers)
      setActiveSubscribers(subscriberData.active)
    } catch (requestError) {
      if (requestError.status === 401 || requestError.status === 503) {
        logout()
        setError(requestError.message)
      } else {
        setError(requestError.message)
      }
    } finally {
      setLoading(false)
    }
  }, [logout, token])

  useEffect(() => {
    // The dashboard fetch is the external synchronization for this effect.
    // oxlint-disable-next-line react/set-state-in-effect
    if (token) loadDashboard()
  }, [token, loadDashboard])

  const handleLogin = (nextToken) => {
    setLoading(true)
    setError('')
    setToken(nextToken)
  }

  const refreshDashboard = () => {
    setLoading(true)
    setError('')
    loadDashboard()
  }

  const handleOrderAction = async (action, orderId, body) => {
    const data = await adminApi.updateOrder(token, orderId, body)
    setOrders((current) =>
      current.map((order) => (order.id === orderId ? data.order : order)),
    )
    adminApi
      .overview(token)
      .then((overview) => setStats(overview.stats))
      .catch(() => {})
    return data
  }

  const handleStockSave = async (body) => {
    const data = await adminApi.updateStock(token, body)
    setInventory(data.inventory)
    return data
  }

  if (!token) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <main className="px-4 pb-20 pt-8 sm:px-6 sm:pt-10 lg:px-8">
      <Seo
        title="Store admin"
        description="StudentSoko admin dashboard."
        path="/admin"
        noindex
      />

      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-flame">
              StudentSoko HQ
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Store admin
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={refreshDashboard}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-4 py-2.5 text-xs font-semibold transition hover:border-ink disabled:opacity-50"
            >
              <RefreshCw
                className={`size-3.5 ${loading ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              Refresh
            </button>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-xs font-semibold text-cream transition hover:bg-flame"
            >
              <LogOut className="size-3.5" aria-hidden="true" />
              Lock
            </button>
          </div>
        </div>

        {error && (
          <p className="mt-4 flex items-start gap-2 rounded-xl bg-flame/10 px-3.5 py-2.5 text-xs font-medium text-flame">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}

        {loading && !stats ? (
          <div className="mt-16 text-center">
            <Loader2 className="mx-auto size-7 animate-spin text-flame" aria-hidden="true" />
            <p className="mt-3 text-xs text-smoke">Loading store data...</p>
          </div>
        ) : (
          stats && (
            <>
              <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                <StatCard
                  label="Orders"
                  value={stats.orders}
                  hint="All time"
                  icon={ShoppingBag}
                />
                <StatCard
                  label="Paid"
                  value={stats.paidOrders}
                  hint={formatPrice(stats.paidRevenue)}
                  icon={CheckCircle2}
                />
                <StatCard
                  label="Pending"
                  value={stats.pendingPayments}
                  hint="Payment not confirmed"
                  icon={RefreshCw}
                />
                <StatCard
                  label="To fulfil"
                  value={stats.unfulfilled}
                  hint="Paid, not shipped"
                  icon={Package}
                />
                <StatCard
                  label="Subscribers"
                  value={stats.subscribers}
                  hint="Active drop list"
                  icon={Users}
                />
                <StatCard
                  label="Low stock"
                  value={stats.lowStock}
                  hint="Variants at threshold"
                  icon={Boxes}
                />
              </div>

              {stats.lowStock > 0 && (
                <div className="mt-3 rounded-2xl border border-flame/20 bg-flame/5 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-flame">
                    Low stock alert
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-smoke">
                    {stats.lowStock} variant
                    {stats.lowStock === 1 ? ' is' : 's are'} at or below the
                    threshold. Check the inventory tab before the next drop.
                  </p>
                </div>
              )}

              <div className="no-scrollbar mt-6 flex gap-2 overflow-x-auto">
                {[
                  ['orders', `Orders (${orders.length})`],
                  ['inventory', 'Inventory'],
                  ['subscribers', `Drop list (${subscribers.length})`],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setTab(value)}
                    className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition ${
                      tab === value
                        ? 'border-ink bg-ink text-cream'
                        : 'border-ink/15 text-ink/65 hover:border-ink/40'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="mt-4">
                {tab === 'orders' && (
                  <OrdersPanel orders={orders} onChanged={handleOrderAction} />
                )}
                {tab === 'inventory' && (
                  <InventoryPanel
                    inventory={inventory}
                    lowStockThreshold={lowStockThreshold}
                    onSave={handleStockSave}
                  />
                )}
                {tab === 'subscribers' && (
                  <SubscribersPanel
                    subscribers={subscribers}
                    active={activeSubscribers}
                  />
                )}
              </div>
            </>
          )
        )}
      </div>
    </main>
  )
}
