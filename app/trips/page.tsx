'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Trip } from '@/lib/types'

/* ─── Style tokens ─── */
const C = {
  bg: '#030810',
  surface: 'rgba(255,255,255,0.04)',
  surfaceHover: 'rgba(255,255,255,0.06)',
  border: 'rgba(255,255,255,0.08)',
  borderHover: 'rgba(52,212,117,0.32)',
  green: '#1e8a52',
  greenBright: '#34d475',
  greenDark: '#0d5530',
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255,255,255,0.62)',
  textMuted: 'rgba(255,255,255,0.38)',
}

/* ─── Helpers ─── */
function sevenDaysAgoISO(): string {
  return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
}

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
}

function deletedAgoLabel(dateStr: string): string {
  const d = daysSince(dateStr)
  if (d === 0) return 'Deleted today'
  if (d === 1) return 'Deleted 1 day ago'
  return `Deleted ${d} days ago`
}

function expiresLabel(dateStr: string): { text: string; urgent: boolean; warning: boolean } {
  const d = daysSince(dateStr)
  const left = 7 - d
  if (left <= 0) return { text: 'Expiring now', urgent: true, warning: false }
  if (left === 1) return { text: 'Expires tomorrow', urgent: true, warning: false }
  if (left <= 3) return { text: `Expires in ${left} days`, urgent: false, warning: true }
  return { text: `Expires in ${left} days`, urgent: false, warning: false }
}

/* ─── Logo icon ─── */
function LogoIcon({ size = 30 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 30" fill="none" style={{ width: size * 0.8, height: size, flexShrink: 0 }} aria-hidden="true">
      <defs>
        <linearGradient id="et-pin-dash" x1="3" y1="1" x2="21" y2="29" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34d475" />
          <stop offset="100%" stopColor="#0d6b35" />
        </linearGradient>
      </defs>
      <path d="M12 1C7.03 1 3 5.03 3 10c0 4.42 3.2 8.22 7.2 13.1L12 29l1.8-5.9C17.8 18.22 21 14.42 21 10c0-4.97-4.03-9-9-9z"
        fill="url(#et-pin-dash)" style={{ filter: 'drop-shadow(0 3px 8px rgba(13,107,53,0.45))' }} />
      <circle cx="12" cy="10" r="5.5" fill="white" opacity="0.97" />
      <line x1="12" y1="10" x2="9.6" y2="8.6" stroke="#0d6b35" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="12" y1="10" x2="15.3" y2="8.1" stroke="#0d6b35" strokeWidth="1" strokeLinecap="round" />
      <circle cx="12" cy="10" r="0.9" fill="#0d6b35" />
    </svg>
  )
}

/* ─── Date helpers ─── */
function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })
}

function formatDateRange(start: string, end: string): string {
  const s = new Date(start + 'T00:00:00')
  const e = new Date(end + 'T00:00:00')
  const sameYear = s.getFullYear() === e.getFullYear()
  const startFmt = s.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
  const endFmt = e.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  if (sameYear) return `${startFmt} – ${endFmt}`
  return `${s.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} – ${endFmt}`
}

function calcDays(start: string, end: string): number {
  const ms = new Date(end + 'T00:00:00').getTime() - new Date(start + 'T00:00:00').getTime()
  return Math.round(ms / 86400000) + 1
}

/* ─── Shimmer skeleton card ─── */
function SkeletonCard() {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: `1px solid ${C.border}`,
      borderRadius: 16,
      overflow: 'hidden',
    }}>
      <div style={{ height: 4, background: 'rgba(255,255,255,0.06)' }} />
      <div style={{ padding: '22px 22px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ height: 13, width: '35%', borderRadius: 6, background: 'rgba(255,255,255,0.06)', animation: 'sk-pulse 1.6s ease-in-out infinite' }} />
        <div style={{ height: 26, width: '70%', borderRadius: 7, background: 'rgba(255,255,255,0.07)', animation: 'sk-pulse 1.6s ease-in-out infinite 0.1s' }} />
        <div style={{ height: 13, width: '55%', borderRadius: 6, background: 'rgba(255,255,255,0.05)', animation: 'sk-pulse 1.6s ease-in-out infinite 0.2s' }} />
        <div style={{ height: 13, width: '42%', borderRadius: 6, background: 'rgba(255,255,255,0.05)', animation: 'sk-pulse 1.6s ease-in-out infinite 0.25s' }} />
        <div style={{ height: 38, width: '100%', borderRadius: 9, background: 'rgba(255,255,255,0.045)', animation: 'sk-pulse 1.6s ease-in-out infinite 0.3s', marginTop: 6 }} />
        <div style={{ height: 38, width: '100%', borderRadius: 9, background: 'rgba(255,255,255,0.04)', animation: 'sk-pulse 1.6s ease-in-out infinite 0.35s' }} />
      </div>
    </div>
  )
}

