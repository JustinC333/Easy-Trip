# REGRETS.md

## Things I Wish I'd Gotten To

### Flight API Live Pricing
The flight integration works end-to-end but the Flights Scraper Data API (RapidAPI) only returns data for trips within ~60 days. Users planning further out get a Google Flights link instead of real prices. I would have liked to find a more reliable flight data source (without paying for API right now lol).

### Regenerate Trip Feature
Users cannot tweak their preferences and re-run the AI without refilling the entire 4-step form. This was cut for time but would meaningfully improve the experience.

### Google Places Photos
Attraction names and ratings are pulled from Google Places and fed to Claude, but actual photos are not displayed on the results page. The itinerary would feel much more real and compelling with inline photos of the places Claude recommends.

### Email Deliverability
Supabase free tier has a hard limit of 3 emails per hour globally across the project. This caused signup failures during peer review. The fix (custom SMTP via Resend) requires a paid Supabase plan. For a production app this would be the first thing to address.

---

## Where Time Was Wasted

### Hydration Errors (several hours)
Next.js 16 introduced breaking changes: `middleware.ts` was renamed to `proxy.ts`, the exported function must be named `proxy` not `middleware`, and highly interactive pages with localStorage and dynamic styles cause server/client render mismatches. Diagnosing and fixing these took significantly longer than expected. The solution (splitting the form into a thin `page.tsx` wrapper + `PlanPageClient.tsx` with `ssr: false`) was simple once understood but took many iterations to reach.

### Flight API Debugging (several hours)
The Flights Scraper Data API returns inconsistent results. Some routes work, some return `status: false, data: null`, and data availability drops off sharply beyond ~60 days. A significant amount of time was spent building fallback strategies (Google Geocoding → nearby airports → distance-based lookup) that ultimately couldn't fully solve the underlying API limitation.

### Google Places CORS Issues
The initial assumption was that Google Places could be called directly from the browser. It cannot. CORS blocks it. Routing all calls through a Next.js backend route (`/api/places`) was the correct fix but required refactoring code that was already written.

### Supabase Key Format
Supabase recently introduced a new `sb_publishable_` key format alongside the legacy `eyJ...` JWT anon key. The `@supabase/ssr` package expects the JWT format. Diagnosing "Invalid API key" errors caused by using the wrong key format cost unnecessary debugging time.

---

## Advice for a Future Engineer Picking Up This Project

### Start with the API contracts first
Before writing any UI, test every external API (NPS, Google Places, Booking.com, Flights) in the RapidAPI playground or with curl. Understand what each returns, what breaks, and what the rate limits are. Three of the four external APIs had surprises that required significant workarounds.

### Next.js 16 is different from tutorials
Most Next.js tutorials and Stack Overflow answers are written for Next.js 12-14. Next.js 16 with Turbopack has different behavior around middleware, hydration, and dynamic imports. Check the official Next.js 16 docs specifically rather than relying on older resources.

### The CostGuard race condition is documented but not critical yet
`lib/costGuard.ts` now uses an atomic PostgreSQL stored procedure (`check_and_increment_usage`) to prevent race conditions. The fix is in place. Monitor `usage_records` in Supabase if token usage seems higher than expected.

### Supabase project pausing
Supabase free tier pauses projects after 1 week of inactivity. If the app stops working suddenly, check the Supabase dashboard first, a paused project looks identical to an API outage from the outside.

### The enrichment pipeline is the heart of the app
`app/api/enrich/route.ts` fans out to NPS, Google Places, Booking.com, and Flights in parallel. The quality of the AI itinerary depends entirely on what enrichment data is available. Improving enrichment (better hotel matching, Google Places photos, more NPS detail) is the highest-leverage place to invest future engineering time.