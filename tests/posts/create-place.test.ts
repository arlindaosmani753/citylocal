import { describe, test } from 'vitest'

describe('createPlace Server Action', () => {
  // PLAC-01
  test.todo('validates name, category, description fields via zod')
  test.todo('rejects unauthenticated callers with redirect')
  test.todo('rejects non-locals (isUserLocalInCity returns false)')
  // PLAC-02
  test.todo('calls verifyGpsProximity and rejects when it returns verified:false')
  test.todo('creates post row with correct contentType=place and cityId')
  // PLAC-03
  test.todo('inserts into post_images table with correct postId and storagePath')
  // PLAC-05
  test.todo('rejects invalid category not in placeCategoryEnum')
  test.todo('accepts all 8 valid place categories')
})
