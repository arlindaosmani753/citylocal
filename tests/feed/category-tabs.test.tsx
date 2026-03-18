import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import CategoryFilterTabs from '@/components/feed/CategoryFilterTabs'

describe('CategoryFilterTabs', () => {
  test('renders a link for each category including "All"', () => {
    render(
      <CategoryFilterTabs activeCategory="all" citySlug="paris-france" />
    )
    const links = screen.getAllByRole('link')
    // 9 tabs: All, Restaurants, Cafes, Bars, Activities, Sport, Attractions, Shopping, Events
    expect(links.length).toBe(9)
    expect(screen.getByText('All')).toBeInTheDocument()
    expect(screen.getByText('Restaurants')).toBeInTheDocument()
    expect(screen.getByText('Events')).toBeInTheDocument()
  })

  test('All tab href is /cities/[slug] with no query string', () => {
    render(
      <CategoryFilterTabs activeCategory="all" citySlug="paris-france" />
    )
    const allLink = screen.getByText('All').closest('a')
    expect(allLink).toHaveAttribute('href', '/cities/paris-france')
  })

  test('category tab href includes ?category=[value]', () => {
    render(
      <CategoryFilterTabs activeCategory="all" citySlug="paris-france" />
    )
    const restaurantsLink = screen.getByText('Restaurants').closest('a')
    expect(restaurantsLink).toHaveAttribute('href', '/cities/paris-france?category=restaurant')
    const eventsLink = screen.getByText('Events').closest('a')
    expect(eventsLink).toHaveAttribute('href', '/cities/paris-france?category=event')
  })

  test('"All" tab has aria-current="page" when activeCategory is "all"', () => {
    render(
      <CategoryFilterTabs activeCategory="all" citySlug="paris-france" />
    )
    const allLink = screen.getByText('All').closest('a')
    expect(allLink).toHaveAttribute('aria-current', 'page')
  })

  test('"Restaurants" tab has aria-current="page" when activeCategory is "restaurant"', () => {
    render(
      <CategoryFilterTabs activeCategory="restaurant" citySlug="paris-france" />
    )
    const restaurantsLink = screen.getByText('Restaurants').closest('a')
    expect(restaurantsLink).toHaveAttribute('aria-current', 'page')
    const allLink = screen.getByText('All').closest('a')
    expect(allLink).not.toHaveAttribute('aria-current', 'page')
  })
})
