import { config } from '../config.js'

const COLORS = {
  ink: '#121212',
  cream: '#faf6ee',
  flame: '#ff4d1c',
  lime: '#d9f56b',
  sand: '#efe3cf',
  smoke: '#716a62',
  line: '#e6dccb',
  softFlame: '#fff3ef',
  softLime: '#f4fadf',
}

const HTML_ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

export function formatKsh(value) {
  return `KSh ${Number(value).toLocaleString('en-KE')}`
}

function escapeHtml(value) {
  return String(value ?? '').replace(
    /[&<>"']/g,
    (character) => HTML_ESCAPES[character],
  )
}

function formatDateTime(iso) {
  if (!iso) return ''

  return new Intl.DateTimeFormat('en-KE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Nairobi',
    timeZoneName: 'short',
  }).format(new Date(iso))
}

function firstName(name) {
  return String(name ?? '').trim().split(/\s+/)[0] || 'there'
}

function sitePath(pathname) {
  return `${config.siteUrl}${pathname}`
}

export function trackingUrl(order) {
  return sitePath(
    `/track?order=${encodeURIComponent(order.id)}&token=${encodeURIComponent(
      order.token ?? '',
    )}`,
  )
}

function unsubscribeUrl(subscriber) {
  return sitePath(`/unsubscribe?token=${encodeURIComponent(subscriber.token)}`)
}

function itemVariant(item) {
  const labels = []

  if (item.size) labels.push(`Size ${item.size}`)
  if (item.color?.name) labels.push(item.color.name)
  else if (typeof item.color === 'string' && item.color) labels.push(item.color)

  return labels.join(' · ')
}

function textItem(item) {
  const variant = itemVariant(item)
  return `- ${item.qty} x ${item.name}${variant ? ` (${variant})` : ''} — ${formatKsh(item.lineTotal)}`
}


function shell({ preheader, eyebrow, title, intro, content }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(eyebrow)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f1ebdf;font-family:'DM Sans',Arial,Helvetica,sans-serif;color:${COLORS.ink};">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader)}</div>
    <div style="width:100%;padding:28px 12px;">
      <div style="max-width:600px;margin:0 auto;">
        <div style="border-radius:24px 24px 0 0;background-color:${COLORS.ink};padding:30px 32px 28px;">
          <div style="font-size:11px;font-weight:700;letter-spacing:0.26em;color:${COLORS.lime};">STUDENTSSOKO</div>
          <div style="width:46px;height:4px;margin:16px 0 20px;border-radius:999px;background-color:${COLORS.flame};"></div>
          <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:${COLORS.flame};">${escapeHtml(eyebrow)}</p>
          <h1 style="margin:8px 0 10px;font-family:'Space Grotesk',Arial,Helvetica,sans-serif;font-size:28px;line-height:1.15;color:${COLORS.cream};">${title}</h1>
          <p style="margin:0;font-size:14px;line-height:1.6;color:#d8d0c3;">${intro}</p>
        </div>
        <div style="border:1px solid ${COLORS.line};border-top:0;border-radius:0 0 24px 24px;background-color:${COLORS.cream};padding:30px 32px 26px;">
          ${content}
          <div style="margin-top:30px;padding-top:20px;border-top:1px solid ${COLORS.line};">
            <p style="margin:0 0 6px;font-size:13px;line-height:1.6;color:${COLORS.smoke};">
              Need a hand with your order? Just reply to this email and we'll sort it out.
            </p>
            <p style="margin:0;font-size:12px;line-height:1.6;color:${COLORS.smoke};">
              StudentsSoko · Nairobi, Kenya · Free campus delivery on orders over ${formatKsh(config.delivery.freeAt)}
            </p>
          </div>
        </div>
      </div>
    </div>
  </body>
</html>`
}

function sectionTitle(label) {
  return `<p style="margin:0 0 10px;font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:${COLORS.smoke};">${escapeHtml(label)}</p>`
}

function itemsTable(order) {
  const rows = order.items
    .map((item) => {
      const variant = itemVariant(item)

      return `
        <tr>
          <td style="padding:11px 0;border-bottom:1px solid ${COLORS.line};font-size:14px;line-height:1.45;color:${COLORS.ink};">
            <span style="font-weight:600;">${escapeHtml(item.name)}</span>
            <span style="display:block;margin-top:2px;font-size:12px;color:${COLORS.smoke};">${item.qty} × ${formatKsh(item.unitPrice)}${variant ? ` · ${escapeHtml(variant)}` : ''}</span>
          </td>
          <td align="right" style="padding:11px 0 11px 16px;border-bottom:1px solid ${COLORS.line};font-size:14px;font-weight:600;white-space:nowrap;color:${COLORS.ink};">
            ${formatKsh(item.lineTotal)}
          </td>
        </tr>`
    })
    .join('')

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">${rows}</table>`
}

