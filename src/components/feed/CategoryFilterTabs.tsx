import Link from 'next/link'

const CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'restaurant', label: 'Restaurants' },
  { value: 'cafe', label: 'Cafes' },
  { value: 'bar', label: 'Bars' },
  { value: 'activity', label: 'Activities' },
  { value: 'sport', label: 'Sport' },
  { value: 'tourist_attraction', label: 'Attractions' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'event', label: 'Events' },
]

type Props = {
  activeCategory: string
  citySlug: string
}

export default function CategoryFilterTabs({ activeCategory, citySlug }: Props) {
  return (
    <nav aria-label="Category filter">
      {CATEGORIES.map(({ value, label }) => {
        const href =
          value === 'all'
            ? `/cities/${citySlug}`
            : `/cities/${citySlug}?category=${value}`
        const isActive = activeCategory === value

        return (
          <Link
            key={value}
            href={href}
            aria-current={isActive ? 'page' : undefined}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
