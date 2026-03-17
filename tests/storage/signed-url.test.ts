import { describe, test } from 'vitest'

describe('getSignedUploadUrl Server Action (PLAC-03)', () => {
  test.todo('returns signedUrl, path, and token for authenticated user')
  test.todo('path includes postId and userId segments')
  test.todo('throws when Supabase storage returns error')
  test.todo('rejects unauthenticated callers')
})
