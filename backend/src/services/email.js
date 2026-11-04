import { Resend } from 'resend'
import { config } from '../config.js'
import {
  buildAbandonedCartEmail,
  buildOrderConfirmationEmail,
  buildPaymentReceiptEmail,
  buildShippedEmail,
  buildWelcomeEmail,
} from '../emails/templates.js'

const resend =
  config.email.mode === 'resend' ? new Resend(config.email.apiKey) : null

async function deliver({ to, subject, html, text, kind, ref = '' }) {
  if (!resend) {
    console.log(
      [
        '',
        `[email:log] ${kind}${ref ? ` for ${ref}` : ''}`,
        `To: ${to}`,
        `Subject: ${subject}`,
        '',
        text,
        '',
      ].join('\n'),
    )

    return { status: 'logged', sent: false }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: config.email.from,
      to,
      subject,
      html,
      text,
      ...(config.email.replyTo ? { replyTo: config.email.replyTo } : {}),
    })

    if (error) {
      throw new Error(error.message || 'Resend rejected the email.')
    }

    console.log(
      `[email] ${kind} sent${ref ? ` for ${ref}` : ''} (${data?.id ?? 'no provider id'})`,
    )

    return { status: 'sent', sent: true, id: data?.id ?? null }
  } catch (error) {
    console.error(
      `[email] Could not send ${kind}${ref ? ` for ${ref}` : ''}:`,
      error.message,
    )

    return { status: 'failed', sent: false, error: error.message }
  }
}

async function deliverBuiltEmail(buildEmail, context, kind, to) {
  try {
    const { subject, html, text } = buildEmail(context)

    return await deliver({
      to,
      subject,
      html,
      text,
      kind,
      ref: context.id,
    })
  } catch (error) {
    console.error(
      `[email] Could not build ${kind} for ${context.id}:`,
      error.message,
    )

    return { status: 'failed', sent: false, error: error.message }
  }
}

export function sendOrderConfirmationEmail(order) {
  return deliverBuiltEmail(
    buildOrderConfirmationEmail,
    order,
    'order confirmation',
    order.customer.email,
  )
}

export function sendPaymentReceiptEmail(order) {
  return deliverBuiltEmail(
    buildPaymentReceiptEmail,
    order,
    'payment receipt',
    order.customer.email,
  )
}

export function sendAbandonedCartEmail(order) {
  return deliverBuiltEmail(
    buildAbandonedCartEmail,
    order,
    'abandoned cart reminder',
    order.customer.email,
  )
}

export function sendShippedEmail(order) {
  return deliverBuiltEmail(
    buildShippedEmail,
    order,
    'shipping update',
    order.customer.email,
  )
}

export function sendWelcomeEmail(subscriber) {
  return deliverBuiltEmail(
    buildWelcomeEmail,
    subscriber,
    'newsletter welcome',
    subscriber.email,
  )
}
