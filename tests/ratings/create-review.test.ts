import { test } from 'vitest'

// RATE-01: Star rating creation
test.todo('createReview inserts a review row with stars 1')
test.todo('createReview inserts a review row with stars 5')
test.todo('createReview rejects stars = 0 (below minimum)')
test.todo('createReview rejects stars = 6 (above maximum)')
test.todo('createReview blocks duplicate review from same user on same post')
test.todo('createReview returns error for unauthenticated caller')

// RATE-02: Optional written review body
test.todo('createReview accepts null body (review without text)')
test.todo('createReview accepts body up to 2000 chars')
test.todo('createReview rejects body longer than 2000 chars')

// RATE-04: rating_summary write-through in same transaction
test.todo('createReview upserts rating_summary with recalculated avg and count')
test.todo('second review from different user updates avgRating in rating_summary')
test.todo('deleteReview recalculates rating_summary after removal')
