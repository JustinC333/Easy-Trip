import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkAndReserve, recordUsage } from '@/lib/costGuard'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const result = await checkAndReserve(user.id, 1000)
    return NextResponse.json({ userId: user.id, checkAndReserve: result })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    await recordUsage(user.id, 500)
    const updatedUsage = await checkAndReserve(user.id, 0)

    return NextResponse.json({
      userId: user.id,
      recordUsage: { tokensRecorded: 500 },
      updatedUsage,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
