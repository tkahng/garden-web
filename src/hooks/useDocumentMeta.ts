import { useEffect } from 'react'

export interface OpenGraphMeta {
  image?: string | null
  type?: 'website' | 'product' | 'article'
  url?: string | null
}

function setMeta(
  selector: string,
  attr: string,
  value: string,
): HTMLMetaElement {
  let el = document.querySelector<HTMLMetaElement>(selector)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr.startsWith('og:') || attr.startsWith('twitter:') ? 'property' : 'name', attr)
    document.head.appendChild(el)
  }
  el.setAttribute('content', value)
  return el
}

export function useDocumentMeta(
  title?: string | null,
  description?: string | null,
  og?: OpenGraphMeta,
) {
  const siteName = 'The Garden Shop'

  useEffect(() => {
    if (!title) return
    const fullTitle = `${title} — ${siteName}`
    const prev = document.title
    document.title = fullTitle
    const el = setMeta('meta[property="og:title"]', 'og:title', fullTitle)
    const twEl = setMeta('meta[name="twitter:title"]', 'twitter:title', fullTitle)
    return () => {
      document.title = prev
      el.setAttribute('content', prev)
      twEl.setAttribute('content', prev)
    }
  }, [title])

  useEffect(() => {
    if (!description) return
    const descEl = setMeta('meta[name="description"]', 'description', description)
    const ogEl = setMeta('meta[property="og:description"]', 'og:description', description)
    const twEl = setMeta('meta[name="twitter:description"]', 'twitter:description', description)
    const prevDesc = descEl.content
    return () => {
      descEl.setAttribute('content', prevDesc)
      ogEl.setAttribute('content', prevDesc)
      twEl.setAttribute('content', prevDesc)
    }
  }, [description])

  useEffect(() => {
    const type = og?.type ?? 'website'
    const el = setMeta('meta[property="og:type"]', 'og:type', type)
    return () => { el.setAttribute('content', 'website') }
  }, [og?.type])

  useEffect(() => {
    if (!og?.image) return
    const el = setMeta('meta[property="og:image"]', 'og:image', og.image)
    const twEl = setMeta('meta[name="twitter:image"]', 'twitter:image', og.image)
    const twCard = setMeta('meta[name="twitter:card"]', 'twitter:card', 'summary_large_image')
    return () => {
      el.setAttribute('content', '')
      twEl.setAttribute('content', '')
      twCard.setAttribute('content', 'summary')
    }
  }, [og?.image])

  useEffect(() => {
    const url = og?.url ?? window.location.href
    const el = setMeta('meta[property="og:url"]', 'og:url', url)
    return () => { el.setAttribute('content', window.location.href) }
  }, [og?.url])
}
