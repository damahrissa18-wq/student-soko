# StudentsSoko

Campus streetwear storefront with a real checkout flow, variant-level stock, order tracking and a small admin dashboard.

```
frontend/   React + Vite storefront, product pages, tracking and admin UI
backend/    Express API: orders, inventory, newsletter, Resend email, M-Pesa Daraja
shared/     products.json — the single product/variant catalog used by both apps
```

## What is included

- Product catalog with sizes, named colours, descriptions and per-size stock.
- Cart persisted in `localStorage`, with size/colour variants and live stock limits.
- M-Pesa STK Push checkout, order confirmation and payment receipt emails via Resend.
- Public order tracking at `/track` using the private link in emails, or order number + email.
- Admin dashboard at `/admin` for orders, fulfilment, tracking numbers, stock and subscribers.
- Newsletter signup on the storefront with welcome email and one-click unsubscribe.
- Abandoned cart reminder emails for orders that stay unpaid.
- Delivery, returns, size guide, FAQ, privacy and terms pages.
- SEO titles/descriptions, OG/Twitter tags, product JSON-LD, `robots.txt`, `sitemap.xml`.
- Optional Plausible analytics and optional WhatsApp/social links via environment variables.

## Quick start (demo mode, no accounts needed)

Demo mode is the default when no API keys are configured:

- Emails are printed to the backend console instead of being delivered.
- M-Pesa payments auto-confirm after ~5 seconds, so you can see the full order → paid → receipt flow.
- `ADMIN_TOKEN` falls back to `dev-admin-token` outside production.

**Terminal 1 — backend**

```bash
cd backend
npm install
copy .env.example .env      # Windows; use `cp` on macOS/Linux
npm run dev
```

The API runs on `http://localhost:4000`.

**Terminal 2 — frontend**

```bash
cd frontend
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

1. Browse a product and choose a size/colour.
2. Add it to the cart and check out with any valid Kenyan phone number, for example `0712 345 678`.
3. The console prints the order confirmation email.
4. After ~5 seconds the mock payment confirms and the console prints the payment receipt.
5. Open `/track` to see the order timeline. Open `/admin` and use `dev-admin-token` to edit stock and fulfilment.

## Product catalog and stock

`shared/products.json` is the source of truth for both the API and the storefront. Each product has:

- `price`, `oldPrice`, `image`, `category`, `badge`, `description`, `details`
- `sizes` (for example `S`, `M`, `L` or `One size`)
- `colors` as named values with hex codes (for example `{ "name": "Ink", "hex": "#121212" }`)
- `defaultStock` used the first time a size is seen

Stock is tracked per `productId::size` in `backend/data/inventory.json`. It is checked when an order is created and reduced once when payment is confirmed. This is a simple non-reservation model: stock is not held while an M-Pesa prompt is open.

To add a product, add it to `shared/products.json` and restart both apps. New size entries are initialised automatically.

## Admin dashboard

Go to `/admin`.

- In development the token is `dev-admin-token`.
- In production, set a long random `ADMIN_TOKEN` in `backend/.env` and set `NODE_ENV=production`. If either is missing, admin access returns 503 instead of using the dev fallback.
- The token is stored in `sessionStorage` for that browser tab only.

The dashboard can:

- View order totals, paid revenue, pending payments, unfulfilled orders, low stock and subscribers.
- Search/filter orders and update `unfulfilled → processing → shipped → delivered`, or cancel.
- Add a tracking number. Saving an order as **Shipped** sends a shipping email once.
- Edit per-size stock.
- View newsletter subscribers.

## Order tracking

Emails include a private tracking link:

```
https://your-site.com/track?order=SS-ABCDEF&token=...
```

Customers can also look up an order with the order number and the email used at checkout. The lookup endpoint has a basic per-IP rate limit. Unpaid orders show a **Resume payment** button that sends a fresh M-Pesa STK Push.

Order access tokens are secrets. Do not share the tracking link publicly; anyone with the link can view that order.

## Sending real emails with Resend

1. Create an account at <https://resend.com>.
2. Verify the domain you want to send from (for example `studentsoko.co.ke`).
3. Create an API key.
4. Set these in `backend/.env`:

```env
RESEND_API_KEY=re_your_key
RESEND_FROM_EMAIL=StudentsSoko <orders@your-verified-domain.com>
RESEND_REPLY_TO=support@your-verified-domain.com
SITE_URL=https://your-site.com
```

Restart the backend. The startup banner should show `Email: Resend`. Emails are built server-side with HTML and plain-text versions in `backend/src/emails/templates.js`.

> If the API key is missing, emails are logged to the console. If Resend rejects a send, the order still succeeds and the error is logged on the server.

`SITE_URL` is important: it is used for tracking, shipping and unsubscribe links in emails. The local default is `http://localhost:5173`.

