export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'
import type { Trip } from '@/lib/types'

/* ─── Style tokens ─── */
const C = {
  bg: '#030810',
  border: 'rgba(255,255,255,0.08)',
  green: '#1e8a52',
  greenBright: '#34d475',
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255,255,255,0.62)',
  textMuted: 'rgba(255,255,255,0.38)',
}

/* ─── Activity type config ─── */
const ACT: Record<string, { color: string; bg: string; label: string }> = {
  activity: { color: '#34d475', bg: 'rgba(52,212,117,0.12)', label: 'Activity' },
  food:     { color: '#fb923c', bg: 'rgba(251,146,60,0.12)',  label: 'Food'     },
  lodging:  { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', label: 'Lodging'  },
  travel:   { color: 'rgba(255,255,255,0.45)', bg: 'rgba(255,255,255,0.06)', label: 'Travel' },
}

/* ─── Date helpers ─── */
function formatDateRange(start: string, end: string): string {
  const s = new Date(start + 'T00:00:00')
  const e = new Date(end + 'T00:00:00')
  const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) => d.toLocaleDateString('en-US', opts)
  return `${fmt(s, { month: 'long', day: 'numeric' })} – ${fmt(e, { month: 'long', day: 'numeric' })}, ${e.getFullYear()}`
}

function formatDayHeader(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })
}

function calcDays(start: string, end: string): number {
  return Math.round((new Date(end + 'T00:00:00').getTime() - new Date(start + 'T00:00:00').getTime()) / 86400000) + 1
}

/* ─── Logo ─── */
function LogoIcon() {
  return (
    <svg viewBox="0 0 24 30" fill="none" style={{ width: 24, height: 30, flexShrink: 0 }} aria-hidden="true">
      <defs>
        <linearGradient id="et-pin-share" x1="3" y1="1" x2="21" y2="29" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34d475" />
          <stop offset="100%" stopColor="#0d6b35" />
        </linearGradient>
      </defs>
      <path d="M12 1C7.03 1 3 5.03 3 10c0 4.42 3.2 8.22 7.2 13.1L12 29l1.8-5.9C17.8 18.22 21 14.42 21 10c0-4.97-4.03-9-9-9z"
        fill="url(#et-pin-share)" style={{ filter: 'drop-shadow(0 3px 8px rgba(13,107,53,0.45))' }} />
      <circle cx="12" cy="10" r="5.5" fill="white" opacity="0.97" />
      <line x1="12" y1="10" x2="9.6" y2="8.6" stroke="#0d6b35" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="12" y1="10" x2="15.3" y2="8.1" stroke="#0d6b35" strokeWidth="1" strokeLinecap="round" />
      <circle cx="12" cy="10" r="0.9" fill="#0d6b35" />
    </svg>
  )
}

