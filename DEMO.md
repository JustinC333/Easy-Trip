# Easy Trip — DEMO.md

## Live Demo

The app is deployed and accessible at:

**[https://easy-trip-steel.vercel.app](https://easy-trip-steel.vercel.app)**

No installation required. Visit the URL in any modern browser.

### How to use the live demo

1. Go to [easy-trip-steel.vercel.app](https://easy-trip-steel.vercel.app)
2. Click **"Get Started"** or **"Plan My Trip"** on the homepage
3. Create an account with any email and password
4. Fill out the 4-step trip planning form:
   - **Step 1:** Choose a US state and destination city (try "California" → "Yosemite National Park"), select travel dates
   - **Step 2:** Pick your travel style, transportation, and accommodation type
   - **Step 3:** Set your budget and group size
   - **Step 4:** Add any must-haves (optional), then click "Plan My Trip 🗺️"
5. Wait 30–60 seconds while the AI generates your itinerary
6. View your complete day-by-day trip plan
7. Go to **"My Trips"** to see your saved trips dashboard

---

## Running Locally

### Prerequisites

- Node.js v18 or higher (check with `node -v`)
- npm (comes with Node.js)
- Git

### Step 1 — Clone and install

```bash
git clone https://github.com/JustinC333/Easy-Trip.git
cd Easy-Trip
npm install
```

### Step 2 — Set up external services

You will need accounts and API keys for the following services:

| Service | Purpose | Sign up |
|---|---|---|
| Supabase | Database + Auth | supabase.com |
| Anthropic | AI itinerary generation | console.anthropic.com |
| Google Cloud | Places autocomplete + Maps | console.cloud.google.com |
| RapidAPI | Hotel prices | rapidapi.com |
| NPS.gov | National park data | nps.gov/subjects/developer |

**Supabase setup:**

1. Create a new project at supabase.com
2. Go to SQL Editor and run:

```sql
create table trips (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  destination text not null,
  start_date text not null,
  end_date text not null,
  created_at timestamp with time zone default now(),
  itinerary_json jsonb not null,
  deleted_at timestamp with time zone default null,
  is_public boolean default false  ← ADD THIS LINE
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

3. Go to Authentication → Providers → enable Email

**Google Cloud setup:**

Enable these APIs in Google Cloud Console:
- Maps JavaScript API
- Places API (New)
- Directions API
- Geocoding API
- Distance Matrix API

Remove HTTP referer restrictions from your API key (required for server-side calls).

**RapidAPI setup:**

Subscribe to:
- Booking.com by Tipsters CO

### Step 3 — Configure environment variables

Create a file called `.env.local` in the project root:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key
GOOGLE_API_KEY=AIzaSy...your-google-key
RAPIDAPI_KEY=your-rapidapi-key
NPS_API_KEY=your-nps-key
ANTHROPIC_API_KEY=sk-ant-...your-anthropic-key
```

### Step 4 — Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Step 5 — Build for production (optional)

```bash
npm run build
npm start
```

---

## Notes for Reviewers

- AI generation takes 30–60 seconds per trip — this is expected due to the Claude API response time
- The app requires valid API keys for all external services to function fully
- If you don't have API keys, the live demo at [easy-trip-steel.vercel.app](https://easy-trip-steel.vercel.app) is the easiest way to evaluate the app
- The Google Places city search works best with 3+ characters typed
- All trips are saved per user account — create your own account to see a clean dashboard