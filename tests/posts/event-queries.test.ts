import { describe, test } from 'vitest'

describe('Active events query (EVNT-02)', () => {
  test.todo('excludes events where endsAt < NOW()')
  test.todo('includes events where endsAt IS NULL (no end time set)')
  test.todo('includes events where endsAt > NOW()')
  test.todo('excludes soft-deleted events (deletedAt IS NOT NULL)')
})
