import { NextRequest, NextResponse } from 'next/server';

const STATE_ABBR: Record<string, string> = {
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
  Virginia: 'VA', Washington: 'WA', 'West Virginia': 'WV', Wisconsin: 'WI',
  Wyoming: 'WY',
};

interface GooglePrediction {
  place_id: string;
  description: string;
  structured_formatting?: {
    main_text: string;
    secondary_text?: string;
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const input = searchParams.get('input')?.trim() ?? '';
  const state = searchParams.get('state')?.trim() ?? '';
  const sessiontoken = searchParams.get('sessiontoken')?.trim() ?? '';

  if (input.length < 2) {
    return NextResponse.json({ predictions: [] });
  }

  const key = process.env.GOOGLE_API_KEY;
  if (!key) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  const abbr = STATE_ABBR[state];

  // Append state to query to strongly bias results toward the selected state
  const query = state ? `${input}, ${state}` : input;

  const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
  url.searchParams.set('input', query);
  url.searchParams.set('types', 'geocode');
  url.searchParams.set('components', 'country:us');
  url.searchParams.set('key', key);
  if (sessiontoken) url.searchParams.set('sessiontoken', sessiontoken);

  let data: { status: string; predictions?: GooglePrediction[]; error_message?: string };
  try {
    const res = await fetch(url.toString(), { cache: 'no-store' });
    data = await res.json();
  } catch (err) {
    console.error('[places/autocomplete] Upstream fetch failed:', err);
    return NextResponse.json({ error: 'upstream_error', predictions: [] });
  }

  console.log('[places/autocomplete] Google status:', data.status, '| input:', query);

  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    console.error('[places/autocomplete] API error:', data.status, data.error_message ?? '');
    return NextResponse.json({ predictions: [], status: data.status, error: data.error_message });
  }

  const predictions = (data.predictions ?? [])
    .filter((p) => {
      if (!state || !abbr) return true;
      const desc = p.description;
      // Match ", CA," or ", CA " (end) or ", California" anywhere in description
      return (
        desc.includes(`, ${abbr},`) ||
        desc.endsWith(`, ${abbr}`) ||
        desc.includes(`, ${state}`)
      );
    })
    .slice(0, 8)
    .map((p) => ({
      placeId: p.place_id,
      description: p.description,
      // Use just the city/area name without state/country for display
      mainText: p.structured_formatting?.main_text ?? p.description,
    }));

  return NextResponse.json({ predictions });
}