/* ─── Private / Not Found ─── */
function PrivateMessage() {
  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', system-ui, sans-serif", padding: 24 }}>
      <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`, borderRadius: 20, padding: '44px 36px', maxWidth: 480, width: '100%', textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg viewBox="0 0 20 20" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 22, height: 22 }}>
            <rect x="5" y="8" width="10" height="9" rx="2" />
            <path d="M7 8V6a3 3 0 016 0v2" />
          </svg>
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: C.textPrimary, margin: '0 0 12px', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          This trip is private or doesn&apos;t exist.
        </h2>
        <p style={{ fontSize: 15, color: C.textSecondary, lineHeight: 1.7, margin: '0 0 28px' }}>
          The link may have expired, or the owner made this trip private.
        </p>
        <a href="/" className="share-cta-btn" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'linear-gradient(140deg,#1e8a52 0%,#0d5530 100%)',
          border: '1px solid rgba(50,160,100,0.35)',
          borderRadius: 10, padding: '12px 24px',
          fontSize: 14, fontWeight: 600, color: 'white', textDecoration: 'none',
          boxShadow: '0 0 20px rgba(26,130,78,0.3)',
          transition: 'box-shadow 0.2s ease, transform 0.15s ease',
        }}>
          Plan Your Own Trip
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}>
            <path d="M6 4l4 4-4 4" />
          </svg>
        </a>
      </div>
      <style>{`.share-cta-btn:hover { box-shadow: 0 0 32px rgba(26,130,78,0.5) !important; transform: translateY(-1px) !important; }`}</style>
    </div>
  )
}

/* ─── Share View ─── */
function ShareView({ trip, sharedByName }: { trip: Trip; sharedByName?: string | null }) {
  const itin = trip.itinerary_json
  const days = calcDays(trip.start_date, trip.end_date)

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'DM Sans', system-ui, sans-serif", color: 'white' }}>

      {/* Background aurora */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div className="aurora-a" style={{ position: 'absolute', top: '-10%', left: '20%', width: 700, height: 500, borderRadius: '50%', background: 'radial-gradient(ellipse at center, rgba(26,130,78,0.18) 0%, transparent 70%)' }} />
        <div className="aurora-b" style={{ position: 'absolute', bottom: '10%', right: '15%', width: 500, height: 400, borderRadius: '50%', background: 'radial-gradient(ellipse at center, rgba(13,107,53,0.14) 0%, transparent 70%)' }} />
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.03 }}>
          <filter id="grain-share">
            <feTurbulence type="fractalNoise" baseFrequency="0.68" numOctaves="3" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#grain-share)" />
        </svg>
      </div>

      {/* Navbar */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, padding: '14px 0', background: 'rgba(3,8,16,0.82)', backdropFilter: 'blur(18px) saturate(1.4)', borderBottom: '1px solid rgba(255,255,255,0.055)' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
            <LogoIcon />
            <span className="et-display" style={{ fontWeight: 700, fontSize: 20, color: 'white', letterSpacing: '-0.02em' }}>Easy Trip</span>
          </a>
          <a href="/plan" className="share-cta-btn" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'linear-gradient(140deg,#1e8a52 0%,#0d5530 100%)',
            border: '1px solid rgba(50,160,100,0.35)',
            borderRadius: 9, padding: '9px 18px',
            fontSize: 13, fontWeight: 600, color: 'white', textDecoration: 'none',
            boxShadow: '0 0 18px rgba(26,130,78,0.25)',
            transition: 'box-shadow 0.2s ease, transform 0.15s ease',
          }}>
            Plan Your Own Trip →
          </a>
        </div>
      </nav>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 780, margin: '0 auto', padding: '106px 24px 160px', animation: 'trip-fadein 0.45s ease-out both' }}>

        {/* ── BANNER ── */}
        <div style={{
          marginBottom: 32,
          background: 'linear-gradient(135deg, rgba(30,138,82,0.18) 0%, rgba(13,85,48,0.12) 100%)',
          border: '1px solid rgba(52,212,117,0.22)',
          borderRadius: 14, padding: '16px 22px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary, marginBottom: 3 }}>
              ✈️ Planned with Easy Trip AI
            </div>
            <div style={{ fontSize: 12, color: C.textSecondary }}>
              {sharedByName ? `Shared by ${sharedByName} · ` : ''}Plan your own AI-powered itinerary in minutes
            </div>
          </div>
          <a href="/plan" className="share-cta-btn" style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: 'linear-gradient(140deg,#1e8a52 0%,#0d5530 100%)',
            border: '1px solid rgba(50,160,100,0.35)',
            borderRadius: 8, padding: '9px 16px',
            fontSize: 13, fontWeight: 600, color: 'white', textDecoration: 'none',
            boxShadow: '0 0 14px rgba(26,130,78,0.25)',
            flexShrink: 0,
            transition: 'box-shadow 0.2s ease, transform 0.15s ease',
          }}>
            Plan My Trip
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 12, height: 12 }}>
              <path d="M6 4l4 4-4 4" />
            </svg>
          </a>
        </div>

        {/* ── HERO ── */}
        <div style={{ paddingBottom: 36, marginBottom: 32, borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(52,212,117,0.09)', border: '1px solid rgba(52,212,117,0.2)', borderRadius: 100, padding: '5px 13px', fontSize: 10, fontWeight: 700, color: C.greenBright, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 20 }}>
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 11, height: 11 }}>
              <path d="M7 1l1.5 3 3.5.5-2.5 2.5.6 3.5L7 9l-3.1 1.5.6-3.5L2 4.5l3.5-.5z" />
            </svg>
            Generated by Easy Trip AI
          </div>

          <h1 className="et-display" style={{ fontSize: 'clamp(38px, 8vw, 68px)', fontWeight: 700, color: C.textPrimary, letterSpacing: '-0.03em', lineHeight: 1.05, margin: '0 0 20px' }}>
            {trip.destination}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 14, color: C.textSecondary }}>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" style={{ width: 13, height: 13, flexShrink: 0 }}>
                <rect x="2" y="3" width="12" height="11" rx="2" />
                <path d="M5 1v4M11 1v4M2 7h12" />
              </svg>
              {formatDateRange(trip.start_date, trip.end_date)}
            </div>
            <div style={{ width: 3, height: 3, borderRadius: '50%', background: C.textMuted, flexShrink: 0 }} />
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(30,138,82,0.18)', border: '1px solid rgba(52,212,117,0.25)', borderRadius: 100, padding: '5px 14px', fontSize: 13, fontWeight: 600, color: C.greenBright }}>
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" style={{ width: 11, height: 11 }}>
                <circle cx="7" cy="7" r="5.5" />
                <path d="M7 4v3l2 1.5" />
              </svg>
              {days} {days === 1 ? 'day' : 'days'}
            </div>
          </div>
        </div>

        {/* ── SUMMARY ── */}
        <div style={{ marginBottom: 32, background: 'rgba(255,255,255,0.025)', border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.green}`, borderRadius: '0 14px 14px 0', padding: '22px 26px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: C.greenBright, textTransform: 'uppercase', marginBottom: 10 }}>Trip Overview</div>
          <p style={{ fontSize: 15, color: C.textSecondary, lineHeight: 1.78, margin: 0 }}>{itin.summary}</p>
        </div>

        {/* ── DAY CARDS ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 32 }}>
          {itin.days.map((day, dayIdx) => (
            <div key={dayIdx} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 32px rgba(0,0,0,0.28)' }}>
              <div style={{ padding: '18px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: 'rgba(255,255,255,0.015)' }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: C.greenBright, textTransform: 'uppercase', marginBottom: 5 }}>Day {day.day}</div>
                  <div className="et-display" style={{ fontSize: 18, fontWeight: 600, color: C.textPrimary, letterSpacing: '-0.01em' }}>{formatDayHeader(day.date)}</div>
                </div>
                <div style={{ fontSize: 11, color: C.textMuted, background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 100, padding: '4px 12px', fontWeight: 500, flexShrink: 0, whiteSpace: 'nowrap' }}>
                  {day.activities.length} {day.activities.length === 1 ? 'stop' : 'stops'}
                </div>
              </div>
              <div style={{ padding: '6px 0 4px' }}>
                {day.activities.map((act, actIdx) => {
                  const ac = ACT[act.type] ?? ACT.activity
                  const isLast = actIdx === day.activities.length - 1
                  return (
                    <div key={actIdx} style={{ display: 'flex', padding: `0 24px ${isLast ? 20 : 0}px` }}>
                      <div style={{ width: 64, flexShrink: 0, paddingTop: 20, fontSize: 11, fontWeight: 600, color: C.textMuted, letterSpacing: '0.03em', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{act.time}</div>
                      <div style={{ width: 20, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: ac.color, marginTop: 18, flexShrink: 0, boxShadow: `0 0 10px ${ac.color}66`, position: 'relative', zIndex: 1 }} />
                        {!isLast && <div style={{ flex: 1, width: 1.5, background: 'rgba(255,255,255,0.07)', marginTop: 5, minHeight: 20 }} />}
                      </div>
                      <div style={{ flex: 1, paddingLeft: 16, paddingTop: 14, paddingBottom: isLast ? 0 : 20 }}>
                        <div style={{ marginBottom: 7 }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', background: ac.bg, borderRadius: 100, padding: '2px 9px', fontSize: 9, fontWeight: 800, color: ac.color, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{ac.label}</span>
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: C.textPrimary, marginBottom: 5, lineHeight: 1.3 }}>{act.title}</div>
                        {act.description && <div style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.68, marginBottom: act.place_name ? 8 : 0 }}>{act.description}</div>}
                        {act.place_name && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: C.textMuted, fontStyle: 'italic' }}>
                            <svg viewBox="0 0 12 12" fill="none" stroke={ac.color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width: 10, height: 10, flexShrink: 0, opacity: 0.8 }}>
                              <path d="M6 1C3.8 1 2 2.8 2 5c0 2.5 3.5 6 4 6s4-3.5 4-6c0-2.2-1.8-4-4-4z" />
                              <circle cx="6" cy="5" r="1.2" />
                            </svg>
                            {act.place_name}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* ── TRAVEL TIPS ── */}
        {itin.tips && itin.tips.length > 0 && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`, borderRadius: 16, padding: '24px 28px', marginBottom: 40, boxShadow: '0 4px 24px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(52,212,117,0.1)', border: '1px solid rgba(52,212,117,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg viewBox="0 0 16 16" fill="none" stroke={C.greenBright} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
                  <circle cx="8" cy="8" r="6" />
                  <path d="M8 5.5v3M8 11v.5" />
                </svg>
              </div>
              <h2 className="et-display" style={{ fontSize: 18, fontWeight: 600, color: C.textPrimary, margin: 0, letterSpacing: '-0.01em' }}>Travel Tips</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              {itin.tips.map((tip, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(52,212,117,0.1)', border: '1px solid rgba(52,212,117,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                    <svg viewBox="0 0 12 12" fill="none" stroke={C.greenBright} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 8, height: 8 }}>
                      <path d="M2 6l2.5 2.5L10 3" />
                    </svg>
                  </div>
                  <p style={{ fontSize: 14, color: C.textSecondary, lineHeight: 1.68, margin: 0 }}>{tip}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── BOTTOM CTA ── */}
        <div style={{ background: 'linear-gradient(135deg, rgba(30,138,82,0.14) 0%, rgba(13,85,48,0.09) 100%)', border: '1px solid rgba(52,212,117,0.18)', borderRadius: 16, padding: '32px 28px', textAlign: 'center' }}>
          <div className="et-display" style={{ fontSize: 24, fontWeight: 700, color: C.textPrimary, marginBottom: 10, letterSpacing: '-0.02em' }}>
            Love this itinerary?
          </div>
          <p style={{ fontSize: 15, color: C.textSecondary, lineHeight: 1.7, margin: '0 0 24px' }}>
            Plan your own AI-powered trip in minutes — no sign-up needed to start.
          </p>
          <a href="/plan" className="share-cta-btn" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'linear-gradient(140deg,#1e8a52 0%,#0d5530 100%)',
            border: '1px solid rgba(50,160,100,0.35)',
            borderRadius: 10, padding: '13px 28px',
            fontSize: 15, fontWeight: 600, color: 'white', textDecoration: 'none',
            boxShadow: '0 0 22px rgba(26,130,78,0.28)',
            transition: 'box-shadow 0.2s ease, transform 0.15s ease',
          }}>
            Plan My Trip →
          </a>
        </div>
      </div>

      <style>{`
        @keyframes trip-fadein {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .share-cta-btn:hover {
          box-shadow: 0 0 32px rgba(26,130,78,0.5) !important;
          transform: translateY(-1px) !important;
        }
      `}</style>
    </div>
  )
}

/* ─── Page ─── */
export default async function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: trip } = await supabase
    .from('trips')
    .select('*')
    .eq('id', id)
    .eq('is_public', true)
    .is('deleted_at', null)
    .single()

  if (!trip) return <PrivateMessage />

  let sharedByName: string | null = null
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (serviceKey) {
    try {
      const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey)
      const { data } = await admin.auth.admin.getUserById(trip.user_id)
      if (data.user?.email) sharedByName = data.user.email.split('@')[0]
    } catch {}
  }

  return <ShareView trip={trip as Trip} sharedByName={sharedByName} />
}