## Accepting real M-Pesa payments (Daraja)

1. Create an app on the [Safaricom Daraja portal](https://developer.safaricom.co.ke/).
2. Get the consumer key, consumer secret, shortcode and passkey for sandbox or production.
3. Expose the backend publicly over HTTPS. For local testing, use a tunnel such as ngrok:

   ```bash
   ngrok http 4000
   ```

4. Set the values in `backend/.env`:

```env
MPESA_ENV=sandbox
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=174379
MPESA_PASSKEY=your_passkey
MPESA_TRANSACTION_TYPE=CustomerPayBillOnline
MPESA_CALLBACK_URL=https://your-tunnel.ngrok-free.app/api/mpesa/callback
```

5. Restart the backend. The banner should show `M-Pesa: Daraja sandbox` (or `production`).

How it works:

1. `POST /api/orders` validates variants and stock, calculates prices on the server and sends the order confirmation email.
2. The backend calls Daraja `stkpush` for the order total.
3. Safaricom calls `POST /api/mpesa/callback` with the result.
4. On `ResultCode === 0`, the order is marked paid, stock is reduced once and the receipt email is sent. The callback is acknowledged with HTTP 200 so Safaricom does not retry.

`MPESA_MOCK=true` forces mock mode even when credentials exist. Leave the credentials blank to stay in mock mode.

> The callback URL must be publicly reachable over HTTPS. `localhost` will not work with Safaricom. Remember to update the URL whenever your tunnel changes.

## Newsletter and abandoned carts

**Newsletter** — the storefront's drop-list form posts to `POST /api/newsletter`. Subscribers are stored in `backend/data/subscribers.json`. New subscribers receive a welcome email with an unsubscribe link. Unsubscribing through `/unsubscribe?token=...` updates the record and keeps it for audit purposes.

**Abandoned cart** — a background sweeper checks unpaid orders (`pending_payment` or `payment_failed`) and sends one reminder email after the configured delay. The email links to the order's tracking page so the customer can resume payment. Configure or disable it with:

```env
ABANDONED_CART_ENABLED=true
ABANDONED_CART_DELAY_MINUTES=60
ABANDONED_CART_SWEEP_MINUTES=15
ABANDONED_CART_MAX_AGE_DAYS=7
```

In mock mode orders auto-pay in seconds, so reminders will normally only apply to failed/abandoned payments.

## WhatsApp and social links

These are intentionally blank by default so the site does not invent an account. Fill them in `frontend/.env` when you have the real details:

```env
VITE_WHATSAPP_NUMBER=254712345678
VITE_INSTAGRAM_URL=https://instagram.com/your-handle
VITE_TIKTOK_URL=
VITE_X_URL=
VITE_YOUTUBE_URL=
VITE_FACEBOOK_URL=
VITE_CONTACT_EMAIL=hello@studentsoko.co.ke
VITE_SITE_URL=https://studentsoko.co.ke
```

If a value is blank, the corresponding icon/button is hidden. `VITE_WHATSAPP_NUMBER` must be digits only, including the country code.

## Analytics and SEO

Set `VITE_PLAUSIBLE_DOMAIN` to load the privacy-friendly Plausible script. If it is blank, no analytics script is loaded. Custom events are sent for:

- `add_to_cart`
- `begin_checkout`
- `purchase`
- `newsletter_signup`

`frontend/public/robots.txt`, `frontend/public/sitemap.xml` and the static OG/Twitter tags in `frontend/index.html` are static files. Update the domain there if you launch on a different domain. The `Seo` component sets per-route titles, descriptions, canonical/OG/Twitter tags and product JSON-LD at runtime.

## Configuration

### Backend (`backend/.env`)

| Variable | Purpose |
| --- | --- |
| `PORT` | API port, default `4000` |
| `NODE_ENV` | Set to `production` on your host; disables the dev admin fallback |
| `CORS_ORIGIN` | Comma-separated allowed frontend origins |
| `SITE_URL` | Public frontend URL used in email links, default `http://localhost:5173` |
| `ADMIN_TOKEN` | Bearer token for `/api/admin`; required in production |
| `FREE_DELIVERY_AT` / `DELIVERY_FEE` | Delivery pricing in KSh, defaults `2000` / `150` |
| `LOW_STOCK_THRESHOLD` | Low-stock alert threshold, default `3` |
| `RESEND_API_KEY` | Resend API key; empty means console logging |
| `RESEND_FROM_EMAIL` | Verified sender address |
| `RESEND_REPLY_TO` | Optional reply-to address |
| `EMAIL_MODE` | Set to `log` to force console logging |
| `MPESA_ENV` | `sandbox` or `production` |
| `MPESA_CONSUMER_KEY` / `MPESA_CONSUMER_SECRET` | Daraja app credentials |
| `MPESA_SHORTCODE` / `MPESA_PASSKEY` | Paybill/till number and Lipa na M-Pesa passkey |
| `MPESA_CALLBACK_URL` | Public HTTPS callback URL |
| `MPESA_MOCK` | `true` forces simulated payments |
| `ABANDONED_CART_*` | Enable, delay, sweep interval and max age for reminders |
| `ORDER_STORE_FILE` | Optional path for the JSON order store |
| `INVENTORY_STORE_FILE` | Optional path for inventory |
| `SUBSCRIBER_STORE_FILE` | Optional path for newsletter subscribers |

### Frontend (`frontend/.env`)

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | API origin when it is not proxied (blank in local dev) |
| `VITE_SITE_URL` | Canonical/public site URL for metadata |
| `VITE_CONTACT_EMAIL` | Support email in the footer/pages |
| `VITE_WHATSAPP_NUMBER` | WhatsApp number, digits only; blank hides button |
| `VITE_INSTAGRAM_URL`, `VITE_TIKTOK_URL`, `VITE_X_URL`, `VITE_YOUTUBE_URL`, `VITE_FACEBOOK_URL` | Social profile links; blank hides the icon |
| `VITE_PLAUSIBLE_DOMAIN` | Plausible domain; blank disables analytics |
| `VITE_PLAUSIBLE_SCRIPT` | Optional custom Plausible script URL |

The frontend uses a Vite proxy for `/api` in development. If you host the API on a different domain, set `VITE_API_URL` to the API origin and add the storefront origin to `CORS_ORIGIN`.

## API

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Email, M-Pesa, admin and abandoned-cart modes |
| `GET` | `/api/catalog` | Products, variants, stock map and low-stock threshold |
| `POST` | `/api/orders` | Create order, send confirmation, start STK Push |
| `POST` | `/api/orders/lookup` | Find an order by order number + email |
| `GET` | `/api/orders/:id` | Poll order status (requires `x-order-token`) |
| `POST` | `/api/orders/:id/pay` | Retry/resend the M-Pesa prompt (requires `x-order-token`) |
| `POST` | `/api/mpesa/callback` | Safaricom payment callback |
| `POST` | `/api/newsletter` | Subscribe to the drop list |
| `GET` | `/api/newsletter/unsubscribe?token=` | One-click unsubscribe |
| `GET` | `/api/admin/overview` | Dashboard stats (Bearer `ADMIN_TOKEN`) |
| `GET` | `/api/admin/orders` | List/search orders (Bearer token) |
| `PATCH` | `/api/admin/orders/:id` | Update fulfilment status/tracking number |
| `GET` | `/api/admin/inventory` | Product stock snapshot |
| `PATCH` | `/api/admin/inventory` | Update one product/size stock level |
| `GET` | `/api/admin/subscribers` | Newsletter subscriber list |

Order prices are always taken from `shared/products.json`. Never trust prices or stock from the browser.

## Before going live

- Replace the JSON stores with a real database and object storage where appropriate. The current stores are fine for development but are not designed for multiple server instances or high traffic.
- The JSON stores contain customer PII, order access tokens and subscriber tokens in plain text. Protect the files and move to a database before launch.
- Set a strong `ADMIN_TOKEN`, `NODE_ENV=production`, a real `SITE_URL`, and production `CORS_ORIGIN`.
- Put the API behind HTTPS and add rate limiting at the edge for checkout, lookup, newsletter and admin endpoints.
- Restrict the M-Pesa callback to Safaricom's published IP ranges (or put it behind a WAF). The callback validates the `CheckoutRequestID` and amount, but IP allowlisting is an extra layer.
- Review the privacy, terms, delivery and returns copy with the real business details. The included pages are practical placeholders, not legal advice.
- Test the full flow in the Daraja sandbox before switching `MPESA_ENV` to `production`.
- Monitor Resend and Daraja logs for failed emails/payments.
- Update `frontend/public/robots.txt`, `sitemap.xml` and the static `og:url`/`og:image` in `frontend/index.html` if the production domain differs from `studentsoko.co.ke`.

## Scripts

```bash
# backend
npm run dev      # node --watch
npm start        # production start

# frontend
npm run dev
npm run build
npm run lint
```
