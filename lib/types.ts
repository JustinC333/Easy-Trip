export type Trip = {
  id: string
  user_id: string
  destination: string
  start_date: string
  end_date: string
  created_at: string
  itinerary_json: Itinerary
  deleted_at?: string | null
  is_public?: boolean
}

export type FlightSegment = {
  from: string
  to: string
  airline: string
  flightNumber: string
  departureTime: string
  arrivalTime: string
  aircraft: string
  duration: string
}

export type FlightOption = {
  airline: string
  airlineCode?: string
  departureTime: string
  arrivalTime: string
  departureDate?: string
  duration?: string
  durationMinutes?: number
  stops: number
  price: number
  pricePerPerson: number
  isWithinBudget?: boolean
  segments?: FlightSegment[]
  bookingToken?: string
}

export type ArrivalAirport = {
  code: string
  name?: string
  city: string
  originalDestination?: string
  requiresDriving?: boolean
  driveInfo?: { distance: string; duration: string } | null
  /** @deprecated use driveInfo */
  distanceToDestination?: string
  /** @deprecated use driveInfo */
  driveTimeToDestination?: string
}

export type DepartureInfo = {
  city?: string
  code?: string
  cabinClass?: number | string
  budgetPerPerson?: number
}

export type Itinerary = {
  summary: string
  days: {
    day: number
    date: string
    activities: {
      time: string
      title: string
      description: string
      place_name?: string
      type: 'activity' | 'food' | 'lodging' | 'travel'
    }[]
  }[]
  tips: string[]
  departureCity?: string
  departureCode?: string
  flightBudgetPerPerson?: number
  cabinClass?: string
  departureInfo?: DepartureInfo
  flights?: FlightOption[]
  arrivalAirport?: ArrivalAirport
  flightMessage?: string
  googleFlightsUrl?: string
  hotels?: { name: string; pricePerNight: number | null; url?: string }[]
  accommodationType?: string
  dataConfidence?: {
    hitRate: number
    totalPlaceNames: number
    matchedPlaceNames: number
    isHighConfidence: boolean
    flag: 'high' | 'medium' | 'low'
  }
}

export type UsageRecord = {
  user_id: string
  month: string
  tokens_used: number
  ceiling: number
}
