// CostGuard uses an atomic PostgreSQL stored procedure
// (check_and_increment_usage) to prevent race conditions.
// The UPDATE ... WHERE tokens_used + estimated <= ceiling
// operation is atomic at the database level, so concurrent
// requests cannot both exceed the ceiling.

import { createClient } from '@/lib/supabase/server'

export async function checkAndReserve(
  userId: string,
  estimatedTokens: number
): Promise<{ allowed: boolean; remaining: number }> {
  const supabase = await createClient()
  const month = new Date().toISOString().slice(0, 7)

  const { data, error } = await supabase
    .rpc('check_and_increment_usage', {
      p_user_id: userId,
      p_month: month,
      p_estimated_tokens: estimatedTokens,
      p_ceiling: 50000
    })

  if (error) {
    console.error('[costGuard] checkAndReserve error:', error)
    // Fail open — allow the request if RPC fails
    // to avoid blocking users due to DB errors
    return { allowed: true, remaining: 50000 }
  }

  console.log('[costGuard] checkAndReserve result:', data)

  return {
    allowed: data.allowed,
    remaining: data.remaining ?? 0
  }
}

export async function recordUsage(
  userId: string,
  tokensUsed: number
): Promise<void> {
  const supabase = await createClient()
  const month = new Date().toISOString().slice(0, 7)

  const { error } = await supabase.rpc(
    'check_and_increment_usage', {
      p_user_id: userId,
      p_month: month,
      p_estimated_tokens: tokensUsed,
      p_ceiling: 999999999  // No ceiling for recordUsage
    }
  )

  if (error) {
    console.error('[costGuard] recordUsage error:', error)
  }
}
