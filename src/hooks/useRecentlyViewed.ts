import { useState, useCallback } from 'react'

export interface RecentlyViewedItem {
  id: string
  handle: string
  title: string
  priceMin: number | null
  featuredImageUrl: string | null
}

const STORAGE_KEY = 'recently_viewed'
const MAX_ITEMS = 8

function readStorage(): RecentlyViewedItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as RecentlyViewedItem[]) : []
  } catch {
    return []
  }
}

function writeStorage(items: RecentlyViewedItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // quota exceeded — silently ignore
  }
}

export function useRecentlyViewed() {
  const [items, setItems] = useState<RecentlyViewedItem[]>(readStorage)

  const record = useCallback((item: RecentlyViewedItem) => {
    setItems((prev) => {
      const filtered = prev.filter((p) => p.id !== item.id)
      const next = [item, ...filtered].slice(0, MAX_ITEMS)
      writeStorage(next)
      return next
    })
  }, [])

  return { items, record }
}
