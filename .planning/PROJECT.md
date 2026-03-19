# CityLocal — Community-Powered City Guide

## What This Is

CityLocal is a multi-city platform where locals GPS-verify and post the best restaurants, cafés, activities, tourist spots, and open community gatherings in their city — and tourists who visit those places rate and validate the recommendations. It's a living, community-driven guide powered by people who actually live there, not algorithms or travel corporations.

v1.0 shipped with full auth, GPS-verified content creation (places + events), city feed with map and search, and a complete ratings/review system — 26 requirements delivered across 4 phases in 6 days.

## Core Value

Authentic, GPS-verified local knowledge that tourists can trust — because every post comes from someone who was physically there.

## Requirements

### Validated

- ✓ User registration with email/password, email verification, persistent sessions — v1.0
- ✓ Password reset via email link — v1.0
- ✓ Per-city role model: self-declared home city + confirmed local after 3 GPS-verified posts — v1.0
- ✓ Any authenticated user can rate/review content — v1.0
- ✓ Public profile page showing contributions — v1.0
- ✓ Locals can post GPS-verified places (restaurant, café, bar, activity, sport, attraction, shopping) with photos — v1.0
- ✓ GPS proximity verified server-side at post time via PostGIS ST_DWithin — v1.0
- ✓ At least one photo required when creating a place post (Supabase Storage) — v1.0
- ✓ Place detail page with full info, photos, and ratings — v1.0
- ✓ Locals can post GPS-verified community events with date/time, location, optional recurrence — v1.0
- ✓ Events auto-hide past end date/time — v1.0
- ✓ Any user can RSVP to events — v1.0
- ✓ Recurring events (weekly/monthly) — v1.0
- ✓ Event detail page shows attendee count and RSVP list — v1.0
- ✓ City pages with recency-first feed of places and events — v1.0
- ✓ Feed filterable by content category — v1.0
- ✓ City search by name — v1.0
- ✓ Interactive map view of places on city page (Leaflet + OpenStreetMap) — v1.0
- ✓ Star ratings 1–5 on places and events visited — v1.0
- ✓ Optional written review alongside star score — v1.0
- ✓ Report/flag content as inappropriate — v1.0
- ✓ Average rating + review count displayed on cards and detail pages — v1.0

### Active

*(None — define for v1.1 via /gsd:new-milestone)*

### Out of Scope

| Feature | Reason |
|---------|--------|
| Native mobile app (iOS/Android) | Web-first to validate concept; mobile deferred |
| Algorithmic feed ranking / ML recommendations | Deliberately excluded — community ratings are the trust signal |
| Paid listings or sponsored content | Keeps authenticity; business model deferred |
| Real-time chat or messaging | High complexity, not core to city guide value |
| Video posts | Storage/bandwidth cost; defer to v2+ |
| Business owner verified accounts | Complex verification; defer to v2 |
| OAuth / magic link login | Deferred to v1.1 |
| Admin moderation dashboard | Deferred to v1.1 |
| Personalized recommendations | Deferred to v2.0 |

## Context

- **Current state (v1.0):** Full MVP shipped. ~3,600 lines TypeScript/TSX, 151 tests passing, 88 commits.
- **Tech stack:** Next.js 16 (App Router), Drizzle ORM, Supabase (Postgres + Auth + Storage), PostGIS, Tailwind v4, shadcn/ui, Vitest, React Testing Library, Leaflet/react-leaflet
- **Launch city:** Paris, France — seeded in DB with correct slug/coords/timezone
- **Known gaps:** Admin moderation for flagged content is in-DB only (no UI); 3 pre-existing TypeScript errors in city-page.test.tsx (do not affect runtime)

## Constraints

- **GPS/Location**: Web Geolocation API for GPS verification at post time — requires HTTPS
- **Scope**: v1 is web app only; mobile native deferred
- **Moderation**: Community-driven ratings as primary trust signal; no manual moderation team in v1

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Locals post, tourists rate | Clear role separation prevents confusion and spam | ✓ Good — clean UX boundary |
| GPS verification at post time | Ensures authenticity without ID verification overhead | ✓ Good — PostGIS ST_DWithin works well |
| Feed-first city page | Shows recency and activity; builds sense of living community | ✓ Good — map available as secondary view |
| Web-first | Fastest path to validate the concept | ✓ Good — Geolocation API covers GPS on mobile browsers |
| Launch city: Paris, France | World's most visited city; ideal seed city for content density | ✓ Good — seed data in place |
| Unified posts table (content_type discriminator) | Simplifies feed queries; places and events share GPS/photo logic | ✓ Good — compound cursor pagination cleaner |
| Transactional write-through for rating_summary | Avoids expensive aggregation queries on read path | ✓ Good — feed join is O(1) per post |
| Wave 0 Nyquist stubs before implementation | Test baseline enforces no regressions; makes TDD cycle reliable | ✓ Good — adopted every phase |

---
*Last updated: 2026-03-19 after v1.0 milestone*
