const read = (value) => String(value ?? '').trim()

const normaliseUrl = (value) => {
  const url = read(value)
  if (!url) return ''
  return /^https?:\/\//i.test(url) ? url : `https://${url}`
}

const socialDefinitions = [
  { key: 'instagram', label: 'Instagram', short: 'IG' },
  { key: 'tiktok', label: 'TikTok', short: 'TT' },
  { key: 'x', label: 'X', short: 'X' },
  { key: 'youtube', label: 'YouTube', short: 'YT' },
  { key: 'facebook', label: 'Facebook', short: 'FB' },
]

export const siteConfig = {
  name: 'StudentSoko',
  email: read(import.meta.env.VITE_CONTACT_EMAIL) || 'hello@studentsoko.co.ke',
  siteUrl:
    read(import.meta.env.VITE_SITE_URL) ||
    (typeof window !== 'undefined' ? window.location.origin : ''),
  whatsappNumber: read(import.meta.env.VITE_WHATSAPP_NUMBER).replace(
    /[^\d]/g,
    '',
  ),
  plausibleDomain: read(import.meta.env.VITE_PLAUSIBLE_DOMAIN),
  plausibleScript: normaliseUrl(
    import.meta.env.VITE_PLAUSIBLE_SCRIPT || 'https://plausible.io/js/script.js',
  ),
  socials: socialDefinitions
    .map((social) => ({
      ...social,
      href: normaliseUrl(import.meta.env[`VITE_${social.key.toUpperCase()}_URL`]),
    }))
    .filter((social) => social.href),
}

export function whatsappUrl(message = 'Hi StudentSoko! I have a question about an order.') {
  if (!siteConfig.whatsappNumber) return ''
  return `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(message)}`
}

export function absoluteUrl(pathname = '/') {
  if (!siteConfig.siteUrl) return pathname
  return `${siteConfig.siteUrl.replace(/\/$/, '')}${pathname}`
}
