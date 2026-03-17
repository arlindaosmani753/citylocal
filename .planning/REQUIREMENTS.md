# Requirements: CityLocal

**Defined:** 2026-03-13
**Core Value:** Authentic, GPS-verified local knowledge that tourists can trust — because every post comes from someone who was physically there.

## v1 Requirements

### Authentication

- [x] **AUTH-01**: User can create an account with email and password
- [x] **AUTH-02**: User receives email verification link after signup and must verify before posting
- [x] **AUTH-03**: User can request a password reset via email link
- [x] **AUTH-04**: User session persists across browser refresh

### User Roles

- [x] **ROLE-01**: User declares a home city when registering (self-declared local)
- [x] **ROLE-02**: User earns confirmed local status in a city after 3+ GPS-verified posts from that city
- [x] **ROLE-03**: Any authenticated user can rate/review places and events they have visited
- [x] **ROLE-04**: User has a public profile page showing their contributions and average rating received

### Places

- [x] **PLAC-01**: Local (or user with GPS verification) can post a place with name, category, and description
- [ ] **PLAC-02**: GPS location is verified server-side at post time — user must be physically within proximity of the place
- [x] **PLAC-03**: User can upload at least one photo when creating a place post
- [ ] **PLAC-04**: Each place has a dedicated detail page showing full info, photos, and ratings
- [x] **PLAC-05**: Place categories include: Restaurant, Café, Bar, Activity, Sport, Tourist Attraction, Shopping, Other

### Events

- [x] **EVNT-01**: Local can post an open community event with name, description, date/time, and location (GPS-verified)
- [ ] **EVNT-02**: Events automatically hide from the feed after their end date/time passes
- [x] **EVNT-03**: Any user can RSVP "I'm attending" to an event
- [x] **EVNT-04**: Local can create a recurring event with a repeat pattern (weekly, monthly)
- [ ] **EVNT-05**: Event detail page shows attendee count and RSVP list

### City Feed & Discovery

- [ ] **FEED-01**: Each city has a public page showing a chronological feed of recent place posts and events
- [ ] **FEED-02**: City feed can be filtered by content category (restaurants, events, activities, etc.)
- [ ] **FEED-03**: User can search for a city by name and navigate to its city page
- [ ] **FEED-04**: City page has an interactive map view showing all places as pins

### Ratings & Trust

- [ ] **RATE-01**: Any authenticated user can leave a star rating (1–5) on a place or event they visited
- [ ] **RATE-02**: Rating includes an optional written review alongside the star score
- [ ] **RATE-03**: Any user can report/flag a place, event, or review as inappropriate
- [ ] **RATE-04**: Average rating and total review count are displayed on place and event cards and detail pages

## v2 Requirements

### Authentication

- **AUTH-V2-01**: OAuth login via Google or Facebook
- **AUTH-V2-02**: Magic link (passwordless) login

### Discovery

- **DISC-V2-01**: Personalized recommendations based on past ratings
- **DISC-V2-02**: "Trending this week" section on city page
- **DISC-V2-03**: Nearby cities suggestions

### Social

- **SOCL-V2-01**: Follow other users and see their contributions in a personal feed
- **SOCL-V2-02**: Share a place or event via public link

### Moderation

- **MODR-V2-01**: Admin dashboard to review flagged content and take action
- **MODR-V2-02**: Ability to ban or suspend abusive users

### Notifications

- **NOTF-V2-01**: In-app notification when someone rates your posted place
- **NOTF-V2-02**: Reminder notification before an event you RSVP'd to

## Out of Scope

| Feature | Reason |
|---------|--------|
| Native mobile app (iOS/Android) | Web-first to validate concept; mobile deferred |
| Algorithmic feed ranking / ML recommendations | Deliberately excluded — community ratings are the trust signal |
| Paid listings or sponsored content | Keeps authenticity; business model deferred |
| Real-time chat or messaging | High complexity, not core to city guide value |
| Video posts | Storage/bandwidth cost; defer to v2+ |
| Business owner verified accounts | Complex verification; defer to v2 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 1 | Complete |
| AUTH-03 | Phase 1 | Complete |
| AUTH-04 | Phase 1 | Complete |
| ROLE-01 | Phase 1 | Complete |
| ROLE-02 | Phase 1 | Complete |
| ROLE-03 | Phase 1 | Complete |
| ROLE-04 | Phase 1 | Complete |
| PLAC-01 | Phase 2 | Complete |
| PLAC-02 | Phase 2 | Pending |
| PLAC-03 | Phase 2 | Complete |
| PLAC-04 | Phase 2 | Pending |
| PLAC-05 | Phase 2 | Complete |
| EVNT-01 | Phase 2 | Complete |
| EVNT-02 | Phase 2 | Pending |
| EVNT-03 | Phase 2 | Complete |
| EVNT-04 | Phase 2 | Complete |
| EVNT-05 | Phase 2 | Pending |
| FEED-01 | Phase 3 | Pending |
| FEED-02 | Phase 3 | Pending |
| FEED-03 | Phase 3 | Pending |
| FEED-04 | Phase 3 | Pending |
| RATE-01 | Phase 4 | Pending |
| RATE-02 | Phase 4 | Pending |
| RATE-03 | Phase 4 | Pending |
| RATE-04 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 26 total
- Mapped to phases: 26
- Unmapped: 0

---
*Requirements defined: 2026-03-13*
*Last updated: 2026-03-13 after roadmap creation*
