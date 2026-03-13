# CityLocal — Community-Powered City Guide

## What This Is

CityLocal is a multi-city platform where locals GPS-verify and post the best restaurants, cafés, activities, tourist spots, and open community gatherings in their city — and tourists who visit those places rate and validate the recommendations. It's a living, community-driven guide powered by people who actually live there, not algorithms or travel corporations.

## Core Value

Authentic, GPS-verified local knowledge that tourists can trust — because every post comes from someone who was physically there.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Any user can register as a local (home city self-declared) or tourist
- [ ] Locals can post places: restaurants, cafés, activities, tourist spots, sports, events, gatherings
- [ ] GPS location must be verified at time of posting (user must physically be at/near the place)
- [ ] Tourists can rate and review places/activities they've visited
- [ ] City pages show a feed of recent local posts
- [ ] Open community events and group activities can be posted by any local (holidays, gatherings, etc.)
- [ ] Multi-city support — any city in the world can have its own page

### Out of Scope

- Algorithmic recommendations — community ratings are the trust signal, not ML
- Paid listings / sponsored content (v1) — keep it authentic
- Mobile native app (v1) — web-first, mobile later

## Context

- The key differentiator from TripAdvisor/Yelp/Meetup is GPS-verified local authorship + open community events in one place
- Two distinct user roles: **Locals** (create content, GPS-verified at post time) and **Tourists** (rate/review places they visit)
- Trust model: GPS check when posting + community ratings from visitors
- Content types: permanent places (restaurants, cafés, attractions) + time-based events (gatherings, holiday celebrations, group activities)
- City page entry point: feed of recent local posts (not category browse, not map)

## Constraints

- **GPS/Location**: Web Geolocation API for GPS verification at post time — requires HTTPS
- **Scope**: v1 is web app only; mobile native deferred
- **Moderation**: Community-driven ratings as primary trust signal; no manual moderation team in v1

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Locals post, tourists rate | Clear role separation prevents confusion and spam | — Pending |
| GPS verification at post time | Ensures authenticity without ID verification overhead | — Pending |
| Feed-first city page | Shows recency and activity; builds sense of living community | — Pending |
| Web-first | Fastest path to validate the concept | — Pending |
| Launch city: Paris, France | World's most visited city (~100M tourists/year); rich mix of restaurants, cafés, museums, markets, local events — ideal seed city for content density | — Pending |

---
*Last updated: 2026-03-13 after launch city decision*
