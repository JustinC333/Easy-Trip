import { NextRequest, NextResponse } from 'next/server';

interface EnrichRequest {
  destination: string;
  state: string;
  startDate: string;
  endDate: string;
}

const STATE_CODES: Record<string, string> = {
  Alabama: 'AL', Alaska: 'AK', Arizona: 'AZ', Arkansas: 'AR', California: 'CA',
  Colorado: 'CO', Connecticut: 'CT', Delaware: 'DE', Florida: 'FL', Georgia: 'GA',
  Hawaii: 'HI', Idaho: 'ID', Illinois: 'IL', Indiana: 'IN', Iowa: 'IA',
  Kansas: 'KS', Kentucky: 'KY', Louisiana: 'LA', Maine: 'ME', Maryland: 'MD',
  Massachusetts: 'MA', Michigan: 'MI', Minnesota: 'MN', Mississippi: 'MS',
  Missouri: 'MO', Montana: 'MT', Nebraska: 'NE', Nevada: 'NV',
  'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
  'North Carolina': 'NC', 'North Dakota': 'ND', Ohio: 'OH', Oklahoma: 'OK',
  Oregon: 'OR', Pennsylvania: 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
  'South Dakota': 'SD', Tennessee: 'TN', Texas: 'TX', Utah: 'UT', Vermont: 'VT',
  Virginia: 'VA', Washington: 'WA', 'West Virginia': 'WV', Wisconsin: 'WI', Wyoming: 'WY',
};

async function fetchNPS(state: string) {
  const key = process.env.NPS_API_KEY;
  if (!key) throw new Error('NPS_API_KEY not set');

  const stateCode = STATE_CODES[state];
  if (!stateCode) throw new Error(`Unknown state: ${state}`);

  const params = new URLSearchParams({ stateCode, limit: '5', api_key: key });
  const res = await fetch(`https://developer.nps.gov/api/v1/parks?${params}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`NPS API ${res.status}`);

  const data = await res.json();
  const parks = (data.data ?? []).map((park: Record<string, unknown>) => ({
    name: park.fullName,
    description: park.description,
    url: park.url,
    entranceFee: (park.entranceFees as Array<{ cost: string }> | undefined)?.[0]?.cost ?? null,
  }));

  return { parks };
}

async function fetchPlaces(destination: string) {
  const key = process.env.GOOGLE_API_KEY;
  if (!key) throw new Error('GOOGLE_API_KEY not set');

  const params = new URLSearchParams({
    query: `top attractions in ${destination}`,
    key,
  });
  const res = await fetch(
    `https://maps.googleapis.com/maps/api/place/textsearch/json?${params}`,
    { cache: 'no-store' },
  );
  if (!res.ok) throw new Error(`Places API ${res.status}`);

  const data = await res.json();
  const attractions = (data.results ?? [])
    .slice(0, 5)
    .map((place: Record<string, unknown>) => ({
      name: place.name,
      rating: place.rating ?? null,
      address: place.formatted_address,
      types: place.types ?? [],
    }));

  return { attractions };
}

