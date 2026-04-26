import { StarIcon } from '@phosphor-icons/react'

export function StarRating({
  rating,
  max = 5,
  size = 16,
  interactive = false,
  onRate,
}: {
  rating: number
  max?: number
  size?: number
  interactive?: boolean
  onRate?: (rating: number) => void
}) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => {
        const filled = i < Math.round(rating)
        return interactive ? (
          <button
            key={i}
            type="button"
            aria-label={`Rate ${i + 1} star${i + 1 > 1 ? 's' : ''}`}
            onClick={() => onRate?.(i + 1)}
            className="text-yellow-400 hover:text-yellow-500 transition"
          >
            <StarIcon size={size} weight={filled ? 'fill' : 'regular'} />
          </button>
        ) : (
          <StarIcon
            key={i}
            size={size}
            weight={filled ? 'fill' : 'regular'}
            className={filled ? 'text-yellow-400' : 'text-muted-foreground/30'}
          />
        )
      })}
    </div>
  )
}
