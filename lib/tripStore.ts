import { Itinerary } from '@/lib/types'
import { createClient } from '@/lib/supabase/server'

export async function saveTrip(params: {
  userId: string
  destination: string
  startDate: string
  endDate: string
  itinerary: Itinerary
}): Promise<string> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('trips')
    .insert({
      user_id: params.userId,
      destination: params.destination,
      start_date: params.startDate,
      end_date: params.endDate,
      itinerary_json: params.itinerary,
    })
    .select('id')
    .single()

  if (error || !data) {
    throw new Error(`Failed to save trip: ${error?.message ?? 'no data returned'}`)
  }

  return data.id as string
}