async function fetchHotels(destination: string, startDate: string, endDate: string) {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) throw new Error('RAPIDAPI_KEY not set');

  const headers = {
    'X-RapidAPI-Key': key,
    'X-RapidAPI-Host': 'booking-com.p.rapidapi.com',
  };

  // Step 1 — resolve destination id
  const locParams = new URLSearchParams({ name: destination, locale: 'en-gb', languagecode: 'en-us' });
  const locUrl = `https://booking-com.p.rapidapi.com/v1/hotels/locations?${locParams}`;
  console.log('[/api/enrich] Hotels location request:', locUrl);

  const locRes = await fetch(locUrl, { headers, cache: 'no-store' });
  console.log('[/api/enrich] Hotels location response status:', locRes.status);

  if (!locRes.ok) {
    const errorBody = await locRes.text();
    console.error('[/api/enrich] Hotels location error body:', errorBody);
    throw new Error(`Hotels location API ${locRes.status}: ${errorBody}`);
  }

  const locData = await locRes.json();
  console.log('[/api/enrich] Hotels location raw response:', JSON.stringify(locData).slice(0, 500));

  const first = locData?.[0];
  if (!first?.dest_id) throw new Error(`No hotel destination found. Response: ${JSON.stringify(locData).slice(0, 200)}`);

  const destId: string = String(first.dest_id);
  const destType: string = first.dest_type ?? 'city';
  console.log('[/api/enrich] Hotels resolved dest_id:', destId, 'dest_type:', destType);

  // Step 2 — search hotels
  // startDate/endDate must be YYYY-MM-DD
  const checkin = startDate.slice(0, 10);
  const checkout = endDate.slice(0, 10);
  console.log('[/api/enrich] Hotels search dates — checkin:', checkin, 'checkout:', checkout);

  const hotelParams = new URLSearchParams({
    dest_id: destId,
    dest_type: destType,
    checkin_date: checkin,
    checkout_date: checkout,
    adults_number: '2',
    room_number: '1',
    order_by: 'popularity',
    filter_by_currency: 'USD',
    locale: 'en-gb',
    currency: 'USD',
    units: 'metric',
    page_number: '0',
  });
  const hotelUrl = `https://booking-com.p.rapidapi.com/v1/hotels/search?${hotelParams}`;
  console.log('[/api/enrich] Hotels search request:', hotelUrl);

  const hotelRes = await fetch(hotelUrl, { headers, cache: 'no-store' });
  console.log('[/api/enrich] Hotels search response status:', hotelRes.status);

  if (!hotelRes.ok) {
    const errorBody = await hotelRes.text();
    console.error('[/api/enrich] Hotels search error body:', errorBody);
    throw new Error(`Hotels search API ${hotelRes.status}: ${errorBody}`);
  }

  const hotelData = await hotelRes.json();
  console.log('[/api/enrich] Hotels search raw keys:', Object.keys(hotelData));

  const resultArray = hotelData.result ?? hotelData.results ?? [];
  console.log('[/api/enrich] Hotels result count:', resultArray.length);

  // Log the full first result so we can inspect every price field
  if (resultArray.length > 0) {
    const first = resultArray[0] as Record<string, unknown>;
    console.log('[/api/enrich] Hotels first result (price fields) — '
      + 'min_total_price:', first.min_total_price,
      '| price_breakdown:', JSON.stringify(first.price_breakdown),
      '| composite_price_breakdown:', JSON.stringify(first.composite_price_breakdown),
    );
  }

  const options = resultArray
    .slice(0, 5)
    .map((h: Record<string, unknown>) => {
      // composite_price_breakdown.gross_amount_per_night is the per-night rate in the
      // selected currency. Fall back to min_total_price (which is the *total* stay cost)
      // divided by the number of nights if the per-night field is absent.
      const cpb = h.composite_price_breakdown as Record<string, Record<string, number>> | null;
      const pb  = h.price_breakdown as Record<string, number> | null;

      const checkinMs  = new Date(checkin).getTime();
      const checkoutMs = new Date(checkout).getTime();
      const nights = Math.max(1, Math.round((checkoutMs - checkinMs) / 86_400_000));

      const pricePerNight =
        cpb?.gross_amount_per_night?.value ??
        cpb?.all_inclusive_amount?.value ??
        pb?.gross_price ??
        (typeof h.min_total_price === 'number' ? h.min_total_price / nights : null);

      console.log(`[/api/enrich] Hotel "${h.hotel_name}" — nights: ${nights}, pricePerNight: ${pricePerNight}`);

      return {
        name: h.hotel_name,
        pricePerNight,
        rating: h.review_score ?? null,
      };
    });

  return { options };
}

export async function POST(req: NextRequest) {
  let body: EnrichRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { destination, state, startDate, endDate } = body;
  if (!destination) {
    return NextResponse.json({ error: 'destination is required' }, { status: 400 });
  }

  const [npsResult, placesResult, hotelsResult] = await Promise.allSettled([
    fetchNPS(state),
    fetchPlaces(destination),
    fetchHotels(destination, startDate, endDate),
  ]);

  if (npsResult.status === 'rejected')
    console.error('[/api/enrich] NPS failed:', npsResult.reason);
  if (placesResult.status === 'rejected')
    console.error('[/api/enrich] Places failed:', placesResult.reason);
  if (hotelsResult.status === 'rejected')
    console.error('[/api/enrich] Hotels failed:', hotelsResult.reason);

  return NextResponse.json({
    nps: npsResult.status === 'fulfilled' ? npsResult.value : null,
    places: placesResult.status === 'fulfilled' ? placesResult.value : null,
    hotels: hotelsResult.status === 'fulfilled' ? hotelsResult.value : null,
  });
}
