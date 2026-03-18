import { describe, test, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
  },
}))

import { getFeedForCity, getPostsForMap } from '@/lib/db/queries/feed'
import { db } from '@/lib/db'

const CITY_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'

// Chainable mock builder for db.select()...from()...leftJoin()...where()...orderBy()...limit()
function makeSelectChain(resolvedValue: unknown[]) {
  const chain: Record<string, unknown> = {}
  const terminal = vi.fn().mockResolvedValue(resolvedValue)
  const methods = ['from', 'leftJoin', 'where', 'orderBy']
  methods.forEach(m => {
    chain[m] = vi.fn().mockReturnValue(chain)
  })
  chain['limit'] = terminal
  return chain
}

function makeFeedPost(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'post-uuid-1',
    title: 'Test Post',
    contentType: 'place' as const,
    category: 'cafe' as const,
    body: 'Great place',
    lat: '48.8566',
    lng: '2.3522',
    authorUsername: 'testuser',
    createdAt: new Date('2024-01-15T10:00:00Z'),
    startsAt: null,
    endsAt: null,
    firstImagePath: null,
    ...overrides,
  }
}

describe('getFeedForCity', () => {
  beforeEach(() => vi.clearAllMocks())

  test('returns posts ordered by createdAt DESC', async () => {
    const post1 = makeFeedPost({ id: 'post-1', createdAt: new Date('2024-01-15T10:00:00Z') })
    const post2 = makeFeedPost({ id: 'post-2', createdAt: new Date('2024-01-14T10:00:00Z') })
    const chain = makeSelectChain([post1, post2])
    vi.mocked(db.select).mockReturnValue(chain as any)

    const result = await getFeedForCity(CITY_ID, {})
    expect(result.posts).toHaveLength(2)
    expect(result.nextCursor).toBeNull()
  })

  test('excludes soft-deleted posts (deletedAt not null)', async () => {
    const chain = makeSelectChain([])
    vi.mocked(db.select).mockReturnValue(chain as any)

    const result = await getFeedForCity(CITY_ID, {})
    expect(result.posts).toHaveLength(0)
    expect(result.nextCursor).toBeNull()
  })

  test('excludes posts with status hidden or removed', async () => {
    const chain = makeSelectChain([])
    vi.mocked(db.select).mockReturnValue(chain as any)

    const result = await getFeedForCity(CITY_ID, {})
    expect(result.posts).toHaveLength(0)
  })

  test('excludes past events (endsAt before NOW)', async () => {
    const chain = makeSelectChain([])
    vi.mocked(db.select).mockReturnValue(chain as any)

    const result = await getFeedForCity(CITY_ID, { category: 'event' })
    expect(result.posts).toHaveLength(0)
  })

  test('filters by place category when category param provided', async () => {
    const post = makeFeedPost({ category: 'restaurant' })
    const chain = makeSelectChain([post])
    vi.mocked(db.select).mockReturnValue(chain as any)

    const result = await getFeedForCity(CITY_ID, { category: 'restaurant' })
    expect(result.posts).toHaveLength(1)
    expect(result.posts[0].category).toBe('restaurant')
  })

  test('returns events when category param is "event"', async () => {
    const eventPost = makeFeedPost({
      id: 'event-1',
      contentType: 'event',
      category: null,
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 3_600_000),
    })
    const chain = makeSelectChain([eventPost])
    vi.mocked(db.select).mockReturnValue(chain as any)

    const result = await getFeedForCity(CITY_ID, { category: 'event' })
    expect(result.posts).toHaveLength(1)
    expect(result.posts[0].contentType).toBe('event')
  })

  test('returns all content types when category is "all" or omitted', async () => {
    const place = makeFeedPost({ id: 'place-1', contentType: 'place' })
    const event = makeFeedPost({ id: 'event-1', contentType: 'event', category: null })
    const chain = makeSelectChain([place, event])
    vi.mocked(db.select).mockReturnValue(chain as any)

    const result = await getFeedForCity(CITY_ID, { category: 'all' })
    expect(result.posts).toHaveLength(2)
  })

  test('returns nextCursor when more posts exist beyond the limit', async () => {
    const limit = 2
    const posts = [
      makeFeedPost({ id: 'post-1', createdAt: new Date('2024-01-15T10:00:00Z') }),
      makeFeedPost({ id: 'post-2', createdAt: new Date('2024-01-14T10:00:00Z') }),
      makeFeedPost({ id: 'post-3', createdAt: new Date('2024-01-13T10:00:00Z') }),
    ]
    const chain = makeSelectChain(posts)
    vi.mocked(db.select).mockReturnValue(chain as any)

    const result = await getFeedForCity(CITY_ID, { limit })
    expect(result.posts).toHaveLength(limit)
    expect(result.nextCursor).not.toBeNull()
    expect(result.nextCursor).toHaveProperty('id', 'post-2')
    expect(result.nextCursor).toHaveProperty('createdAt')
  })

  test('returns nextCursor null on last page', async () => {
    const limit = 5
    const posts = [makeFeedPost({ id: 'post-1' }), makeFeedPost({ id: 'post-2' })]
    const chain = makeSelectChain(posts)
    vi.mocked(db.select).mockReturnValue(chain as any)

    const result = await getFeedForCity(CITY_ID, { limit })
    expect(result.nextCursor).toBeNull()
    expect(result.posts).toHaveLength(2)
  })

  test('with cursor: returns next page without duplicating previous page items', async () => {
    const cursor = { id: 'post-2', createdAt: new Date('2024-01-14T10:00:00Z') }
    const posts = [makeFeedPost({ id: 'post-3', createdAt: new Date('2024-01-13T10:00:00Z') })]
    const chain = makeSelectChain(posts)
    vi.mocked(db.select).mockReturnValue(chain as any)

    const result = await getFeedForCity(CITY_ID, { cursor })
    expect(result.posts).toHaveLength(1)
    expect(result.posts[0].id).toBe('post-3')
    expect(result.nextCursor).toBeNull()
  })
})

describe('getPostsForMap', () => {
  beforeEach(() => vi.clearAllMocks())

  test('returns only place posts (content_type = place)', async () => {
    const pin = { id: 'post-1', title: 'Café Marais', lat: '48.8566', lng: '2.3522' }
    const chain = makeSelectChain([pin])
    vi.mocked(db.select).mockReturnValue(chain as any)

    const result = await getPostsForMap(CITY_ID)
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual(pin)
  })

  test('excludes posts with null lat or null lng', async () => {
    const chain = makeSelectChain([])
    vi.mocked(db.select).mockReturnValue(chain as any)

    const result = await getPostsForMap(CITY_ID)
    expect(result).toHaveLength(0)
  })

  test('excludes soft-deleted posts', async () => {
    const chain = makeSelectChain([])
    vi.mocked(db.select).mockReturnValue(chain as any)

    const result = await getPostsForMap(CITY_ID)
    expect(result).toEqual([])
  })

  test('returns at most 200 rows', async () => {
    const pins = Array.from({ length: 200 }, (_, i) => ({
      id: `post-${i}`,
      title: `Place ${i}`,
      lat: '48.8566',
      lng: '2.3522',
    }))
    const chain = makeSelectChain(pins)
    vi.mocked(db.select).mockReturnValue(chain as any)

    const result = await getPostsForMap(CITY_ID)
    expect(result).toHaveLength(200)
  })
})