function totalsTable(order) {
  const deliveryLabel = order.deliveryFee === 0 ? 'Free' : formatKsh(order.deliveryFee)

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;border-collapse:collapse;">
      <tr>
        <td style="padding:3px 0;font-size:13px;color:${COLORS.smoke};">Subtotal</td>
        <td align="right" style="padding:3px 0;font-size:13px;color:${COLORS.ink};">${formatKsh(order.subtotal)}</td>
      </tr>
      <tr>
        <td style="padding:3px 0;font-size:13px;color:${COLORS.smoke};">Delivery</td>
        <td align="right" style="padding:3px 0;font-size:13px;color:${COLORS.ink};">${deliveryLabel}</td>
      </tr>
      <tr>
        <td style="padding:10px 0 0;font-size:15px;font-weight:700;color:${COLORS.ink};">Total</td>
        <td align="right" style="padding:10px 0 0;font-family:'Space Grotesk',Arial,Helvetica,sans-serif;font-size:20px;font-weight:700;color:${COLORS.ink};">${formatKsh(order.total)}</td>
      </tr>
    </table>`
}

function deliveryBlock(order) {
  return `
    <div style="margin-top:24px;border-radius:16px;background-color:${COLORS.sand};padding:18px 20px;">
      ${sectionTitle('Delivery details')}
      <p style="margin:0;font-size:14px;font-weight:600;color:${COLORS.ink};">${escapeHtml(order.customer.name)}</p>
      <p style="margin:4px 0 0;font-size:13px;line-height:1.6;color:${COLORS.smoke};">${escapeHtml(order.customer.address)}</p>
      <p style="margin:4px 0 0;font-size:13px;color:${COLORS.smoke};">${escapeHtml(order.customer.phone)}</p>
    </div>`
}

function pendingPaymentBlock(order) {
  return `
    <div style="margin:0 0 24px;border:1px solid #ffd3c7;border-radius:16px;background-color:${COLORS.softFlame};padding:18px 20px;">
      <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:${COLORS.flame};">M-Pesa payment pending</p>
      <p style="margin:7px 0 0;font-size:14px;line-height:1.6;color:${COLORS.ink};">
        We sent an M-Pesa request for <strong>${formatKsh(order.total)}</strong> to <strong>${escapeHtml(order.customer.phone)}</strong>.
        Enter your M-Pesa PIN on your phone to confirm. We'll email your receipt as soon as the payment lands.
      </p>
    </div>`
}

function trackBlock(order, label = 'Track your order') {
  const url = trackingUrl(order)

  return `
    <div style="margin:0 0 24px;text-align:center;">
      <a href="${escapeHtml(url)}" style="display:inline-block;border-radius:999px;background-color:${COLORS.ink};padding:14px 24px;font-size:13px;font-weight:700;color:${COLORS.cream};text-decoration:none;">${escapeHtml(label)}</a>
      <p style="margin:10px 0 0;font-size:11px;line-height:1.6;color:${COLORS.smoke};">
        This link is private to you. Save it to check payment and delivery updates.
      </p>
    </div>`
}

function unsubscribeBlock(subscriber) {
  const url = unsubscribeUrl(subscriber)

  return `
    <p style="margin:22px 0 0;font-size:11px;line-height:1.6;color:${COLORS.smoke};">
      You're receiving this because you joined the StudentSoko drop list. You can
      <a href="${escapeHtml(url)}" style="color:${COLORS.flame};">unsubscribe in one click</a>.
    </p>`
}


function paidPaymentBlock(order) {
  return `
    <div style="margin:0 0 24px;border:1px solid #d5e79c;border-radius:16px;background-color:${COLORS.softLime};padding:18px 20px;">
      <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#4f6415;">Payment received</p>
      <p style="margin:7px 0 0;font-size:14px;line-height:1.6;color:${COLORS.ink};">
        ${formatKsh(order.total)} paid via M-Pesa${
          order.payment?.receiptNumber
            ? ` · Receipt <strong>${escapeHtml(order.payment.receiptNumber)}</strong>`
            : ''
        }.
      </p>
    </div>`
}

function orderMeta(order) {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border-collapse:collapse;">
      <tr>
        <td style="font-size:12px;color:${COLORS.smoke};">Order</td>
        <td align="right" style="font-size:13px;font-weight:700;color:${COLORS.ink};">${escapeHtml(order.id)}</td>
      </tr>
      <tr>
        <td style="padding-top:4px;font-size:12px;color:${COLORS.smoke};">Placed</td>
        <td align="right" style="padding-top:4px;font-size:13px;color:${COLORS.ink};">${escapeHtml(formatDateTime(order.createdAt))}</td>
      </tr>
    </table>`
}

