export type Trip = {
  id: string
  user_id: string
  destination: string
  start_date: string
  end_date: string
  created_at: string
  itinerary_json: Itinerary
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
}

export type UsageRecord = {
  user_id: string
  month: string
  tokens_used: number
  ceiling: number
}
