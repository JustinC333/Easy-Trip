# REVIEW-PLAN.md

## Feedback Received on Review Day

---

## From Course Staff

### Fix the CostGuard race condition
Staff noted the comment in `lib/costGuard.ts` calls it "MVP" but the app is live on the open internet, the race condition is a real exposure.

**Fix applied:**
Replaced two-step read/write with atomic PostgreSQL stored procedure (`check_and_increment_usage`). The `UPDATE ... WHERE tokens_used + estimated <= ceiling` operation is atomic at the database level — concurrent requests cannot both exceed the ceiling. Deployed via Supabase RPC called from `lib/costGuard.ts`.

---

### Add `is_public boolean default false` to trips DDL in DEMO.md
Anyone doing a local install would get a Postgres error when clicking Share because the SQL in DEMO.md was missing the `is_public` column.

**Fix applied:**
Added `is_public boolean default false` to the `trips` table DDL in DEMO.md.

---

### Budget math should include accommodation when surfacing "remaining"
The remaining budget display was not correctly accounting for total accommodation cost over the full trip duration.

**Fix applied:**
Fixed accommodation budget validation in `app/plan/PlanPageClient.tsx`:
- For Hotel/Hostel/Flexible: `totalAccommodationPerPerson = accommodationBudget × numberOfNights`
- For Airbnb/VRBO: `totalAccommodationPerPerson = (accommodationBudget × numberOfNights) / numberOfPeople`
- Validation now checks total accommodation cost over full trip, not just nightly rate
- Budget summary card correctly shows remaining after both flights and accommodation

---

### Add a hallucination check on generated itineraries against the enrichment context
Verify `place_name` fields in generated activities against enrichment context to turn the "real data" pitch into a code-level guarantee.

**Fix applied:**
Added hallucination check in `app/api/generate/route.ts`:
- Builds list of known real places from enrichment (hotels, attractions, NPS parks)
- Extracts all `place_name` fields from generated itinerary
- Uses fuzzy matching to calculate hit rate
- Attaches `dataConfidence` object to itinerary: `{ hitRate, flag: 'high'|'medium'|'low' }`
- Results page shows confidence badge: "✓ Verified with live data" / "⚠ Some suggestions may be AI-generated"

---

### Fix the proposal markup — ItineraryGenerator bullets copy-pasted from EnrichmentFetcher
Page 4 of the marked-up proposal had the ItineraryGenerator section accidentally referencing `app/api/enrich/route.ts` and `Promise.allSettled()` instead of the Claude API call.

**Fix applied:**
Corrected the ItineraryGenerator section in `proposal/proposal-markup.md` to reference `app/api/generate/route.ts` and accurately describe the Claude API call, JSON-only system prompt, and token counting.

---

### Ship the flights integration (RapidAPI key is already paid)
Staff noted the RapidAPI flights subscription was already active and asked for live flight data to be integrated.

**Fix applied:**
Built full flight integration:
- New `app/api/flights/autocomplete/route.ts` — airport search using Flights Scraper Data API
- New `app/api/flights/search/route.ts` — roundtrip flight search with dynamic nearest-airport fallback using Google Geocoding + distance-based commercial airport lookup
- Added Step 2.5 "Flight Details" to the form (conditional — only shows for Flying/Either/Flexible)
- Flight results displayed on results page with airline, times, prices, and segments
- Drive time from nearest airport to destination shown when destination has no direct airport
- Falls back to Google Flights search link for dates beyond API availability (~60 days out)

---

## From Wayne Wang (Peer Reviewer 1)

**Bug: DEMO.md missing `is_public` column**
*(Course staff also flagged this)*

See course staff fix above.

---

**Bug: Proposal markup copy-paste error**
*(Course staff also flagged this)*

See course staff fix above.

---

**Suggestion: Ship the flight integration**
*(Course staff also flagged this)*

See course staff fix above.

---

**Suggestion: Hallucination check on place names**
*(Course staff also flagged this)*

See course staff fix above.

---

**Concern: CostGuard race condition**
*(Course staff also flagged this)*

See course staff fix above.

---

## From Hongyi Pan (Peer Reviewer 2)

**Successfully completed full demo** — signed up, filled out the form, generated a 3-day itinerary end-to-end with no blockers.

---

**Bug: Budget validation confusing for accommodation**
Entering $250/night hotel when $250/person remained after flights triggered an incorrect error.
*(Course staff also flagged this)*

See course staff fix above.

---

**Suggestion: Flight integration**
Flights are a key component for many users.
*(Course staff also flagged this)*

See course staff fix above.

---

**Suggestion: Show which APIs returned data**
Reviewer wanted visibility into which enrichment sources were actually used for a given trip.

**Fix applied:**
Added `dataConfidence` badge on results page showing verification status. The hallucination check console output shows exactly which place names were matched to real enrichment data vs AI-generated.

---

## Summary of All Fixes Implemented

| Feedback Source | Issue | Fixed |
|---|---|---|
| Staff | CostGuard race condition | ✅ Atomic SQL stored procedure |
| Staff + Wayne | DEMO.md missing is_public | ✅ Added to DDL |
| Staff + Hongyi | Budget math for accommodation | ✅ Full trip cost calculation |
| Staff + Wayne | Hallucination check | ✅ Confidence badge on results |
| Staff + Wayne | Proposal markup copy-paste | ✅ Corrected ItineraryGenerator section |
| Staff + Wayne + Hongyi | Flight integration | ✅ Full flight search pipeline |
| Wayne | Signup rate limit | ✅ Email confirmation disabled |
| Hongyi | Which APIs returned data | ✅ Confidence badge + logs |