function itemLabel(count) {
  return `${count} ${count === 1 ? 'piece' : 'pieces'}`
}

export function buildOrderConfirmationEmail(order) {
  const paid = order.payment?.status === 'paid'
  const subject = `Order ${order.id} confirmed — StudentsSoko`

  const html = shell({
    preheader: `We've received order ${order.id}. ${paid ? 'Your payment is confirmed.' : 'Your M-Pesa payment is still pending.'}`,
    eyebrow: 'Order confirmed',
    title: `Got it, ${escapeHtml(firstName(order.customer.name))}. Your order is in.`,
    intro: `Thanks for shopping with StudentsSoko. We've received order <strong style="color:${COLORS.cream};">${escapeHtml(order.id)}</strong> and we're getting it ready.`,
    content: `
      ${paid ? paidPaymentBlock(order) : pendingPaymentBlock(order)}
      ${trackBlock(order)}
      ${orderMeta(order)}
      ${sectionTitle(`Your order · ${itemLabel(
        order.items.reduce((sum, item) => sum + item.qty, 0),
      )}`)}
      ${itemsTable(order)}
      ${totalsTable(order)}
      ${deliveryBlock(order)}
    `,
  })

  const text = [
    `Hey ${firstName(order.customer.name)},`,
    '',
    `Thanks for shopping with StudentsSoko. Your order ${order.id} is confirmed.`,
    '',
    paid
      ? `Payment received: ${formatKsh(order.total)} via M-Pesa${order.payment?.receiptNumber ? ` (receipt ${order.payment.receiptNumber})` : ''}.`
      : `M-Pesa payment pending: we sent a request for ${formatKsh(order.total)} to ${order.customer.phone}. Enter your M-Pesa PIN to confirm. We'll email your receipt once payment lands.`,
    '',
    `Track your order: ${trackingUrl(order)}`,
    '',
    'Your order:',
    ...order.items.map(textItem),
    '',
    `Subtotal: ${formatKsh(order.subtotal)}`,
    `Delivery: ${order.deliveryFee === 0 ? 'Free' : formatKsh(order.deliveryFee)}`,
    `Total: ${formatKsh(order.total)}`,
    '',
    'Delivery details:',
    order.customer.name,
    order.customer.address,
    order.customer.phone,
    '',
    'Need a hand with your order? Just reply to this email.',
    'StudentsSoko · Nairobi, Kenya',
  ].join('\n')

  return { subject, html, text }
}

