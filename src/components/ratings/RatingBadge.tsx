type Props = { avgRating: string | null; reviewCount: number | null }

export function RatingBadge({ avgRating, reviewCount }: Props) {
  if (!reviewCount) return null
  const display = parseFloat(avgRating ?? '0').toFixed(1)
  return (
    <span
      aria-label={`${display} stars from ${reviewCount} reviews`}
      className="inline-flex items-center gap-1 text-sm"
    >
      <span className="text-yellow-500">★</span>
      <span className="font-medium">{display}</span>
      <span className="text-neutral-500">({reviewCount})</span>
    </span>
  )
}
