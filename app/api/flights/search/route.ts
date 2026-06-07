import { NextRequest, NextResponse } from 'next/server';

interface AirportResult {
  code: string;
  name: string;
  city: string;
}

interface DriveInfo {
  distance: string;
  duration: string;
}

interface Segment {
  from: string;
  to: string;
  airline: string;
  flightNumber: string;
  departureTime: string;
  arrivalTime: string;
  aircraft: string;
  duration: string;
}

interface FlightOption {
  airline: string;
  airlineCode: string;
  departureTime: string;
  arrivalTime: string;
  departureDate: string;
  durationMinutes: number;
  stops: number;
  price: number;
  pricePerPerson: number;
  isWithinBudget: boolean;
  segments: Segment[];
}

interface SearchRequest {
  departureCode: string;
  arrivalCity: string;
  startDate: string;
  endDate: string;
  numberOfPeople: number;
  cabinClass: number;
  flightBudgetPerPerson?: number;
}

const US_COMMERCIAL_AIRPORTS = [
  { code: 'LAX', name: 'Los Angeles', lat: 33.9425, lng: -118.4081 },
  { code: 'SFO', name: 'San Francisco', lat: 37.6213, lng: -122.3790 },
  { code: 'SJC', name: 'San Jose', lat: 37.3639, lng: -121.9289 },
  { code: 'OAK', name: 'Oakland', lat: 37.7213, lng: -122.2208 },
  { code: 'FAT', name: 'Fresno', lat: 36.7762, lng: -119.7181 },
  { code: 'SMF', name: 'Sacramento', lat: 38.6954, lng: -121.5908 },
  { code: 'RNO', name: 'Reno', lat: 39.4991, lng: -119.7681 },
  { code: 'LAS', name: 'Las Vegas', lat: 36.0840, lng: -115.1537 },
  { code: 'PHX', name: 'Phoenix', lat: 33.4373, lng: -112.0078 },
  { code: 'SAN', name: 'San Diego', lat: 32.7336, lng: -117.1897 },
  { code: 'PDX', name: 'Portland', lat: 45.5898, lng: -122.5951 },
  { code: 'SEA', name: 'Seattle', lat: 47.4502, lng: -122.3088 },
  { code: 'DEN', name: 'Denver', lat: 39.8561, lng: -104.6737 },
  { code: 'SLC', name: 'Salt Lake City', lat: 40.7899, lng: -111.9791 },
  { code: 'ABQ', name: 'Albuquerque', lat: 35.0402, lng: -106.6090 },
  { code: 'BOI', name: 'Boise', lat: 43.5644, lng: -116.2228 },
  { code: 'BZN', name: 'Bozeman', lat: 45.7775, lng: -111.1603 },
  { code: 'JAC', name: 'Jackson Hole', lat: 43.6073, lng: -110.7377 },
  { code: 'MSO', name: 'Missoula', lat: 46.9163, lng: -114.0906 },
  { code: 'GEG', name: 'Spokane', lat: 47.6199, lng: -117.5339 },
  { code: 'JFK', name: 'New York JFK', lat: 40.6413, lng: -73.7781 },
  { code: 'LGA', name: 'New York LGA', lat: 40.7769, lng: -73.8740 },
  { code: 'EWR', name: 'Newark', lat: 40.6895, lng: -74.1745 },
  { code: 'BOS', name: 'Boston', lat: 42.3656, lng: -71.0096 },
  { code: 'ORD', name: 'Chicago OHare', lat: 41.9742, lng: -87.9073 },
  { code: 'MDW', name: 'Chicago Midway', lat: 41.7868, lng: -87.7522 },
  { code: 'ATL', name: 'Atlanta', lat: 33.6407, lng: -84.4277 },
  { code: 'DFW', name: 'Dallas', lat: 32.8998, lng: -97.0403 },
  { code: 'IAH', name: 'Houston', lat: 29.9902, lng: -95.3368 },
  { code: 'MIA', name: 'Miami', lat: 25.7959, lng: -80.2870 },
  { code: 'MCO', name: 'Orlando', lat: 28.4312, lng: -81.3081 },
  { code: 'TPA', name: 'Tampa', lat: 27.9755, lng: -82.5332 },
  { code: 'CLT', name: 'Charlotte', lat: 35.2144, lng: -80.9473 },
  { code: 'PHL', name: 'Philadelphia', lat: 39.8744, lng: -75.2424 },
  { code: 'DCA', name: 'Washington DC', lat: 38.8512, lng: -77.0402 },
  { code: 'IAD', name: 'Dulles', lat: 38.9531, lng: -77.4565 },
  { code: 'BWI', name: 'Baltimore', lat: 39.1754, lng: -76.6683 },
  { code: 'MSP', name: 'Minneapolis', lat: 44.8848, lng: -93.2223 },
  { code: 'DTW', name: 'Detroit', lat: 42.2162, lng: -83.3554 },
  { code: 'STL', name: 'St Louis', lat: 38.7487, lng: -90.3700 },
  { code: 'MCI', name: 'Kansas City', lat: 39.2976, lng: -94.7139 },
  { code: 'MSY', name: 'New Orleans', lat: 29.9934, lng: -90.2580 },
  { code: 'BNA', name: 'Nashville', lat: 36.1245, lng: -86.6782 },
  { code: 'RDU', name: 'Raleigh', lat: 35.8776, lng: -78.7875 },
  { code: 'CVG', name: 'Cincinnati', lat: 39.0489, lng: -84.6678 },
  { code: 'CMH', name: 'Columbus', lat: 39.9980, lng: -82.8919 },
  { code: 'IND', name: 'Indianapolis', lat: 39.7173, lng: -86.2944 },
  { code: 'MKE', name: 'Milwaukee', lat: 42.9472, lng: -87.8966 },
  { code: 'PIT', name: 'Pittsburgh', lat: 40.4915, lng: -80.2329 },
  { code: 'AUS', name: 'Austin', lat: 30.1975, lng: -97.6664 },
  { code: 'SAT', name: 'San Antonio', lat: 29.5337, lng: -98.4698 },
  { code: 'HNL', name: 'Honolulu', lat: 21.3245, lng: -157.9251 },
  { code: 'ANC', name: 'Anchorage', lat: 61.1743, lng: -149.9963 },
  { code: 'PSP', name: 'Palm Springs', lat: 33.8297, lng: -116.5067 },
  { code: 'SBA', name: 'Santa Barbara', lat: 34.4262, lng: -119.8404 },
  { code: 'MRY', name: 'Monterey', lat: 36.5870, lng: -121.8428 },
  { code: 'SBP', name: 'San Luis Obispo', lat: 35.2368, lng: -120.6423 },
  { code: 'BUR', name: 'Burbank', lat: 34.2007, lng: -118.3585 },
  { code: 'ONT', name: 'Ontario', lat: 34.0560, lng: -117.6012 },
  { code: 'SNA', name: 'Orange County', lat: 33.6757, lng: -117.8682 },
  { code: 'LGB', name: 'Long Beach', lat: 33.8177, lng: -118.1516 },
];

