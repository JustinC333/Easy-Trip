import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

interface Destination {
  state: string;
  city: string;
}

interface EnrichedContext {
  nps: { parks: Array<{ name: string; description: string; url: string; entranceFee: string | null }> } | null;
  places: { attractions: Array<{ name: string; rating: number; address: string }> } | null;
  hotels: { options: Array<{ name: string; pricePerNight: number; rating: number }> } | null;
}

interface GenerateRequest {
  destinations: Destination[];
  startDate: string;
  endDate: string;
  groupSize: string;
  numberOfPeople: number;
  travelStyles: string[];
  transportation: string;
  accommodation: string;
  totalBudget: number;
  budgetPerPerson: number;
  flightBudgetPerPerson?: number;
  accommodationBudget?: number;
  mustHaves?: string;
  departureCity?: string;
  departureCode?: string;
  cabinClass?: string;
  enrichedContext: EnrichedContext;
}

interface Activity {
  time: string;
  title: string;
  description: string;
  place_name?: string;
  type: 'activity' | 'food' | 'lodging' | 'travel';
}

interface Day {
  day: number;
  date: string;
  activities: Activity[];
}

interface Itinerary {
  summary: string;
  days: Day[];
  tips: string[];
}

function buildUserPrompt(body: GenerateRequest): string {
  const start = new Date(body.startDate);
  const end = new Date(body.endDate);
  const numberOfDays = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;

  const destinationList = body.destinations.map(d => `${d.city}, ${d.state}`).join(' → ');

  const lines: string[] = [
    `Create a detailed ${numberOfDays}-day trip itinerary for the following trip:`,
    ``,
    `DESTINATIONS: ${destinationList}`,
    `TRAVEL DATES: ${body.startDate} to ${body.endDate} (${numberOfDays} days)`,
    `GROUP SIZE: ${body.groupSize} (${body.numberOfPeople} people)`,
    `TRAVEL STYLES/INTERESTS: ${body.travelStyles.join(', ')}`,
    `TRANSPORTATION: ${body.transportation}`,
    `ACCOMMODATION TYPE: ${body.accommodation}`,
    `TOTAL BUDGET: $${body.totalBudget}`,
    `BUDGET PER PERSON: $${body.budgetPerPerson}`,
  ];

  if (body.flightBudgetPerPerson) {
    lines.push(`FLIGHT BUDGET PER PERSON (round trip): $${body.flightBudgetPerPerson}`);
  }
  if (body.accommodationBudget) {
    lines.push(`ACCOMMODATION BUDGET (total): $${body.accommodationBudget}`);
  }
  if (body.mustHaves) {
    lines.push(`MUST-HAVES: ${body.mustHaves}`);
  }

  lines.push(``);

  if (body.enrichedContext.places?.attractions?.length) {
    lines.push(`NEARBY ATTRACTIONS (use these real place names wherever possible):`);
    for (const a of body.enrichedContext.places.attractions) {
      lines.push(`  - ${a.name} (rating: ${a.rating ?? 'N/A'}) — ${a.address}`);
    }
    lines.push(``);
  }

  if (body.enrichedContext.hotels?.options?.length) {
    lines.push(`NEARBY HOTELS (recommend the most appropriate one based on the accommodation budget and group size):`);
    for (const h of body.enrichedContext.hotels.options) {
      const price = h.pricePerNight != null ? `$${h.pricePerNight}/night` : 'price unavailable';
      lines.push(`  - ${h.name} — ${price}, rating: ${h.rating ?? 'N/A'}`);
    }
    lines.push(``);
  }

  if (body.enrichedContext.nps?.parks?.length) {
    lines.push(`NEARBY NATIONAL PARKS (include if relevant to travel style):`);
    for (const p of body.enrichedContext.nps.parks) {
      const fee = p.entranceFee ? `entrance fee: $${p.entranceFee}` : 'no entrance fee';
      lines.push(`  - ${p.name} — ${fee}. ${p.description?.slice(0, 150)}...`);
    }
    lines.push(``);
  }

  if (body.departureCode && body.flightBudgetPerPerson) {
    const cabinClass = body.cabinClass ?? 'Economy';
    const cabinClassUrl = cabinClass === 'Premium Economy' ? 'premium' : cabinClass.toLowerCase();
    const primaryDest = body.destinations[0];

    lines.push(
      `FLIGHT INFORMATION:`,
      `The user is flying from ${body.departureCity} (${body.departureCode}).`,
      `Their round trip flight budget is $${body.flightBudgetPerPerson} per person.`,
      `Cabin class preference: ${cabinClass}`,
      `Travel dates: ${body.startDate} to ${body.endDate}`,
      `Number of passengers: ${body.numberOfPeople}`,
      ``,
      `In Day 1 of the itinerary:`,
      `1. Include a morning travel activity for the flight`,
      `2. Search Google Flights or similar for this route:`,
      `   ${body.departureCode} → nearest major airport to ${primaryDest.city}, ${primaryDest.state}`,
      `   Departure: ${body.startDate}, Return: ${body.endDate}`,
      `3. If you know of likely flight options for this route within the budget, mention specific airlines and approximate prices`,
      `4. Include a Google Flights search link in the activity description using this format:`,
      `   https://www.google.com/flights#search;f=${body.departureCode};t=[ARRIVAL_AIRPORT_CODE];d=${body.startDate};r=${body.endDate};c=${cabinClassUrl}`,
      `   (Replace [ARRIVAL_AIRPORT_CODE] with the actual IATA code of the nearest major airport to ${primaryDest.city})`,
      `5. If the destination has no direct airport, include a driving leg from the nearest airport to the destination with estimated drive time`,
      ``,
      `In the last day of the itinerary:`,
      `Include a return flight activity with departure from the destination airport back to ${body.departureCode} (${body.departureCity}).`,
      ``,
    );
  }

  lines.push(
    `INSTRUCTIONS:`,
    `- Use REAL place names from the enriched context above wherever possible`,
    `- Include realistic times for each activity (e.g. "9:00 AM", "12:30 PM")`,
    `- Balance activities, meals, and rest throughout each day`,
    `- Each day must have breakfast, lunch, and dinner entries`,
    `- Spread the destinations across the days logically based on travel time`,
    `- Stay within the stated budget`,
    ``,
    `Return a JSON object matching EXACTLY this TypeScript type (no extra fields):`,
    `{`,
    `  summary: string,`,
    `  days: Array<{`,
    `    day: number,`,
    `    date: string,`,
    `    activities: Array<{`,
    `      time: string,`,
    `      title: string,`,
    `      description: string,`,
    `      place_name?: string,`,
    `      type: "activity" | "food" | "lodging" | "travel"`,
    `    }>`,
    `  }>,`,
    `  tips: string[]`,
    `}`,
  );

  return lines.join('\n');
}

