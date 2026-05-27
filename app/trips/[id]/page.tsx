'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Trip } from '@/lib/types'

/* ─── Style tokens ─── */
const C = {
  bg: '#030810',
  surface: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.08)',
  green: '#1e8a52',
  greenBright: '#34d475',
  greenDark: '#0d5530',
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255,255,255,0.62)',
  textMuted: 'rgba(255,255,255,0.38)',
}

/* ─── Activity type config ─── */
const ACT = {
  activity: { color: '#34d475', bg: 'rgba(52,212,117,0.12)', label: 'Activity' },
  food:     { color: '#fb923c', bg: 'rgba(251,146,60,0.12)',  label: 'Food'     },
  lodging:  { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', label: 'Lodging'  },
  travel:   { color: 'rgba(255,255,255,0.45)', bg: 'rgba(255,255,255,0.06)', label: 'Travel' },
}

/* ─── Logo ─── */
function LogoIcon({ size = 30 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 30" fill="none" style={{ width: size * 0.8, height: size, flexShrink: 0 }} aria-hidden="true">
      <defs>
        <linearGradient id="et-pin-trip" x1="3" y1="1" x2="21" y2="29" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34d475" />
          <stop offset="100%" stopColor="#0d6b35" />
        </linearGradient>
      </defs>
      <path d="M12 1C7.03 1 3 5.03 3 10c0 4.42 3.2 8.22 7.2 13.1L12 29l1.8-5.9C17.8 18.22 21 14.42 21 10c0-4.97-4.03-9-9-9z"
        fill="url(#et-pin-trip)" style={{ filter: 'drop-shadow(0 3px 8px rgba(13,107,53,0.45))' }} />
      <circle cx="12" cy="10" r="5.5" fill="white" opacity="0.97" />
      <line x1="12" y1="10" x2="9.6" y2="8.6" stroke="#0d6b35" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="12" y1="10" x2="15.3" y2="8.1" stroke="#0d6b35" strokeWidth="1" strokeLinecap="round" />
      <circle cx="12" cy="10" r="0.9" fill="#0d6b35" />
    </svg>
  )
}

/* ─── Date helpers ─── */
function formatDateRange(start: string, end: string): string {
  const s = new Date(start + 'T00:00:00')
  const e = new Date(end + 'T00:00:00')
  const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) => d.toLocaleDateString('en-US', opts)
  const year = e.getFullYear()
  return `${fmt(s, { month: 'long', day: 'numeric' })} – ${fmt(e, { month: 'long', day: 'numeric' })}, ${year}`
}

function formatDayHeader(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })
}

function calcDays(start: string, end: string): number {
  const ms = new Date(end + 'T00:00:00').getTime() - new Date(start + 'T00:00:00').getTime()
  return Math.round(ms / 86400000) + 1
}

/* ─── Skeleton ─── */
function SkeletonBar({ w, h, r = 6 }: { w: string | number; h: number; r?: number }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r,
      background: 'rgba(255,255,255,0.06)',
      animation: 'sk-pulse 1.6s ease-in-out infinite',
    }} />
  )
}