/* ─── Trip card ─── */
function TripCard({
  trip,
  index,
  onDelete,
}: {
  trip: Trip
  index: number
  onDelete: (id: string) => Promise<void>
}) {
  const [hovered, setHovered] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [fadeOut, setFadeOut] = useState(false)

  const days = calcDays(trip.start_date, trip.end_date)
  const summary = trip.itinerary_json?.summary ?? ''

  async function handleDelete() {
    setDeleting(true)
    setFadeOut(true)
    await onDelete(trip.id)
  }

  return (
    <div
      style={{
        background: hovered ? C.surfaceHover : C.surface,
        border: `1px solid ${hovered ? C.borderHover : C.border}`,
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: hovered
          ? '0 8px 40px rgba(0,0,0,0.45), 0 0 0 1px rgba(52,212,117,0.12)'
          : '0 4px 24px rgba(0,0,0,0.28)',
        transform: hovered ? 'translateY(-3px) scale(1.005)' : 'translateY(0) scale(1)',
        transition: 'transform 0.22s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.22s ease, border-color 0.22s ease, background 0.22s ease, opacity 0.35s ease',
        opacity: fadeOut ? 0 : 1,
        animation: `card-in 0.42s cubic-bezier(0.34,1.2,0.64,1) ${index * 0.06}s both`,
        display: 'flex',
        flexDirection: 'column',
        cursor: 'default',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Green top accent */}
      <div style={{
        height: 3,
        background: `linear-gradient(90deg, ${C.greenBright} 0%, #0d6b35 100%)`,
        opacity: hovered ? 1 : 0.45,
        transition: 'opacity 0.22s ease',
      }} />

      <div style={{ padding: '20px 22px', flex: 1, display: 'flex', flexDirection: 'column', gap: 0 }}>

        {/* Days badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          background: 'rgba(52,212,117,0.1)',
          border: '1px solid rgba(52,212,117,0.2)',
          borderRadius: 100, padding: '3px 10px',
          fontSize: 10, fontWeight: 700, color: C.greenBright,
          letterSpacing: '0.06em', textTransform: 'uppercase',
          marginBottom: 12, alignSelf: 'flex-start',
        }}>
          <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" style={{ width: 9, height: 9 }}>
            <circle cx="6" cy="6" r="4.5" />
            <path d="M6 3.5v2.5l1.5 1" />
          </svg>
          {days} {days === 1 ? 'day' : 'days'}
        </div>

        {/* Destination */}
        <h2 style={{
          fontSize: 'clamp(18px, 3vw, 22px)',
          fontWeight: 700,
          color: C.textPrimary,
          letterSpacing: '-0.025em',
          lineHeight: 1.15,
          margin: '0 0 10px',
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}>
          {trip.destination}
        </h2>

        {/* Date range */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: C.textSecondary, marginBottom: 6 }}>
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" style={{ width: 11, height: 11, flexShrink: 0, opacity: 0.7 }}>
            <rect x="1.5" y="2.5" width="11" height="10" rx="2" />
            <path d="M4 1v3M10 1v3M1.5 6h11" />
          </svg>
          <span>{formatDateRange(trip.start_date, trip.end_date)}</span>
        </div>

        {/* Created at */}
        <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 14 }}>
          Planned on {formatDate(trip.created_at.split('T')[0])}
        </div>

        {/* Summary excerpt */}
        {summary && (
          <p style={{
            fontSize: 13,
            color: C.textSecondary,
            lineHeight: 1.68,
            margin: '0 0 18px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            flex: 1,
          }}>
            {summary}
          </p>
        )}

        {/* Actions */}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {!confirming ? (
            <>
              <a
                href={`/trips/${trip.id}`}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  background: 'linear-gradient(140deg, #1e8a52 0%, #0d5530 100%)',
                  border: '1px solid rgba(50,160,100,0.35)',
                  borderRadius: 9, padding: '11px 18px',
                  fontSize: 13, fontWeight: 600, color: 'white',
                  textDecoration: 'none',
                  boxShadow: '0 0 18px rgba(26,130,78,0.25)',
                  transition: 'box-shadow 0.2s ease, transform 0.15s ease',
                }}
                onMouseEnter={e => Object.assign((e.currentTarget as HTMLElement).style, { boxShadow: '0 0 28px rgba(26,130,78,0.45)', transform: 'translateY(-1px)' })}
                onMouseLeave={e => Object.assign((e.currentTarget as HTMLElement).style, { boxShadow: '0 0 18px rgba(26,130,78,0.25)', transform: 'translateY(0)' })}
              >
                View Trip
                <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 11, height: 11 }}>
                  <path d="M5 3l4 4-4 4" />
                </svg>
              </a>

              <button
                onClick={() => setConfirming(true)}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(239,68,68,0.18)',
                  borderRadius: 9, padding: '8px 14px',
                  fontSize: 12, fontWeight: 500,
                  color: 'rgba(239,68,68,0.55)',
                  cursor: 'pointer',
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  transition: 'color 0.2s ease, border-color 0.2s ease, background 0.2s ease',
                  width: '100%',
                  textAlign: 'center',
                }}
                onMouseEnter={e => Object.assign((e.currentTarget as HTMLElement).style, { color: 'rgba(239,68,68,0.9)', borderColor: 'rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.06)' })}
                onMouseLeave={e => Object.assign((e.currentTarget as HTMLElement).style, { color: 'rgba(239,68,68,0.55)', borderColor: 'rgba(239,68,68,0.18)', background: 'transparent' })}
              >
                Delete
              </button>
            </>
          ) : (
            <div style={{
              background: 'rgba(239,68,68,0.06)',
              border: '1px solid rgba(239,68,68,0.22)',
              borderRadius: 10,
              padding: '14px 16px',
              animation: 'confirm-in 0.18s ease-out both',
            }}>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.78)', margin: '0 0 12px', fontWeight: 500, lineHeight: 1.5 }}>
                Move to trash?
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  style={{
                    flex: 1,
                    background: deleting ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.75)',
                    border: 'none',
                    borderRadius: 7, padding: '9px 12px',
                    fontSize: 12, fontWeight: 600, color: 'white',
                    cursor: deleting ? 'default' : 'pointer',
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={e => { if (!deleting) (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.9)' }}
                  onMouseLeave={e => { if (!deleting) (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.75)' }}
                >
                  {deleting ? 'Moving…' : 'Move to Trash'}
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  disabled={deleting}
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 7, padding: '9px 12px',
                    fontSize: 12, fontWeight: 500,
                    color: C.textSecondary,
                    cursor: 'pointer',
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    transition: 'background 0.15s ease, color 0.15s ease',
                  }}
                  onMouseEnter={e => Object.assign((e.currentTarget as HTMLElement).style, { background: 'rgba(255,255,255,0.1)', color: C.textPrimary })}
                  onMouseLeave={e => Object.assign((e.currentTarget as HTMLElement).style, { background: 'rgba(255,255,255,0.06)', color: C.textSecondary })}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Empty state ─── */
function EmptyState() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      textAlign: 'center', padding: '80px 24px',
      animation: 'card-in 0.45s ease-out both',
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: 20,
        background: 'rgba(52,212,117,0.07)',
        border: '1px solid rgba(52,212,117,0.16)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 24,
        boxShadow: '0 0 40px rgba(52,212,117,0.08)',
      }}>
        <svg viewBox="0 0 40 40" fill="none" style={{ width: 34, height: 34 }}>
          <circle cx="20" cy="20" r="15" stroke="rgba(52,212,117,0.5)" strokeWidth="1.5" />
          <circle cx="20" cy="20" r="3" fill="rgba(52,212,117,0.6)" />
          <path d="M20 7v4M20 29v4M7 20h4M29 20h4" stroke="rgba(52,212,117,0.35)" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M15 15l2.5 5 5-2.5-2.5-5z" fill="rgba(52,212,117,0.5)" />
          <path d="M25 25l-2.5-5-5 2.5 2.5 5z" fill="rgba(255,255,255,0.2)" />
        </svg>
      </div>
      <h2 style={{
        fontSize: 22, fontWeight: 700, color: C.textPrimary,
        letterSpacing: '-0.025em', margin: '0 0 12px',
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}>
        No trips planned yet
      </h2>
      <p style={{
        fontSize: 15, color: C.textSecondary, lineHeight: 1.7,
        maxWidth: 380, margin: '0 0 32px',
      }}>
        Your adventures start here. Plan your first trip and it will appear here.
      </p>
      <a
        href="/plan"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'linear-gradient(140deg, #1e8a52 0%, #0d5530 100%)',
          border: '1px solid rgba(50,160,100,0.35)',
          borderRadius: 11, padding: '14px 28px',
          fontSize: 15, fontWeight: 600, color: 'white',
          textDecoration: 'none',
          boxShadow: '0 0 28px rgba(26,130,78,0.3)',
          transition: 'box-shadow 0.2s ease, transform 0.15s ease',
        }}
        onMouseEnter={e => Object.assign((e.currentTarget as HTMLElement).style, { boxShadow: '0 0 40px rgba(26,130,78,0.5)', transform: 'translateY(-2px)' })}
        onMouseLeave={e => Object.assign((e.currentTarget as HTMLElement).style, { boxShadow: '0 0 28px rgba(26,130,78,0.3)', transform: 'translateY(0)' })}
      >
        Plan Your First Trip
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}>
          <path d="M6 4l4 4-4 4" />
        </svg>
      </a>
    </div>
  )
}

