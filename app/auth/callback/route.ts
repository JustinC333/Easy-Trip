import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  if (error) {
    return NextResponse.redirect(
      `${origin}/auth?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(errorDescription ?? '')}`
    )
  }

  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    if (!exchangeError) {
      return NextResponse.redirect(`${origin}/plan`)
    }
    return NextResponse.redirect(
      `${origin}/auth?error=exchange_failed&error_description=Could+not+confirm+your+email`
    )
  }

  return NextResponse.redirect(`${origin}/auth`)
}
