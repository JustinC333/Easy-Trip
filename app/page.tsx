// Home Page

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

/* ─── Video slideshow config ─── */
const BG_VIDEOS = [
  'https://ucur14dm16l5fxk8.public.blob.vercel-storage.com/bg1.mp4',
  'https://ucur14dm16l5fxk8.public.blob.vercel-storage.com/bg2.mp4',
  'https://ucur14dm16l5fxk8.public.blob.vercel-storage.com/bg3.mp4',
  'https://ucur14dm16l5fxk8.public.blob.vercel-storage.com/bg4.mp4',
  'https://ucur14dm16l5fxk8.public.blob.vercel-storage.com/bg5.mp4',
  'https://ucur14dm16l5fxk8.public.blob.vercel-storage.com/bg6.mp4',
  'https://ucur14dm16l5fxk8.public.blob.vercel-storage.com/bg7.mp4',
  'https://ucur14dm16l5fxk8.public.blob.vercel-storage.com/bg8.mp4',
];
const CROSSFADE_MS = 1400;

/* ─── Icon components ─── */
const IconSparkle = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 24, height: 24 }}>
    <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
    <path d="M18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
  </svg>
);

const IconMap = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 24, height: 24 }}>
    <path d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
  </svg>
);

const IconWallet = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 24, height: 24 }}>
    <path d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
  </svg>
);

const IconCheck = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 13, height: 13, flexShrink: 0 }}>
    <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
  </svg>
);

const LogoIcon = ({ size = 32 }: { size?: number }) => (
  <svg
    viewBox="0 0 24 30"
    fill="none"
    style={{ width: size * 24 / 30, height: size, flexShrink: 0 }}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="et-pin-grad" x1="3" y1="1" x2="21" y2="29" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#34d475" />
        <stop offset="100%" stopColor="#0d6b35" />
      </linearGradient>
    </defs>
    <path
      d="M12 1C7.03 1 3 5.03 3 10c0 4.42 3.2 8.22 7.2 13.1L12 29l1.8-5.9C17.8 18.22 21 14.42 21 10c0-4.97-4.03-9-9-9z"
      fill="url(#et-pin-grad)"
      style={{ filter: 'drop-shadow(0 3px 8px rgba(13,107,53,0.45))' }}
    />
    <circle cx="12" cy="10" r="5.5" fill="white" opacity="0.97" />
    <line x1="12" y1="10" x2="9.6" y2="8.6" stroke="#0d6b35" strokeWidth="1.3" strokeLinecap="round" />
    <line x1="12" y1="10" x2="15.3" y2="8.1" stroke="#0d6b35" strokeWidth="1" strokeLinecap="round" />
    <circle cx="12" cy="10" r="0.9" fill="#0d6b35" />
  </svg>
);

/* ─── Hover helper ─── */
const hov = (el: EventTarget, styles: Record<string, string>) => {
  Object.assign((el as HTMLElement).style, styles);
};

