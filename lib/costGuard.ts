// NOTE: checkAndReserve is not atomic — race conditions possible
// under high concurrency. For production, use a database transaction
// or atomic increment. Acceptable for MVP usage levels.

import { createClient } from '@/lib/supabase/server'

function getCurrentMonth(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

export async function checkAndReserve(
  userId: string,
  estimatedTokens: number
): Promise<{ allowed: boolean; remaining: number }> {
  try {
    const supabase = await createClient()
    const month = getCurrentMonth()

    const { data, error } = await supabase
      .from('usage_records')
      .select('tokens_used, ceiling')
      .eq('user_id', userId)
      .eq('month', month)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch usage record: ${error.message}`)
    }

    if (!data) {
      const { error: insertError } = await supabase.from('usage_records').insert({
        user_id: userId,
        month,
        tokens_used: 0,
        ceiling: 50000,
      })

      if (insertError) {
        throw new Error(`Failed to create usage record: ${insertError.message}`)
      }

      return { allowed: estimatedTokens <= 50000, remaining: 50000 }
    }

    const { tokens_used, ceiling } = data
    const remaining = ceiling - tokens_used

    if (tokens_used + estimatedTokens > ceiling) {
      return { allowed: false, remaining }
    }

    return { allowed: true, remaining }
  } catch (err) {
    if (err instanceof Error) throw err
    throw new Error('Unexpected error in checkAndReserve')
  }
}

export async function recordUsage(userId: string, tokensUsed: number): Promise<void> {
  try {
    const supabase = await createClient()
    const month = getCurrentMonth()

    const { data, error: fetchError } = await supabase
      .from('usage_records')
      .select('tokens_used')
      .eq('user_id', userId)
      .eq('month', month)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw new Error(`Failed to fetch usage record: ${fetchError.message}`)
    }

    if (!data) {
      const { error: insertError } = await supabase.from('usage_records').insert({
        user_id: userId,
        month,
        tokens_used: tokensUsed,
        ceiling: 50000,
      })

      if (insertError) {
        throw new Error(`Failed to create usage record: ${insertError.message}`)
      }

      return
    }

    const { error: updateError } = await supabase
      .from('usage_records')
      .update({ tokens_used: data.tokens_used + tokensUsed })
      .eq('user_id', userId)
      .eq('month', month)

    if (updateError) {
      throw new Error(`Failed to update usage record: ${updateError.message}`)
    }
  } catch (err) {
    if (err instanceof Error) throw err
    throw new Error('Unexpected error in recordUsage')
  }
}
