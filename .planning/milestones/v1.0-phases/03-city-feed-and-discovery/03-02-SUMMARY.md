---
phase: 03-city-feed-and-discovery
plan: "02"
subsystem: ui
tags: [next.js, react, server-component, feed, pagination, date-fns, tdd, vitest]

requires:
  - phase: 03-01
    provides: getFeedForCity, getCityBySlug, FeedPost, FeedCursor types

provides:
  - CityPage: public /cities/[slug] route with ISR revalidate=60
  - FeedCard: renders a single FeedPost (place or event) with title, badge, category, body excerpt, relative time
  - CategoryFilterTabs: Server Component with 9 category links and aria-current active state
  - FeedList: maps FeedCards, empty state, compound-cursor Load more link
  - loading.tsx: Suspense skeleton for city page

affects:
  - 03-03 (map view page renders within /cities/[slug] page shell)
  - 03-04 (city search links to /cities/[slug])

tech-stack:
  added: []
  patterns:
    - Next.js 16 async params/searchParams — await both Promise props before use
    - Server Component category tabs — pure Link nav, no useState or useRouter
    - Compound cursor Load more — URLSearchParams encoding cursor/cursorAt/category
    - ISR on public feed page — export const revalidate = 60

key-files:
  created:
    - src/app/cities/[slug]/page.tsx
    - src/app/cities/[slug]/loading.tsx
    - src/components/feed/FeedCard.tsx
    - src/components/feed/CategoryFilterTabs.tsx
    - src/components/feed/FeedList.tsx
  modified:
    - tests/feed/city-page.test.tsx
    - tests/feed/category-tabs.test.tsx

key-decisions:
  - "CategoryFilterTabs uses aria-current='page' (not a CSS class) on the active Link — accessible and testable without className inspection"
  - "FeedCard uses date-fns formatDistanceToNow for relative time and format(startsAt, 'PPp') for event start display"
  - "Load more href encodes cursor via URLSearchParams to handle ISO string special characters safely"
  - "category='all' is treated as no-filter in FeedList buildNextPageHref — omitted from Load more URL"

patterns-established:
  - "Server Component tabs: Link-based nav with aria-current, no client state"
  - "Async RSC test pattern: await Page({ params: Promise.resolve({...}), searchParams: Promise.resolve({...}) }) + act(render)"

requirements-completed: [FEED-01, FEED-02]

duration: 2min
completed: 2026-03-18
---

# Phase 3 Plan 02: City Feed Page Summary

**Public /cities/[slug] route with recency-first feed, 9-tab category filter (aria-current), FeedCard with relative timestamps, and Load-more cursor pagination — all Server Components, 0 client JS**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-18T17:37:38Z
- **Completed:** 2026-03-18T17:39:55Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Implemented CityPage as async Server Component at `/cities/[slug]` with ISR (`revalidate = 60`), awaiting Next.js 16 Promise params/searchParams
- Built CategoryFilterTabs with 9 tabs, correct hrefs, and `aria-current="page"` on active tab — no 'use client'
- Built FeedCard rendering title, contentType badge, CATEGORY_LABELS map (matching Phase 2), body excerpt, date-fns relative time, event startsAt
- Built FeedList with empty state and compound-cursor Load more link using URLSearchParams encoding
- 8 new tests pass; full suite 111 passed, 0 failures

## Task Commits

1. **Task 1: RED — failing tests for city page and category tabs** - `ee11474` (test)
2. **Task 2: GREEN — city feed page, FeedCard, CategoryFilterTabs, FeedList** - `f93bd62` (feat)

**Plan metadata:** (docs commit — see final commit hash)

_Note: TDD tasks have two commits (test RED → feat GREEN)_

## Files Created/Modified

- `src/app/cities/[slug]/page.tsx` - Async Server Component; getCityBySlug + getFeedForCity; ISR 60s
- `src/app/cities/[slug]/loading.tsx` - Suspense skeleton fallback
- `src/components/feed/FeedCard.tsx` - Single post card: title, badge, category label, body excerpt, timestamps
- `src/components/feed/CategoryFilterTabs.tsx` - 9-tab nav Server Component with aria-current
- `src/components/feed/FeedList.tsx` - List with empty state and Load more cursor link
- `tests/feed/city-page.test.tsx` - 3 tests: heading, post titles, notFound()
- `tests/feed/category-tabs.test.tsx` - 5 tests: hrefs, aria-current, tab count

## Decisions Made

- `aria-current="page"` on active Link tab — accessible standard; easier to assert in tests than CSS class inspection
- `URLSearchParams` for Load more href — safe encoding of ISO cursor strings (contains colons and dots)
- `category='all'` omitted from Load more URL params — server treats missing category as all

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- City feed page is live at `/cities/[slug]` with feed, filters, and pagination
- `<div id="map-placeholder" />` in CityPage ready for CityMap wiring in plan 03-04
- CategoryFilterTabs, FeedCard, FeedList ready for reuse or extension in 03-03/03-04

---
*Phase: 03-city-feed-and-discovery*
*Completed: 2026-03-18*
