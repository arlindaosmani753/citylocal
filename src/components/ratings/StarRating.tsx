import { Star } from 'lucide-react'

type Props = { value: number; max?: number }

export function StarRating({ value, max = 5 }: Props) {
  return (
    <span aria-label={`${value} out of ${max} stars`} className="inline-flex gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          size={16}
          className={i < value ? 'fill-yellow-400 text-yellow-400' : 'text-neutral-300'}
        />
      ))}
    </span>
  )
}
