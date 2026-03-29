import { NextRequest, NextResponse } from 'next/server';

const STATE_ABBR: Record<string, string> = {
  Alabama:'AL', Alaska:'AK', Arizona:'AZ', Arkansas:'AR', California:'CA',
  Colorado:'CO', Connecticut:'CT', Delaware:'DE', Florida:'FL', Georgia:'GA',
  Hawaii:'HI', Idaho:'ID', Illinois:'IL', Indiana:'IN', Iowa:'IA',
  Kansas:'KS', Kentucky:'KY', Louisiana:'LA', Maine:'ME', Maryland:'MD',
  Massachusetts:'MA', Michigan:'MI', Minnesota:'MN', Mississippi:'MS',
  Missouri:'MO', Montana:'MT', Nebraska:'NE', Nevada:'NV',
  'New Hampshire':'NH', 'New Jersey':'NJ', 'New Mexico':'NM', 'New York':'NY',
  'North Carolina':'NC', 'North Dakota':'ND', Ohio:'OH', Oklahoma:'OK',
  Oregon:'OR', Pennsylvania:'PA', 'Rhode Island':'RI', 'South Carolina':'SC',
  'South Dakota':'SD', Tennessee:'TN', Texas:'TX', Utah:'UT', Vermont:'VT',
  Virginia:'VA', Washington:'WA', 'West Virginia':'WV', Wisconsin:'WI', Wyoming:'WY',
};

// Bounding boxes: [south, west, north, east]
const STATE_BBOX: Record<string, [number, number, number, number]> = {
  Alabama:        [30.14, -88.47, 35.01, -84.89],
  Alaska:         [54.56, -179.99, 71.54, -129.99],
  Arizona:        [31.33, -114.82, 37.00, -109.04],
  Arkansas:       [33.00, -94.62, 36.50, -89.64],
  California:     [32.53, -124.41, 42.01, -114.13],
  Colorado:       [36.99, -109.06, 41.00, -102.04],
  Connecticut:    [40.95, -73.73, 42.05, -71.79],
  Delaware:       [38.45, -75.79, 39.84, -74.98],
  Florida:        [24.39, -87.63, 31.00, -79.97],
  Georgia:        [30.36, -85.61, 35.00, -80.84],
  Hawaii:         [18.91, -160.25, 22.24, -154.81],
  Idaho:          [41.99, -117.24, 49.00, -111.04],
  Illinois:       [36.97, -91.51, 42.51, -87.49],
  Indiana:        [37.77, -88.10, 41.76, -84.78],
  Iowa:           [40.38, -96.64, 43.50, -90.14],
  Kansas:         [36.99, -102.05, 40.00, -94.59],
  Kentucky:       [36.50, -89.57, 39.15, -81.96],
  Louisiana:      [28.93, -94.04, 33.02, -88.82],
  Maine:          [43.06, -71.08, 47.46, -66.95],
  Maryland:       [37.91, -79.49, 39.72, -74.99],
  Massachusetts:  [41.19, -73.51, 42.89, -69.93],
  Michigan:       [41.70, -90.42, 48.30, -82.41],
  Minnesota:      [43.50, -97.24, 49.38, -89.49],
  Mississippi:    [30.17, -91.66, 34.99, -88.10],
  Missouri:       [35.99, -95.77, 40.61, -89.10],
  Montana:        [44.36, -116.05, 49.00, -104.04],
  Nebraska:       [40.00, -104.05, 43.00, -95.31],
  Nevada:         [35.00, -120.00, 42.00, -114.04],
  'New Hampshire':[42.70, -72.56, 45.31, -70.61],
  'New Jersey':   [38.93, -75.56, 41.36, -73.90],
  'New Mexico':   [31.33, -109.05, 37.00, -103.00],
  'New York':     [40.50, -79.76, 45.02, -71.86],
  'North Carolina':[33.84, -84.32, 36.59, -75.46],
  'North Dakota': [45.94, -104.05, 49.00, -96.55],
  Ohio:           [38.40, -84.82, 41.98, -80.52],
  Oklahoma:       [33.62, -103.00, 37.00, -94.43],
  Oregon:         [41.99, -124.57, 46.24, -116.46],
  Pennsylvania:   [39.72, -80.52, 42.27, -74.69],
  'Rhode Island': [41.15, -71.91, 42.02, -71.12],
  'South Carolina':[32.05, -83.35, 35.22, -78.54],
  'South Dakota': [42.48, -104.06, 45.94, -96.44],
  Tennessee:      [34.98, -90.31, 36.68, -81.65],
  Texas:          [25.84, -106.65, 36.50, -93.51],
  Utah:           [36.99, -114.05, 42.00, -109.04],
  Vermont:        [42.73, -73.44, 45.02, -71.50],
  Virginia:       [36.54, -83.68, 39.47, -75.24],
  Washington:     [45.54, -124.73, 49.00, -116.92],
  'West Virginia':[37.20, -82.64, 40.64, -77.72],
  Wisconsin:      [42.49, -92.89, 47.08, -86.25],
  Wyoming:        [40.99, -111.06, 45.01, -104.05],
};

