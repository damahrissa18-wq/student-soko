import { Link } from 'react-router-dom'
import { ArrowRight, Mail, MessageCircle } from 'lucide-react'
import PageShell from '../components/PageShell'
import Seo from '../components/Seo'
import { products } from '../data/products'
import { siteConfig, whatsappUrl } from '../config/site'

function ContactStrip() {
  const whatsapp = whatsappUrl()

  return (
    <div className="rounded-2xl border border-ink/10 bg-sand/50 p-5 text-sm">
      <p className="font-display font-bold text-ink">Still need help?</p>
      <p className="mt-1 text-xs leading-relaxed text-smoke">
        Message us with your order number and we will help you sort it out.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={`mailto:${siteConfig.email}`}
          className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-xs font-semibold text-cream transition hover:bg-flame"
        >
          <Mail className="size-3.5" aria-hidden="true" />
          Email us
        </a>
        {whatsapp && (
          <a
            href={whatsapp}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-ink/20 px-4 py-2.5 text-xs font-semibold text-ink transition hover:border-ink"
          >
            <MessageCircle className="size-3.5" aria-hidden="true" />
            WhatsApp
          </a>
        )}
        <Link
          to="/track"
          className="inline-flex items-center gap-2 rounded-full border border-ink/20 px-4 py-2.5 text-xs font-semibold text-ink transition hover:border-ink"
        >
          Track an order
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}

function sizeList(category) {
  return [...new Set(products.filter((p) => p.category === category).flatMap((p) => p.sizes))]
}

export function SizeGuidePage() {
  const topSizes = [...new Set([...sizeList('Hoodies'), ...sizeList('Tees')])]

  return (
    <>
      <Seo
        title="Size guide"
        description="StudentSoko size guide for hoodies, tees, caps, bags, notebooks and suitcases. Find your fit before ordering."
        path="/size-guide"
      />
      <PageShell
        eyebrow="Fit first"
        title="Find your size."
        intro="Our tops are unisex and cut for a relaxed campus fit. If you like a closer fit, size down one. Measurements below are body measurements, not garment measurements."
      >
        <section>
          <h2 className="font-display text-xl font-bold text-ink">Tops & hoodies</h2>
          <div className="mt-3 overflow-x-auto rounded-2xl border border-ink/10 bg-white/60">
            <table className="w-full min-w-[520px] text-left text-xs">
              <thead className="border-b border-ink/10 text-[10px] uppercase tracking-[0.12em] text-smoke">
                <tr>
                  <th className="px-4 py-3">Size</th>
                  <th className="px-4 py-3">Chest (in)</th>
                  <th className="px-4 py-3">Chest (cm)</th>
                  <th className="px-4 py-3">Fit note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {[
                  ['XS', '32–34', '81–86', 'Fitted'],
                  ['S', '34–36', '86–91', 'Relaxed'],
                  ['M', '38–40', '96–102', 'Relaxed'],
                  ['L', '42–44', '107–112', 'Relaxed'],
                  ['XL', '46–48', '117–122', 'Roomy'],
                  ['XXL', '50–52', '127–132', 'Extra roomy'],
                ].map(([size, inches, cm, fit]) => (
                  <tr key={size}>
                    <td className="px-4 py-3 font-semibold">{size}</td>
                    <td className="px-4 py-3">{inches}</td>
                    <td className="px-4 py-3">{cm}</td>
                    <td className="px-4 py-3 text-smoke">{fit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-smoke">
            Available top sizes in this drop: {topSizes.join(' · ')}. Oversized
            hoodies run deliberately large — take your usual size for the
            intended fit.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-ink">Everything else</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-ink/10 bg-white/60 p-4">
              <h3 className="font-display text-sm font-bold">Caps</h3>
              <p className="mt-1 text-xs text-smoke">
                One size, adjustable metal buckle at the back. Fits most head
                sizes comfortably.
              </p>
            </div>
            <div className="rounded-2xl border border-ink/10 bg-white/60 p-4">
              <h3 className="font-display text-sm font-bold">Totes & backpacks</h3>
              <p className="mt-1 text-xs text-smoke">
                One size. The tote fits a 15-inch laptop; the daypack has a padded
                15-inch laptop sleeve and 22L of space.
              </p>
            </div>
            <div className="rounded-2xl border border-ink/10 bg-white/60 p-4">
              <h3 className="font-display text-sm font-bold">Notebook</h3>
              <p className="mt-1 text-xs text-smoke">
                A5 hardcover (148 × 210 mm), 160 dotted pages, lay-flat binding.
              </p>
            </div>
            <div className="rounded-2xl border border-ink/10 bg-white/60 p-4">
              <h3 className="font-display text-sm font-bold">Suitcase</h3>
              <p className="mt-1 text-xs text-smoke">
                Cabin: 20-inch carry-on. Medium: 24-inch check-in. Both have
                spinner wheels and a TSA lock.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-ink p-5 text-cream">
          <h2 className="font-display text-lg font-bold">Between sizes?</h2>
          <p className="mt-2 text-sm leading-relaxed text-cream/70">
            Size down for a closer fit or stay true to size for the relaxed campus
            look. If it is not right, you have 7 days to swap it — tags on, unworn.
          </p>
          <Link
            to="/returns"
            className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-lime"
          >
            Read the swap policy
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </section>

        <ContactStrip />
      </PageShell>
    </>
  )
}

export function DeliveryPage() {
  return (
    <>
      <Seo
        title="Delivery & pickup"
        description="StudentSoko delivery: free campus delivery in Nairobi on orders over KSh 2,000, flat KSh 150 under that, and countrywide delivery in 2–4 business days."
        path="/delivery"
      />
      <PageShell
        eyebrow="Delivery"
        title="From our studio to your hostel."
        intro="We pack orders in Nairobi and deliver across Kenya. Pay with M-Pesa at checkout — no card details needed."
      >
        <section className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-ink/10 bg-white/60 p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-flame">
              Nairobi campus
            </p>
            <p className="mt-2 font-display text-lg font-bold">24 hours</p>
            <p className="mt-1 text-xs text-smoke">
              Order before 4PM and we aim to deliver the next day to hostels,
              halls and campus pickup points.
            </p>
          </div>
          <div className="rounded-2xl border border-ink/10 bg-white/60 p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-flame">
              Countrywide
            </p>
            <p className="mt-2 font-display text-lg font-bold">2–4 days</p>
            <p className="mt-1 text-xs text-smoke">
              Delivered through our courier partners to your campus or estate.
            </p>
          </div>
          <div className="rounded-2xl border border-ink/10 bg-white/60 p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-flame">
              Delivery fee
            </p>
            <p className="mt-2 font-display text-lg font-bold">
              Free over KSh 2,000
            </p>
            <p className="mt-1 text-xs text-smoke">
              Orders under KSh 2,000 have a flat KSh 150 delivery fee.
            </p>
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-ink">How it works</h2>
          <ol className="mt-3 space-y-3">
            {[
              'Place your order and enter your hostel, hall or estate address at checkout.',
              'Approve the M-Pesa prompt on your phone. We start packing once payment lands.',
              'We send an order confirmation right away, then a receipt once M-Pesa confirms.',
              'You get a shipping email with a tracking number when your order leaves the studio.',
              'Track the whole thing any time with your order number and email.',
            ].map((step, index) => (
              <li key={step} className="flex gap-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-ink text-[10px] font-bold text-cream">
                  {index + 1}
                </span>
                <span className="text-sm leading-relaxed text-ink/75">{step}</span>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-ink">
            Pickup points
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink/75">
            Prefer not to share your room number? Choose a campus pickup point at
            checkout if your campus has one, and we will message you when the
            parcel is ready. If you are unsure, add a note to your order or email
            us before placing it.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-ink">
            Payment is only M-Pesa
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink/75">
            Checkout sends an M-Pesa STK Push to the number you enter. We do not
            accept cards or cash on delivery, and we never ask for your M-Pesa PIN
            by email, phone or WhatsApp. Enter your PIN only in the official
            M-Pesa prompt.
          </p>
        </section>

        <ContactStrip />
      </PageShell>
    </>
  )
}

export function ReturnsPage() {
  return (
    <>
      <Seo
        title="Returns & swaps"
        description="StudentSoko 7-day returns and size swaps. Keep tags on and contact us with your order number."
        path="/returns"
      />
      <PageShell
        eyebrow="Returns & swaps"
        title="Wrong size happens."
        intro="You have 7 days from delivery to swap or return unworn items with the tags still on. Here is the simple version."
      >
        <section className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-ink/10 bg-white/60 p-5">
            <h2 className="font-display text-base font-bold text-ink">
              Eligible for a swap or return
            </h2>
            <ul className="mt-2 space-y-1.5 text-xs text-smoke">
              <li>• Unworn, unwashed and in the condition you received it</li>
              <li>• Original tags still attached</li>
              <li>• Reported within 7 days of delivery</li>
              <li>• Original packaging where possible</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-ink/10 bg-white/60 p-5">
            <h2 className="font-display text-base font-bold text-ink">
              Not eligible
            </h2>
            <ul className="mt-2 space-y-1.5 text-xs text-smoke">
              <li>• Items worn, washed, altered or damaged after delivery</li>
              <li>• Tags removed</li>
              <li>• Returns requested after 7 days</li>
              <li>• Free promotional items</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-ink">How to start</h2>
          <ol className="mt-3 space-y-3">
            {[
              'Email us or send a WhatsApp message with your order number and what you want to swap.',
              'We confirm availability and send you the drop-off or pickup instructions.',
              'Pack the item with its tags on and hand it back to our delivery team or courier.',
              'Once we check it, we send the replacement or process the refund.',
            ].map((step, index) => (
              <li key={step} className="flex gap-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-ink text-[10px] font-bold text-cream">
                  {index + 1}
                </span>
                <span className="text-sm leading-relaxed text-ink/75">{step}</span>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-ink">
            Refunds and delivery fees
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink/75">
            Refunds go back to the M-Pesa number used at checkout, usually within
            3–5 business days after we approve the return. Original delivery fees
            are refunded when the item is faulty or the wrong item was sent. For
            size swaps, return delivery is free within Nairobi; countrywide
            courier costs may apply.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-ink">
            Faulty or wrong item?
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink/75">
            If something arrives damaged or is not what you ordered, send us a
            photo within 48 hours and we will make it right at no cost to you.
          </p>
        </section>

        <ContactStrip />
      </PageShell>
    </>
  )
}

export function FaqPage() {
  const faqs = [
    {
      q: 'How do I pay?',
      a: 'Checkout sends an M-Pesa STK Push to the number you enter. Approve it with your M-Pesa PIN and we will confirm the order. We do not accept cards or cash on delivery.',
    },
    {
      q: 'When will my order arrive?',
      a: 'Nairobi campus orders usually arrive within 24 hours when placed before 4PM. Countrywide orders take 2–4 business days. You will get a shipping email when your parcel leaves us.',
    },
    {
      q: 'How do I track my order?',
      a: 'Use the Track order page with your order number and the email you used at checkout, or open the private tracking link in your confirmation email.',
    },
    {
      q: 'What if my payment does not go through?',
      a: 'Your order is saved. Open the tracking link or track it with your order number and email, then choose Resume payment to send a fresh M-Pesa prompt.',
    },
    {
      q: 'Can I change my size after ordering?',
      a: 'Email or WhatsApp us as soon as possible. If your order has not shipped and the size is in stock, we will update it. After delivery, use the 7-day swap policy.',
    },
    {
      q: 'Why does a size show as sold out?',
      a: 'We keep stock per size and colour. When a variant sells out, it is marked on the product page. Join the drop list to hear about restocks before they go public.',
    },
    {
      q: 'Do you deliver outside Nairobi?',
      a: 'Yes. Countrywide delivery takes 2–4 business days through our courier partners. Delivery is free on orders over KSh 2,000, otherwise KSh 150.',
    },
    {
      q: 'How do I unsubscribe from the drop list?',
      a: 'Every drop-list email has a one-click unsubscribe link. You can also use the unsubscribe page from that email. Order confirmation and receipt emails are transactional and are still sent for purchases.',
    },
  ]

  return (
    <>
      <Seo
        title="FAQ"
        description="Answers about StudentSoko payments, delivery, tracking, stock, sizes, returns and the drop list."
        path="/faq"
      />
      <PageShell
        eyebrow="FAQ"
        title="Questions, answered."
        intro="The quick answers to the things students ask us most. If your question is not here, message us."
      >
        <div className="space-y-3">
          {faqs.map((faq) => (
            <details
              key={faq.q}
              className="group rounded-2xl border border-ink/10 bg-white/60 p-5"
            >
              <summary className="cursor-pointer list-none font-display text-sm font-bold text-ink marker:hidden">
                <span className="flex items-center justify-between gap-4">
                  {faq.q}
                  <span className="text-lg leading-none text-flame transition group-open:rotate-45">
                    +
                  </span>
                </span>
              </summary>
              <p className="mt-3 text-xs leading-relaxed text-smoke">{faq.a}</p>
            </details>
          ))}
        </div>

        <ContactStrip />
      </PageShell>
    </>
  )
}

export function PrivacyPage() {
  return (
    <>
      <Seo
        title="Privacy policy"
        description="How StudentSoko collects, uses and protects your personal data."
        path="/privacy"
      />
      <PageShell
        eyebrow="Privacy"
        title="Your data, explained."
        intro="We collect the minimum we need to take your order, deliver it and keep you posted. We do not sell your personal data."
      >
        <section>
          <h2 className="font-display text-xl font-bold text-ink">
            What we collect
          </h2>
          <ul className="mt-2 space-y-1.5 text-sm text-ink/75">
            <li>• Name, email, phone number and delivery address when you order.</li>
            <li>• Order details, payment status and M-Pesa receipt number.</li>
            <li>• Email address and signup source when you join the drop list.</li>
            <li>• Basic, privacy-friendly analytics if analytics is enabled.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-ink">
            How we use it
          </h2>
          <ul className="mt-2 space-y-1.5 text-sm text-ink/75">
            <li>• To process your order, take payment and deliver your items.</li>
            <li>• To send order confirmations, receipts and delivery updates.</li>
            <li>• To send drop-list emails if you asked for them.</li>
            <li>• To answer support questions and prevent fraud or abuse.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-ink">
            Who we share it with
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink/75">
            We share only what is needed with service providers: Resend for email
            delivery and Safaricom M-Pesa for payment processing. Our courier
            partners receive the name, phone number and delivery address needed to
            deliver your parcel. We do not sell or rent your data.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-ink">
            Analytics and cookies
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink/75">
            If analytics is enabled, we use Plausible, a privacy-friendly
            analytics tool that does not use cookies or collect personal data. If
            it is not configured, no analytics script is loaded.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-ink">
            Your choices
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink/75">
            You can unsubscribe from the drop list at any time using the link in
            any drop-list email. You can ask us to access, correct or delete your
            personal data by emailing{' '}
            <a
              href={`mailto:${siteConfig.email}`}
              className="font-semibold text-flame"
            >
              {siteConfig.email}
            </a>
            . We keep order records for as long as needed for accounting, tax and
            dispute resolution.
          </p>
        </section>

        <ContactStrip />
      </PageShell>
    </>
  )
}

export function TermsPage() {
  return (
    <>
      <Seo
        title="Terms of service"
        description="StudentSoko terms for orders, pricing, delivery, returns and using the store."
        path="/terms"
      />
      <PageShell
        eyebrow="Terms"
        title="The ground rules."
        intro="By ordering from StudentSoko you agree to these terms. Keep them handy if you need to check something later."
      >
        <section>
          <h2 className="font-display text-xl font-bold text-ink">Orders</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink/75">
            An order is confirmed when M-Pesa confirms payment. Prices are in
            Kenyan shillings and include applicable taxes unless stated otherwise.
            Stock is limited and confirmed at payment time; if an item sells out
            before payment lands, we will contact you to swap it or refund you.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-ink">
            Pricing and delivery
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink/75">
            We try to keep prices and stock accurate, but errors can happen. If a
            pricing error is obvious, we may cancel and refund the order. Delivery
            timelines are estimates, not guarantees; courier delays can occur.
            Delivery is free on orders over KSh 2,000, otherwise KSh 150.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-ink">
            Returns and swaps
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink/75">
            Returns and size swaps follow the 7-day policy on the Returns page.
            Items must be unworn, unwashed and have their tags attached. Refunds go
            back to the M-Pesa number used at checkout.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-ink">
            Payments
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink/75">
            We only accept M-Pesa. We never ask for your M-Pesa PIN by email,
            phone or WhatsApp. Enter your PIN only in the official M-Pesa prompt
            on your phone. If you are unsure whether a payment request is genuine,
            contact us before approving it.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-ink">
            Acceptable use
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink/75">
            Do not misuse the store, attempt to access other customers' orders,
            scrape the site or interfere with checkout. We may cancel orders and
            restrict access if we detect fraud or abuse.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-ink">
            Contact
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink/75">
            Questions about these terms? Email{' '}
            <a
              href={`mailto:${siteConfig.email}`}
              className="font-semibold text-flame"
            >
              {siteConfig.email}
            </a>
            .
          </p>
        </section>

        <ContactStrip />
      </PageShell>
    </>
  )
}
