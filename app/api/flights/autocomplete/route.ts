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

const cache = new Map<string, { results: AirportResult[]; ts: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const FALLBACK_AIRPORTS: AirportResult[] = [
  { code: 'JFK', name: 'John F. Kennedy International Airport', city: 'New York', display: 'New York - John F. Kennedy International Airport (JFK)' },
  { code: 'LGA', name: 'LaGuardia Airport', city: 'New York', display: 'New York - LaGuardia Airport (LGA)' },
  { code: 'EWR', name: 'Newark Liberty International Airport', city: 'Newark', display: 'Newark - Newark Liberty International Airport (EWR)' },
  { code: 'LAX', name: 'Los Angeles International Airport', city: 'Los Angeles', display: 'Los Angeles - Los Angeles International Airport (LAX)' },
  { code: 'SFO', name: 'San Francisco International Airport', city: 'San Francisco', display: 'San Francisco - San Francisco International Airport (SFO)' },
  { code: 'SJC', name: 'Norman Y. Mineta San Jose International Airport', city: 'San Jose', display: 'San Jose - Norman Y. Mineta San Jose International Airport (SJC)' },
  { code: 'OAK', name: 'Oakland International Airport', city: 'Oakland', display: 'Oakland - Oakland International Airport (OAK)' },
  { code: 'ORD', name: "O'Hare International Airport", city: 'Chicago', display: "Chicago - O'Hare International Airport (ORD)" },
  { code: 'MDW', name: 'Chicago Midway International Airport', city: 'Chicago', display: 'Chicago - Chicago Midway International Airport (MDW)' },
  { code: 'MIA', name: 'Miami International Airport', city: 'Miami', display: 'Miami - Miami International Airport (MIA)' },
  { code: 'FLL', name: 'Fort Lauderdale-Hollywood International Airport', city: 'Fort Lauderdale', display: 'Fort Lauderdale - Fort Lauderdale-Hollywood International Airport (FLL)' },
  { code: 'MCO', name: 'Orlando International Airport', city: 'Orlando', display: 'Orlando - Orlando International Airport (MCO)' },
  { code: 'TPA', name: 'Tampa International Airport', city: 'Tampa', display: 'Tampa - Tampa International Airport (TPA)' },
  { code: 'ATL', name: 'Hartsfield-Jackson Atlanta International Airport', city: 'Atlanta', display: 'Atlanta - Hartsfield-Jackson Atlanta International Airport (ATL)' },
  { code: 'DFW', name: 'Dallas/Fort Worth International Airport', city: 'Dallas', display: 'Dallas - Dallas/Fort Worth International Airport (DFW)' },
  { code: 'DAL', name: 'Dallas Love Field', city: 'Dallas', display: 'Dallas - Dallas Love Field (DAL)' },
  { code: 'IAH', name: 'George Bush Intercontinental Airport', city: 'Houston', display: 'Houston - George Bush Intercontinental Airport (IAH)' },
  { code: 'HOU', name: 'William P. Hobby Airport', city: 'Houston', display: 'Houston - William P. Hobby Airport (HOU)' },
  { code: 'PHX', name: 'Phoenix Sky Harbor International Airport', city: 'Phoenix', display: 'Phoenix - Phoenix Sky Harbor International Airport (PHX)' },
  { code: 'DEN', name: 'Denver International Airport', city: 'Denver', display: 'Denver - Denver International Airport (DEN)' },
  { code: 'SEA', name: 'Seattle-Tacoma International Airport', city: 'Seattle', display: 'Seattle - Seattle-Tacoma International Airport (SEA)' },
  { code: 'LAS', name: 'Harry Reid International Airport', city: 'Las Vegas', display: 'Las Vegas - Harry Reid International Airport (LAS)' },
  { code: 'BOS', name: 'Logan International Airport', city: 'Boston', display: 'Boston - Logan International Airport (BOS)' },
  { code: 'DCA', name: 'Ronald Reagan Washington National Airport', city: 'Washington', display: 'Washington - Ronald Reagan Washington National Airport (DCA)' },
  { code: 'IAD', name: 'Washington Dulles International Airport', city: 'Washington', display: 'Washington - Washington Dulles International Airport (IAD)' },
  { code: 'BWI', name: 'Baltimore/Washington International Airport', city: 'Baltimore', display: 'Baltimore - Baltimore/Washington International Airport (BWI)' },
  { code: 'PHL', name: 'Philadelphia International Airport', city: 'Philadelphia', display: 'Philadelphia - Philadelphia International Airport (PHL)' },
  { code: 'MSP', name: 'Minneapolis-Saint Paul International Airport', city: 'Minneapolis', display: 'Minneapolis - Minneapolis-Saint Paul International Airport (MSP)' },
  { code: 'DTW', name: 'Detroit Metropolitan Airport', city: 'Detroit', display: 'Detroit - Detroit Metropolitan Airport (DTW)' },
  { code: 'CLT', name: 'Charlotte Douglas International Airport', city: 'Charlotte', display: 'Charlotte - Charlotte Douglas International Airport (CLT)' },
  { code: 'SLC', name: 'Salt Lake City International Airport', city: 'Salt Lake City', display: 'Salt Lake City - Salt Lake City International Airport (SLC)' },
  { code: 'PDX', name: 'Portland International Airport', city: 'Portland', display: 'Portland - Portland International Airport (PDX)' },
  { code: 'HNL', name: 'Daniel K. Inouye International Airport', city: 'Honolulu', display: 'Honolulu - Daniel K. Inouye International Airport (HNL)' },
  { code: 'ANC', name: 'Ted Stevens Anchorage International Airport', city: 'Anchorage', display: 'Anchorage - Ted Stevens Anchorage International Airport (ANC)' },
  { code: 'STL', name: 'St. Louis Lambert International Airport', city: 'St. Louis', display: 'St. Louis - St. Louis Lambert International Airport (STL)' },
  { code: 'MCI', name: 'Kansas City International Airport', city: 'Kansas City', display: 'Kansas City - Kansas City International Airport (MCI)' },
  { code: 'MSY', name: 'Louis Armstrong New Orleans International Airport', city: 'New Orleans', display: 'New Orleans - Louis Armstrong New Orleans International Airport (MSY)' },
  { code: 'RDU', name: 'Raleigh-Durham International Airport', city: 'Raleigh', display: 'Raleigh - Raleigh-Durham International Airport (RDU)' },
  { code: 'PIT', name: 'Pittsburgh International Airport', city: 'Pittsburgh', display: 'Pittsburgh - Pittsburgh International Airport (PIT)' },
  { code: 'CLE', name: 'Cleveland Hopkins International Airport', city: 'Cleveland', display: 'Cleveland - Cleveland Hopkins International Airport (CLE)' },
  { code: 'CMH', name: 'John Glenn Columbus International Airport', city: 'Columbus', display: 'Columbus - John Glenn Columbus International Airport (CMH)' },
  { code: 'IND', name: 'Indianapolis International Airport', city: 'Indianapolis', display: 'Indianapolis - Indianapolis International Airport (IND)' },
  { code: 'MKE', name: 'Milwaukee Mitchell International Airport', city: 'Milwaukee', display: 'Milwaukee - Milwaukee Mitchell International Airport (MKE)' },
  { code: 'BNA', name: 'Nashville International Airport', city: 'Nashville', display: 'Nashville - Nashville International Airport (BNA)' },
  { code: 'MEM', name: 'Memphis International Airport', city: 'Memphis', display: 'Memphis - Memphis International Airport (MEM)' },
  { code: 'BHM', name: 'Birmingham-Shuttlesworth International Airport', city: 'Birmingham', display: 'Birmingham - Birmingham-Shuttlesworth International Airport (BHM)' },
  { code: 'SAT', name: 'San Antonio International Airport', city: 'San Antonio', display: 'San Antonio - San Antonio International Airport (SAT)' },
  { code: 'AUS', name: 'Austin-Bergstrom International Airport', city: 'Austin', display: 'Austin - Austin-Bergstrom International Airport (AUS)' },
  { code: 'ELP', name: 'El Paso International Airport', city: 'El Paso', display: 'El Paso - El Paso International Airport (ELP)' },
  { code: 'ABQ', name: 'Albuquerque International Sunport', city: 'Albuquerque', display: 'Albuquerque - Albuquerque International Sunport (ABQ)' },
  { code: 'TUC', name: 'Tucson International Airport', city: 'Tucson', display: 'Tucson - Tucson International Airport (TUC)' },
  { code: 'OKC', name: 'Will Rogers World Airport', city: 'Oklahoma City', display: 'Oklahoma City - Will Rogers World Airport (OKC)' },
  { code: 'TUL', name: 'Tulsa International Airport', city: 'Tulsa', display: 'Tulsa - Tulsa International Airport (TUL)' },
  { code: 'LIT', name: 'Bill and Hillary Clinton National Airport', city: 'Little Rock', display: 'Little Rock - Bill and Hillary Clinton National Airport (LIT)' },
  { code: 'JAX', name: 'Jacksonville International Airport', city: 'Jacksonville', display: 'Jacksonville - Jacksonville International Airport (JAX)' },
  { code: 'RSW', name: 'Southwest Florida International Airport', city: 'Fort Myers', display: 'Fort Myers - Southwest Florida International Airport (RSW)' },
  { code: 'SRQ', name: 'Sarasota-Bradenton International Airport', city: 'Sarasota', display: 'Sarasota - Sarasota-Bradenton International Airport (SRQ)' },
  { code: 'PBI', name: 'Palm Beach International Airport', city: 'West Palm Beach', display: 'West Palm Beach - Palm Beach International Airport (PBI)' },
  { code: 'SAN', name: 'San Diego International Airport', city: 'San Diego', display: 'San Diego - San Diego International Airport (SAN)' },
  { code: 'BUR', name: 'Hollywood Burbank Airport', city: 'Burbank', display: 'Burbank - Hollywood Burbank Airport (BUR)' },
  { code: 'LGB', name: 'Long Beach Airport', city: 'Long Beach', display: 'Long Beach - Long Beach Airport (LGB)' },
  { code: 'ONT', name: 'Ontario International Airport', city: 'Ontario', display: 'Ontario - Ontario International Airport (ONT)' },
  { code: 'SMF', name: 'Sacramento International Airport', city: 'Sacramento', display: 'Sacramento - Sacramento International Airport (SMF)' },
  { code: 'FAT', name: 'Fresno Yosemite International Airport', city: 'Fresno', display: 'Fresno - Fresno Yosemite International Airport (FAT)' },
  { code: 'RNO', name: 'Reno-Tahoe International Airport', city: 'Reno', display: 'Reno - Reno-Tahoe International Airport (RNO)' },
  { code: 'BOI', name: 'Boise Airport', city: 'Boise', display: 'Boise - Boise Airport (BOI)' },
  { code: 'GEG', name: 'Spokane International Airport', city: 'Spokane', display: 'Spokane - Spokane International Airport (GEG)' },
  { code: 'BZN', name: 'Bozeman Yellowstone International Airport', city: 'Bozeman', display: 'Bozeman - Bozeman Yellowstone International Airport (BZN)' },
  { code: 'BIL', name: 'Billings Logan International Airport', city: 'Billings', display: 'Billings - Billings Logan International Airport (BIL)' },
  { code: 'FSD', name: 'Sioux Falls Regional Airport', city: 'Sioux Falls', display: 'Sioux Falls - Sioux Falls Regional Airport (FSD)' },
  { code: 'FAR', name: 'Hector International Airport', city: 'Fargo', display: 'Fargo - Hector International Airport (FAR)' },
  { code: 'OMA', name: 'Eppley Airfield', city: 'Omaha', display: 'Omaha - Eppley Airfield (OMA)' },
  { code: 'DSM', name: 'Des Moines International Airport', city: 'Des Moines', display: 'Des Moines - Des Moines International Airport (DSM)' },
  { code: 'GRR', name: 'Gerald R. Ford International Airport', city: 'Grand Rapids', display: 'Grand Rapids - Gerald R. Ford International Airport (GRR)' },
  { code: 'LAN', name: 'Capital Region International Airport', city: 'Lansing', display: 'Lansing - Capital Region International Airport (LAN)' },
  { code: 'SYR', name: 'Syracuse Hancock International Airport', city: 'Syracuse', display: 'Syracuse - Syracuse Hancock International Airport (SYR)' },
  { code: 'ROC', name: 'Greater Rochester International Airport', city: 'Rochester', display: 'Rochester - Greater Rochester International Airport (ROC)' },
  { code: 'ALB', name: 'Albany International Airport', city: 'Albany', display: 'Albany - Albany International Airport (ALB)' },
  { code: 'BUF', name: 'Buffalo Niagara International Airport', city: 'Buffalo', display: 'Buffalo - Buffalo Niagara International Airport (BUF)' },
  { code: 'BDL', name: 'Bradley International Airport', city: 'Hartford', display: 'Hartford - Bradley International Airport (BDL)' },
  { code: 'PVD', name: 'Rhode Island T.F. Green International Airport', city: 'Providence', display: 'Providence - Rhode Island T.F. Green International Airport (PVD)' },
  { code: 'MHT', name: 'Manchester-Boston Regional Airport', city: 'Manchester', display: 'Manchester - Manchester-Boston Regional Airport (MHT)' },
  { code: 'PWM', name: 'Portland International Jetport', city: 'Portland', display: 'Portland - Portland International Jetport (PWM)' },
  { code: 'BGR', name: 'Bangor International Airport', city: 'Bangor', display: 'Bangor - Bangor International Airport (BGR)' },
  { code: 'BTV', name: 'Burlington International Airport', city: 'Burlington', display: 'Burlington - Burlington International Airport (BTV)' },
  { code: 'RIC', name: 'Richmond International Airport', city: 'Richmond', display: 'Richmond - Richmond International Airport (RIC)' },
  { code: 'ORF', name: 'Norfolk International Airport', city: 'Norfolk', display: 'Norfolk - Norfolk International Airport (ORF)' },
  { code: 'CHO', name: 'Charlottesville-Albemarle Airport', city: 'Charlottesville', display: 'Charlottesville - Charlottesville-Albemarle Airport (CHO)' },
  { code: 'GSO', name: 'Piedmont Triad International Airport', city: 'Greensboro', display: 'Greensboro - Piedmont Triad International Airport (GSO)' },
  { code: 'CHS', name: 'Charleston International Airport', city: 'Charleston', display: 'Charleston - Charleston International Airport (CHS)' },
  { code: 'CAE', name: 'Columbia Metropolitan Airport', city: 'Columbia', display: 'Columbia - Columbia Metropolitan Airport (CAE)' },
  { code: 'SAV', name: 'Savannah/Hilton Head International Airport', city: 'Savannah', display: 'Savannah - Savannah/Hilton Head International Airport (SAV)' },
];

function fallbackSearch(input: string): AirportResult[] {
  const q = input.toLowerCase();
  return FALLBACK_AIRPORTS.filter(a =>
    a.city.toLowerCase().includes(q) ||
    a.code.toLowerCase().includes(q) ||
    a.name.toLowerCase().includes(q)
  ).slice(0, 6);
}

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

  const cacheKey = input.toLowerCase();
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return NextResponse.json(cached.results);
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
      if (res.status === 429) {
        console.error('[/api/flights/autocomplete] Rate limit headers:', {
          limit: res.headers.get('X-RateLimit-Requests-Limit'),
          remaining: res.headers.get('X-RateLimit-Requests-Remaining'),
          reset: res.headers.get('X-RateLimit-Requests-Reset'),
        });
        return NextResponse.json(fallbackSearch(input));
      }
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

    cache.set(cacheKey, { results: deduplicated, ts: Date.now() });
    console.log(`[/api/flights/autocomplete] input: ${input}, results: ${deduplicated.length}`);
    return NextResponse.json(deduplicated);
  } catch (err) {
    console.error('[/api/flights/autocomplete] Error:', err);
    return NextResponse.json([]);
  }
}
