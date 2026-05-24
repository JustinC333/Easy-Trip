'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const LogoIcon = ({ size = 32 }: { size?: number }) => (
  <svg viewBox="0 0 24 30" fill="none" style={{ width: size * 24 / 30, height: size, flexShrink: 0 }} aria-hidden="true">
    <defs>
      <linearGradient id="et-pin-reset" x1="3" y1="1" x2="21" y2="29" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#34d475" />
        <stop offset="100%" stopColor="#0d6b35" />
      </linearGradient>
    </defs>
    <path d="M12 1C7.03 1 3 5.03 3 10c0 4.42 3.2 8.22 7.2 13.1L12 29l1.8-5.9C17.8 18.22 21 14.42 21 10c0-4.97-4.03-9-9-9z" fill="url(#et-pin-reset)" style={{ filter: 'drop-shadow(0 3px 8px rgba(13,107,53,0.45))' }} />
    <circle cx="12" cy="10" r="5.5" fill="white" opacity="0.97" />
    <line x1="12" y1="10" x2="9.6" y2="8.6" stroke="#0d6b35" strokeWidth="1.3" strokeLinecap="round" />
    <line x1="12" y1="10" x2="15.3" y2="8.1" stroke="#0d6b35" strokeWidth="1" strokeLinecap="round" />
    <circle cx="12" cy="10" r="0.9" fill="#0d6b35" />
  </svg>
)

