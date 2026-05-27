# Easy Trip

**AI-Powered US Trip Planner**

Easy Trip turns your travel ideas into a complete, personalized day-by-day itinerary in minutes. Tell us where you want to go, your budget, travel style, and group size, and our AI builds your entire trip plan, including real hotel options, local attractions, national park info, and practical travel tips.

Live demo: [easy-trip-steel.vercel.app](https://easy-trip-steel.vercel.app)

---

## What it does

- **Multi-step trip planning form** — destination (with Google Places autocomplete), dates, budget breakdown, group size, travel style, transportation, and accommodation preferences
- **AI-generated itineraries** — Claude AI produces a full day-by-day plan with timed activities, meals, lodging, and travel segments
- **Live enrichment data** — pulls real hotel prices (Booking.com), local attractions (Google Places), and national park info (NPS.gov) to personalize the itinerary
- **Per-user token budget** — each user has a monthly AI usage ceiling tracked in the database
- **Trip dashboard** — view, manage, and delete all your saved trips
- **Trash/restore** — deleted trips go to a trash bin and are permanently removed after 7 days
- **Auth** — email/password signup and login via Supabase Auth, with route protection middleware

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router), TypeScript |
| Styling | Tailwind CSS v4 |
| Auth & Database | Supabase (PostgreSQL + Supabase Auth) |
| AI | Anthropic Claude API (claude-sonnet-4-5) |
| Places | Google Places API (via Next.js backend route) |
| Hotels | Booking.com API via RapidAPI |
| National Parks | NPS.gov API |
| Deployment | Vercel |

---

## Project Structure

```
app/
  page.tsx                  # Homepage
  auth/page.tsx             # Login / signup
  plan/
    page.tsx                # Thin wrapper (SSR disabled)
    PlanPageClient.tsx      # 4-step trip planning form
  trips/
    page.tsx                # Trip dashboard
    [id]/page.tsx           # Itinerary results page
  api/
    plan/route.ts           # Master pipeline endpoint
    enrich/route.ts         # Parallel enrichment (NPS + Places + Hotels)
    generate/route.ts       # Claude API itinerary generation
    places/route.ts         # Google Places autocomplete proxy

lib/
  supabase/
    client.ts               # Browser-side Supabase client
    server.ts               # Server-side Supabase client
  costGuard.ts              # Per-user monthly token ceiling
  tripStore.ts              # Save itineraries to Supabase
  types.ts                  # Shared TypeScript types

proxy.ts                    # Route protection (replaces middleware in Next.js 16)
```

---

## Database Schema

```sql
-- Stores generated itineraries
create table trips (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  destination text not null,
  start_date text not null,
  end_date text not null,
  created_at timestamp with time zone default now(),
  itinerary_json jsonb not null,
  deleted_at timestamp with time zone default null
);

-- Tracks per-user monthly AI token usage
create table usage_records (
  user_id uuid references auth.users(id) on delete cascade,
  month text not null,         -- e.g. "2026-05"
  tokens_used integer default 0,
  ceiling integer default 50000,
  primary key (user_id, month)
);
```

---

## Local Development

### Prerequisites

- Node.js v18 or higher
- npm
- A Supabase project
- API keys for: Anthropic, Google Cloud, RapidAPI, NPS.gov

### Setup

```bash
# Clone the repo
git clone https://github.com/JustinC333/Easy-Trip.git
cd Easy-Trip

# Install dependencies
npm install

# Create your environment file
cp .env.example .env.local
# Fill in your API keys (see Environment Variables below)

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Create a `.env.local` file at the project root with these values:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
GOOGLE_API_KEY=your-google-cloud-api-key
RAPIDAPI_KEY=your-rapidapi-key
NPS_API_KEY=your-nps-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
```

### Supabase Setup

Run these SQL statements in your Supabase SQL Editor:

```sql
create table trips (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  destination text not null,
  start_date text not null,
  end_date text not null,
  created_at timestamp with time zone default now(),
  itinerary_json jsonb not null,
  deleted_at timestamp with time zone default null
);
alter table trips enable row level security;
create policy "Users can only access their own trips"
on trips for all using (auth.uid() = user_id);

create table usage_records (
  user_id uuid references auth.users(id) on delete cascade,
  month text not null,
  tokens_used integer default 0,
  ceiling integer default 50000,
  primary key (user_id, month)
);
alter table usage_records enable row level security;
create policy "Users can only access their own usage"
on usage_records for all using (auth.uid() = user_id);
```

Enable email/password auth in your Supabase dashboard under Authentication → Providers.

### Google APIs Required

Enable these in Google Cloud Console:
- Maps JavaScript API
- Places API (New)
- Directions API
- Geocoding API
- Distance Matrix API

### RapidAPI Subscriptions Required

- Booking.com by Tipsters CO (hotels)
- Flights Scraper Data by Vibe pro (flights — planned)

---

## Deployment

The app is deployed on Vercel. To deploy your own instance:

1. Push the repo to GitHub
2. Connect to Vercel and import the repository
3. Add all environment variables in Vercel → Settings → Environment Variables
4. Deploy

---

## Known Limitations

- Google Places city autocomplete works best with 3+ characters typed
- Hotel prices are pulled live from Booking.com and may vary
- AI generation takes 30–60 seconds per trip
- CostGuard token checking is not atomic — race conditions possible under very high concurrency (acceptable at current usage scale)
- Flight data integration is planned but not yet implemented