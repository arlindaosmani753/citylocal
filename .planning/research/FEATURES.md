# Feature Research

**Domain:** Community city guide / local discovery platform (dual-role: Locals post, Tourists rate)
**Researched:** 2026-03-13
**Confidence:** MEDIUM — training knowledge of TripAdvisor, Yelp, Google Maps, Foursquare/Swarm, Meetup, Airbnb Experiences; no live web search available. Patterns are well-established; specifics may have evolved.

---

## Competitor Reference Set

| Platform | Relevance to CityLocal |
|----------|------------------------|
| TripAdvisor | City guides, tourist-facing reviews, attraction/restaurant listings |
| Yelp | Local business discovery, check-ins, reviews, community events |
| Google Maps | Place listings, user reviews, photos, local guides program |
| Foursquare / Swarm | Check-in mechanics, local tips, venue authority |
| Meetup | Community events, group gatherings, RSVP |
| Airbnb Experiences | Local-hosted activities, trust through identity |
| Spotted by Locals | Curated local tips specifically for travellers — closest concept match |

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing = product feels broken or untrustworthy.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| User registration + profiles | Every social/community platform has identity; anonymous posts are untrusted | LOW | Must distinguish Local vs Tourist role at registration; home city declaration for locals |
| City pages (browse by city) | Entry point to discovery; competitors all organize by city/location | LOW | Feed-first per PROJECT.md decision; city slug routing (e.g., /city/istanbul) |
| Place listings (restaurants, cafes, attractions, activities) | Core content unit; what every city guide offers | MEDIUM | Categories: Food & Drink, Things To Do, Hidden Gems, Attractions, Sports — flexible taxonomy needed |
| Place detail pages | Users need a canonical page per place to aggregate reviews + photos | MEDIUM | Name, description, location/map embed, category, who posted, when, tourist ratings |
| Tourist ratings and reviews | Trust signal; TripAdvisor/Yelp established this as mandatory | MEDIUM | Star rating (1–5) + optional text review; only tourists who "visited" should rate |
| Photo uploads on places | Visual trust signal; users won't believe a listing without photos | MEDIUM | At minimum 1–3 photos per place post; storage cost consideration |
| Search within a city | Users need to find a specific place or type of place | MEDIUM | Search by name and category; full-text across place names/descriptions |
| Map view for places | Spatial orientation is expected from any location-based product | MEDIUM | Embedded map (Leaflet + OpenStreetMap or Google Maps); pin cluster view |
| Event listings (community gatherings) | Meetup-style events are expected alongside permanent places; PROJECT.md explicitly requires this | MEDIUM | Event type: date/time, location, description, who posted; different from permanent places |
| Mobile-responsive web UI | Most users will access on phone; non-responsive = unusable | LOW | Web-first but must be touch-friendly; PROJECT.md defers native app |
| HTTPS | Required for Geolocation API; also user trust baseline | LOW | Mandatory for GPS verification to work at all |
| Content categories / filtering | Users want to narrow feed by type (food, activities, events) | LOW | Filter on city feed; helps both locals and tourists navigate |
| Notification of GPS denial | If GPS is blocked, local must understand why posting fails | LOW | Clear browser permission prompts and fallback messaging |

### Differentiators (Competitive Advantage)