/* ─── Error state ─── */
function ErrorState({ onRefresh }: { onRefresh: () => void }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      textAlign: 'center', padding: '80px 24px',
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: '50%',
        background: 'rgba(239,68,68,0.08)',
        border: '1px solid rgba(239,68,68,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 20,
      }}>
        <svg viewBox="0 0 20 20" fill="none" stroke="rgba(239,68,68,0.8)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 22, height: 22 }}>
          <circle cx="10" cy="10" r="8" />
          <path d="M10 6v4M10 14v.5" />
        </svg>
      </div>
      <p style={{ fontSize: 15, color: C.textSecondary, margin: '0 0 24px', lineHeight: 1.6 }}>
        Couldn&apos;t load your trips. Please refresh the page.
      </p>
      <button
        onClick={onRefresh}
        style={{
          background: 'rgba(255,255,255,0.06)',
          border: `1px solid ${C.border}`,
          borderRadius: 9, padding: '11px 22px',
          fontSize: 13, fontWeight: 500,
          color: C.textSecondary, cursor: 'pointer',
          fontFamily: "'DM Sans', system-ui, sans-serif",
          transition: 'color 0.2s ease, border-color 0.2s ease',
        }}
        onMouseEnter={e => Object.assign((e.currentTarget as HTMLElement).style, { color: C.textPrimary, borderColor: 'rgba(255,255,255,0.2)' })}
        onMouseLeave={e => Object.assign((e.currentTarget as HTMLElement).style, { color: C.textSecondary, borderColor: C.border })}
      >
        Refresh
      </button>
    </div>
  )
}