function SkeletonLoader() {
  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, padding: '14px 0', background: 'rgba(3,8,16,0.82)', backdropFilter: 'blur(18px)', borderBottom: '1px solid rgba(255,255,255,0.055)' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 28px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <SkeletonBar w={22} h={30} r={4} />
          <SkeletonBar w={80} h={20} r={4} />
        </div>
      </nav>
      <div style={{ maxWidth: 780, margin: '0 auto', padding: '110px 24px 80px', display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 32, borderBottom: `1px solid ${C.border}` }}>
          <SkeletonBar w={100} h={14} r={100} />
          <SkeletonBar w="55%" h={60} r={12} />
          <SkeletonBar w="38%" h={22} r={6} />
          <SkeletonBar w={80} h={26} r={100} />
        </div>
        <SkeletonBar w="100%" h={90} r={12} />
        {[1, 2, 3].map(i => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`, borderRadius: 16, padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <SkeletonBar w={60} h={12} r={4} />
              <SkeletonBar w="40%" h={22} r={6} />
            </div>
            {[1, 2, 3].map(j => (
              <div key={j} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <SkeletonBar w={52} h={16} r={4} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <SkeletonBar w="50%" h={18} r={4} />
                  <SkeletonBar w="78%" h={13} r={4} />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <style>{`@keyframes sk-pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }`}</style>
    </div>
  )
}

/* ─── Error state ─── */
function ErrorState({ message }: { message: string | null }) {
  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', system-ui, sans-serif", padding: 24 }}>
      <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`, borderRadius: 20, padding: '44px 36px', maxWidth: 480, width: '100%', textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg viewBox="0 0 20 20" fill="none" stroke="rgba(239,68,68,0.8)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 22, height: 22 }}>
            <circle cx="10" cy="10" r="8" />
            <path d="M10 6v4M10 14v.5" />
          </svg>
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: C.textPrimary, margin: '0 0 12px' }}>Trip Not Found</h2>
        <p style={{ fontSize: 15, color: C.textSecondary, lineHeight: 1.7, margin: '0 0 28px' }}>
          {message ?? "We couldn't load this trip. It may have been deleted or you may not have access."}
        </p>
        <a href="/trips" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'linear-gradient(140deg,#1e8a52 0%,#0d5530 100%)',
          border: '1px solid rgba(50,160,100,0.35)',
          borderRadius: 10, padding: '12px 24px',
          fontSize: 14, fontWeight: 600, color: 'white', textDecoration: 'none',
          boxShadow: '0 0 20px rgba(26,130,78,0.3)',
        }}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
            <path d="M10 4L6 8l4 4" />
          </svg>
          Back to My Trips
        </a>
      </div>
    </div>
  )
}

