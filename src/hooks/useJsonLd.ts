import { useEffect } from 'react'

export function useJsonLd(schema: Record<string, unknown> | null) {
  useEffect(() => {
    if (!schema) return
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify(schema)
    document.head.appendChild(script)
    return () => { document.head.removeChild(script) }
  }, [JSON.stringify(schema)]) // eslint-disable-line react-hooks/exhaustive-deps
}