/* ═══════════════════════════════════════════ */
export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isWide, setIsWide] = useState(true);

  useEffect(() => {
    const checkWidth = () => setIsWide(window.innerWidth >= 800);
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 56);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => { document.documentElement.style.scrollBehavior = ''; };
  }, []);

  // ── Video slideshow ──
  const ref0 = useRef<HTMLVideoElement>(null);
  const ref1 = useRef<HTMLVideoElement>(null);
  const [opacities, setOpacities] = useState<[number, number]>([1, 0]);
  const activeSlotRef = useRef<0 | 1>(0);
  const nextVidRef = useRef(2);

  useEffect(() => {
    const v0 = ref0.current;
    const v1 = ref1.current;
    if (v0) { v0.src = BG_VIDEOS[0]; v0.load(); v0.play().catch(() => {}); }
    if (v1) { v1.src = BG_VIDEOS[1]; v1.load(); }
  }, []);

  const handleVideoEnded = useCallback((slot: 0 | 1) => {
    if (slot !== activeSlotRef.current) return;
    const incoming: 0 | 1 = slot === 0 ? 1 : 0;
    const inRef  = incoming === 0 ? ref0 : ref1;
    const outRef = slot    === 0 ? ref0 : ref1;
    inRef.current?.play().catch(() => {});
    setOpacities(incoming === 0 ? [1, 0] : [0, 1]);
    activeSlotRef.current = incoming;
    setTimeout(() => {
      const nextSrc = BG_VIDEOS[nextVidRef.current % BG_VIDEOS.length];
      nextVidRef.current++;
      if (outRef.current) { outRef.current.src = nextSrc; outRef.current.load(); }
    }, CROSSFADE_MS + 200);
  }, []);

  return (
    <div id="top" style={{ fontFamily: "'DM Sans', system-ui, sans-serif", color: '#ede8df', overflowX: 'hidden', background: '#060908' }}>

      {/* ════════════════════════════════════
          NAVIGATION
      ════════════════════════════════════ */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        padding: scrolled ? '10px 0' : '18px 0',
        background: scrolled ? 'rgba(6,9,8,0.90)' : 'transparent',
        backdropFilter: scrolled ? 'blur(22px) saturate(1.5)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.05)' : 'none',
        transition: 'padding 0.35s ease, background 0.35s ease',
      }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          {/* Logo */}
          <a href="#" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <LogoIcon size={32} />
            <span className="et-display" style={{ fontWeight: 700, fontSize: 20, color: '#ede8df', letterSpacing: '-0.025em' }}>
              Easy Trip
            </span>
          </a>

          {/* Desktop links */}
          <div className="hidden md:flex" style={{ alignItems: 'center', gap: 36 }}>
            {([['Home', '#top'], ['How It Works', '#how-it-works'], ['Features', '#features']] as [string, string][]).map(([label, href]) => (
              <a key={label} href={href}
                style={{ fontSize: 13.5, fontWeight: 500, color: 'rgba(237,232,223,0.52)', textDecoration: 'none', letterSpacing: '0.01em', transition: 'color 0.2s ease' }}
                onMouseEnter={e => hov(e.currentTarget, { color: '#ede8df' })}
                onMouseLeave={e => hov(e.currentTarget, { color: 'rgba(237,232,223,0.52)' })}>
                {label}
              </a>
            ))}
          </div>

          {/* CTA */}
          <a href="/plan" className="hidden md:block"
            style={{
              background: 'linear-gradient(135deg, #1e6b42 0%, #0e4428 100%)',
              border: '1px solid rgba(46,140,88,0.38)',
              borderRadius: 8,
              padding: '9px 22px',
              fontSize: 13.5,
              fontWeight: 600,
              color: '#ede8df',
              textDecoration: 'none',
              display: 'inline-block',
              letterSpacing: '-0.01em',
              cursor: 'pointer',
              boxShadow: '0 2px 18px rgba(18,90,54,0.32)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
            onMouseEnter={e => hov(e.currentTarget, { transform: 'translateY(-1px)', boxShadow: '0 4px 26px rgba(18,90,54,0.52)' })}
            onMouseLeave={e => hov(e.currentTarget, { transform: 'translateY(0)', boxShadow: '0 2px 18px rgba(18,90,54,0.32)' })}>
            Get Started
          </a>

          {/* Mobile hamburger */}
          <button className="md:hidden"
            onClick={() => setMenuOpen(o => !o)}
            style={{ background: 'none', border: 'none', color: '#ede8df', cursor: 'pointer', padding: 4, lineHeight: 0 }}
            aria-label="Toggle menu">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width: 22, height: 22 }}>
              {menuOpen
                ? <><path d="M6 18L18 6" /><path d="M6 6l12 12" /></>
                : <><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" /></>}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div style={{
            background: 'rgba(6,9,8,0.98)',
            backdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            padding: '20px 28px',
            display: 'flex', flexDirection: 'column', gap: 16,
          }}>
            {([['Home', '#top'], ['How It Works', '#how-it-works'], ['Features', '#features']] as [string, string][]).map(([label, href]) => (
              <a key={label} href={href}
                onClick={() => setMenuOpen(false)}
                style={{ color: 'rgba(237,232,223,0.75)', fontSize: 16, textDecoration: 'none', fontWeight: 500 }}>
                {label}
              </a>
            ))}
            <a href="/plan" style={{
              background: 'linear-gradient(135deg, #1e6b42 0%, #0e4428 100%)',
              border: 'none', borderRadius: 8, padding: '13px', fontSize: 15,
              fontWeight: 600, color: '#ede8df', textDecoration: 'none',
              display: 'block', textAlign: 'center', marginTop: 4,
            }}>
              Get Started
            </a>
          </div>
        )}
      </nav>

      {/* ════════════════════════════════════
          HERO
      ════════════════════════════════════ */}
      <section style={{
        position: 'relative', zIndex: 10,
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center',
        padding: '100px 24px 80px',
        overflow: 'hidden',
      }}>
        {/* Video background */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden', background: '#060908' }}>
          <video ref={ref0} muted playsInline preload="auto" onEnded={() => handleVideoEnded(0)}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: opacities[0], transition: `opacity ${CROSSFADE_MS}ms ease-in-out` }} />
          <video ref={ref1} muted playsInline preload="none" onEnded={() => handleVideoEnded(1)}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: opacities[1], transition: `opacity ${CROSSFADE_MS}ms ease-in-out` }} />
          {/* Cinematic overlay */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(6,9,8,0.36) 0%, rgba(6,9,8,0.18) 45%, rgba(6,9,8,0.64) 100%)' }} />
          {/* Edge vignette */}
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 90% 80% at 50% 50%, transparent 38%, rgba(0,0,0,0.54) 100%)' }} />
          {/* Grain */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.025, pointerEvents: 'none' }}>
            <filter id="grain">
              <feTurbulence type="fractalNoise" baseFrequency="0.68" numOctaves="3" stitchTiles="stitch" />
              <feColorMatrix type="saturate" values="0" />
            </filter>
            <rect width="100%" height="100%" filter="url(#grain)" />
          </svg>
        </div>

        {/* Hero content */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: 1000 }}>

          {/* Badge */}
          <div className="anim-fade-up" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(200,145,58,0.10)',
            border: '1px solid rgba(200,145,58,0.28)',
            borderRadius: 100,
            padding: '7px 18px',
            marginBottom: 32,
            backdropFilter: 'blur(10px)',
          }}>
            <span style={{ width: 6, height: 6, background: '#c8913a', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 6px rgba(200,145,58,0.8)' }} />
            <span style={{ color: '#dba860', fontSize: 12.5, fontWeight: 500, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
              AI-Powered US Trip Planner
            </span>
          </div>

          {/* Headline */}
          <h1 className="et-display anim-fade-up" style={{
            fontSize: 'clamp(2.8rem, 5.8vw, 5.6rem)',
            fontWeight: 700,
            lineHeight: 1.04,
            letterSpacing: '-0.03em',
            marginBottom: 24,
            animationDelay: '0.08s',
          }}>
            <span style={{ color: '#ede8df' }}>Plan Your Perfect</span>
            <br />
            <span style={{
              background: 'linear-gradient(118deg, #c8913a 0%, #e8b86a 38%, #d4a050 68%, #bf8830 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              American Adventure
            </span>
          </h1>

          {/* Subhead */}
          <p className="anim-fade-up" style={{
            fontSize: 'clamp(1rem, 2.2vw, 1.18rem)',
            color: 'rgba(237,232,223,0.60)',
            maxWidth: 540,
            lineHeight: 1.78,
            marginBottom: 44,
            fontWeight: 400,
            animationDelay: '0.16s',
          }}>
            From National Parks to vibrant cities — tell us where you want to go and we&apos;ll build your complete personalized US itinerary with real flights, hotels, and restaurants. Ready in minutes.
          </p>

          {/* Buttons */}
          <div className="anim-fade-up" style={{
            display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center',
            marginBottom: 36, animationDelay: '0.26s',
          }}>
            <a href="/plan"
              style={{
                background: 'linear-gradient(135deg, #1e6b42 0%, #0e4428 100%)',
                border: '1px solid rgba(46,140,88,0.4)',
                borderRadius: 10,
                padding: '16px 38px',
                fontSize: 15.5,
                fontWeight: 600,
                color: '#ede8df',
                cursor: 'pointer',
                transition: 'transform 0.22s ease, box-shadow 0.22s ease',
                boxShadow: '0 4px 30px rgba(18,90,54,0.46), 0 1px 0 rgba(255,255,255,0.08) inset',
                letterSpacing: '-0.01em',
                textDecoration: 'none',
                display: 'inline-block',
              }}
              onMouseEnter={e => hov(e.currentTarget, { transform: 'translateY(-3px)', boxShadow: '0 9px 42px rgba(18,90,54,0.62), 0 1px 0 rgba(255,255,255,0.08) inset' })}
              onMouseLeave={e => hov(e.currentTarget, { transform: 'translateY(0)', boxShadow: '0 4px 30px rgba(18,90,54,0.46), 0 1px 0 rgba(255,255,255,0.08) inset' })}>
              Plan My Trip &rarr;
            </a>

            <button
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              style={{
                background: 'rgba(237,232,223,0.06)',
                border: '1px solid rgba(237,232,223,0.15)',
                borderRadius: 10,
                padding: '16px 38px',
                fontSize: 15.5,
                fontWeight: 500,
                color: 'rgba(237,232,223,0.78)',
                cursor: 'pointer',
                transition: 'background 0.2s ease, color 0.2s ease, border-color 0.2s ease',
                backdropFilter: 'blur(8px)',
                letterSpacing: '-0.01em',
              }}
              onMouseEnter={e => hov(e.currentTarget, { background: 'rgba(237,232,223,0.11)', color: '#ede8df', borderColor: 'rgba(237,232,223,0.28)' })}
              onMouseLeave={e => hov(e.currentTarget, { background: 'rgba(237,232,223,0.06)', color: 'rgba(237,232,223,0.78)', borderColor: 'rgba(237,232,223,0.15)' })}>
              How It Works
            </button>
          </div>

          {/* Trust pills */}
          <div className="anim-fade-up" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 22px', justifyContent: 'center', animationDelay: '0.36s' }}>
            {['No signup required', 'Free itinerary', 'Real-time prices'].map((t) => (
              <span key={t} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontSize: 13, color: 'rgba(237,232,223,0.44)',
              }}>
                <span style={{ color: '#2d7a4f', display: 'flex' }}><IconCheck /></span>
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="anim-fade-up" style={{
          position: 'absolute', zIndex: 1, bottom: 36, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          color: 'rgba(237,232,223,0.22)', fontSize: 10, letterSpacing: '0.12em',
          textTransform: 'uppercase', animationDelay: '1.1s',
        }}>
          <span>Scroll</span>
          <div className="scroll-pulse" style={{ width: 1, height: 42, background: 'linear-gradient(to bottom, rgba(237,232,223,0.26), transparent)' }} />
        </div>
      </section>

      {/* ════════════════════════════════════
          STATS BAR
      ════════════════════════════════════ */}
      <section style={{ background: '#060908', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: isWide ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)' }}>
          {[
            { num: '50K+',    label: 'Trips Planned' },
            { num: '400+',    label: 'US Destinations' },
            { num: '100%',    label: 'Free to Use' },
            { num: '< 5 min', label: 'Average Plan Time' },
          ].map(({ num, label }, i) => (
            <div key={label} style={{
              padding: '44px 24px',
              textAlign: 'center',
              borderRight: (isWide ? i < 3 : i % 2 === 0) ? '1px solid rgba(255,255,255,0.05)' : 'none',
              borderBottom: !isWide && i < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none',
            }}>
              <div className="et-display" style={{
                fontSize: 'clamp(1.9rem, 3.5vw, 2.7rem)',
                fontWeight: 700,
                color: '#c8913a',
                letterSpacing: '-0.03em',
                lineHeight: 1.1,
                marginBottom: 6,
              }}>
                {num}
              </div>
              <div style={{
                fontSize: 12.5,
                color: 'rgba(237,232,223,0.38)',
                fontWeight: 500,
                letterSpacing: '0.07em',
                textTransform: 'uppercase',
              }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════
          HOW IT WORKS
      ════════════════════════════════════ */}
      <section id="how-it-works" style={{
        position: 'relative', zIndex: 10,
        padding: '120px 24px 140px',
        backgroundImage: 'url(/HowItWorks/pic1.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        overflow: 'hidden',
      }}>
        {/* Dark overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(4,7,4,0.74)', pointerEvents: 'none' }} />
        {/* Top warmth */}
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 700, height: 280, background: 'radial-gradient(ellipse at 50% 0%, rgba(200,145,58,0.07) 0%, transparent 62%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1120, margin: '0 auto' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 80 }}>
            <span style={{ color: '#c8913a', fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', display: 'block', marginBottom: 16 }}>
              How It Works
            </span>
            <h2 className="et-display" style={{
              fontSize: 'clamp(2.2rem, 5vw, 3.8rem)',
              fontWeight: 700,
              letterSpacing: '-0.03em', lineHeight: 1.05,
              color: '#ede8df',
              marginBottom: 18,
            }}>
              Three steps to your<br />perfect trip
            </h2>
            <p style={{ color: 'rgba(237,232,223,0.50)', fontSize: 16.5, lineHeight: 1.72, maxWidth: 400, margin: '0 auto' }}>
              From zero to full itinerary in the time it takes to finish a coffee.
            </p>
          </div>

          {/* Steps */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            {[
              {
                num: '01',
                icon: <IconSparkle />,
                title: 'Tell Us Your Vibe',
                desc: 'Beach bum, city explorer, or mountain chaser — tell us where you want to go and how you like to travel. Takes under two minutes.',
              },
              {
                num: '02',
                icon: <IconWallet />,
                title: 'We Build the Plan',
                desc: 'Real flights, real hotels, real restaurants — all personalized and sequenced into a day-by-day itinerary you\'ll actually want to follow.',
              },
              {
                num: '03',
                icon: <IconMap />,
                title: 'Hit the Road',
                desc: 'Access your trip on any device. Navigate each day with built-in routes, drive times, and local tips — no guesswork, just adventure.',
              },
            ].map((step, i) => (
              <div key={i}
                style={{
                  background: 'rgba(8,13,9,0.68)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 20,
                  padding: '44px 36px 40px',
                  position: 'relative',
                  overflow: 'hidden',
                  backdropFilter: 'blur(14px)',
                  boxShadow: '0 4px 32px rgba(0,0,0,0.42)',
                  transition: 'border-color 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease',
                  cursor: 'default',
                }}
                onMouseEnter={e => hov(e.currentTarget, { borderColor: 'rgba(200,145,58,0.28)', transform: 'translateY(-5px)', boxShadow: '0 14px 48px rgba(0,0,0,0.52), 0 0 0 1px rgba(200,145,58,0.14)' })}
                onMouseLeave={e => hov(e.currentTarget, { borderColor: 'rgba(255,255,255,0.07)', transform: 'translateY(0)', boxShadow: '0 4px 32px rgba(0,0,0,0.42)' })}>

                {/* Watermark number */}
                <div className="et-display" style={{
                  position: 'absolute', bottom: -18, right: 2,
                  fontSize: 156, fontWeight: 900,
                  color: 'rgba(200,145,58,0.07)',
                  lineHeight: 1, userSelect: 'none', pointerEvents: 'none',
                  letterSpacing: '-0.06em',
                }}>
                  {step.num}
                </div>

                {/* Step tag */}
                <div style={{ marginBottom: 28 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: '#c8913a',
                    letterSpacing: '0.13em', textTransform: 'uppercase',
                    background: 'rgba(200,145,58,0.10)',
                    border: '1px solid rgba(200,145,58,0.22)',
                    borderRadius: 6,
                    padding: '3px 10px',
                  }}>
                    Step {step.num}
                  </span>
                </div>

                {/* Icon */}
                <div style={{
                  width: 52, height: 52,
                  background: 'linear-gradient(135deg, rgba(200,145,58,0.14) 0%, rgba(200,145,58,0.04) 100%)',
                  border: '1px solid rgba(200,145,58,0.22)',
                  borderRadius: 13,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#c8913a',
                  marginBottom: 22,
                  boxShadow: '0 0 18px rgba(200,145,58,0.10)',
                }}>
                  {step.icon}
                </div>

                <h3 style={{ fontSize: 21, fontWeight: 700, color: '#ede8df', marginBottom: 12, letterSpacing: '-0.02em', lineHeight: 1.22, position: 'relative' }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: 15, color: 'rgba(237,232,223,0.55)', lineHeight: 1.76, position: 'relative' }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section divider ── */}
      <div style={{ height: 1, background: 'linear-gradient(90deg, transparent 0%, rgba(200,145,58,0.10) 22%, rgba(200,145,58,0.26) 50%, rgba(200,145,58,0.10) 78%, transparent 100%)' }} />

      {/* ════════════════════════════════════
          FEATURES
      ════════════════════════════════════ */}
      <section id="features" style={{ position: 'relative', zIndex: 10, padding: '120px 24px 140px', background: '#060908' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 40% at 8% 88%, rgba(18,44,26,0.18) 0%, transparent 55%), radial-gradient(ellipse 50% 40% at 92% 10%, rgba(8,20,38,0.18) 0%, transparent 55%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1120, margin: '0 auto' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 80 }}>
            <span style={{ color: '#c8913a', fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', display: 'block', marginBottom: 16 }}>
              Features
            </span>
            <h2 className="et-display" style={{
              fontSize: 'clamp(2.2rem, 5vw, 3.8rem)',
              fontWeight: 700,
              letterSpacing: '-0.03em', lineHeight: 1.05,
              color: '#ede8df',
              marginBottom: 18,
            }}>
              Everything your trip needs,<br />already built in
            </h2>
            <p style={{ color: 'rgba(237,232,223,0.46)', fontSize: 16.5, lineHeight: 1.72, maxWidth: 440, margin: '0 auto' }}>
              One platform. Every tool a smart traveler needs.
            </p>
          </div>

          {/* Bento grid */}
          <div style={{ display: 'grid', gridTemplateColumns: isWide ? 'repeat(3, 1fr)' : '1fr', gap: 14 }}>
            {[
              {
                title: 'Personalized Itineraries',
                desc: 'Tell us your vibe — beach bum, city explorer, mountain chaser — and we\'ll handle everything down to the best local coffee stops.',
                img: '/features/card1.jpg', imgPos: 'center 80%',
                tag: 'Core Feature', wide: true, full: false, tall: true,
              },
              {
                title: 'Live Flight & Hotel Prices',
                desc: 'Real-time prices synced to your exact dates — no surprises at checkout.',
                img: '/features/card2.jpg', imgPos: 'center 20%',
                tag: 'Real-time', wide: false, full: false, tall: false,
              },
              {
                title: 'Restaurant Recommendations',
                desc: 'Hand-curated local dining filtered by cuisine, price, and where you\'ll actually be that day.',
                img: '/features/card3.jpg', imgPos: 'center',
                tag: 'Dining', wide: false, full: false, tall: false,
              },
              {
                title: 'Drive Times & Routes',
                desc: 'Fully optimized routes — real drive times, fuel estimates, and the scenic detours worth taking.',
                img: '/features/card4.jpg', imgPos: 'center',
                tag: 'Navigation', wide: false, full: false, tall: false,
              },
              {
                title: 'National Park Info',
                desc: 'Entrance fees, permit requirements, best trails by season — pulled fresh from NPS data.',
                img: '/features/card5.jpg', imgPos: 'center',
                tag: 'Parks', wide: false, full: false, tall: false,
              },
              {
                title: 'Budget Tracking',
                desc: 'See your real spend before you land: flights, hotels, food, activities — broken down so you can splurge on what actually matters.',
                img: '/features/card6.jpg', imgPos: 'center',
                tag: 'Finance', wide: false, full: true, tall: false,
              },
            ].map((f, i) => (
              <div key={i}
                style={{
                  gridColumn: isWide && f.full ? '1 / -1' : isWide && f.wide ? 'span 2' : 'span 1',
                  position: 'relative',
                  overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 16,
                  minHeight: f.tall ? 340 : f.full ? 220 : 272,
                  cursor: 'default',
                  boxShadow: '0 2px 20px rgba(0,0,0,0.42)',
                  transition: 'border-color 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease',
                }}
                onMouseEnter={e => {
                  hov(e.currentTarget, { borderColor: 'rgba(200,145,58,0.30)', transform: 'translateY(-4px)', boxShadow: '0 10px 42px rgba(0,0,0,0.52), 0 0 0 1px rgba(200,145,58,0.12)' });
                  const img = e.currentTarget.querySelector('.feat-img') as HTMLElement | null;
                  if (img) img.style.transform = 'scale(1.04)';
                }}
                onMouseLeave={e => {
                  hov(e.currentTarget, { borderColor: 'rgba(255,255,255,0.07)', transform: 'translateY(0)', boxShadow: '0 2px 20px rgba(0,0,0,0.42)' });
                  const img = e.currentTarget.querySelector('.feat-img') as HTMLElement | null;
                  if (img) img.style.transform = 'scale(1)';
                }}>

                {/* Background image */}
                <img src={f.img} alt="" aria-hidden="true" className="feat-img" style={{
                  position: 'absolute', inset: 0, width: '100%', height: '100%',
                  objectFit: 'cover', objectPosition: f.imgPos,
                  pointerEvents: 'none',
                  transition: 'transform 0.5s ease',
                }} />
                {/* Bottom gradient overlay */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to bottom, rgba(6,9,8,0.20) 0%, rgba(6,9,8,0.24) 25%, rgba(6,9,8,0.78) 68%, rgba(6,9,8,0.97) 100%)',
                  pointerEvents: 'none',
                }} />

                {/* Content */}
                <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '18px 22px 24px' }}>
                  {/* Category tag */}
                  <div>
                    <span style={{
                      fontSize: 10.5, fontWeight: 700, color: '#c8913a',
                      background: 'rgba(200,145,58,0.12)',
                      border: '1px solid rgba(200,145,58,0.22)',
                      borderRadius: 5, padding: '3px 9px',
                      letterSpacing: '0.07em', textTransform: 'uppercase',
                    }}>
                      {f.tag}
                    </span>
                  </div>
                  {/* Text block anchored to bottom */}
                  <div>
                    <h4 style={{ fontSize: f.wide ? 19 : 17, fontWeight: 700, color: '#ede8df', marginBottom: 7, letterSpacing: '-0.015em', lineHeight: 1.25 }}>
                      {f.title}
                    </h4>
                    <p style={{ fontSize: 13.5, color: 'rgba(237,232,223,0.55)', lineHeight: 1.68, margin: 0 }}>
                      {f.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section divider ── */}
      <div style={{ height: 1, background: 'linear-gradient(90deg, transparent 0%, rgba(200,145,58,0.10) 22%, rgba(200,145,58,0.26) 50%, rgba(200,145,58,0.10) 78%, transparent 100%)' }} />

      {/* ════════════════════════════════════
          CTA
      ════════════════════════════════════ */}
      <section style={{ position: 'relative', zIndex: 10, padding: '100px 24px 140px', background: '#070a08', overflow: 'hidden' }}>
        {/* Atmospheric orbs */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 700, height: 500, background: 'radial-gradient(ellipse at center, rgba(26,80,48,0.14) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: -80, right: -80, width: 380, height: 380, background: 'radial-gradient(ellipse at center, rgba(200,145,58,0.04) 0%, transparent 60%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 740, margin: '0 auto', textAlign: 'center' }}>
          <div className="cta-border" style={{ position: 'relative', padding: 1, borderRadius: 28 }}>
            <div style={{
              background: 'linear-gradient(150deg, #0c1f13 0%, #132b1d 40%, #0a1a12 70%, #0d2017 100%)',
              borderRadius: 27,
              padding: 'clamp(52px, 8vw, 88px) clamp(32px, 6vw, 80px)',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Glows */}
              <div style={{ position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)', width: 560, height: 240, background: 'radial-gradient(ellipse at center, rgba(26,100,58,0.22) 0%, transparent 62%)', borderRadius: '50%', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: -60, right: -60, width: 300, height: 200, background: 'radial-gradient(ellipse at center, rgba(200,145,58,0.06) 0%, transparent 62%)', borderRadius: '50%', pointerEvents: 'none' }} />

              {/* Corner brackets */}
              <div style={{ position: 'absolute', top: 22, left: 22, width: 38, height: 38, borderTop: '1.5px solid rgba(200,145,58,0.28)', borderLeft: '1.5px solid rgba(200,145,58,0.28)', borderRadius: '4px 0 0 0', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', top: 22, right: 22, width: 38, height: 38, borderTop: '1.5px solid rgba(200,145,58,0.28)', borderRight: '1.5px solid rgba(200,145,58,0.28)', borderRadius: '0 4px 0 0', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: 22, left: 22, width: 38, height: 38, borderBottom: '1.5px solid rgba(200,145,58,0.28)', borderLeft: '1.5px solid rgba(200,145,58,0.28)', borderRadius: '0 0 0 4px', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: 22, right: 22, width: 38, height: 38, borderBottom: '1.5px solid rgba(200,145,58,0.28)', borderRight: '1.5px solid rgba(200,145,58,0.28)', borderRadius: '0 0 4px 0', pointerEvents: 'none' }} />

              <span style={{ color: '#c8913a', fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', display: 'block', marginBottom: 22, position: 'relative' }}>
                Start Planning
              </span>

              <h2 className="et-display" style={{
                fontSize: 'clamp(2.1rem, 5vw, 3.6rem)',
                fontWeight: 700,
                letterSpacing: '-0.03em', lineHeight: 1.08,
                marginBottom: 20, position: 'relative',
                color: '#ede8df',
              }}>
                Your next adventure<br />starts with one click
              </h2>

              <p style={{ color: 'rgba(237,232,223,0.54)', fontSize: 16.5, lineHeight: 1.72, maxWidth: 420, margin: '0 auto 36px', position: 'relative' }}>
                No subscription. No account needed. Just your destination and a minute of your time.
              </p>

              {/* Feature bullets */}
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px 24px', marginBottom: 44, position: 'relative' }}>
                {['Free itinerary', 'Real flight & hotel prices', 'Works for all US destinations'].map(t => (
                  <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(237,232,223,0.46)' }}>
                    <span style={{ color: '#2d7a4f', display: 'flex' }}><IconCheck /></span>
                    {t}
                  </span>
                ))}
              </div>

              <a href="/plan"
                style={{
                  background: 'linear-gradient(135deg, #1e6b42 0%, #0e4428 100%)',
                  border: '1px solid rgba(46,140,88,0.38)',
                  borderRadius: 11,
                  padding: '18px 54px',
                  fontSize: 16,
                  fontWeight: 600,
                  color: '#ede8df',
                  cursor: 'pointer',
                  transition: 'transform 0.24s ease, box-shadow 0.24s ease',
                  boxShadow: '0 6px 36px rgba(18,90,54,0.46), 0 1px 0 rgba(255,255,255,0.1) inset',
                  letterSpacing: '-0.01em',
                  position: 'relative',
                  textDecoration: 'none',
                  display: 'inline-block',
                }}
                onMouseEnter={e => hov(e.currentTarget, { transform: 'translateY(-4px)', boxShadow: '0 14px 50px rgba(18,90,54,0.64), 0 1px 0 rgba(255,255,255,0.1) inset' })}
                onMouseLeave={e => hov(e.currentTarget, { transform: 'translateY(0)', boxShadow: '0 6px 36px rgba(18,90,54,0.46), 0 1px 0 rgba(255,255,255,0.1) inset' })}>
                Plan My Trip &mdash; It&rsquo;s Free
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════
          FOOTER
      ════════════════════════════════════ */}
      <footer style={{
        position: 'relative', zIndex: 10,
        background: '#030605',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        padding: '60px 24px 48px',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 600, height: 100, background: 'radial-gradient(ellipse at 50% 0%, rgba(200,145,58,0.05) 0%, transparent 68%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1120, margin: '0 auto', position: 'relative' }}>
          <div style={{ display: 'grid', gridTemplateColumns: isWide ? '2fr 1fr 1fr' : '1fr', gap: isWide ? '48px' : '32px', marginBottom: 48 }}>
            {/* Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <LogoIcon size={28} />
                <span className="et-display" style={{ fontWeight: 700, fontSize: 18, color: '#ede8df', letterSpacing: '-0.025em' }}>
                  Easy Trip
                </span>
              </div>
              <p style={{ color: 'rgba(237,232,223,0.34)', fontSize: 13.5, lineHeight: 1.70, maxWidth: 280 }}>
                Smart travel planning for every American road. Free, fast, and built for the way you actually travel.
              </p>
            </div>

            {/* Navigation */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(237,232,223,0.25)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 20 }}>
                Navigation
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                {([['Home', '#top'], ['How It Works', '#how-it-works'], ['Features', '#features']] as [string, string][]).map(([label, href]) => (
                  <a key={label} href={href}
                    style={{ color: 'rgba(237,232,223,0.38)', fontSize: 14, textDecoration: 'none', fontWeight: 500, transition: 'color 0.2s ease' }}
                    onMouseEnter={e => hov(e.currentTarget, { color: 'rgba(237,232,223,0.76)' })}
                    onMouseLeave={e => hov(e.currentTarget, { color: 'rgba(237,232,223,0.38)' })}>
                    {label}
                  </a>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(237,232,223,0.25)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 20 }}>
                Contact
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                <a href="mailto:jonusajc@gmail.com"
                  style={{ color: 'rgba(237,232,223,0.38)', fontSize: 14, textDecoration: 'none', fontWeight: 500, transition: 'color 0.2s ease' }}
                  onMouseEnter={e => hov(e.currentTarget, { color: 'rgba(237,232,223,0.76)' })}
                  onMouseLeave={e => hov(e.currentTarget, { color: 'rgba(237,232,223,0.38)' })}>
                  Send a Message
                </a>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 24, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <p style={{ color: 'rgba(237,232,223,0.18)', fontSize: 13 }}>
              &copy; 2026 Easy Trip. All rights reserved.
            </p>
            <p style={{ color: 'rgba(237,232,223,0.18)', fontSize: 13 }}>
              Built for the road.
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