Features that set CityLocal apart. Aligned with core value: GPS-verified local authorship + community events in one place.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| GPS verification at post time | The defining trust mechanism — locals must physically be at/near the place to post it. No other major city guide requires this. Eliminates fake listings and remote content farms. | HIGH | Web Geolocation API; must capture lat/lng at submission and compare against place coordinates with tolerance (e.g., 200m radius); HTTPS required; needs graceful degradation messaging |
| Dual user roles (Local / Tourist) | Clear role separation creates content quality gradient: locals know the place, tourists validate it. Prevents review bombing by people who never visited. | MEDIUM | Role set at registration; Tourists can only rate/review, not post places; role badge on profiles and content |
| "Living" city feed (recency-first) | Shows community activity right now — not static category lists. Feels like a pulse of the city. TripAdvisor/Yelp are category-browse; this is stream-based. | LOW | Reverse-chronological post feed scoped to a city; encourages regular posting by locals |
| Community events alongside permanent places | No major platform combines "best restaurant" and "open community gathering on Sunday" in one feed. Meetup does events but not places. Yelp does places but events are secondary. | MEDIUM | Unified content type model with sub-type: place vs. event; event has datetime fields; expired events should auto-archive |
| Tourist visit confirmation before rating | Tourists rate only places they've visited — enforced by a "I visited this" confirmation step (not GPS-required for tourists, but self-declared visit). Reduces review fraud. | LOW | Visit flag on tourist review submission; no GPS required for tourists, just intent declaration |
| Local reputation / post history | Locals who post frequently in a city build visible credibility. Encourages quality contributors. Not algorithmic ranking — just a visible post count and joined date. | LOW | Public profile: post count, city, member since; no gamification points initially |
| City "heartbeat" (activity metrics) | Show how active a city's community is — number of posts this week, recent tourist ratings. Helps tourists choose which city guide to trust. | LOW | Aggregate counts per city; no ML required |
| Multi-city from day one | Competitor platforms are US/EU-centric or require business partnership. Any city in the world can bootstrap here. | MEDIUM | City model must support any world city; no editorial gatekeeping on city creation |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem valuable but create problems for this specific platform at this stage.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Algorithmic recommendations ("You might like...") | Users are accustomed to Netflix/Spotify-style suggestions | Contradicts core value of authentic community signals; adds ML complexity; training data cold start problem for new cities; PROJECT.md explicitly out of scope | Recency feed + community ratings ARE the discovery mechanism; sort by highest-rated in category |
| Paid / sponsored listings | Revenue stream; TripAdvisor/Google do this | Destroys authentic local curation; sponsored content is why users distrust the incumbents; PROJECT.md explicit no for v1 | Explore community features or premium local profiles post-validation |
| Permanent GPS tracking / location history | Richer personalization; check-in history | Privacy concerns; browser GPS is not designed for persistent tracking; chills posting behavior; GDPR complexity | Single GPS check at post time only — ephemeral, not stored long-term |
| Full business owner claim/management | Businesses want to update their own info like Yelp/Google | Creates conflict between local-curated authenticity and business marketing; locals should own the narrative | Locals can update their own posts; business response can be considered in v2 |
| Upvote/downvote on posts | Reddit-style community curation | Can be gamed; creates popularity bias over recency; undermines the feed-first model | Tourists rate after visiting; local post count as credibility proxy |
| Real-time chat / messaging | Community engagement; Meetup has this | High complexity; moderation burden; not core to discovery use case | Comment thread on individual places/events is sufficient social layer |
| Native mobile app (iOS/Android) | Better UX; GPS reliability on mobile | Doubles build/maintenance cost; PROJECT.md explicitly defers; web Geolocation API works on mobile browsers | PWA with geolocation on mobile web browser; revisit after validation |
| Follower/following social graph | Social networks drive engagement loops | Distracts from place-centric discovery; encourages influencer behavior over authentic local knowledge | City-scoped feed naturally connects locals to tourists without follower graphs |
| Automatic place data import (Google Places API) | Pre-populate place database; less work for locals | Defeats the purpose — GPS-verified local knowledge is the differentiator; imported places have no GPS attestation | All places must be human-posted with GPS verification |

---

## Feature Dependencies

```
User Registration + Roles (Local/Tourist)
    └──requires──> City Pages
                       └──requires──> Place Listings
                                          └──requires──> GPS Verification at Post Time [Local only]
                                          └──enhances──> Photo Uploads
                                          └──enhances──> Map View

Tourist Ratings + Reviews
    └──requires──> Place Listings (something to rate)
    └──requires──> User Registration + Roles (must be Tourist role)
    └──enhances──> Place Detail Pages (aggregated rating display)

Event Listings
    └──requires──> User Registration + Roles (must be Local role)
    └──requires──> GPS Verification at Post Time
    └──requires──> City Pages (events scoped to a city)
    └──conflicts──> Place Listings schema (events have datetime; need unified content model)

City Feed (recency-first)
    └──requires──> City Pages
    └──requires──> Place Listings + Event Listings (content to display)
    └──enhances──> Content Categories / Filtering

Search Within City
    └──requires──> Place Listings + Event Listings (content to index)
    └──requires──> City Pages (search is city-scoped)

Map View
    └──requires──> Place Listings (lat/lng coordinates stored at GPS verification time)
    └──enhances──> Place Detail Pages

Local Reputation / Post History
    └──requires──> User Registration + Roles
    └──requires──> Place Listings (posts to count)
    └──enhances──> Tourist Ratings (tourists can see local's credibility)

Tourist Visit Confirmation
    └──requires──> Tourist Ratings + Reviews
    └──enhances──> GPS Verification trust model (tourist-side validation)
```

### Dependency Notes

- **GPS Verification requires HTTPS:** Browser Geolocation API is blocked on non-HTTPS origins. Infrastructure must have TLS from day one — not optional.
- **Event Listings conflicts with Place Listings schema:** Events have start/end datetime and expire; places are permanent. A unified content type with a sub-type discriminator (place | event) avoids two separate data models while preserving distinct behavior.
- **Tourist Ratings require Place Listings:** Tourists can only rate something that already exists. The Local posting workflow must come before Tourist rating workflow in the build sequence.
- **Map View requires stored coordinates:** GPS coordinates must be persisted at post time (from the verification check) — they become the map pin. This means GPS verification isn't just a gate; it's a data-capture step.
- **City Feed enhances Content Categories:** Without filtering, a busy city feed becomes overwhelming. Category filter is low complexity but high UX value once a city has 20+ posts.

---

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the core concept: GPS-verified local knowledge that tourists trust.