/* ─── Trash Panel ─── */
function TrashPanel({
  isOpen,
  onClose,
  trashedTrips,
  loading,
  onRestore,
}: {
  isOpen: boolean
  onClose: () => void
  trashedTrips: Trip[]
  loading: boolean
  onRestore: (tripId: string) => Promise<void>
}) {
  const [restoringId, setRestoringId] = useState<string | null>(null)

  async function handleRestore(tripId: string) {
    setRestoringId(tripId)
    await onRestore(tripId)
    setRestoringId(null)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.62)',
          backdropFilter: 'blur(4px)',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* Slide-in panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 'min(420px, 100vw)',
        zIndex: 101,
        background: 'linear-gradient(180deg, #050e1c 0%, #030810 100%)',
        borderLeft: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', flexDirection: 'column',
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.38s cubic-bezier(0.22, 1, 0.36, 1)',
        boxShadow: '-24px 0 80px rgba(0,0,0,0.5)',
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}>

        {/* Panel header */}
        <div style={{
          padding: '28px 24px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 8,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.09)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg viewBox="0 0 20 20" fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
                  <path d="M4 6h12M7 6V4h6v2M5 6l1 11h8l1-11" />
                  <path d="M8 10v4M12 10v4" />
                </svg>
              </div>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: C.textPrimary, margin: 0, letterSpacing: '-0.02em' }}>
                Trash
              </h2>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 7, width: 30, height: 30,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background 0.15s ease',
                flexShrink: 0,
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.10)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'}
            >
              <svg viewBox="0 0 14 14" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.8" strokeLinecap="round" style={{ width: 12, height: 12 }}>
                <path d="M2 2l10 10M12 2L2 12" />
              </svg>
            </button>
          </div>
          <p style={{ fontSize: 12, color: C.textMuted, margin: 0, lineHeight: 1.5 }}>
            Trips are permanently deleted after 7 days
          </p>
        </div>

        {/* Panel content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px 32px' }}>

          {loading ? (
            /* Loading skeleton */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 8 }}>
              {[0.1, 0.2, 0.3].map((delay, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${C.border}`,
                  borderRadius: 12, padding: '16px',
                  display: 'flex', flexDirection: 'column', gap: 10,
                }}>
                  <div style={{ height: 16, width: '60%', borderRadius: 5, background: 'rgba(255,255,255,0.06)', animation: `sk-pulse 1.6s ease-in-out ${delay}s infinite` }} />
                  <div style={{ height: 12, width: '80%', borderRadius: 5, background: 'rgba(255,255,255,0.04)', animation: `sk-pulse 1.6s ease-in-out ${delay + 0.1}s infinite` }} />
                  <div style={{ height: 12, width: '45%', borderRadius: 5, background: 'rgba(255,255,255,0.04)', animation: `sk-pulse 1.6s ease-in-out ${delay + 0.2}s infinite` }} />
                  <div style={{ height: 34, width: '100%', borderRadius: 7, background: 'rgba(255,255,255,0.04)', animation: `sk-pulse 1.6s ease-in-out ${delay + 0.3}s infinite`, marginTop: 2 }} />
                </div>
              ))}
            </div>
          ) : trashedTrips.length === 0 ? (
            /* Empty trash state */
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', textAlign: 'center',
              padding: '60px 20px',
              animation: 'card-in 0.35s ease-out both',
            }}>
              <div style={{
                width: 60, height: 60, borderRadius: 16,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 18,
              }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 24, height: 24 }}>
                  <path d="M5 7h14M8 7V4h8v3M6 7l1 13h10l1-13" />
                  <path d="M10 11v5M14 11v5" />
                </svg>
              </div>
              <p style={{ fontSize: 15, fontWeight: 600, color: C.textSecondary, margin: '0 0 6px', letterSpacing: '-0.01em' }}>
                Your trash is empty
              </p>
              <p style={{ fontSize: 13, color: C.textMuted, margin: 0, lineHeight: 1.6 }}>
                Deleted trips will appear here for 7 days before being permanently removed.
              </p>
            </div>
          ) : (
            /* Trash items list */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 8 }}>
              {trashedTrips.map((trip, i) => {
                const isRestoring = restoringId === trip.id
                const expire = expiresLabel(trip.deleted_at!)
                return (
                  <div
                    key={trip.id}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: 12,
                      padding: '16px',
                      animation: `card-in 0.35s cubic-bezier(0.34,1.2,0.64,1) ${i * 0.05}s both`,
                      transition: 'border-color 0.2s ease',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.12)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'}
                  >
                    {/* Destination */}
                    <div style={{
                      fontSize: 15, fontWeight: 700, color: C.textPrimary,
                      letterSpacing: '-0.02em', marginBottom: 5,
                    }}>
                      {trip.destination}
                    </div>

                    {/* Date range */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      fontSize: 12, color: C.textSecondary, marginBottom: 10,
                    }}>
                      <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" style={{ width: 10, height: 10, opacity: 0.6, flexShrink: 0 }}>
                        <rect x="1.5" y="2.5" width="11" height="10" rx="2" />
                        <path d="M4 1v3M10 1v3M1.5 6h11" />
                      </svg>
                      {formatDateRange(trip.start_date, trip.end_date)}
                    </div>

                    {/* Status pills */}
                    <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: 10.5, fontWeight: 600,
                        color: 'rgba(255,255,255,0.45)',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 100, padding: '3px 8px',
                        letterSpacing: '0.02em',
                        whiteSpace: 'nowrap',
                      }}>
                        {deletedAgoLabel(trip.deleted_at!)}
                      </span>
                      <span style={{
                        fontSize: 10.5, fontWeight: 600,
                        color: expire.urgent
                          ? '#f87171'
                          : expire.warning
                          ? '#fb923c'
                          : 'rgba(255,255,255,0.38)',
                        background: expire.urgent
                          ? 'rgba(239,68,68,0.10)'
                          : expire.warning
                          ? 'rgba(249,115,22,0.10)'
                          : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${expire.urgent
                          ? 'rgba(239,68,68,0.22)'
                          : expire.warning
                          ? 'rgba(249,115,22,0.20)'
                          : 'rgba(255,255,255,0.07)'}`,
                        borderRadius: 100, padding: '3px 8px',
                        letterSpacing: '0.02em',
                        whiteSpace: 'nowrap',
                      }}>
                        {expire.text}
                      </span>
                    </div>

                    {/* Restore button */}
                    <button
                      onClick={() => handleRestore(trip.id)}
                      disabled={isRestoring}
                      style={{
                        width: '100%',
                        background: isRestoring
                          ? 'rgba(30,138,82,0.25)'
                          : 'rgba(30,138,82,0.18)',
                        border: '1px solid rgba(52,212,117,0.22)',
                        borderRadius: 8, padding: '9px 14px',
                        fontSize: 12.5, fontWeight: 600,
                        color: isRestoring ? 'rgba(52,212,117,0.5)' : C.greenBright,
                        cursor: isRestoring ? 'default' : 'pointer',
                        fontFamily: "'DM Sans', system-ui, sans-serif",
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        transition: 'background 0.15s ease, border-color 0.15s ease',
                      }}
                      onMouseEnter={e => {
                        if (!isRestoring) Object.assign((e.currentTarget as HTMLElement).style, {
                          background: 'rgba(30,138,82,0.28)',
                          borderColor: 'rgba(52,212,117,0.38)',
                        })
                      }}
                      onMouseLeave={e => {
                        if (!isRestoring) Object.assign((e.currentTarget as HTMLElement).style, {
                          background: 'rgba(30,138,82,0.18)',
                          borderColor: 'rgba(52,212,117,0.22)',
                        })
                      }}
                    >
                      {isRestoring ? (
                        <>
                          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 12, height: 12, animation: 'spin 0.8s linear infinite' }}>
                            <path d="M7 2a5 5 0 1 1-3.54 1.46" />
                          </svg>
                          Restoring…
                        </>
                      ) : (
                        <>
                          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 12, height: 12 }}>
                            <path d="M2 5h7a4 4 0 0 1 0 8H5M2 5l3-3M2 5l3 3" />
                          </svg>
                          Restore
                        </>
                      )}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

