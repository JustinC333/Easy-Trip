import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkAndReserve, recordUsage } from '@/lib/costGuard'
import { saveTrip } from '@/lib/tripStore'
import { Itinerary } from '@/lib/types'

const CABIN_CLASS_MAP: Record<number, string> = {
  1: 'Economy',
  2: 'Premium Economy',
  3: 'Business',
  4: 'First Class',
}

interface PlanRequest {
  destinations: Array<{ state: string; city: string }>
  startDate: string
  endDate: string
  groupSize: string
  numberOfPeople: number
  travelStyles: string[]
  transportation: string
  accommodation: string
  totalBudget: number
  budgetPerPerson: number
  flightBudgetPerPerson?: number
  accommodationBudget?: number
  mustHaves?: string
  departureCode?: string
  departureCity?: string
  cabinClass?: number
}

export async function POST(req: NextRequest) {
  // Step 1 — Authenticate
  console.log('[/api/plan] Step 1: Authenticating...')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Step 2 — Validate input
  console.log('[/api/plan] Step 2: Validating input...')
  let body: PlanRequest
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { destinations, startDate, endDate, departureCode, departureCity, cabinClass, numberOfPeople, flightBudgetPerPerson } = body
  if (!destinations || destinations.length === 0) {
    return NextResponse.json({ error: 'At least one destination required' }, { status: 400 })
  }
  if (!startDate || !endDate) {
    return NextResponse.json({ error: 'Dates are required' }, { status: 400 })
  }

  // Step 3 — Check cost guard
  console.log('[/api/plan] Step 3: Checking cost guard...')
  const { allowed } = await checkAndReserve(user.id, 3000)
  if (!allowed) {
    return NextResponse.json({ error: 'Monthly AI limit reached', remaining: 0 }, { status: 429 })
  }

  // Step 4 — Fetch enrichment data (no flight search)
  console.log('[/api/plan] Step 4: Fetching enrichment...')
  const baseUrl = new URL(req.url).origin
  let enrichedContext: { nps: null | unknown; places: null | unknown; hotels: null | unknown; flights: null | unknown } = { nps: null, places: null, hotels: null, flights: null }
  try {
    const enrichRes = await fetch(`${baseUrl}/api/enrich`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destination: `${destinations[0].city}, ${destinations[0].state}`,
        state: destinations[0].state,
        startDate,
        endDate,
        departureCode,
        numberOfPeople,
        cabinClass,
        flightBudgetPerPerson,
      }),
    })
    if (enrichRes.ok) {
      enrichedContext = await enrichRes.json()
    } else {
      console.warn('[/api/plan] Enrichment returned non-OK status:', enrichRes.status, '— continuing without enrichment')
    }
  } catch (err) {
    console.error('[/api/plan] Enrichment fetch failed (continuing without enrichment):', err)
  }

  // Step 5 — Generate itinerary
  console.log('[/api/plan] Step 5: Generating itinerary...')
  const cabinClassText = CABIN_CLASS_MAP[cabinClass ?? 1] ?? 'Economy'

  let itinerary: Itinerary
  let tokensUsed = 0
  try {
    const generateRes = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...body,
        enrichedContext,
        cabinClass: cabinClassText,
      }),
    })
    if (!generateRes.ok) {
      const errData = await generateRes.json().catch(() => ({ error: 'Generation failed' }))
      console.error('[/api/plan] Generation endpoint returned error:', errData)
      return NextResponse.json({ error: errData.error ?? 'Failed to generate itinerary' }, { status: 500 })
    }
    const generateData = await generateRes.json()
    itinerary = generateData.itinerary
    tokensUsed = generateData.tokensUsed ?? 0
  } catch (err) {
    console.error('[/api/plan] Generation fetch failed:', err)
    return NextResponse.json({ error: 'Failed to generate itinerary' }, { status: 500 })
  }

  // Step 6 — Record token usage
  console.log('[/api/plan] Step 6: Recording usage...')
  await recordUsage(user.id, tokensUsed)

  // Step 7 — Save trip
  console.log('[/api/plan] Step 7: Saving trip...')
  if (departureCity) itinerary.departureCity = departureCity
  if (departureCode) itinerary.departureCode = departureCode
  if (departureCode && flightBudgetPerPerson) {
    itinerary.flightBudgetPerPerson = flightBudgetPerPerson
    itinerary.cabinClass = cabinClassText
  }

  // Attach flight data from enrichment
  if (enrichedContext?.flights) {
    const flightData = enrichedContext.flights as {
      flights?: unknown[]
      arrivalAirport?: unknown
      message?: string
      googleFlightsUrl?: string
    }
    if (flightData.flights && (flightData.flights as unknown[]).length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      itinerary.flights = flightData.flights as any
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      itinerary.arrivalAirport = flightData.arrivalAirport as any
    }
    if (flightData.message) itinerary.flightMessage = flightData.message
    if (flightData.googleFlightsUrl) itinerary.googleFlightsUrl = flightData.googleFlightsUrl
    if (flightData.arrivalAirport) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      itinerary.arrivalAirport = flightData.arrivalAirport as any
    }
  }

  // Store departure info for display
  if (departureCode) {
    itinerary.departureInfo = {
      city: departureCity,
      code: departureCode,
      cabinClass: cabinClass,
      budgetPerPerson: flightBudgetPerPerson,
    }
  }

  const destination = destinations.map(d => `${d.city}, ${d.state}`).join(' → ')
  const tripId = await saveTrip({
    userId: user.id,
    destination,
    startDate,
    endDate,
    itinerary,
  })

  // Step 8 — Done
  console.log(`[/api/plan] Step 8: Done! tripId: ${tripId}`)
  return NextResponse.json({ tripId })
}
