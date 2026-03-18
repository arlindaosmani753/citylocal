type Props = {
  initialQuery?: string
}

export default function CitySearchForm({ initialQuery }: Props) {
  return (
    <form method="GET" action="/cities/search" aria-label="Search for a city">
      <input
        type="text"
        name="q"
        defaultValue={initialQuery ?? ''}
        placeholder="Search cities..."
      />
      <button type="submit">Search</button>
    </form>
  )
}
