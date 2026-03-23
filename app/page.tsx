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
const IconPin = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 26, height: 26 }}>
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
    <circle cx="12" cy="9" r="2.5" />
  </svg>
);

const IconSparkle = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 26, height: 26 }}>
    <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
    <path d="M18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
  </svg>
);

const IconMap = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 26, height: 26 }}>
    <path d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
  </svg>
);

const IconPlane = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 26, height: 26 }}>
    <path d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
  </svg>
);

const IconBuilding = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 26, height: 26 }}>
    <path d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
  </svg>
);

const IconFork = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 26, height: 26 }}>
    <path d="M7.5 3.75v16.5m0 0H6m1.5 0H9m-1.5-5.25H9a3 3 0 003-3v-3a3 3 0 00-3-3H7.5m9-3v2.25m0 0A2.25 2.25 0 0118.75 9v.75a2.25 2.25 0 01-2.25 2.25H15m1.5-5.25v12" />
  </svg>
);

const IconMountain = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 26, height: 26 }}>
    <path d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
  </svg>
);

const IconWallet = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 26, height: 26 }}>
    <path d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
  </svg>
);

const LogoIcon = ({ size = 32 }: { size?: number }) => (
  <div style={{
    width: size, height: size,
    background: 'linear-gradient(140deg, #20a862 0%, #0c5e35 100%)',
    borderRadius: size * 0.28,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 2px 12px rgba(20,140,80,0.35)',
  }}>
    <svg viewBox="0 0 24 24" fill="white" style={{ width: size * 0.56, height: size * 0.56 }}>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
    </svg>
  </div>
);

/* ─── Hover helpers (TS-friendly) ─── */
type El = HTMLButtonElement | HTMLAnchorElement | HTMLDivElement;
const hov = (el: EventTarget, styles: Record<string, string>) => {
  Object.assign((el as HTMLElement).style, styles);
};