/* ─── Toast notification ─── */
function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div style={{
      position: 'fixed', bottom: 32, left: '50%',
      transform: `translateX(-50%) translateY(${visible ? 0 : 12}px)`,
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.25s ease, transform 0.25s cubic-bezier(0.34,1.56,0.64,1)',
      zIndex: 200,
      background: 'rgba(16,120,68,0.96)',
      backdropFilter: 'blur(14px)',
      border: '1px solid rgba(52,212,117,0.28)',
      borderRadius: 10, padding: '12px 20px',
      fontSize: 13.5, fontWeight: 600, color: 'white',
      pointerEvents: 'none',
      display: 'flex', alignItems: 'center', gap: 8,
      boxShadow: '0 4px 28px rgba(16,120,68,0.4), 0 1px 0 rgba(255,255,255,0.08) inset',
      whiteSpace: 'nowrap',
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
        <path d="M2.5 7l3.5 3.5L11.5 3.5" />
      </svg>
      {message}
    </div>
  )
}

/* ─── Page ─── */
export default function TripsPage() {
  const router = useRouter()
  const [trips, setTrips] = useState<Trip[]>([])
  const [userEmail, setUserEmail] = useState<string>('')
  const [userId, setUserId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const [trashOpen, setTrashOpen] = useState(false)
  const [trashedTrips, setTrashedTrips] = useState<Trip[]>([])
  const [trashCount, setTrashCount] = useState(0)
  const [trashLoading, setTrashLoading] = useState(false)
  const [toast, setToast] = useState('')
  const [toastVisible, setToastVisible] = useState(false)

  async function load() {
    setError(false)
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/auth'); return }

      setUserEmail(user.email ?? '')
      setUserId(user.id)

      // Silently purge expired trash (> 7 days old)
      await supabase
        .from('trips')
        .delete()
        .eq('user_id', user.id)
        .not('deleted_at', 'is', null)
        .lt('deleted_at', sevenDaysAgoISO())

      // Fetch active trips only
      const { data, error: fetchErr } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (fetchErr) { setError(true); return }
      setTrips((data ?? []) as Trip[])

      // Count current trash items (not yet expired)
      const { count } = await supabase
        .from('trips')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .not('deleted_at', 'is', null)
        .gte('deleted_at', sevenDaysAgoISO())

      setTrashCount(count ?? 0)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function deleteTrip(tripId: string) {
    const supabase = createClient()
    const { error: err } = await supabase
      .from('trips')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', tripId)
      .eq('user_id', userId)
    if (!err) {
      setTimeout(() => {
        setTrips(prev => prev.filter(t => t.id !== tripId))
        setTrashCount(prev => prev + 1)
      }, 340)
    }
  }

  async function fetchTrash() {
    setTrashLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', user.id)
        .not('deleted_at', 'is', null)
        .gte('deleted_at', sevenDaysAgoISO())
        .order('deleted_at', { ascending: false })
      setTrashedTrips((data ?? []) as Trip[])
    } finally {
      setTrashLoading(false)
    }
  }

  function openTrash() {
    setTrashOpen(true)
    fetchTrash()
  }

  async function restoreTrip(tripId: string) {
    const supabase = createClient()
    const trip = trashedTrips.find(t => t.id === tripId)
    const { error: err } = await supabase
      .from('trips')
      .update({ deleted_at: null })
      .eq('id', tripId)
      .eq('user_id', userId)
    if (!err) {
      setTrashedTrips(prev => prev.filter(t => t.id !== tripId))
      setTrashCount(prev => Math.max(0, prev - 1))
      if (trip) {
        setTrips(prev => [{ ...trip, deleted_at: null }, ...prev])
      }
      showToast('Trip restored!')
    }
  }

  function showToast(message: string) {
    setToast(message)
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 2800)
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/auth')
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: C.bg,
      fontFamily: "'DM Sans', system-ui, sans-serif",
      color: 'white',
    }}>

      {/* Background aurora blobs */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-8%', left: '30%', width: 600, height: 450, borderRadius: '50%', background: 'radial-gradient(ellipse at center, rgba(26,130,78,0.16) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '15%', right: '10%', width: 480, height: 380, borderRadius: '50%', background: 'radial-gradient(ellipse at center, rgba(13,107,53,0.12) 0%, transparent 70%)' }} />
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.03 }}>
          <filter id="grain-dash">
            <feTurbulence type="fractalNoise" baseFrequency="0.68" numOctaves="3" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#grain-dash)" />
        </svg>
      </div>

      {/* ─── Navbar ─── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        padding: '14px 0',
        background: 'rgba(3,8,16,0.82)',
        backdropFilter: 'blur(18px) saturate(1.4)',
        borderBottom: '1px solid rgba(255,255,255,0.055)',
      }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
            <LogoIcon size={30} />
            <span style={{ fontWeight: 700, fontSize: 20, color: 'white', letterSpacing: '-0.02em' }}>Easy Trip</span>
          </a>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            {userEmail && (
              <span style={{ fontSize: 12, color: C.textMuted, marginRight: 4, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {userEmail}
              </span>
            )}
            <a
              href="/plan"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'linear-gradient(140deg, #1e8a52 0%, #0d5530 100%)',
                border: '1px solid rgba(50,160,100,0.35)',
                borderRadius: 8, padding: '8px 16px',
                fontSize: 13, fontWeight: 600, color: 'white',
                textDecoration: 'none',
                boxShadow: '0 0 16px rgba(26,130,78,0.22)',
                transition: 'box-shadow 0.2s ease, transform 0.15s ease',
              }}
              onMouseEnter={e => Object.assign((e.currentTarget as HTMLElement).style, { boxShadow: '0 0 26px rgba(26,130,78,0.42)', transform: 'translateY(-1px)' })}
              onMouseLeave={e => Object.assign((e.currentTarget as HTMLElement).style, { boxShadow: '0 0 16px rgba(26,130,78,0.22)', transform: 'translateY(0)' })}
            >
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" style={{ width: 11, height: 11 }}>
                <path d="M7 2v10M2 7h10" />
              </svg>
              Plan a Trip
            </a>
            <button
              onClick={handleLogout}
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

      {/* ─── Content ─── */}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1140, margin: '0 auto', padding: '100px 28px 100px' }}>

        {/* Page header */}
        <div style={{
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 20,
          marginBottom: 40,
          animation: 'card-in 0.4s ease-out both',
        }}>
          <div>
            <h1 style={{
              fontSize: 'clamp(28px, 5vw, 42px)',
              fontWeight: 700, color: C.textPrimary,
              letterSpacing: '-0.03em', lineHeight: 1.1,
              margin: '0 0 8px',
            }}>
              My Trips
            </h1>
            {!loading && !error && (
              <p style={{ fontSize: 15, color: C.textSecondary, margin: 0 }}>
                {trips.length === 0
                  ? 'No trips planned yet'
                  : `${trips.length} ${trips.length === 1 ? 'trip' : 'trips'} planned`}
              </p>
            )}
          </div>

          {/* Header actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>

            {/* Trash bin button */}
            <button
              onClick={openTrash}
              title="Trash"
              style={{
                position: 'relative',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: 10, padding: '12px 14px',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.2s ease, border-color 0.2s ease, transform 0.15s ease',
                flexShrink: 0,
              }}
              onMouseEnter={e => Object.assign((e.currentTarget as HTMLElement).style, { background: 'rgba(255,255,255,0.09)', borderColor: 'rgba(255,255,255,0.18)', transform: 'translateY(-1px)' })}
              onMouseLeave={e => Object.assign((e.currentTarget as HTMLElement).style, { background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.10)', transform: 'translateY(0)' })}
            >
              <svg viewBox="0 0 20 20" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
                <path d="M4 6h12M8 6V4h4v2M5.5 6l1 11h7l1-11" />
                <path d="M8.5 10v4M11.5 10v4" />
              </svg>

              {/* Badge */}
              {trashCount > 0 && (
                <span style={{
                  position: 'absolute', top: -7, right: -7,
                  minWidth: 18, height: 18,
                  borderRadius: 100,
                  background: '#ef4444',
                  color: 'white',
                  fontSize: 10, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `2px solid ${C.bg}`,
                  lineHeight: 1,
                  padding: '0 4px',
                  letterSpacing: '0',
                }}>
                  {trashCount > 9 ? '9+' : trashCount}
                </span>
              )}
            </button>

            {/* Plan a New Trip button */}
            <a
              href="/plan"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'linear-gradient(140deg, #1e8a52 0%, #0d5530 100%)',
                border: '1px solid rgba(50,160,100,0.35)',
                borderRadius: 10, padding: '12px 22px',
                fontSize: 14, fontWeight: 600, color: 'white',
                textDecoration: 'none',
                boxShadow: '0 0 22px rgba(26,130,78,0.28)',
                transition: 'box-shadow 0.2s ease, transform 0.15s ease',
                flexShrink: 0,
              }}
              onMouseEnter={e => Object.assign((e.currentTarget as HTMLElement).style, { boxShadow: '0 0 34px rgba(26,130,78,0.5)', transform: 'translateY(-2px)' })}
              onMouseLeave={e => Object.assign((e.currentTarget as HTMLElement).style, { boxShadow: '0 0 22px rgba(26,130,78,0.28)', transform: 'translateY(0)' })}
            >
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" style={{ width: 11, height: 11 }}>
                <path d="M7 2v10M2 7h10" />
              </svg>
              Plan a New Trip
            </a>
          </div>
        </div>

        {/* States */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }} className="trips-grid">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : error ? (
          <ErrorState onRefresh={load} />
        ) : trips.length === 0 ? (
          <EmptyState />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }} className="trips-grid">
            {trips.map((trip, i) => (
              <TripCard
                key={trip.id}
                trip={trip}
                index={i}
                onDelete={deleteTrip}
              />
            ))}
          </div>
        )}
      </div>

      {/* ─── Trash Panel ─── */}
      <TrashPanel
        isOpen={trashOpen}
        onClose={() => setTrashOpen(false)}
        trashedTrips={trashedTrips}
        loading={trashLoading}
        onRestore={restoreTrip}
      />

      {/* ─── Toast ─── */}
      <Toast message={toast} visible={toastVisible} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

        @keyframes card-in {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes confirm-in {
          from { opacity: 0; transform: scale(0.97); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes sk-pulse {
          0%,100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        .trips-grid { grid-template-columns: repeat(3, 1fr); }
        @media (max-width: 1024px) {
          .trips-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 640px) {
          .trips-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 560px) {
          .nav-email { display: none !important; }
        }
      `}</style>
    </div>
  )
}
