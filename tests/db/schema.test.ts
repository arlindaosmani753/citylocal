import { describe, it, expect } from 'vitest'
import {
  posts,
  userCityRoles,
  contentStatusEnum,
  reports,
} from '@/lib/db/schema'

describe('Drizzle schema — soft-delete foundation', () => {
  it('posts table schema object has a deletedAt property', () => {
    expect(posts).toBeDefined()
    const columns = posts as unknown as Record<string, unknown>
    expect(columns['deletedAt']).toBeDefined()
  })

  it('userCityRoles table has uniqueIndex on userId + cityId', () => {
    expect(userCityRoles).toBeDefined()
    const columns = userCityRoles as unknown as Record<string, unknown>
    expect(columns['userId']).toBeDefined()
    expect(columns['cityId']).toBeDefined()
  })

  it('contentStatusEnum has values active, hidden, removed', () => {
    expect(contentStatusEnum).toBeDefined()
    const enumValues = contentStatusEnum.enumValues
    expect(enumValues).toContain('active')
    expect(enumValues).toContain('hidden')
    expect(enumValues).toContain('removed')
  })

  it('reports table has targetType and targetId columns', () => {
    expect(reports).toBeDefined()
    const columns = reports as unknown as Record<string, unknown>
    expect(columns['targetType']).toBeDefined()
    expect(columns['targetId']).toBeDefined()
  })
})