export function buildPaymentReceiptEmail(order) {
  const paidAt = order.payment?.paidAt ?? new Date().toISOString()
  const receiptNumber = order.payment?.receiptNumber ?? '—'
  const subject = `Payment received for order ${order.id} — StudentsSoko`

  const html = shell({
    preheader: `${formatKsh(order.total)} received for order ${order.id}. Receipt ${receiptNumber}.`,
    eyebrow: 'Payment received',
    title: `Payment landed, ${escapeHtml(firstName(order.customer.name))}.`,
    intro: `We've received your M-Pesa payment for order <strong style="color:${COLORS.cream};">${escapeHtml(order.id)}</strong>. Your pieces are officially secured.`,
    content: `
      <div style="margin:0 0 26px;border-radius:18px;background-color:${COLORS.ink};padding:22px 24px;">
        <p style="margin:0;font-size:10px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:${COLORS.lime};">Amount paid</p>
        <p style="margin:8px 0 0;font-family:'Space Grotesk',Arial,Helvetica,sans-serif;font-size:32px;font-weight:700;line-height:1;color:${COLORS.cream};">${formatKsh(order.total)}</p>
        <p style="margin:12px 0 0;font-size:12px;line-height:1.6;color:#d8d0c3;">
          M-Pesa receipt <strong style="color:${COLORS.cream};">${escapeHtml(receiptNumber)}</strong><br />
          ${escapeHtml(formatDateTime(paidAt))}
        </p>
      </div>
      ${orderMeta(order)}
      ${sectionTitle(`What you paid for · ${itemLabel(
        order.items.reduce((sum, item) => sum + item.qty, 0),
      )}`)}
      ${itemsTable(order)}
      ${totalsTable(order)}
      ${trackBlock(order)}
      ${deliveryBlock(order)}
      <p style="margin:22px 0 0;font-size:13px;line-height:1.6;color:${COLORS.smoke};">
        Keep this email as your receipt. We'll let you know as soon as your order is on its way.
      </p>
    `,
  })

  const text = [
    `Hey ${firstName(order.customer.name)},`,
    '',
    `We've received your M-Pesa payment for order ${order.id}.`,
    '',
    `Amount paid: ${formatKsh(order.total)}`,
    `M-Pesa receipt: ${receiptNumber}`,
    `Paid: ${formatDateTime(paidAt)}`,
    '',
    'What you paid for:',
    ...order.items.map(textItem),
    '',
    `Subtotal: ${formatKsh(order.subtotal)}`,
    `Delivery: ${order.deliveryFee === 0 ? 'Free' : formatKsh(order.deliveryFee)}`,
    `Total: ${formatKsh(order.total)}`,
    '',
    `Track your order: ${trackingUrl(order)}`,
    '',
    'Delivery details:',
    order.customer.name,
    order.customer.address,
    order.customer.phone,
    '',
    'Keep this email as your receipt. We will let you know as soon as your order is on its way.',
    'StudentsSoko · Nairobi, Kenya',
  ].join('\n')

  return { subject, html, text }
}

export function buildWelcomeEmail(subscriber) {
  const subject = 'You are on the StudentSoko drop list'

  const html = shell({
    preheader:
      'First dibs on new drops, restocks and campus pop-ups. One email a week, no spam.',
    eyebrow: 'Drop list',
    title: "You're on the list.",
    intro:
      'First dibs on new drops, restocks and campus pop-ups. We send one email a week, and you can leave any time.',
    content: `
      <p style="margin:0 0 18px;font-size:14px;line-height:1.7;color:${COLORS.ink};">
        New merch lands on Fridays. Drop-list members get the link before it goes public, plus the occasional student-only restock alert.
      </p>
      <div style="margin:0 0 22px;border-radius:16px;background-color:${COLORS.sand};padding:18px 20px;">
        ${sectionTitle('What to expect')}
        <p style="margin:0;font-size:14px;line-height:1.7;color:${COLORS.smoke};">
          New drops · Restock alerts · Campus pop-up dates · Student-only offers
        </p>
      </div>
      <div style="text-align:center;">
        <a href="${escapeHtml(sitePath('/#shop'))}" style="display:inline-block;border-radius:999px;background-color:${COLORS.flame};padding:14px 24px;font-size:13px;font-weight:700;color:${COLORS.cream};text-decoration:none;">Shop the latest drop</a>
      </div>
      ${unsubscribeBlock(subscriber)}
    `,
  })

  const text = [
    'You are on the StudentSoko drop list. First dibs on new drops, restocks and campus pop-ups.',
    '',
    'New merch lands on Fridays. Drop-list members get the link before it goes public.',
    '',
    `Shop the latest drop: ${sitePath('/#shop')}`,
    '',
    `Unsubscribe: ${unsubscribeUrl(subscriber)}`,
    'StudentsSoko · Nairobi, Kenya',
  ].join('\n')

  return { subject, html, text }
}

