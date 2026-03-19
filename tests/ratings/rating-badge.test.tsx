import { render, screen } from '@testing-library/react'
import { describe, test, expect } from 'vitest'
import { RatingBadge } from '../../src/components/ratings/RatingBadge'
import { StarRating } from '../../src/components/ratings/StarRating'

// RATE-04: RatingBadge display component
describe('RatingBadge', () => {
  test('RatingBadge renders avg rating formatted to 1 decimal place', () => {
    render(<RatingBadge avgRating="4.2" reviewCount={17} />)
    expect(screen.getByText('4.2')).toBeTruthy()
  })

  test('RatingBadge renders review count', () => {
    render(<RatingBadge avgRating="3.5" reviewCount={5} />)
    expect(screen.getByText('(5)')).toBeTruthy()
  })

  test('RatingBadge renders nothing when reviewCount is 0 or null', () => {
    const { container: c1 } = render(<RatingBadge avgRating="4.0" reviewCount={0} />)
    expect(c1.firstChild).toBeNull()

    const { container: c2 } = render(<RatingBadge avgRating={null} reviewCount={null} />)
    expect(c2.firstChild).toBeNull()
  })

  test('RatingBadge has accessible aria-label with avg and count', () => {
    render(<RatingBadge avgRating="4.2" reviewCount={17} />)
    expect(screen.getByLabelText('4.2 stars from 17 reviews')).toBeTruthy()
  })
})

describe('StarRating', () => {
  test('StarRating renders correct number of filled stars', () => {
    const { container } = render(<StarRating value={3} />)
    const filled = container.querySelectorAll('.fill-yellow-400')
    expect(filled).toHaveLength(3)
  })

  test('StarRating renders correct number of empty stars', () => {
    const { container } = render(<StarRating value={3} />)
    const empty = container.querySelectorAll('.text-neutral-300')
    expect(empty).toHaveLength(2)
  })

  test('StarRating has accessible aria-label', () => {
    render(<StarRating value={4} />)
    expect(screen.getByLabelText('4 out of 5 stars')).toBeTruthy()
  })

  test('StarRating respects custom max', () => {
    const { container } = render(<StarRating value={2} max={3} />)
    const filled = container.querySelectorAll('.fill-yellow-400')
    const empty = container.querySelectorAll('.text-neutral-300')
    expect(filled).toHaveLength(2)
    expect(empty).toHaveLength(1)
  })
})

// FeedCard rating tests — deferred until FeedPost type includes avgRating (plan 04-03)
test.todo('FeedCard renders RatingBadge when avgRating and reviewCount are present')
test.todo('FeedCard renders nothing for rating when reviewCount is null')