/* ═══════════════════════════════════════════ */
export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 56);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  // ── Video slideshow ──
  const ref0 = useRef<HTMLVideoElement>(null);
  const ref1 = useRef<HTMLVideoElement>(null);
  const [opacities, setOpacities] = useState<[number, number]>([1, 0]);
  const activeSlotRef = useRef<0 | 1>(0);  // which slot is currently foreground
  const nextVidRef = useRef(2);             // index of next video to queue after load

  useEffect(() => {
    // Slot 0 plays first; slot 1 is pre-loaded with video 1, ready to play
    const v0 = ref0.current;
    const v1 = ref1.current;
    if (v0) { v0.src = BG_VIDEOS[0]; v0.load(); v0.play().catch(() => {}); }
    if (v1) { v1.src = BG_VIDEOS[1]; v1.load(); }
  }, []);

  const handleVideoEnded = useCallback((slot: 0 | 1) => {
    if (slot !== activeSlotRef.current) return; // guard against stale events
    const incoming: 0 | 1 = slot === 0 ? 1 : 0;
    const inRef  = incoming === 0 ? ref0 : ref1;
    const outRef = slot    === 0 ? ref0 : ref1;

    // Start playing the pre-loaded incoming video and crossfade
    inRef.current?.play().catch(() => {});
    setOpacities(incoming === 0 ? [1, 0] : [0, 1]);
    activeSlotRef.current = incoming;

    // After the crossfade completes, reload the now-background slot with the next video
    setTimeout(() => {
      const nextSrc = BG_VIDEOS[nextVidRef.current % BG_VIDEOS.length];
      nextVidRef.current++;
      if (outRef.current) { outRef.current.src = nextSrc; outRef.current.load(); }
    }, CROSSFADE_MS + 200);
  }, []);

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", color: 'white', overflowX: 'hidden' }}>

      {/* ════════════════════════════════════
          NAVIGATION
      ════════════════════════════════════ */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        padding: scrolled ? '12px 0' : '20px 0',
        background: scrolled ? 'rgba(3,8,16,0.82)' : 'transparent',
        backdropFilter: scrolled ? 'blur(18px) saturate(1.4)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.055)' : 'none',
        transition: 'padding 0.4s ease, background 0.4s ease, backdrop-filter 0.4s ease',
      }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          {/* Logo */}
          <a href="#" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <LogoIcon size={34} />
            <span className="et-display" style={{ fontWeight: 700, fontSize: 22, color: 'white', letterSpacing: '-0.02em' }}>
              Easy Trip
            </span>
          </a>

          {/* Desktop links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 36 }} className="hidden md:flex">
            {([['Home', '#'], ['How It Works', '#how-it-works'], ['About', '#about']] as [string, string][]).map(([label, href]) => (
              <a key={label} href={href}
                style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.62)', textDecoration: 'none', transition: 'color 0.2s ease' }}
                onMouseEnter={e => hov(e.currentTarget, { color: '#fff' })}
                onMouseLeave={e => hov(e.currentTarget, { color: 'rgba(255,255,255,0.62)' })}>
                {label}
              </a>
            ))}
          </div>

          {/* CTA button */}
          <button className="hidden md:block"
            style={{
              background: 'linear-gradient(140deg, #1e8a52 0%, #0d5530 100%)',
              border: '1px solid rgba(50,160,100,0.35)',
              borderRadius: 9,
              padding: '10px 24px',
              fontSize: 14,
              fontWeight: 600,
              color: 'white',
              cursor: 'pointer',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              boxShadow: '0 0 22px rgba(26,130,78,0.28)',
              letterSpacing: '-0.01em',
            }}
            onMouseEnter={e => hov(e.currentTarget, { transform: 'translateY(-2px)', boxShadow: '0 0 32px rgba(26,130,78,0.5)' })}
            onMouseLeave={e => hov(e.currentTarget, { transform: 'translateY(0)', boxShadow: '0 0 22px rgba(26,130,78,0.28)' })}>
            Get Started
          </button>

          {/* Mobile hamburger */}
          <button className="md:hidden"
            onClick={() => setMenuOpen(o => !o)}
            style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 4, lineHeight: 0 }}
            aria-label="Toggle menu">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width: 24, height: 24 }}>
              {menuOpen
                ? <><path d="M6 18L18 6" /><path d="M6 6l12 12" /></>
                : <><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" /></>}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div style={{
            background: 'rgba(3,8,18,0.96)',
            backdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            padding: '22px 28px',
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
          }}>
            {(['Home', 'How It Works', 'About'] as string[]).map(label => (
              <a key={label} href="#"
                onClick={() => setMenuOpen(false)}
                style={{ color: 'rgba(255,255,255,0.78)', fontSize: 16, textDecoration: 'none', fontWeight: 500 }}>
                {label}
              </a>
            ))}
            <button style={{
              background: 'linear-gradient(140deg, #1e8a52 0%, #0d5530 100%)',
              border: 'none', borderRadius: 9, padding: '13px', fontSize: 15,
              fontWeight: 600, color: 'white', cursor: 'pointer', marginTop: 6,
            }}>
              Get Started
            </button>
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
        padding: '100px 24px 60px',
        overflow: 'hidden',
      }}>
        {/* ── Video background (hero-only) ── */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden', background: '#030810' }}>
          {/* Slot 0 */}
          <video
            ref={ref0}
            muted
            playsInline
            preload="auto"
            onEnded={() => handleVideoEnded(0)}
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'cover',
              opacity: opacities[0],
              transition: `opacity ${CROSSFADE_MS}ms ease-in-out`,
            }}
          />
          {/* Slot 1 */}
          <video
            ref={ref1}
            muted
            playsInline
            preload="none"
            onEnded={() => handleVideoEnded(1)}
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'cover',
              opacity: opacities[1],
              transition: `opacity ${CROSSFADE_MS}ms ease-in-out`,
            }}
          />
          {/* Dark overlay — keeps text readable over any video */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0.28) 50%, rgba(0,0,0,0.55) 100%)',
          }} />
          {/* Edge vignette for depth */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse 90% 80% at 50% 50%, transparent 40%, rgba(0,0,0,0.5) 100%)',
          }} />
          {/* Grain texture */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.03, pointerEvents: 'none' }}>
            <filter id="grain">
              <feTurbulence type="fractalNoise" baseFrequency="0.68" numOctaves="3" stitchTiles="stitch" />
              <feColorMatrix type="saturate" values="0" />
            </filter>
            <rect width="100%" height="100%" filter="url(#grain)" />
          </svg>
        </div>
        {/* Hero content — sits above the video */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        {/* Badge */}
        <div className="anim-fade-up" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(26,130,78,0.13)',
          border: '1px solid rgba(40,160,95,0.32)',
          borderRadius: 100,
          padding: '8px 20px',
          marginBottom: 36,
          backdropFilter: 'blur(10px)',
        }}>
          <span style={{ width: 7, height: 7, background: '#40d48c', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 8px #40d48c' }} />
          <span style={{ color: 'rgb(21, 209, 150)', fontSize: 13, fontWeight: 500, letterSpacing: '0.055em' }}>
            Smart US Travel Planning
          </span>
        </div>

        {/* Headline */}
        <h1 className="et-display anim-fade-up" style={{
          fontSize: 'clamp(2.6rem, 5.4vw, 5.2rem)',
          fontWeight: 700,
          lineHeight: 1.06,
          letterSpacing: '-0.03em',
          marginBottom: 26,
          maxWidth: 980,
          animationDelay: '0.08s',
        }}>
          <span style={{ color: 'white' }}>Your Dream Trip,</span>
          <br />
          <span style={{
            background: 'linear-gradient(128deg, #0feb28 30%, #2fd047 20%, #d4e609 70%, #dde904 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Planned in Minutes
          </span>
        </h1>

        {/* Sub-headline */}
        <p className="anim-fade-up" style={{
          fontSize: 'clamp(1rem, 2.4vw, 1.22rem)',
          color: 'rgba(255,255,255,0.58)',
          maxWidth: 560,
          lineHeight: 1.72,
          marginBottom: 48,
          fontWeight: 400,
          animationDelay: '0.18s',
        }}>
          Tell us where you want to go — we will build your complete personalized US itinerary with flights, hotels, restaurants, and routes in minutes.
        </p>

        {/* Buttons */}
        <div className="anim-fade-up" style={{
          display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center',
          animationDelay: '0.28s',
        }}>
          <button
            style={{
              background: 'linear-gradient(140deg, #1e8a52 0%, #0e5c34 100%)',
              border: '1px solid rgba(50,170,105,0.38)',
              borderRadius: 11,
              padding: '17px 40px',
              fontSize: 16,
              fontWeight: 600,
              color: 'white',
              cursor: 'pointer',
              transition: 'transform 0.22s ease, box-shadow 0.22s ease',
              boxShadow: '0 5px 28px rgba(26,138,82,0.4), 0 1px 0 rgba(255,255,255,0.1) inset',
              letterSpacing: '-0.015em',
            }}
            onMouseEnter={e => hov(e.currentTarget, { transform: 'translateY(-3px)', boxShadow: '0 10px 38px rgba(26,138,82,0.58), 0 1px 0 rgba(255,255,255,0.1) inset' })}
            onMouseLeave={e => hov(e.currentTarget, { transform: 'translateY(0)', boxShadow: '0 5px 28px rgba(26,138,82,0.4), 0 1px 0 rgba(255,255,255,0.1) inset' })}>
            Plan My Trip &rarr;
          </button>

          <button
            style={{
              background: 'rgba(255,255,255,0.055)',
              border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: 11,
              padding: '17px 40px',
              fontSize: 16,
              fontWeight: 500,
              color: 'rgba(255,255,255,0.82)',
              cursor: 'pointer',
              transition: 'background 0.22s ease, color 0.22s ease, border-color 0.22s ease',
              backdropFilter: 'blur(10px)',
              letterSpacing: '-0.015em',
            }}
            onMouseEnter={e => hov(e.currentTarget, { background: 'rgba(255,255,255,0.1)', color: '#fff', borderColor: 'rgba(255,255,255,0.25)' })}
            onMouseLeave={e => hov(e.currentTarget, { background: 'rgba(255,255,255,0.055)', color: 'rgba(255,255,255,0.82)', borderColor: 'rgba(255,255,255,0.14)' })}>
            See How It Works
          </button>
        </div>
        </div>

        {/* Scroll indicator */}
        <div className="anim-fade-up" style={{
          position: 'absolute', zIndex: 1, bottom: 38, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          color: 'rgba(255,255,255,0.28)', fontSize: 10, letterSpacing: '0.12em',
          textTransform: 'uppercase', animationDelay: '1s',
        }}>
          <span>Scroll</span>
          <div className="scroll-pulse" style={{ width: 1, height: 44, background: 'linear-gradient(to bottom, rgba(255,255,255,0.32), transparent)' }} />
        </div>
      </section>

      {/* ════════════════════════════════════
          HOW IT WORKS
      ════════════════════════════════════ */}
      <section id="how-it-works" style={{ position: 'relative', zIndex: 10, padding: '120px 24px 140px', background: '#0b1218' }}>
        {/* Green glow crown */}
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 800, height: 360, background: 'radial-gradient(ellipse at 50% 0%, rgba(67,82,69,0.22) 0%, transparent 58%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1120, margin: '0 auto' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 88 }}>
            <span style={{ color: '#435245', fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', display: 'block', marginBottom: 20 }}>
              How It Works
            </span>
            <h2 className="et-display" style={{
              fontSize: 'clamp(2.2rem, 5vw, 3.8rem)',
              fontWeight: 700,
              letterSpacing: '-0.03em', lineHeight: 1.06,
              background: 'linear-gradient(128deg, #f0f5f0 15%, #9dbfa2 60%, #435245 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Trip planning, simplified
            </h2>
            <p style={{ color: 'rgba(200,218,204,0.7)', fontSize: 17, marginTop: 20, lineHeight: 1.72, maxWidth: 440, margin: '20px auto 0' }}>
              Three steps between you and your perfect American adventure.
            </p>
          </div>

          {/* Steps */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, alignItems: 'start' }}>
            {[
              {
                num: '01',
                icon: <IconPin />,
                title: 'Tell Us Your Vibe',
                desc: 'Beach bum, city explorer, or mountain chaser — tell us where you want to go and how you like to travel. Takes under two minutes.',
              },
              {
                num: '02',
                icon: <IconSparkle />,
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
                  background: 'rgba(13,22,18,0.72)',
                  border: '1px solid rgba(67,82,69,0.28)',
                  borderRadius: 20,
                  padding: '44px 38px',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 0 0 1px rgba(67,82,69,0.06), 0 4px 32px rgba(0,0,0,0.5)',
                  transition: 'border-color 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease',
                  cursor: 'default',
                  marginTop: i === 1 ? 36 : 0,
                }}
                onMouseEnter={e => hov(e.currentTarget, { borderColor: 'rgba(67,130,80,0.55)', boxShadow: '0 0 36px rgba(67,130,80,0.15), 0 0 0 1px rgba(67,130,80,0.24), 0 8px 40px rgba(0,0,0,0.55)', transform: 'translateY(-6px)' })}
                onMouseLeave={e => hov(e.currentTarget, { borderColor: 'rgba(67,82,69,0.28)', boxShadow: '0 0 0 1px rgba(67,82,69,0.06), 0 4px 32px rgba(0,0,0,0.5)', transform: 'translateY(0)' })}>
                {/* Large watermark number */}
                <div className="et-display" style={{
                  position: 'absolute', bottom: -28, right: -8,
                  fontSize: 180, fontWeight: 900,
                  color: 'rgba(67,82,69,0.1)',
                  lineHeight: 1, userSelect: 'none', pointerEvents: 'none',
                  letterSpacing: '-0.06em',
                }}>
                  {step.num}
                </div>
                {/* Corner glow */}
                <div style={{
                  position: 'absolute', top: 0, right: 0,
                  width: 150, height: 150,
                  background: 'radial-gradient(ellipse at top right, rgba(67,82,69,0.16) 0%, transparent 62%)',
                  borderRadius: '0 20px 0 0', pointerEvents: 'none',
                }} />
                {/* Icon */}
                <div style={{
                  width: 58, height: 58,
                  background: 'linear-gradient(140deg, rgba(67,82,69,0.32) 0%, rgba(20,40,25,0.15) 100%)',
                  border: '1px solid rgba(67,82,69,0.44)',
                  borderRadius: 15,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#7aad7e',
                  marginBottom: 28,
                  boxShadow: '0 0 22px rgba(67,82,69,0.22)',
                }}>
                  {step.icon}
                </div>
                <h3 style={{ fontSize: 22, fontWeight: 700, color: '#e8ede9', marginBottom: 14, letterSpacing: '-0.022em', lineHeight: 1.18, position: 'relative' }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: 15.5, color: 'rgba(200,218,204,0.72)', lineHeight: 1.74, position: 'relative' }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Glowing section divider ── */}
      <div style={{ position: 'relative', height: 1, background: 'linear-gradient(90deg, transparent 0%, rgba(67,82,69,0.3) 22%, rgba(67,145,88,0.58) 50%, rgba(67,82,69,0.3) 78%, transparent 100%)' }}>
        <div style={{ position: 'absolute', top: -5, left: '50%', transform: 'translateX(-50%)', width: '42%', height: 10, background: 'radial-gradient(ellipse at center, rgba(67,145,88,0.24) 0%, transparent 70%)', pointerEvents: 'none' }} />
      </div>

      {/* ════════════════════════════════════
          FEATURES
      ════════════════════════════════════ */}
      <section style={{ position: 'relative', zIndex: 10, padding: '120px 24px 140px', background: '#080d16' }}>
        {/* Subtle atmospheric texture */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 65% 50% at 8% 88%, rgba(20,40,28,0.3) 0%, transparent 52%), radial-gradient(ellipse 55% 45% at 92% 12%, rgba(8,18,40,0.35) 0%, transparent 52%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1120, margin: '0 auto' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 88 }}>
            <span style={{ color: '#435245', fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', display: 'block', marginBottom: 20 }}>
              Features
            </span>
            <h2 className="et-display" style={{
              fontSize: 'clamp(2.2rem, 5vw, 3.8rem)',
              fontWeight: 700,
              letterSpacing: '-0.03em', lineHeight: 1.06,
              background: 'linear-gradient(128deg, #f0f5f0 15%, #9dbfa2 60%, #435245 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Everything you'd need<br />for a perfect trip
            </h2>
            <p style={{ color: 'rgba(200,218,204,0.68)', fontSize: 17, marginTop: 20, lineHeight: 1.72, maxWidth: 460, margin: '20px auto 0' }}>
              Every tool a smart traveler need
            </p>
          </div>

          {/* Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 22 }}>
            {[
              {
                icon: <IconSparkle />,
                title: 'Personalized Itineraries',
                desc: 'Tell us your vibe — beach bum, city explorer, mountain chaser — and we\'ll handle everything else, down to the best local coffee stops.',
              },
              {
                icon: <IconPlane />,
                title: 'Live Flight & Hotel Prices',
                desc: 'Live flight prices so you always fly smart, not expensive. Real hotel availability synced to your exact dates — no surprises at checkout.',
              },
              {
                icon: <IconFork />,
                title: 'Restaurant Recommendations',
                desc: 'Hand-curated local dining — not just the Yelp top-10. Filtered by cuisine, price, and where you\'ll actually be that day.',
              },
              {
                icon: <IconMap />,
                title: 'Drive Times & Routes',
                desc: 'Your route fully optimized so you\'re never backtracking. Real drive times, fuel estimates, and the scenic detours worth taking.',
              },
              {
                icon: <IconMountain />,
                title: 'National Park Info',
                desc: 'Entrance fees, permit requirements, best trails by season, and ranger tips — pulled fresh from NPS data, not some outdated blog.',
              },
              {
                icon: <IconWallet />,
                title: 'Budget Tracking',
                desc: 'See your real spend before you land: flights, hotels, food, activities — broken down so you can splurge on what actually matters.',
              },
            ].map((f, i) => (
              <div key={i}
                style={{
                  background: 'rgba(10,16,24,0.82)',
                  border: '1px solid rgba(67,82,69,0.2)',
                  borderRadius: 16,
                  padding: '34px 32px',
                  display: 'flex', gap: 24, alignItems: 'flex-start',
                  boxShadow: '0 0 0 1px rgba(67,82,69,0.05), 0 2px 24px rgba(0,0,0,0.5)',
                  transition: 'border-color 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease',
                  cursor: 'default',
                }}
                onMouseEnter={e => hov(e.currentTarget, { borderColor: 'rgba(67,145,88,0.5)', boxShadow: '0 0 30px rgba(67,145,88,0.12), 0 0 0 1px rgba(67,145,88,0.2), 0 6px 36px rgba(0,0,0,0.55)', transform: 'translateY(-4px)' })}
                onMouseLeave={e => hov(e.currentTarget, { borderColor: 'rgba(67,82,69,0.2)', boxShadow: '0 0 0 1px rgba(67,82,69,0.05), 0 2px 24px rgba(0,0,0,0.5)', transform: 'translateY(0)' })}>
                <div style={{
                  width: 60, height: 60, flexShrink: 0,
                  background: 'linear-gradient(140deg, rgba(67,82,69,0.28) 0%, rgba(15,30,20,0.14) 100%)',
                  border: '1px solid rgba(67,82,69,0.38)',
                  borderRadius: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#7aad7e',
                  boxShadow: '0 0 20px rgba(67,82,69,0.18)',
                }}>
                  <div style={{ transform: 'scale(1.15)', display: 'flex' }}>{f.icon}</div>
                </div>
                <div>
                  <h4 style={{ fontSize: 17, fontWeight: 700, color: '#e8ede9', marginBottom: 10, letterSpacing: '-0.015em' }}>
                    {f.title}
                  </h4>
                  <p style={{ fontSize: 15, color: 'rgba(200,218,204,0.68)', lineHeight: 1.72 }}>
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Glowing section divider ── */}
      <div style={{ position: 'relative', height: 1, background: 'linear-gradient(90deg, transparent 0%, rgba(67,82,69,0.3) 22%, rgba(67,145,88,0.58) 50%, rgba(67,82,69,0.3) 78%, transparent 100%)' }}>
        <div style={{ position: 'absolute', top: -5, left: '50%', transform: 'translateX(-50%)', width: '42%', height: 10, background: 'radial-gradient(ellipse at center, rgba(67,145,88,0.24) 0%, transparent 70%)', pointerEvents: 'none' }} />
      </div>

      {/* ════════════════════════════════════
          CTA
      ════════════════════════════════════ */}
      <section style={{ position: 'relative', zIndex: 10, padding: '100px 24px 140px', background: '#0b1218' }}>
        <div style={{ maxWidth: 780, margin: '0 auto', textAlign: 'center' }}>
          {/* Animated gradient border wrapper */}
          <div className="cta-border" style={{ position: 'relative', padding: 2, borderRadius: 28 }}>
            <div style={{
              background: 'linear-gradient(135deg, #0e2e1c 0%, #163d28 32%, #0c2820 64%, #0a1e14 100%)',
              borderRadius: 26,
              padding: 'clamp(56px, 8vw, 92px) clamp(36px, 6vw, 92px)',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Layered glows */}
              <div style={{ position: 'absolute', top: -90, left: '50%', transform: 'translateX(-50%)', width: 640, height: 300, background: 'radial-gradient(ellipse at center, rgba(30,138,82,0.28) 0%, transparent 62%)', borderRadius: '50%', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: -70, left: -90, width: 380, height: 220, background: 'radial-gradient(ellipse at center, rgba(20,80,50,0.2) 0%, transparent 62%)', borderRadius: '50%', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', top: -50, right: -50, width: 300, height: 220, background: 'radial-gradient(ellipse at center, rgba(8,40,60,0.22) 0%, transparent 62%)', borderRadius: '50%', pointerEvents: 'none' }} />
              {/* Corner brackets — unique design detail */}
              <div style={{ position: 'absolute', top: 26, left: 26, width: 46, height: 46, borderTop: '1.5px solid rgba(67,145,88,0.42)', borderLeft: '1.5px solid rgba(67,145,88,0.42)', borderRadius: '4px 0 0 0', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', top: 26, right: 26, width: 46, height: 46, borderTop: '1.5px solid rgba(67,145,88,0.42)', borderRight: '1.5px solid rgba(67,145,88,0.42)', borderRadius: '0 4px 0 0', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: 26, left: 26, width: 46, height: 46, borderBottom: '1.5px solid rgba(67,145,88,0.42)', borderLeft: '1.5px solid rgba(67,145,88,0.42)', borderRadius: '0 0 0 4px', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: 26, right: 26, width: 46, height: 46, borderBottom: '1.5px solid rgba(67,145,88,0.42)', borderRight: '1.5px solid rgba(67,145,88,0.42)', borderRadius: '0 0 4px 0', pointerEvents: 'none' }} />

              <span style={{ color: '#435245', fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', display: 'block', marginBottom: 26, position: 'relative' }}>
                Start Planning
              </span>

              <h2 className="et-display" style={{
                fontSize: 'clamp(2.1rem, 5vw, 3.6rem)',
                fontWeight: 700,
                letterSpacing: '-0.03em', lineHeight: 1.08,
                marginBottom: 24, position: 'relative',
                background: 'linear-gradient(128deg, #f0f5f0 15%, #9dbfa2 62%, #6a8a6e 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                Your next adventure<br />starts with one click
              </h2>

              <p style={{
                color: 'rgba(200,218,204,0.72)', fontSize: 17, lineHeight: 1.72,
                maxWidth: 460, margin: '0 auto 52px', position: 'relative',
              }}>
                No subscription. No account needed to start. Just your destination and a minute of your time.
              </p>

              <button
                style={{
                  background: 'linear-gradient(140deg, #1e8a52 0%, #0d5c34 100%)',
                  border: '1px solid rgba(80,200,130,0.25)',
                  borderRadius: 12,
                  padding: '20px 58px',
                  fontSize: 16,
                  fontWeight: 600,
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'transform 0.24s ease, box-shadow 0.24s ease',
                  boxShadow: '0 6px 36px rgba(26,138,82,0.44), 0 1px 0 rgba(255,255,255,0.12) inset',
                  letterSpacing: '-0.015em',
                  position: 'relative',
                }}
                onMouseEnter={e => hov(e.currentTarget, { transform: 'translateY(-4px)', boxShadow: '0 14px 48px rgba(26,138,82,0.64), 0 1px 0 rgba(255,255,255,0.12) inset' })}
                onMouseLeave={e => hov(e.currentTarget, { transform: 'translateY(0)', boxShadow: '0 6px 36px rgba(26,138,82,0.44), 0 1px 0 rgba(255,255,255,0.12) inset' })}>
                Plan My Trip — It&rsquo;s Free
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════
          FOOTER
      ════════════════════════════════════ */}
      <footer style={{
        position: 'relative', zIndex: 10,
        background: '#030810',
        borderTop: '1px solid rgba(67,82,69,0.18)',
        padding: '56px 24px 48px',
      }}>
        {/* Soft green glow at top */}
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 700, height: 130, background: 'radial-gradient(ellipse at 50% 0%, rgba(67,82,69,0.1) 0%, transparent 68%)', pointerEvents: 'none' }} />
        <div style={{
          maxWidth: 1120, margin: '0 auto', position: 'relative',
          display: 'flex', flexWrap: 'wrap',
          justifyContent: 'space-between', alignItems: 'center',
          gap: 32,
        }}>
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <LogoIcon size={28} />
              <span className="et-display" style={{ fontWeight: 700, fontSize: 18, color: 'white', letterSpacing: '-0.02em' }}>
                Easy Trip
              </span>
            </div>
            <p style={{ color: 'rgba(200,218,204,0.36)', fontSize: 13, lineHeight: 1.6 }}>
              Built for the road.<br />
            </p>
          </div>

          {/* Links */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 28 }}>
            {(['Home', 'How It Works', 'About', 'Contact'] as string[]).map(label => (
              <a key={label} href="#"
                style={{ color: 'rgba(200,218,204,0.42)', fontSize: 14, textDecoration: 'none', transition: 'color 0.2s ease', fontWeight: 500 }}
                onMouseEnter={e => hov(e.currentTarget, { color: 'rgba(200,218,204,0.88)' })}
                onMouseLeave={e => hov(e.currentTarget, { color: 'rgba(200,218,204,0.42)' })}>
                {label}
              </a>
            ))}
          </div>

          {/* Copyright */}
          <p style={{ color: 'rgba(200,218,204,0.24)', fontSize: 13 }}>
            &copy; 2026 Easy Trip. All rights reserved.
          </p>
        </div>
      </footer>

    </div>
  );
}