export function buildAbandonedCartEmail(order) {
  const subject = `Still thinking about order ${order.id}?`
  const count = order.items.reduce((sum, item) => sum + item.qty, 0)

  const html = shell({
    preheader: `Your ${itemLabel(count)} are still waiting. Pick up where you left off.`,
    eyebrow: 'Cart saved',
    title: `Still thinking it over, ${escapeHtml(firstName(order.customer.name))}?`,
    intro: `Your order <strong style="color:${COLORS.cream};">${escapeHtml(order.id)}</strong> is saved, but the M-Pesa payment has not landed yet. Pick up where you left off before your size sells out.`,
    content: `
      ${sectionTitle(`Your saved order · ${itemLabel(count)}`)}
      ${itemsTable(order)}
      ${totalsTable(order)}
      ${trackBlock(order, 'Resume payment')}
      ${deliveryBlock(order)}
      <p style="margin:22px 0 0;font-size:12px;line-height:1.6;color:${COLORS.smoke};">
        If you already completed the payment, you can ignore this email. Your receipt will arrive as soon as M-Pesa confirms.
      </p>
    `,
  })

  const text = [
    `Hey ${firstName(order.customer.name)},`,
    '',
    `Your StudentSoko order ${order.id} is saved, but we have not received the M-Pesa payment yet.`,
    '',
    'Your saved order:',
    ...order.items.map(textItem),
    '',
    `Total: ${formatKsh(order.total)}`,
    '',
    `Resume payment: ${trackingUrl(order)}`,
    '',
    'If you already completed the payment, you can ignore this email.',
    'StudentsSoko · Nairobi, Kenya',
  ].join('\n')

  return { subject, html, text }
}

export function buildShippedEmail(order) {
  const subject = `Order ${order.id} is on the way`
  const trackingNumber = order.trackingNumber
    ? `Tracking number: ${order.trackingNumber}`
    : ''

  const html = shell({
    preheader: `Order ${order.id} has left our Nairobi studio.`,
    eyebrow: 'On the way',
    title: `Your order is moving, ${escapeHtml(firstName(order.customer.name))}.`,
    intro: `Order <strong style="color:${COLORS.cream};">${escapeHtml(order.id)}</strong> has been packed and handed to our delivery team.`,
    content: `
      ${paidPaymentBlock(order)}
      ${
        order.trackingNumber
          ? `<div style="margin:0 0 24px;border-radius:16px;background-color:${COLORS.sand};padding:18px 20px;">
              ${sectionTitle('Tracking number')}
              <p style="margin:0;font-family:'Space Grotesk',Arial,Helvetica,sans-serif;font-size:20px;font-weight:700;color:${COLORS.ink};">${escapeHtml(order.trackingNumber)}</p>
            </div>`
          : ''
      }
      ${trackBlock(order)}
      ${deliveryBlock(order)}
      <p style="margin:22px 0 0;font-size:13px;line-height:1.6;color:${COLORS.smoke};">
        Campus deliveries usually arrive within 24 hours. Countrywide deliveries take 2–4 business days.
      </p>
    `,
  })

  const text = [
    `Hey ${firstName(order.customer.name)},`,
    '',
    `Order ${order.id} has left our Nairobi studio and is on the way.`,
    '',
    trackingNumber,
    '',
    `Track your order: ${trackingUrl(order)}`,
    '',
    'Delivery details:',
    order.customer.name,
    order.customer.address,
    order.customer.phone,
    '',
    'Campus deliveries usually arrive within 24 hours. Countrywide deliveries take 2-4 business days.',
    'StudentsSoko · Nairobi, Kenya',
  ]
    .filter((line) => line !== null)
    .join('\n')

  return { subject, html, text }
}

