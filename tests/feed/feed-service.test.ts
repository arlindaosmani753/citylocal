import { describe, test } from 'vitest'

describe('getFeedForCity', () => {
  test.todo('returns posts ordered by createdAt DESC')
  test.todo('excludes soft-deleted posts (deletedAt not null)')
  test.todo('excludes posts with status hidden or removed')
  test.todo('excludes past events (endsAt before NOW)')
  test.todo('filters by place category when category param provided')
  test.todo('returns events when category param is "event"')
  test.todo('returns all content types when category is "all" or omitted')
  test.todo('returns nextCursor when more posts exist beyond the limit')
  test.todo('returns nextCursor null on last page')
  test.todo('with cursor: returns next page without duplicating previous page items')
})

describe('getPostsForMap', () => {
  test.todo('returns only place posts (content_type = place)')
  test.todo('excludes posts with null lat or null lng')
  test.todo('excludes soft-deleted posts')
  test.todo('returns at most 200 rows')
})