function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
  'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
  'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
  'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
  'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
  'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
  'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming',
];

async function callAutocomplete(input: string, rapidApiKey: string): Promise<AirportResult | null> {
  if (!input || input.trim().length < 2) return null;
  try {
    const params = new URLSearchParams({ query: input.trim() });
    const res = await fetch(
      `https://flights-scraper-data.p.rapidapi.com/auto-complete?${params}`,
      {
        headers: {
          'X-RapidAPI-Host': 'flights-scraper-data.p.rapidapi.com',
          'X-RapidAPI-Key': rapidApiKey,
        },
        cache: 'no-store',
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cities: any[] = Array.isArray(data?.data) ? data.data : [];
    for (const city of cities) {
      const description: string = city.description ?? '';
      if (!US_STATES.some(s => description.includes(s))) continue;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const airports: any[] = Array.isArray(city.airports) ? city.airports : [];
      for (const airport of airports) {
        const code = (airport.airportCode ?? '').trim().toUpperCase();
        if (/^[A-Z]{3}$/.test(code)) {
          return { code, name: airport.airportName ?? '', city: city.cityName ?? '' };
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

async function geocodeCity(city: string, googleApiKey: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(city)}&key=${googleApiKey}`,
      { cache: 'no-store' }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const loc = data?.results?.[0]?.geometry?.location;
    if (loc) return { lat: loc.lat as number, lng: loc.lng as number };
    return null;
  } catch {
    return null;
  }
}

async function searchFlightsForCode(
  departureCode: string,
  arrivalCode: string,
  startDate: string,
  endDate: string,
  numberOfPeople: number,
  cabinClass: number,
  rapidApiKey: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any[]> {
  try {
    const params = new URLSearchParams({
      departureId: departureCode,
      arrivalId: arrivalCode,
      departureDate: startDate,
      arrivalDate: endDate,
      adults: String(numberOfPeople),
      currency: 'USD',
      locale: 'en-US',
      market: 'US',
      sort: '2',
      cabinClass: String(cabinClass),
    });
    const res = await fetch(
      `https://flights-scraper-data.p.rapidapi.com/flights/search-roundtrip?${params}`,
      {
        headers: {
          'X-RapidAPI-Host': 'flights-scraper-data.p.rapidapi.com',
          'X-RapidAPI-Key': rapidApiKey,
        },
        cache: 'no-store',
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const top: any[] = data?.data?.topFlights ?? [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const other: any[] = data?.data?.otherFlights ?? [];
    return [...top, ...other];
  } catch {
    return [];
  }
}

type Strategy = 'A' | 'B' | 'C' | 'D' | 'E';

interface ResolvedAirport {
  code: string;
  city: string;
  strategy: Strategy;
  lat?: number;
  lng?: number;
}

async function resolveArrivalAirport(
  arrivalCity: string,
  rapidApiKey: string,
  googleApiKey: string,
): Promise<ResolvedAirport | null> {
  // Strategy A — direct autocomplete
  const resultA = await callAutocomplete(arrivalCity, rapidApiKey);
  if (resultA) {
    console.log('[/api/flights/search] resolved via strategy A:', resultA.code);
    return { code: resultA.code, city: resultA.city, strategy: 'A' };
  }

  // Strategy B — extract city from "Place Name, State" format
  const commaIdx = arrivalCity.indexOf(',');
  if (commaIdx > 0) {
    const extracted = arrivalCity.slice(0, commaIdx).trim();
    const resultB1 = await callAutocomplete(extracted, rapidApiKey);
    if (resultB1) {
      console.log('[/api/flights/search] resolved via strategy B:', resultB1.code);
      return { code: resultB1.code, city: resultB1.city, strategy: 'B' };
    }
    const firstWord = extracted.split(' ')[0];
    if (firstWord && firstWord !== extracted) {
      const resultB2 = await callAutocomplete(firstWord, rapidApiKey);
      if (resultB2) {
        console.log('[/api/flights/search] resolved via strategy B (first word):', resultB2.code);
        return { code: resultB2.code, city: resultB2.city, strategy: 'B' };
      }
    }
  }

  if (!googleApiKey) {
    console.error('[/api/flights/search] GOOGLE_API_KEY not set, skipping strategies C/D/E');
    return null;
  }

  // Geocode destination once — used by strategies C, D, E
  let lat: number | null = null;
  let lng: number | null = null;
  let stateName: string | null = null;

  try {
    const geoRes = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(arrivalCity)}&key=${googleApiKey}`,
      { cache: 'no-store' }
    );
    if (geoRes.ok) {
      const geoData = await geoRes.json();
      const loc = geoData?.results?.[0]?.geometry?.location;
      if (loc) { lat = loc.lat; lng = loc.lng; }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const components: any[] = geoData?.results?.[0]?.address_components ?? [];
      for (const comp of components) {
        if (comp.types?.includes('administrative_area_level_1')) {
          stateName = comp.long_name as string;
          break;
        }
      }
    }
  } catch (err) {
    console.error('[/api/flights/search] geocoding error:', err);
  }

  if (lat !== null && lng !== null) {
    // Strategy C — rankby=distance, try first result
    try {
      const nearbyRes = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&rankby=distance&type=airport&key=${googleApiKey}`,
        { cache: 'no-store' }
      );
      if (nearbyRes.ok) {
        const nearbyData = await nearbyRes.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const places: any[] = nearbyData?.results ?? [];
        if (places.length > 0) {
          const resultC = await callAutocomplete(places[0].name as string, rapidApiKey);
          if (resultC) {
            console.log('[/api/flights/search] resolved via strategy C:', resultC.code);
            return { code: resultC.code, city: resultC.city, strategy: 'C', lat, lng };
          }
        }
      }
    } catch (err) {
      console.error('[/api/flights/search] strategy C error:', err);
    }

    // Strategy D — radius=200000, try all sorted by rating
    try {
      const radiusRes = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=200000&type=airport&key=${googleApiKey}`,
        { cache: 'no-store' }
      );
      if (radiusRes.ok) {
        const radiusData = await radiusRes.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const places: any[] = (radiusData?.results ?? []).sort(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (a: any, b: any) => (b.rating ?? 0) - (a.rating ?? 0)
        );
        for (const place of places) {
          const resultD = await callAutocomplete(place.name as string, rapidApiKey);
          if (resultD) {
            console.log('[/api/flights/search] resolved via strategy D:', resultD.code);
            return { code: resultD.code, city: resultD.city, strategy: 'D', lat, lng };
          }
        }
      }
    } catch (err) {
      console.error('[/api/flights/search] strategy D error:', err);
    }
  }

  // Strategy E — state-level search
  if (stateName) {
    const resultE = await callAutocomplete(stateName, rapidApiKey);
    if (resultE) {
      console.log('[/api/flights/search] resolved via strategy E:', resultE.code);
      return { code: resultE.code, city: resultE.city, strategy: 'E', lat: lat ?? undefined, lng: lng ?? undefined };
    }
  }

  return null;
}

function buildResponse(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rawFlights: any[],
  airport: { code: string; city: string; originalDestination: string; requiresDriving: boolean; driveInfo: DriveInfo | null },
  startDate: string,
  endDate: string,
  numberOfPeople: number,
  flightBudgetPerPerson?: number,
) {
  const flights: FlightOption[] = rawFlights.slice(0, 5).map((flight) => {
    const pricePerPerson = Math.round(flight.price / numberOfPeople);
    return {
      airline: flight.airlineName ?? '',
      airlineCode: flight.airlineCode ?? '',
      departureTime: flight.departureTime ?? '',
      arrivalTime: flight.arrivalTime ?? '',
      departureDate: flight.departureDate ?? '',
      durationMinutes: flight.durationMinutes ?? 0,
      stops: flight.stops ?? 0,
      price: flight.price ?? 0,
      pricePerPerson,
      isWithinBudget: flightBudgetPerPerson ? pricePerPerson <= flightBudgetPerPerson : true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      segments: (flight.segments ?? []).map((s: any) => ({
        from: s.departureAirportCode ?? '',
        to: s.arrivalAirportCode ?? '',
        airline: s.airlineName ?? '',
        flightNumber: `${s.airlineCode ?? ''}${s.flightNumber ?? ''}`,
        departureTime: s.departureTime ?? '',
        arrivalTime: s.arrivalTime ?? '',
        aircraft: s.aircraftName ?? '',
        duration: s.duration ?? '',
      })),
    };
  });

  flights.sort((a, b) => {
    if (a.isWithinBudget && !b.isWithinBudget) return -1;
    if (!a.isWithinBudget && b.isWithinBudget) return 1;
    return a.price - b.price;
  });

  return {
    flights,
    arrivalAirport: airport,
    searchedDates: { departure: startDate, return: endDate },
    totalPassengers: numberOfPeople,
    withinBudgetCount: flights.filter(f => f.isWithinBudget).length,
  };
}

export async function POST(req: NextRequest) {
  let body: SearchRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ flights: [] });
  }

  const { departureCode, arrivalCity, startDate, endDate, numberOfPeople, cabinClass, flightBudgetPerPerson } = body;

  const rapidApiKey = process.env.RAPIDAPI_KEY;
  const googleApiKey = process.env.GOOGLE_API_KEY ?? '';

  if (!rapidApiKey) {
    console.error('[/api/flights/search] RAPIDAPI_KEY not set');
    return NextResponse.json({ flights: [] });
  }

  // STEP 1 — Resolve arrival airport dynamically
  const resolved = await resolveArrivalAirport(arrivalCity, rapidApiKey, googleApiKey);
  if (!resolved) {
    console.log('[/api/flights/search] could not resolve airport for:', arrivalCity);
    return NextResponse.json({ flights: [] });
  }

  let { code: arrivalCode } = resolved;
  const { city: resolvedCity, strategy } = resolved;
  const originalDestination = arrivalCity;

  // STEP 2 — Same airport check
  if (arrivalCode === departureCode) {
    console.log('[/api/flights/search] same airport detected:', arrivalCode);
    return NextResponse.json({
      flights: [],
      message: 'Departure and destination are in the same area - no flights needed',
    });
  }

  // STEP 3 — Drive distance helper (used by main path and fallback)
  async function computeDriveInfo(fromCity: string, toCity: string): Promise<DriveInfo | null> {
    if (!googleApiKey) return null;
    try {
      const distRes = await fetch(
        `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(fromCity)}&destinations=${encodeURIComponent(toCity)}&mode=driving&key=${googleApiKey}`,
        { cache: 'no-store' }
      );
      if (!distRes.ok) return null;
      const distData = await distRes.json();
      const element = distData?.rows?.[0]?.elements?.[0];
      if (element?.status !== 'OK') return null;
      const distanceMeters: number = element.distance.value ?? 0;
      // If the airport is in the same city (<5 miles) don't show a drive requirement
      if (distanceMeters < 8047) return null;
      return {
        distance: element.distance.text as string,
        duration: element.duration.text as string,
      };
    } catch {
      return null;
    }
  }

  let driveInfo: DriveInfo | null = null;
  if (strategy !== 'A') {
    driveInfo = await computeDriveInfo(resolvedCity, arrivalCity);
  }

  // STEP 4 — Search flights
  console.log('[/api/flights/search] searching flights:', departureCode, '->', arrivalCode);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allFlights: any[] = await searchFlightsForCode(
    departureCode, arrivalCode, startDate, endDate, numberOfPeople, cabinClass, rapidApiKey,
  );
  console.log('[/api/flights/search] flights found:', allFlights.length);

  // STEP 5 — Fallback: try alternative airports if no results
  if (allFlights.length === 0) {
    console.log('[/api/flights/search] no flights for', arrivalCode, '- trying alternatives...');

    let lat: number | null = resolved.lat ?? null;
    let lng: number | null = resolved.lng ?? null;

    if (!lat || !lng) {
      try {
        const geoRes = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(arrivalCity)}&key=${googleApiKey}`,
          { cache: 'no-store' }
        );
        const geoData = await geoRes.json();
        lat = geoData.results[0]?.geometry?.location?.lat ?? null;
        lng = geoData.results[0]?.geometry?.location?.lng ?? null;
        console.log('[/api/flights/search] coordinates:', lat, lng);
      } catch (e) {
        console.error('[/api/flights/search] geocoding failed:', e);
      }
    }

    if (lat && lng) {
      const nearbyAirports = US_COMMERCIAL_AIRPORTS
        .filter(a => a.code !== departureCode && a.code !== arrivalCode)
        .map(a => ({ ...a, distanceKm: getDistanceKm(lat!, lng!, a.lat, a.lng) }))
        .sort((a, b) => a.distanceKm - b.distanceKm)
        .slice(0, 8);

      console.log('[/api/flights/search] nearest commercial airports:',
        nearbyAirports.map(a => `${a.code}(${Math.round(a.distanceKm)}km)`));

      for (const airport of nearbyAirports) {
        console.log('[/api/flights/search] trying alternative:', airport.code, airport.name);

        const altFlights = await searchFlightsForCode(
          departureCode, airport.code, startDate, endDate, numberOfPeople, cabinClass, rapidApiKey,
        );

        console.log('[/api/flights/search] alternative', airport.code, 'flights:', altFlights.length);

        if (altFlights.length > 0) {
          arrivalCode = airport.code;
          allFlights.push(...altFlights);

          if (googleApiKey) {
            try {
              const distRes = await fetch(
                `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(airport.name)}&destinations=${encodeURIComponent(originalDestination)}&mode=driving&key=${googleApiKey}`,
                { cache: 'no-store' }
              );
              const distData = await distRes.json();
              const distance: string | undefined = distData.rows[0]?.elements[0]?.distance?.text;
              const duration: string | undefined = distData.rows[0]?.elements[0]?.duration?.text;
              if (distance && duration) driveInfo = { distance, duration };
            } catch (e) {
              console.error('[/api/flights/search] distance matrix failed:', e);
            }
          }

          console.log('[/api/flights/search] SUCCESS via alternative:', airport.code, 'drive:', driveInfo);
          break;
        }
      }
    }
  }

  // STEP 6 — Build response (uses final arrivalCode / driveInfo after any fallback)
  const arrivalAirport = {
    code: arrivalCode,
    city: resolvedCity,
    originalDestination,
    requiresDriving: arrivalCode !== resolved.code || driveInfo !== null,
    driveInfo,
  };

  if (allFlights.length === 0) {
    const today = new Date();
    const departure = new Date(startDate);
    const daysUntilDeparture = Math.floor(
      (departure.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    const googleFlightsUrl = `https://www.google.com/travel/flights?q=flights+from+${departureCode}+to+${encodeURIComponent(originalDestination)}+on+${startDate}`;
    if (daysUntilDeparture > 60) {
      return NextResponse.json({
        flights: [],
        arrivalAirport,
        message: 'Flight data is only available for trips within the next 60 days. Your trip dates are too far in the future — check back closer to your travel date.',
        googleFlightsUrl,
      });
    }
    return NextResponse.json({
      flights: [],
      arrivalAirport,
      message: 'No flights found for this route. Try searching Google Flights directly.',
      googleFlightsUrl,
    });
  }

  return NextResponse.json(buildResponse(allFlights, arrivalAirport, startDate, endDate, numberOfPeople, flightBudgetPerPerson));
}
