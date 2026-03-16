import { describe, test } from 'vitest'

// Schema: soft-delete and unique constraint validation
describe('Drizzle schema — soft-delete foundation', () => {
  test.todo('Schema: posts table has deletedAt timestamp column (nullable)')
  test.todo('Schema: user_city_roles table has unique index on (userId, cityId)')
  test.todo('Schema: posts table has status column with contentStatusEnum default active')
  test.todo('Schema: reports table has targetType and targetId columns')
  test.todo('Schema: isNull(posts.deletedAt) filter correctly excludes soft-deleted rows')
})
