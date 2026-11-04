import { useEffect } from 'react'
import { absoluteUrl, siteConfig } from '../config/site'

function upsertMeta(attribute, key, content) {
  let tag = document.head.querySelector(`meta[${attribute}="${key}"]`)

  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attribute, key)
    document.head.appendChild(tag)
  }

  tag.setAttribute('content', content)
}

function upsertLink(rel, href) {
  let tag = document.head.querySelector(`link[rel="${rel}"]`)

  if (!tag) {
    tag = document.createElement('link')
    tag.setAttribute('rel', rel)
    document.head.appendChild(tag)
  }

  tag.setAttribute('href', href)
}

export default function Seo({
  title,
  description,
  path = '/',
  image = '/images/hero-rack.jpg',
  type = 'website',
  noindex = false,
  jsonLd = null,
}) {
  useEffect(() => {
    const fullTitle = title?.includes(siteConfig.name)
      ? title
      : `${title} — ${siteConfig.name}`
    const canonical = absoluteUrl(path)
    const absoluteImage = image.startsWith('http')
      ? image
      : absoluteUrl(image)

    document.title = fullTitle

    upsertMeta('name', 'description', description)
    upsertMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow')
    upsertMeta('property', 'og:title', fullTitle)
    upsertMeta('property', 'og:description', description)
    upsertMeta('property', 'og:type', type)
    upsertMeta('property', 'og:url', canonical)
    upsertMeta('property', 'og:image', absoluteImage)
    upsertMeta('property', 'og:site_name', siteConfig.name)
    upsertMeta('name', 'twitter:card', 'summary_large_image')
    upsertMeta('name', 'twitter:title', fullTitle)
    upsertMeta('name', 'twitter:description', description)
    upsertMeta('name', 'twitter:image', absoluteImage)

    if (canonical) upsertLink('canonical', canonical)

    const scriptId = 'seo-jsonld'
    const existing = document.getElementById(scriptId)
    if (existing) existing.remove()

    if (jsonLd) {
      const script = document.createElement('script')
      script.type = 'application/ld+json'
      script.id = scriptId
      script.textContent = JSON.stringify(jsonLd)
      document.head.appendChild(script)
    }

    return () => {
      document.getElementById(scriptId)?.remove()
    }
  }, [title, description, path, image, type, noindex, jsonLd])

  return null
}