const Spinner = () => (
  <span style={{
    display: 'inline-block', width: 14, height: 14,
    border: '2px solid rgba(237,232,223,0.30)', borderTopColor: '#ede8df',
    borderRadius: '50%', animation: 'reset-spin 0.7s linear infinite', flexShrink: 0,
  }} />
)

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [focusField, setFocusField] = useState<'pw' | 'confirm' | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace('/auth')
      else setChecking(false)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }

    setLoading(true)
    const { error: updateErr } = await supabase.auth.updateUser({ password })
    if (updateErr) {
      setError(updateErr.message)
    } else {
      setDone(true)
      setTimeout(() => router.replace('/plan'), 2500)
    }
    setLoading(false)
  }

  if (checking) return null

  return (
    <div style={{
      minHeight: '100vh',
      background: '#060908',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: "'DM Sans', system-ui, sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>
      <style>{`@keyframes reset-spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 70% 50% at 50% 10%, rgba(18,80,42,0.18) 0%, transparent 65%)',
      }} />
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.025, pointerEvents: 'none' }}>
        <filter id="grain-reset">
          <feTurbulence type="fractalNoise" baseFrequency="0.68" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain-reset)" />
      </svg>

      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: 420,
        background: 'rgba(8,13,9,0.82)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 20,
        padding: '44px 40px 40px',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 8px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04) inset',
      }}>
        {/* Corner brackets */}
        <div style={{ position: 'absolute', top: 16, left: 16, width: 24, height: 24, borderTop: '1.5px solid rgba(200,145,58,0.22)', borderLeft: '1.5px solid rgba(200,145,58,0.22)', borderRadius: '3px 0 0 0', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 16, right: 16, width: 24, height: 24, borderTop: '1.5px solid rgba(200,145,58,0.22)', borderRight: '1.5px solid rgba(200,145,58,0.22)', borderRadius: '0 3px 0 0', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 16, left: 16, width: 24, height: 24, borderBottom: '1.5px solid rgba(200,145,58,0.22)', borderLeft: '1.5px solid rgba(200,145,58,0.22)', borderRadius: '0 0 0 3px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 16, right: 16, width: 24, height: 24, borderBottom: '1.5px solid rgba(200,145,58,0.22)', borderRight: '1.5px solid rgba(200,145,58,0.22)', borderRadius: '0 0 3px 0', pointerEvents: 'none' }} />

        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 36, justifyContent: 'center' }}>
          <LogoIcon size={34} />
          <span style={{ fontWeight: 700, fontSize: 22, color: '#ede8df', letterSpacing: '-0.025em' }}>Easy Trip</span>
        </a>

        {done ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'rgba(30,138,82,0.15)',
              border: '1px solid rgba(52,212,117,0.30)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 28, height: 28, color: '#34d475' }}>
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#ede8df', letterSpacing: '-0.025em', marginBottom: 8 }}>
              Password updated!
            </h1>
            <p style={{ fontSize: 13.5, color: 'rgba(237,232,223,0.44)', lineHeight: 1.6 }}>
              Redirecting you to your trips…
            </p>
          </div>
        ) : (
          <>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#ede8df', letterSpacing: '-0.025em', marginBottom: 6, lineHeight: 1.2 }}>
              Set new password
            </h1>
            <p style={{ fontSize: 13.5, color: 'rgba(237,232,223,0.44)', marginBottom: 28, lineHeight: 1.6 }}>
              Choose a strong password for your account.
            </p>

            {error && (
              <div style={{
                background: 'rgba(220,50,50,0.10)', border: '1px solid rgba(220,50,50,0.28)',
                borderRadius: 9, padding: '11px 14px', marginBottom: 20,
                display: 'flex', alignItems: 'flex-start', gap: 10,
              }}>
                <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 16, height: 16, flexShrink: 0, color: '#f87171', marginTop: 1 }}>
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                <span style={{ fontSize: 13.5, color: '#fca5a5', lineHeight: 1.5 }}>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* New password */}
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'rgba(237,232,223,0.52)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                  New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setFocusField('pw')}
                    onBlur={() => setFocusField(null)}
                    placeholder="At least 6 characters"
                    required
                    autoComplete="new-password"
                    autoFocus
                    style={{
                      width: '100%',
                      background: 'rgba(255,255,255,0.05)',
                      border: `1px solid ${focusField === 'pw' ? 'rgba(52,212,117,0.50)' : 'rgba(255,255,255,0.09)'}`,
                      borderRadius: 10, padding: '13px 48px 13px 16px', fontSize: 15,
                      color: '#ede8df', outline: 'none',
                      fontFamily: "'DM Sans', system-ui, sans-serif",
                      transition: 'border-color 0.2s ease', boxSizing: 'border-box',
                      boxShadow: focusField === 'pw' ? '0 0 0 3px rgba(52,212,117,0.08)' : 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                      color: showPassword ? 'rgba(52,212,117,0.70)' : 'rgba(237,232,223,0.30)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'color 0.2s ease', borderRadius: 4,
                    }}
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'rgba(237,232,223,0.52)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                  Confirm Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  onFocus={() => setFocusField('confirm')}
                  onBlur={() => setFocusField(null)}
                  placeholder="Repeat your new password"
                  required
                  autoComplete="new-password"
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.05)',
                    border: `1px solid ${focusField === 'confirm' ? 'rgba(52,212,117,0.50)' : confirm && confirm !== password ? 'rgba(220,50,50,0.40)' : 'rgba(255,255,255,0.09)'}`,
                    borderRadius: 10, padding: '13px 16px', fontSize: 15,
                    color: '#ede8df', outline: 'none',
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    transition: 'border-color 0.2s ease', boxSizing: 'border-box',
                    boxShadow: focusField === 'confirm' ? '0 0 0 3px rgba(52,212,117,0.08)' : 'none',
                  }}
                />
                {confirm && confirm !== password && (
                  <p style={{ fontSize: 12, color: '#f87171', marginTop: 6, lineHeight: 1.4 }}>Passwords do not match</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: 4, width: '100%', padding: '14px', fontSize: 15, fontWeight: 600,
                  color: '#ede8df',
                  background: loading ? 'rgba(30,107,66,0.45)' : 'linear-gradient(135deg, #1e6b42 0%, #0e4428 100%)',
                  border: '1px solid rgba(46,140,88,0.38)', borderRadius: 10,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  letterSpacing: '-0.01em',
                  transition: 'opacity 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease',
                  boxShadow: loading ? 'none' : '0 4px 24px rgba(18,90,54,0.38)',
                  opacity: loading ? 0.7 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
                onMouseEnter={e => { if (!loading) Object.assign((e.currentTarget as HTMLElement).style, { transform: 'translateY(-1px)', boxShadow: '0 6px 32px rgba(18,90,54,0.54)' }) }}
                onMouseLeave={e => { if (!loading) Object.assign((e.currentTarget as HTMLElement).style, { transform: 'translateY(0)', boxShadow: '0 4px 24px rgba(18,90,54,0.38)' }) }}
              >
                {loading ? <><Spinner /> Updating password…</> : 'Update Password'}
              </button>
            </form>
          </>
        )}
      </div>

      <a href="/auth" style={{ marginTop: 24, fontSize: 13, color: 'rgba(237,232,223,0.28)', textDecoration: 'none', transition: 'color 0.2s ease' }}
        onMouseEnter={e => Object.assign((e.currentTarget as HTMLElement).style, { color: 'rgba(237,232,223,0.60)' })}
        onMouseLeave={e => Object.assign((e.currentTarget as HTMLElement).style, { color: 'rgba(237,232,223,0.28)' })}
      >
        ← Back to sign in
      </a>
    </div>
  )
}