/* ─── Itinerary view ─── */
function ItineraryView({ trip, onLogout, userEmail }: { trip: Trip; onLogout: () => void; userEmail: string }) {
  const itin = trip.itinerary_json
  const days = calcDays(trip.start_date, trip.end_date)
  const [isPublic, setIsPublic] = useState(trip.is_public ?? false)
  const [shareLoading, setShareLoading] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [toastVisible, setToastVisible] = useState(false)

  function showToast(msg: string) {
    setToastMsg(msg)
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 4500)
  }

  async function handleShare() {
    setShareLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('trips').update({ is_public: true }).eq('id', trip.id)
      if (error) throw error
      setIsPublic(true)
      const shareUrl = window.location.origin + '/trips/' + trip.id + '/share'
      await navigator.clipboard.writeText(shareUrl)
      showToast('Link copied to clipboard! Anyone with this link can view your trip.')
    } catch {
      showToast('Failed to share trip. Please try again.')
    } finally {
      setShareLoading(false)
    }
  }

  async function handleUnshare() {
    setShareLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('trips').update({ is_public: false }).eq('id', trip.id)
      if (error) throw error
      setIsPublic(false)
      showToast('Trip is now private.')
    } catch {
      showToast('Failed to update trip. Please try again.')
    } finally {
      setShareLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'DM Sans', system-ui, sans-serif", color: 'white' }}>

      {/* Background aurora blobs */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div className="aurora-a" style={{ position: 'absolute', top: '-10%', left: '20%', width: 700, height: 500, borderRadius: '50%', background: 'radial-gradient(ellipse at center, rgba(26,130,78,0.18) 0%, transparent 70%)' }} />
        <div className="aurora-b" style={{ position: 'absolute', bottom: '10%', right: '15%', width: 500, height: 400, borderRadius: '50%', background: 'radial-gradient(ellipse at center, rgba(13,107,53,0.14) 0%, transparent 70%)' }} />
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.03 }}>
          <filter id="grain-trip-page">
            <feTurbulence type="fractalNoise" baseFrequency="0.68" numOctaves="3" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#grain-trip-page)" />
        </svg>
      </div>

      {/* Navbar */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        padding: '14px 0',
        background: 'rgba(3,8,16,0.82)',
        backdropFilter: 'blur(18px) saturate(1.4)',
        borderBottom: '1px solid rgba(255,255,255,0.055)',
      }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          {/* Left: Logo */}
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
            <LogoIcon size={30} />
            <span className="et-display" style={{ fontWeight: 700, fontSize: 20, color: 'white', letterSpacing: '-0.02em' }}>Easy Trip</span>
          </a>

          {/* Center: Nav links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <a
              href="/plan"
              style={{
                fontSize: 13, fontWeight: 500, textDecoration: 'none',
                color: C.textMuted,
                padding: '7px 14px', borderRadius: 7,
                border: '1px solid transparent',
                transition: 'color 0.2s ease, background 0.2s ease',
              }}
              onMouseEnter={e => Object.assign((e.currentTarget as HTMLElement).style, { color: C.textSecondary, background: 'rgba(255,255,255,0.05)' })}
              onMouseLeave={e => Object.assign((e.currentTarget as HTMLElement).style, { color: C.textMuted, background: 'transparent' })}
            >
              Plan a Trip
            </a>
            <a
              href="/trips"
              style={{
                fontSize: 13, fontWeight: 600, textDecoration: 'none',
                color: C.greenBright,
                padding: '7px 14px', borderRadius: 7,
                background: 'rgba(52,212,117,0.08)',
                border: '1px solid rgba(52,212,117,0.18)',
                transition: 'background 0.2s ease, border-color 0.2s ease',
              }}
              onMouseEnter={e => Object.assign((e.currentTarget as HTMLElement).style, { background: 'rgba(52,212,117,0.14)', borderColor: 'rgba(52,212,117,0.32)' })}
              onMouseLeave={e => Object.assign((e.currentTarget as HTMLElement).style, { background: 'rgba(52,212,117,0.08)', borderColor: 'rgba(52,212,117,0.18)' })}
            >
              My Trips
            </a>
          </div>

          {/* Right: Email + Logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            {userEmail && (
              <span style={{ fontSize: 12, color: C.textMuted, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {userEmail}
              </span>
            )}
            <button
              onClick={onLogout}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: 7, padding: '8px 15px',
                fontSize: 13, fontWeight: 500,
                color: C.textMuted, cursor: 'pointer',
                fontFamily: "'DM Sans', system-ui, sans-serif",
                transition: 'color 0.2s ease, border-color 0.2s ease',
              }}
              onMouseEnter={e => Object.assign((e.currentTarget as HTMLElement).style, { color: 'rgba(255,255,255,0.75)', borderColor: 'rgba(255,255,255,0.22)' })}
              onMouseLeave={e => Object.assign((e.currentTarget as HTMLElement).style, { color: C.textMuted, borderColor: 'rgba(255,255,255,0.10)' })}
            >
              Log Out
            </button>
          </div>
        </div>
      </nav>

      {/* Page content */}
      <div style={{
        position: 'relative', zIndex: 1,
        maxWidth: 780, margin: '0 auto',
        padding: '106px 24px 160px',
        animation: 'trip-fadein 0.45s ease-out both',
      }}>

        {/* ── HERO ── */}
        <div style={{ paddingBottom: 36, marginBottom: 32, borderBottom: `1px solid ${C.border}` }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(52,212,117,0.09)',
            border: '1px solid rgba(52,212,117,0.2)',
            borderRadius: 100, padding: '5px 13px',
            fontSize: 10, fontWeight: 700, color: C.greenBright,
            letterSpacing: '0.07em', textTransform: 'uppercase',
            marginBottom: 20,
          }}>
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 11, height: 11 }}>
              <path d="M7 1l1.5 3 3.5.5-2.5 2.5.6 3.5L7 9l-3.1 1.5.6-3.5L2 4.5l3.5-.5z" />
            </svg>
            Generated by Easy Trip AI
          </div>

          <h1 className="et-display" style={{
            fontSize: 'clamp(38px, 8vw, 68px)',
            fontWeight: 700,
            color: C.textPrimary,
            letterSpacing: '-0.03em',
            lineHeight: 1.05,
            margin: '0 0 20px',
          }}>
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
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(30,138,82,0.18)',
              border: '1px solid rgba(52,212,117,0.25)',
              borderRadius: 100, padding: '5px 14px',
              fontSize: 13, fontWeight: 600, color: C.greenBright,
            }}>
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" style={{ width: 11, height: 11 }}>
                <circle cx="7" cy="7" r="5.5" />
                <path d="M7 4v3l2 1.5" />
              </svg>
              {days} {days === 1 ? 'day' : 'days'}
            </div>
          </div>
        </div>

        {/* ── SUMMARY ── */}
        <div style={{
          marginBottom: 32,
          background: 'rgba(255,255,255,0.025)',
          border: `1px solid ${C.border}`,
          borderLeft: `3px solid ${C.green}`,
          borderRadius: '0 14px 14px 0',
          padding: '22px 26px',
          animation: 'trip-fadein 0.5s ease-out 0.08s both',
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: C.greenBright, textTransform: 'uppercase', marginBottom: 10 }}>
            Trip Overview
          </div>
          <p style={{ fontSize: 15, color: C.textSecondary, lineHeight: 1.78, margin: 0 }}>
            {itin.summary}
          </p>
        </div>

        {/* ── DAY CARDS ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 32 }}>
          {itin.days.map((day, dayIdx) => {
            const cfg = ACT[day.activities[0]?.type] ?? ACT.activity
            return (
              <div key={dayIdx} style={{
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${C.border}`,
                borderRadius: 16,
                overflow: 'hidden',
                boxShadow: '0 4px 32px rgba(0,0,0,0.28)',
                animation: `trip-fadein 0.5s ease-out ${0.12 + dayIdx * 0.06}s both`,
              }}>
                {/* Card header */}
                <div style={{
                  padding: '18px 24px',
                  borderBottom: `1px solid ${C.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                  background: 'rgba(255,255,255,0.015)',
                }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: C.greenBright, textTransform: 'uppercase', marginBottom: 5 }}>
                      Day {day.day}
                    </div>
                    <div className="et-display" style={{ fontSize: 18, fontWeight: 600, color: C.textPrimary, letterSpacing: '-0.01em' }}>
                      {formatDayHeader(day.date)}
                    </div>
                  </div>
                  <div style={{
                    fontSize: 11, color: C.textMuted,
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${C.border}`,
                    borderRadius: 100, padding: '4px 12px',
                    fontWeight: 500, flexShrink: 0, whiteSpace: 'nowrap',
                  }}>
                    {day.activities.length} {day.activities.length === 1 ? 'stop' : 'stops'}
                  </div>
                </div>

                {/* Timeline */}
                <div style={{ padding: '6px 0 4px' }}>
                  {day.activities.map((act, actIdx) => {
                    const ac = ACT[act.type] ?? ACT.activity
                    const isLast = actIdx === day.activities.length - 1
                    return (
                      <div key={actIdx} style={{ display: 'flex', padding: `0 24px ${isLast ? 20 : 0}px` }}>

                        {/* Time */}
                        <div style={{
                          width: 64, flexShrink: 0, paddingTop: 20,
                          fontSize: 11, fontWeight: 600, color: C.textMuted,
                          letterSpacing: '0.03em', whiteSpace: 'nowrap',
                          fontVariantNumeric: 'tabular-nums',
                        }}>
                          {act.time}
                        </div>

                        {/* Dot + connecting line */}
                        <div style={{ width: 20, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{
                            width: 10, height: 10, borderRadius: '50%',
                            background: ac.color,
                            marginTop: 18, flexShrink: 0,
                            boxShadow: `0 0 10px ${ac.color}66`,
                            position: 'relative', zIndex: 1,
                          }} />
                          {!isLast && (
                            <div style={{
                              flex: 1, width: 1.5,
                              background: 'rgba(255,255,255,0.07)',
                              marginTop: 5, minHeight: 20,
                            }} />
                          )}
                        </div>

                        {/* Activity content */}
                        <div style={{
                          flex: 1, paddingLeft: 16,
                          paddingTop: 14, paddingBottom: isLast ? 0 : 20,
                        }}>
                          <div style={{ marginBottom: 7 }}>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center',
                              background: ac.bg,
                              borderRadius: 100, padding: '2px 9px',
                              fontSize: 9, fontWeight: 800, color: ac.color,
                              letterSpacing: '0.08em', textTransform: 'uppercase',
                            }}>
                              {ac.label}
                            </span>
                          </div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: C.textPrimary, marginBottom: 5, lineHeight: 1.3 }}>
                            {act.title}
                          </div>
                          {act.description && (
                            <div style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.68, marginBottom: act.place_name ? 8 : 0 }}>
                              {act.description}
                            </div>
                          )}
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
            )
          })}
        </div>

        {/* ── TRAVEL TIPS ── */}
        {itin.tips && itin.tips.length > 0 && (
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: `1px solid ${C.border}`,
            borderRadius: 16, padding: '24px 28px',
            marginBottom: 40,
            boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
            animation: `trip-fadein 0.5s ease-out ${0.12 + itin.days.length * 0.06 + 0.1}s both`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'rgba(52,212,117,0.1)',
                border: '1px solid rgba(52,212,117,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <svg viewBox="0 0 16 16" fill="none" stroke={C.greenBright} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
                  <circle cx="8" cy="8" r="6" />
                  <path d="M8 5.5v3M8 11v.5" />
                </svg>
              </div>
              <h2 className="et-display" style={{ fontSize: 18, fontWeight: 600, color: C.textPrimary, margin: 0, letterSpacing: '-0.01em' }}>
                Travel Tips
              </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              {itin.tips.map((tip, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%',
                    background: 'rgba(52,212,117,0.1)',
                    border: '1px solid rgba(52,212,117,0.22)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, marginTop: 1,
                  }}>
                    <svg viewBox="0 0 12 12" fill="none" stroke={C.greenBright} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 8, height: 8 }}>
                      <path d="M2 6l2.5 2.5L10 3" />
                    </svg>
                  </div>
                  <p style={{ fontSize: 14, color: C.textSecondary, lineHeight: 1.68, margin: 0 }}>
                    {tip}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ACTION BUTTONS ── */}
        <div style={{
          display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center',
          animation: `trip-fadein 0.5s ease-out ${0.18 + itin.days.length * 0.06}s both`,
        }}>
          <a
            href="/trips"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'transparent',
              border: `1px solid ${C.border}`,
              borderRadius: 10, padding: '12px 20px',
              fontSize: 14, fontWeight: 500,
              color: C.textSecondary, textDecoration: 'none',
              transition: 'color 0.2s ease, border-color 0.2s ease',
            }}
            onMouseEnter={e => Object.assign((e.currentTarget as HTMLElement).style, { color: C.textPrimary, borderColor: 'rgba(255,255,255,0.2)' })}
            onMouseLeave={e => Object.assign((e.currentTarget as HTMLElement).style, { color: C.textSecondary, borderColor: C.border })}
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}>
              <path d="M10 4L6 8l4 4" />
            </svg>
            Back to My Trips
          </a>

          <a
            href="/plan"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'linear-gradient(140deg,#1e8a52 0%,#0d5530 100%)',
              border: '1px solid rgba(50,160,100,0.35)',
              borderRadius: 10, padding: '12px 22px',
              fontSize: 14, fontWeight: 600,
              color: 'white', textDecoration: 'none',
              boxShadow: '0 0 22px rgba(26,130,78,0.28)',
              transition: 'box-shadow 0.2s ease, transform 0.15s ease',
            }}
            onMouseEnter={e => Object.assign((e.currentTarget as HTMLElement).style, { boxShadow: '0 0 32px rgba(26,130,78,0.5)', transform: 'translateY(-1px)' })}
            onMouseLeave={e => Object.assign((e.currentTarget as HTMLElement).style, { boxShadow: '0 0 22px rgba(26,130,78,0.28)', transform: 'translateY(0)' })}
          >
            Plan Another Trip
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}>
              <path d="M6 4l4 4-4 4" />
            </svg>
          </a>

          {/* ── SHARE / UNSHARE ── */}
          {isPublic ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'rgba(52,212,117,0.09)',
                border: '1px solid rgba(52,212,117,0.25)',
                borderRadius: 10, padding: '12px 20px',
                fontSize: 14, fontWeight: 600, color: C.greenBright,
              }}>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}>
                  <path d="M2 8l4 4L14 4" />
                </svg>
                Shared ✓
              </div>
              <button
                onClick={handleUnshare}
                disabled={shareLoading}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: 'transparent',
                  border: `1px solid ${C.border}`,
                  borderRadius: 10, padding: '12px 20px',
                  fontSize: 14, fontWeight: 500,
                  color: C.textMuted, cursor: shareLoading ? 'not-allowed' : 'pointer',
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  opacity: shareLoading ? 0.5 : 1,
                  transition: 'color 0.2s ease, border-color 0.2s ease',
                }}
                onMouseEnter={e => !shareLoading && Object.assign((e.currentTarget as HTMLElement).style, { color: '#ef4444', borderColor: 'rgba(239,68,68,0.35)' })}
                onMouseLeave={e => Object.assign((e.currentTarget as HTMLElement).style, { color: C.textMuted, borderColor: C.border })}
              >
                Unshare
              </button>
            </div>
          ) : (
            <button
              onClick={handleShare}
              disabled={shareLoading}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${C.border}`,
                borderRadius: 10, padding: '12px 20px',
                fontSize: 14, fontWeight: 500,
                color: shareLoading ? C.textMuted : C.textSecondary,
                cursor: shareLoading ? 'not-allowed' : 'pointer',
                fontFamily: "'DM Sans', system-ui, sans-serif",
                transition: 'color 0.2s ease, border-color 0.2s ease, background 0.2s ease',
              }}
              onMouseEnter={e => !shareLoading && Object.assign((e.currentTarget as HTMLElement).style, { color: C.textPrimary, borderColor: 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)' })}
              onMouseLeave={e => !shareLoading && Object.assign((e.currentTarget as HTMLElement).style, { color: C.textSecondary, borderColor: C.border, background: 'rgba(255,255,255,0.04)' })}
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}>
                <circle cx="12" cy="3" r="1.8" />
                <circle cx="4" cy="8" r="1.8" />
                <circle cx="12" cy="13" r="1.8" />
                <line x1="5.7" y1="9" x2="10.3" y2="12" />
                <line x1="10.3" y1="4" x2="5.7" y2="7" />
              </svg>
              {shareLoading ? 'Sharing…' : 'Share Trip 🔗'}
            </button>
          )}
        </div>
      </div>

      {/* ── TOAST ── */}
      {toastVisible && (
        <div style={{
          position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(5,15,10,0.96)',
          border: '1px solid rgba(52,212,117,0.28)',
          borderRadius: 12, padding: '13px 20px',
          fontSize: 14, color: C.textSecondary,
          boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(52,212,117,0.06)',
          zIndex: 100,
          maxWidth: 440, textAlign: 'center',
          animation: 'trip-fadein 0.25s ease-out both',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
            <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(52,212,117,0.14)', border: '1px solid rgba(52,212,117,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg viewBox="0 0 12 12" fill="none" stroke={C.greenBright} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 7, height: 7 }}>
                <path d="M2 6l2.5 2.5L10 3" />
              </svg>
            </div>
            {toastMsg}
          </div>
        </div>
      )}

      <style>{`
        @keyframes trip-fadein {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

/* ─── Page ─── */
export default function TripPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string

  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState('')

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/auth')
  }

  useEffect(() => {
    if (!id) return
    const supabase = createClient()

    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.replace('/auth'); return }
        setUserEmail(user.email ?? '')

        const { data, error: fetchErr } = await supabase
          .from('trips')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single()

        if (fetchErr) {
          if (fetchErr.code === 'PGRST116') { router.replace('/trips'); return }
          setError("We couldn't load this trip. It may have been deleted or you may not have access.")
          return
        }

        if (!data) { router.replace('/trips'); return }

        setTrip(data as Trip)
      } catch {
        setError("We couldn't load this trip. Something went wrong.")
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [id, router])

  if (loading) return <SkeletonLoader />
  if (error || !trip) return <ErrorState message={error} />
  return <ItineraryView trip={trip} onLogout={handleLogout} userEmail={userEmail} />
}