interface GooglePrediction {
  place_id: string;
  description: string;
  structured_formatting?: { main_text: string; secondary_text?: string };
}

const STREET_RE = /\b(Street|Road|Avenue|Boulevard|Drive|Court|Circle|Lane|Way|Place|Parkway|Highway|Freeway|St|Rd|Ave|Blvd|Dr|Ct|Ln|Pl|Pkwy|Hwy|Trl|Trail|Path)\b/i;
const PARK_RE   = /national park|national monument|national forest|state park/i;

async function callGoogle(params: Record<string, string>, key: string): Promise<GooglePrediction[]> {
  const p = new URLSearchParams({ ...params, key });
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?${p}`,
      { cache: 'no-store' },
    );
    const data: { status: string; predictions?: GooglePrediction[]; error_message?: string } =
      await res.json();
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('[/api/places] Google error:', data.status, data.error_message ?? '');
      return [];
    }
    return data.predictions ?? [];
  } catch (err) {
    console.error('[/api/places] Fetch failed:', err);
    return [];
  }
}

function inState(description: string, state: string, abbr: string | undefined): boolean {
  if (!state) return true;
  return (
    description.includes(`, ${state}`) ||
    (!!abbr && (description.includes(`, ${abbr},`) || description.endsWith(`, ${abbr}`)))
  );
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const input       = searchParams.get('input')?.trim()       ?? '';
  const state       = searchParams.get('state')?.trim()       ?? '';
  const sessiontoken = searchParams.get('sessiontoken')?.trim() ?? '';

  if (input.length < 2) {
    return NextResponse.json({ predictions: [] });
  }

  const key = process.env.GOOGLE_API_KEY;
  if (!key) {
    console.error('[/api/places] GOOGLE_API_KEY is not set');
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  const abbr = STATE_ABBR[state];
  const bbox = state ? STATE_BBOX[state] : undefined;

  // locationbias rectangle: "rectangle:south,west|north,east"
  const locationbias = bbox
    ? `rectangle:${bbox[0]},${bbox[1]}|${bbox[2]},${bbox[3]}`
    : undefined;

  const base: Record<string, string> = {
    components: 'country:us',
    language: 'en',
    ...(sessiontoken   ? { sessiontoken }   : {}),
    ...(locationbias   ? { locationbias }    : {}),
  };

  // CALL 1 — cities: just what the user typed, biased to state bbox
  const cityParams: Record<string, string> = {
    ...base,
    input,
    types: '(cities)',
  };

  // CALL 2 — national parks: append "national park" to help Google rank parks first
  const parkParams: Record<string, string> = {
    ...base,
    input: `${input} national park`,
    types: 'establishment',
  };

  const [cityResults, parkResults] = await Promise.all([
    callGoogle(cityParams, key),
    callGoogle(parkParams, key),
  ]);

  // Filter parks: description must match park keywords AND be in selected state
  const filteredParks = parkResults.filter((p) => {
    const desc     = p.description;
    const mainText = p.structured_formatting?.main_text ?? desc;
    if (!PARK_RE.test(desc))         return false;
    if (STREET_RE.test(mainText))    return false;
    return inState(desc, state, abbr);
  });

  // Filter cities: must be in state, no street words
  const filteredCities = cityResults.filter((p) => {
    const desc     = p.description;
    const mainText = p.structured_formatting?.main_text ?? desc;
    if (STREET_RE.test(mainText)) return false;
    return inState(desc, state, abbr);
  });

  // Deduplicate cities vs parks, parks first, cap at 8
  const parkIds     = new Set(filteredParks.map((p) => p.place_id));
  const dedupCities = filteredCities.filter((p) => !parkIds.has(p.place_id));
  const combined    = [...filteredParks, ...dedupCities].slice(0, 8);

  const predictions = combined.map((p) => ({
    placeId:      p.place_id,
    description:  p.description,
    mainText:     p.structured_formatting?.main_text ?? p.description,
    secondaryText: p.structured_formatting?.secondary_text ?? '',
  }));

  return NextResponse.json({ predictions });
}