- [ ] User registration with role selection (Local / Tourist) and home city for Locals — validates the dual-role model
- [ ] City pages with recency feed — validates feed-first discovery
- [ ] Local can post a place with GPS verification (must be physically near the location) — validates the core trust mechanism
- [ ] Local can post a community event with GPS verification — validates unified place+event content model
- [ ] Tourist can rate and review a place (1–5 stars + text) — validates the tourist validation loop
- [ ] Place detail page aggregating ratings and photos — validates trust signal display
- [ ] Photo upload on place posts (at least 1 photo) — validates visual authenticity
- [ ] Basic category filtering on city feed — validates navigability
- [ ] Multi-city support (any city can be created) — validates the global-first model
- [ ] Mobile-responsive web UI — validates on-the-go posting by locals and browsing by tourists

### Add After Validation (v1.x)

Features to add once core posting + rating loop is working and used.

- [ ] Map view of places in a city — add when city feeds have enough content density to be worth exploring spatially
- [ ] Search within a city — add when individual cities have 50+ listings and discovery becomes a pain point
- [ ] Local reputation / post history on public profiles — add when repeat local contributors emerge
- [ ] Tourist visit confirmation before rating — add when rating spam becomes observable
- [ ] Event expiry / auto-archive for past events — add immediately after events feature, but can be a follow-up iteration
- [ ] City "heartbeat" activity metrics — add when multiple cities exist and comparison becomes valuable

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] Native mobile app (iOS/Android) — defer; validate web-first; GPS on mobile web is sufficient for v1
- [ ] Comment threads on individual places/events — defer; adds moderation complexity; validate core discovery loop first
- [ ] Business response / claim mechanism — defer; only relevant after businesses notice the platform
- [ ] PWA / offline support — defer; adds service worker complexity; validate core use case first
- [ ] Multi-language / localization — defer; English-first is pragmatic for global validation

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| User registration + roles | HIGH | LOW | P1 |
| City pages + recency feed | HIGH | LOW | P1 |
| Place listings (Local post) | HIGH | MEDIUM | P1 |
| GPS verification at post time | HIGH | HIGH | P1 |
| Tourist ratings + reviews | HIGH | MEDIUM | P1 |
| Photo uploads | HIGH | MEDIUM | P1 |
| Event listings (community) | HIGH | MEDIUM | P1 |
| Place detail pages | HIGH | MEDIUM | P1 |
| Mobile-responsive UI | HIGH | LOW | P1 |
| HTTPS / TLS infrastructure | HIGH | LOW | P1 |
| Content category filtering | MEDIUM | LOW | P2 |
| Map view | MEDIUM | MEDIUM | P2 |
| Search within city | MEDIUM | MEDIUM | P2 |
| Local reputation / post history | MEDIUM | LOW | P2 |
| Tourist visit confirmation | MEDIUM | LOW | P2 |
| Event expiry / auto-archive | MEDIUM | LOW | P2 |
| City heartbeat metrics | LOW | LOW | P3 |
| Comment threads | LOW | MEDIUM | P3 |
| PWA / offline | LOW | HIGH | P3 |
| Native mobile app | HIGH | HIGH | P3 (deferred by design) |

---

## Competitor Feature Analysis

| Feature | TripAdvisor | Yelp | Google Maps | Meetup | CityLocal Approach |
|---------|-------------|------|-------------|--------|--------------------|
| Place listings | Yes — business-driven | Yes — business-driven | Yes — Google-aggregated | No | Local-posted, GPS-verified |
| Reviews/ratings | Yes — any user | Yes — any user | Yes — any user | No | Tourist-only after visiting |
| Check-in / GPS verification | No (historical check-ins removed) | Yes — voluntary check-in | Passive location history | No | Mandatory GPS at post time (locals only) |
| Community events | Limited | Yes but secondary | Yes via Google Events | Yes — core product | Equal first-class citizen alongside places |
| Local author distinction | "Local Experts" program — badge only | "Elite" status — gamified | "Local Guides" — points-based | Organizers vs attendees | Hard role separation at registration; GPS enforces it |
| City feed / activity stream | No — category browse | No — category browse | No — search-first | Yes — group feed | Feed-first, city-scoped, recency ordered |
| Algorithmic curation | Yes — heavy ML | Yes — Yelp Sort | Yes — Google ranking | Yes | Deliberately absent; community ratings only |
| Paid listings | Yes — pervasive | Yes — pervasive | Yes — ads | Yes — promoted | Explicitly no for v1 |
| Multi-city / global | Yes | US-focused | Global | Global | Global from day one |
| Mobile-first | Native apps primary | Native apps primary | Native apps primary | Native apps primary | Web-first, mobile-responsive |

---

## Sources

- TripAdvisor product features: training knowledge (platform used extensively through Aug 2025) — MEDIUM confidence
- Yelp product features: training knowledge — MEDIUM confidence
- Google Maps / Local Guides program: training knowledge — MEDIUM confidence
- Foursquare/Swarm check-in mechanics: training knowledge — MEDIUM confidence
- Meetup event platform features: training knowledge — MEDIUM confidence
- Web Geolocation API capabilities: MDN documentation patterns — HIGH confidence (well-established web API)
- Spotted by Locals (local-curated city guides): training knowledge — LOW confidence (smaller platform, less coverage)
- PROJECT.md requirements and constraints: HIGH confidence (authoritative source for this project)

---
*Feature research for: Community city guide platform (CityLocal)*
*Researched: 2026-03-13*