export async function POST(req: NextRequest) {
  let body: GenerateRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.destinations || body.destinations.length === 0) {
    return NextResponse.json(
      { error: 'At least one destination is required' },
      { status: 400 },
    );
  }
  if (!body.startDate || !body.endDate) {
    return NextResponse.json(
      { error: 'Start date and end date are required' },
      { status: 400 },
    );
  }
  if (!body.numberOfPeople || body.numberOfPeople < 1) {
    return NextResponse.json(
      { error: 'Number of people is required' },
      { status: 400 },
    );
  }

  const destinationLabel = body.destinations.map(d => `${d.city}, ${d.state}`).join(' → ');
  console.log(`Generating itinerary for ${destinationLabel}...`);

  const client = new Anthropic();

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 8192,
      system:
        'You are an expert US travel planner. Your job is to create detailed, realistic, personalized day-by-day trip itineraries. You MUST respond with ONLY valid JSON — no markdown, no backticks, no explanation text before or after. Your entire response must be parseable by JSON.parse().',
      messages: [{ role: 'user', content: buildUserPrompt(body) }],
    });

    const tokensUsed = response.usage.input_tokens + response.usage.output_tokens;
    console.log(`Tokens used: ${tokensUsed}`);

    const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === 'text');
    if (!textBlock) {
      console.error('No text block in response:', JSON.stringify(response.content));
      return NextResponse.json({ error: 'No text in response' }, { status: 500 });
    }

    // Strip accidental markdown fences
    const raw = textBlock.text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');

    let itinerary: Itinerary;
    try {
      itinerary = JSON.parse(raw);
    } catch (parseErr) {
      console.error('JSON parse failed:', parseErr, '\nRaw response:', raw);
      return NextResponse.json(
        { error: 'Failed to parse itinerary JSON', raw },
        { status: 500 },
      );
    }

    // ── Hallucination check ──────────────────────────────────────────────────
    const enrichedContext = body.enrichedContext;

    const knownPlaces: string[] = [];
    if (enrichedContext?.hotels?.options) {
      enrichedContext.hotels.options.forEach((h: any) => {
        if (h.name) knownPlaces.push(h.name.toLowerCase());
      });
    }
    if (enrichedContext?.places?.attractions) {
      enrichedContext.places.attractions.forEach((p: any) => {
        if (p.name) knownPlaces.push(p.name.toLowerCase());
      });
    }
    if (enrichedContext?.nps?.parks) {
      enrichedContext.nps.parks.forEach((p: any) => {
        if (p.name) knownPlaces.push(p.name.toLowerCase());
      });
    }
    console.log('[/api/generate] known real places:', knownPlaces.length, knownPlaces);

    const generatedPlaceNames: string[] = [];
    itinerary.days.forEach((day: any) => {
      day.activities.forEach((activity: any) => {
        if (activity.place_name) {
          generatedPlaceNames.push(activity.place_name.toLowerCase());
        }
      });
    });
    console.log('[/api/generate] generated place names:', generatedPlaceNames.length, generatedPlaceNames);

    const matches = generatedPlaceNames.filter(generated =>
      knownPlaces.some(known =>
        known.includes(generated) ||
        generated.includes(known) ||
        generated.split(' ').some(word => word.length > 4 && known.includes(word))
      )
    );

    const hitRate = generatedPlaceNames.length > 0
      ? matches.length / generatedPlaceNames.length
      : 0;

    console.log('[/api/generate] hallucination check:', {
      totalPlaceNames: generatedPlaceNames.length,
      matchedToRealData: matches.length,
      hitRate: Math.round(hitRate * 100) + '%',
      matchedPlaces: matches,
      unmatchedPlaces: generatedPlaceNames.filter(p => !matches.includes(p)),
    });

    (itinerary as any).dataConfidence = {
      hitRate: Math.round(hitRate * 100),
      totalPlaceNames: generatedPlaceNames.length,
      matchedPlaceNames: matches.length,
      isHighConfidence: hitRate >= 0.5,
      flag: hitRate >= 0.7 ? 'high' : hitRate >= 0.4 ? 'medium' : 'low',
    };
    // ────────────────────────────────────────────────────────────────────────

    return NextResponse.json({ itinerary, tokensUsed });
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      console.error(`Anthropic API error ${error.status}:`, error.message, error);
      return NextResponse.json(
        { error: `Anthropic API error: ${error.message}` },
        { status: error.status ?? 500 },
      );
    }
    console.error('Unexpected error generating itinerary:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
