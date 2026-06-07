import { NextRequest, NextResponse } from 'next/server';

interface AirportResult {
  code: string;
  name: string;
  city: string;
  display: string;
}

interface RawAirport {
  airportName?: string;
  airportCode?: string;
  city?: string;
}

interface RawCity {
  cityName?: string;
  cityFullName?: string;
  country?: string;
  description?: string;
  airports?: RawAirport[];
}

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas',
  'California', 'Colorado', 'Connecticut', 'Delaware',
  'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois',
  'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
  'Maine', 'Maryland', 'Massachusetts', 'Michigan',
  'Minnesota', 'Mississippi', 'Missouri', 'Montana',
  'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
  'New Mexico', 'New York', 'North Carolina',
  'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
  'Pennsylvania', 'Rhode Island', 'South Carolina',
  'South Dakota', 'Tennessee', 'Texas', 'Utah',
  'Vermont', 'Virginia', 'Washington', 'West Virginia',
  'Wisconsin', 'Wyoming',
];

const isUSCity = (description: string) =>
  US_STATES.some(state => description.includes(state));

export async function GET(req: NextRequest) {
  const input = req.nextUrl.searchParams.get('input') ?? '';

  if (input.length < 2) {
    return NextResponse.json([]);
  }

  const key = process.env.RAPIDAPI_KEY;
  if (!key) {
    console.error('[/api/flights/autocomplete] RAPIDAPI_KEY not set');
    return NextResponse.json([]);
  }

  try {
    const params = new URLSearchParams({ query: input });
    const res = await fetch(
      `https://flights-scraper-data.p.rapidapi.com/auto-complete?${params}`,
      {
        headers: {
          'X-RapidAPI-Host': 'flights-scraper-data.p.rapidapi.com',
          'X-RapidAPI-Key': key,
        },
        cache: 'no-store',
      }
    );

    if (!res.ok) {
      console.error('[/api/flights/autocomplete] API error:', res.status);
      return NextResponse.json([]);
    }

    const data = await res.json();
    console.log('[/api/flights/autocomplete] raw response:', JSON.stringify(data).slice(0, 500));

    const cities: RawCity[] = Array.isArray(data?.data) ? data.data : [];
    const results: AirportResult[] = [];

    for (const city of cities) {
      if (results.length >= 6) break;

      // Filter to US cities using description field (e.g. "City in California")
      const description = city.description ?? '';
      if (!isUSCity(description)) continue;

      const cityName = city.cityName ?? '';
      const airports = Array.isArray(city.airports) ? city.airports : [];

      for (const airport of airports) {
        if (results.length >= 6) break;
        const code = airport.airportCode ?? '';
        if (!/^[A-Z]{3}$/.test(code)) continue;
        results.push({
          code,
          name: airport.airportName ?? '',
          city: cityName,
          display: `${cityName} - ${airport.airportName ?? code} (${code})`,
        });
      }
    }

    // Deduplicate by airport code, keeping first occurrence
    const seen = new Set<string>();
    const deduplicated = results.filter(r => {
      if (seen.has(r.code)) return false;
      seen.add(r.code);
      return true;
    });

    console.log(`[/api/flights/autocomplete] input: ${input}, results: ${deduplicated.length}`);
    return NextResponse.json(deduplicated);
  } catch (err) {
    console.error('[/api/flights/autocomplete] Error:', err);
    return NextResponse.json([]);
  }
}
