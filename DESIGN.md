# Easy Trip — DESIGN.md

## Decision 1: Routing All Google Places Calls Through a Backend Proxy

- **The Decision:** Instead of calling the Google Places Autocomplete API directly from the browser, all autocomplete requests go through a Next.js backend route at `/api/places`. The browser calls our own server, our server calls Google, and the results come back without ever exposing the API key to the client.

- **Who Decided:** I made this decision after running into a wall during development. When I first tried to wire up the city search, every single keystroke was throwing a "Failed to fetch" error in the browser console. I didn't know why at first, the API key was there, the endpoint looked right. I started digging and figured out it was a CORS issue: browsers block direct calls to `maps.googleapis.com` from a web app for security reasons. I could have just made the key public with `NEXT_PUBLIC_` prefix and hoped nobody abused it, but that felt wrong lol. Anyone could open DevTools and steal the key. I decided the right fix was to route everything through our own backend so the key never touches the browser. I described the problem to Claude Code and it built out the actual route handler and updated the frontend to call `/api/places` instead. But the decision to proxy it, and the reason why, was something I worked out myself through debugging.

---

## Decision 2: Swallowing Enrichment Failures So AI Generation Always Runs

- **The Decision:** The enrichment step fans out to three external APIs in parallel, NPS.gov, Google Places, and Booking.com, using `Promise.allSettled()` instead of `Promise.all()`. If any one of those APIs fails, times out, or returns garbage, the failure is caught and logged, but generation continues with whatever context is available. A Booking.com outage does not prevent the user from getting an itinerary.

- **Who Decided:** I decided this after thinking through what the worst user experience would be. The absolute worst case is: user fills out a 4-step form, waits 30–60 seconds, and gets a hard error because some hotel API they've never heard of had a hiccup. That would feel completely broken. The enrichment data, hotel prices, attraction names, park descriptions, is genuinely useful context for the AI, but it's not required. Claude can generate a solid itinerary for Yosemite without knowing that Curry Village costs $194/night. So I made the call that enrichment should be best-effort, not a hard dependency. I told Claude Code I wanted each API call isolated so failures don't cascade, and it implemented the `Promise.allSettled()` pattern and the null-fallback logic. The decision about what counts as critical vs. optional in the pipeline was mine.

---

## Decision 3: Soft Delete With a 7-Day Trash Bin Instead of Hard Delete

- **The Decision:** When a user deletes a trip, we don't actually remove the row from the database. Instead we set a `deleted_at` timestamp on it. Trips with a `deleted_at` value are hidden from the main dashboard but shown in a trash bin. Users can restore any trip within 7 days. After 7 days, trips are permanently purged the next time the dashboard loads.

- **Who Decided:** I came up with this after thinking about my own behavior when I delete things. I almost always regret at least one deletion. The standard pattern most apps use "Are you sure?" confirmation dialog, doesn't actually help much because you click confirm and it's gone anyway. I wanted something that felt more forgiving. I decided on 7 days because it's long enough to notice a mistake but short enough that the trash doesn't just accumulate forever. I told Claude Code what I wanted: a `deleted_at` column, soft delete behavior, a trash panel in the UI with a badge count, a restore button, and a cleanup that runs on page load. It built all of that. But the decision to make deletion non-destructive in the first place, and why, came entirely from me.