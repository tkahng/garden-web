import { useEffect } from 'react'

export function useDocumentMeta(
  title?: string | null,
  description?: string | null,
) {
  useEffect(() => {
    if (!title) return
    const prev = document.title
    document.title = `${title} — The Garden Shop`
    return () => {
      document.title = prev
    }
  }, [title])

  useEffect(() => {
    if (!description) return
    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute('name', 'description')
      document.head.appendChild(meta)
    }
    const prev = meta.content
    meta.content = description
    return () => {
      if (meta) meta.content = prev
    }
  }, [description])
}
