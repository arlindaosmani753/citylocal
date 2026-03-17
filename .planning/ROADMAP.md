# Roadmap: CityLocal

## Overview

CityLocal builds in four phases that follow the hard dependency chain of the product: identity and trust infrastructure first, then GPS-verified content creation (places and events unified), then the city feed and discovery surface tourists arrive at, then the ratings loop that closes the two-sided market. Each phase delivers a coherent, verifiable capability. Nothing ships until the layer below it is solid.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Auth, per-city roles, soft-delete, and report mechanism — the prerequisite for everything (completed 2026-03-16)
- [ ] **Phase 2: Content Creation** - GPS-verified place and event posting on a unified posts table
- [ ] **Phase 3: City Feed and Discovery** - Public city pages with feed, filters, search, and map
- [ ] **Phase 4: Ratings and Trust** - Tourist reviews and rating aggregation close the two-sided market

## Phase Details

### Phase 1: Foundation
**Goal**: Users can register, authenticate, and carry the correct per-city role — and every piece of content can be soft-deleted or flagged from day one
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, ROLE-01, ROLE-02, ROLE-03, ROLE-04
**Success Criteria** (what must be TRUE):
  1. A new user can create an account with email and password, verify their email, and log in — session persists across browser refresh
  2. A user can reset a forgotten password via an email link
  3. A user who has made 3+ GPS-verified posts in a city is treated as a local in that city, not in cities where they have not posted
  4. Any authenticated user can rate/review content (role enforcement is in place for post gating)
  5. A user's public profile page exists and shows their contributions
**Plans**: 5 plans

Plans:
- [ ] 01-00-PLAN.md — Test infrastructure and failing stubs (Wave 0, Nyquist prerequisite)
- [ ] 01-01-PLAN.md — Next.js 16 scaffold, Drizzle schema (all 5 tables), Supabase clients, env validation
- [ ] 01-02-PLAN.md — Auth flows: registration, email verification, login, password reset, middleware
- [ ] 01-03-PLAN.md — Per-city role model: isUserLocalInCity query, requireAuth guards, Paris seed data
- [ ] 01-04-PLAN.md — Public profile page, auth layout, error page; human verification checkpoint

### Phase 2: Content Creation
**Goal**: GPS-verified locals can post places and community events, with photo uploads, on a single unified posts table
**Depends on**: Phase 1
**Requirements**: PLAC-01, PLAC-02, PLAC-03, PLAC-04, PLAC-05, EVNT-01, EVNT-02, EVNT-03, EVNT-04, EVNT-05
**Success Criteria** (what must be TRUE):
  1. A local (3+ GPS-verified posts in that city) can create a place post with name, category, description, and at least one photo — only when physically within proximity of the place (GPS verified server-side)
  2. A created place has a dedicated detail page showing full info, photos, and the place's category
  3. A local can post a community event with name, description, date/time, and GPS-verified location — any user can RSVP
  4. A recurring event can be created with a weekly or monthly repeat pattern
  5. Events past their end date/time no longer appear in the feed; event detail pages show attendee count and RSVP list
**Plans**: TBD

Plans:
- [ ] 02-01: Unified posts table schema (content_type discriminator, GPS fields, EXIF stripping, photo storage)
- [ ] 02-02: GeoService and CityResolver (server-side ST_DWithin proximity check, accuracy validation, 5-minute expiry, velocity rate limiting)
- [ ] 02-03: Place creation flow (form, GPS capture hook, server action, category enum, place detail page)
- [ ] 02-04: Event creation flow (date/time fields, recurring pattern, RSVP model, auto-expiry logic, event detail page)

### Phase 3: City Feed and Discovery
**Goal**: Any visitor can reach a city page and browse, filter, search, and map-locate all local posts
**Depends on**: Phase 2
**Requirements**: FEED-01, FEED-02, FEED-03, FEED-04
**Success Criteria** (what must be TRUE):
  1. A city page loads with a public, recency-first feed of all place posts and events for that city
  2. The feed can be filtered by content category (restaurants, events, activities, etc.) without a full page reload
  3. A visitor can search for a city by name and navigate to its city page
  4. The city page has an interactive map view showing all places as pins
**Plans**: TBD

Plans:
- [ ] 03-01: FeedService with cursor-based pagination (compound index on city_id + created_at DESC, 60-second polling)
- [ ] 03-02: City feed page (public route, recency-first, category filter tabs)
- [ ] 03-03: City search and multi-city navigation
- [ ] 03-04: Interactive map view (Leaflet + OpenStreetMap tiles, place pins)

### Phase 4: Ratings and Trust
**Goal**: Tourists can rate and review places and events they visited — ratings are visible everywhere content appears
**Depends on**: Phase 3
**Requirements**: RATE-01, RATE-02, RATE-03, RATE-04
**Success Criteria** (what must be TRUE):
  1. Any authenticated user can leave a 1–5 star rating on a place or event, with an optional written review
  2. Average rating and total review count appear on place and event cards in the feed and on detail pages
  3. Any user can report/flag a place, event, or review as inappropriate — flagged content enters the soft-delete queue
**Plans**: TBD

Plans:
- [ ] 04-01: Review model and rating_summary denormalized table (write-through on review submission)
- [ ] 04-02: Rating/review UI (star input, review form, role-gated submission, report/flag integration)
- [ ] 04-03: Rating display on feed cards and detail pages (aggregate query from rating_summary)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 5/5 | Complete   | 2026-03-16 |
| 2. Content Creation | 3/5 | In Progress|  |
| 3. City Feed and Discovery | 0/4 | Not started | - |
| 4. Ratings and Trust | 0/3 | Not started | - |
