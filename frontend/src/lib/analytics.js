import { siteConfig } from '../config/site'

let scriptInjected = false

export function initAnalytics() {
  if (
    scriptInjected ||
    !siteConfig.plausibleDomain ||
    typeof document === 'undefined'
  ) {
    return
  }

  const script = document.createElement('script')
  script.defer = true
  script.src = siteConfig.plausibleScript
  script.dataset.domain = siteConfig.plausibleDomain
  document.head.appendChild(script)
  scriptInjected = true
}

export function trackEvent(name, props = {}) {
  if (typeof window === 'undefined') return
  if (typeof window.plausible !== 'function') return

  window.plausible(name, { props })
}
