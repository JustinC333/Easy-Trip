'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const STEPS_BASE = ['Destination & Dates', 'Your Vibe', 'Budget & Group', 'Must Haves'];
const STEPS_FLIGHT = ['Destination & Dates', 'Your Vibe', 'Flight Details', 'Budget & Group', 'Must Haves'];

const LOADING_MESSAGES = [
  'Analyzing your destinations...',
  'Checking flights and hotels...',
  'Building your day-by-day itinerary...',
  'Adding local recommendations...',
  'Almost ready...',
];

/* ─── Types ─── */
interface Destination {
  state: string;
  city: string;
}

interface FormData {
  destinations: Destination[];
  startDate: string;
  endDate: string;
  budget: number;
  groupSize: 'solo' | 'couple' | 'small' | 'large' | '';
  groupCount: number;
  travelStyles: string[];
  transportation: string;
  accommodation: string;
  mustHaves: string;
  flightBudget: number;
  accommodationBudget: number;
  dailyBudget: number;
  departureCity: string;
  departureCode: string;
  cabinClass: number;
}

const EMPTY_FORM: FormData = {
  destinations: [{ state: '', city: '' }],
  startDate: '',
  endDate: '',
  budget: 0,
  groupSize: '',
  groupCount: 0,
  travelStyles: [],
  transportation: '',
  accommodation: '',
  mustHaves: '',
  flightBudget: 0,
  accommodationBudget: 0,
  dailyBudget: 0,
  departureCity: '',
  departureCode: '',
  cabinClass: 1,
};

/* ─── Logo ─── */
const LogoIcon = ({ size = 32 }: { size?: number }) => (
  <svg viewBox="0 0 24 30" fill="none" style={{ width: size * 24 / 30, height: size, flexShrink: 0 }} aria-hidden="true">
    <defs>
      <linearGradient id="et-pin-plan" x1="3" y1="1" x2="21" y2="29" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#34d475" />
        <stop offset="100%" stopColor="#0d6b35" />
      </linearGradient>
    </defs>
    <path d="M12 1C7.03 1 3 5.03 3 10c0 4.42 3.2 8.22 7.2 13.1L12 29l1.8-5.9C17.8 18.22 21 14.42 21 10c0-4.97-4.03-9-9-9z" fill="url(#et-pin-plan)" style={{ filter: 'drop-shadow(0 3px 8px rgba(13,107,53,0.45))' }} />
    <circle cx="12" cy="10" r="5.5" fill="white" opacity="0.97" />
    <line x1="12" y1="10" x2="9.6" y2="8.6" stroke="#0d6b35" strokeWidth="1.3" strokeLinecap="round" />
    <line x1="12" y1="10" x2="15.3" y2="8.1" stroke="#0d6b35" strokeWidth="1" strokeLinecap="round" />
    <circle cx="12" cy="10" r="0.9" fill="#0d6b35" />
  </svg>
);

/* ─── Style tokens ─── */
const C = {
  bg: '#030810',
  surface: 'rgba(255,255,255,0.04)',
  surfaceHover: 'rgba(255,255,255,0.07)',
  border: 'rgba(255,255,255,0.08)',
  borderFocus: 'rgba(52,212,117,0.5)',
  green: '#1e8a52',
  greenBright: '#34d475',
  greenDark: '#0d5530',
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255,255,255,0.62)',
  textMuted: 'rgba(255,255,255,0.38)',
  selectedBg: 'rgba(30,138,82,0.18)',
  selectedBorder: 'rgba(52,212,117,0.6)',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.05)',
  border: `1px solid ${C.border}`,
  borderRadius: 10,
  padding: '13px 16px',
  fontSize: 15,
  color: C.textPrimary,
  outline: 'none',
  fontFamily: "'DM Sans', system-ui, sans-serif",
  transition: 'border-color 0.2s ease, background 0.2s ease',
  boxSizing: 'border-box',
};

/* ─── Helper: trip duration ─── */
function tripDuration(a: string, b: string): { days: number; nights: number } | null {
  if (!a || !b) return null;
  const diff = Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
  if (diff < 0) return null;
  return { nights: diff, days: diff + 1 };
}
// keep legacy alias for sidebar
function daysBetween(a: string, b: string): number | null {
  const d = tripDuration(a, b);
  return d ? d.nights : null;
}

/* ─── US data ─── */
const US_STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado',
  'Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho',
  'Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana',
  'Maine','Maryland','Massachusetts','Michigan','Minnesota',
  'Mississippi','Missouri','Montana','Nebraska','Nevada',
  'New Hampshire','New Jersey','New Mexico','New York',
  'North Carolina','North Dakota','Ohio','Oklahoma','Oregon',
  'Pennsylvania','Rhode Island','South Carolina','South Dakota',
  'Tennessee','Texas','Utah','Vermont','Virginia','Washington',
  'West Virginia','Wisconsin','Wyoming',
];

/* ─── Combobox ─── */
import { useRef } from 'react';

interface ComboboxProps {
  options: string[];
  value: string;
  onSelect: (val: string) => void;
  onClear: () => void;
  placeholder: string;
  disabled?: boolean;
  showError?: boolean;
  errorMessage?: string;
  icon?: React.ReactNode;
  showWhenEmpty?: boolean;
}

function Combobox({ options, value, onSelect, onClear, placeholder, disabled, showError, errorMessage, icon, showWhenEmpty = false }: ComboboxProps) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = options.filter(o => o.toLowerCase().includes(query.toLowerCase()));
  const showList = open && !disabled && (showWhenEmpty || query.length > 0) && filtered.length > 0;

  useEffect(() => { if (!open) setQuery(value); }, [value, open]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery(value);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [value]);

  const select = (val: string) => {
    setQuery(val);
    onSelect(val);
    setOpen(false);
    setActiveIdx(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showList) {
      if (e.key === 'ArrowDown') { setOpen(true); setActiveIdx(0); e.preventDefault(); }
      return;
    }
    if (e.key === 'ArrowDown') { setActiveIdx(i => Math.min(i + 1, filtered.length - 1)); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { setActiveIdx(i => Math.max(i - 1, 0)); e.preventDefault(); }
    else if (e.key === 'Enter' && activeIdx >= 0) { select(filtered[activeIdx]); e.preventDefault(); }
    else if (e.key === 'Escape') { setOpen(false); setQuery(value); }
  };

  const isError = showError && !value;
  const borderColor = isError ? 'rgba(239,68,68,0.65)' : open ? C.borderFocus : C.border;
  const bg = isError ? 'rgba(239,68,68,0.05)' : open ? 'rgba(30,138,82,0.06)' : 'rgba(255,255,255,0.05)';

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        {icon && (
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: isError ? 'rgba(239,68,68,0.7)' : open ? C.greenBright : C.textMuted, transition: 'color 0.2s', pointerEvents: 'none', zIndex: 1 }}>
            {icon}
          </span>
        )}
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          disabled={disabled}
          onChange={e => { setQuery(e.target.value); setOpen(true); setActiveIdx(-1); if (!e.target.value) onClear(); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          style={{
            ...inputStyle,
            paddingLeft: icon ? 42 : 16,
            paddingRight: 36,
            border: `1px solid ${borderColor}`,
            background: bg,
            opacity: disabled ? 0.45 : 1,
            cursor: disabled ? 'not-allowed' : 'text',
          }}
        />
        <span style={{
          position: 'absolute', right: 12, top: '50%',
          transform: `translateY(-50%) rotate(${open && !disabled ? '180deg' : '0deg'})`,
          color: C.textMuted, pointerEvents: 'none',
          transition: 'transform 0.2s ease',
        }}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
            <path d="M4 6l4 4 4-4" />
          </svg>
        </span>
      </div>

      {isError && errorMessage && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6, fontSize: 12, color: 'rgba(239,68,68,0.9)', fontWeight: 500 }}>
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width: 11, height: 11, flexShrink: 0 }}>
            <circle cx="7" cy="7" r="6" /><path d="M7 4v3M7 10v.5" />
          </svg>
          {errorMessage}
        </div>
      )}

      {showList && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 200,
          background: '#0c1828',
          border: `1px solid ${C.border}`,
          borderRadius: 10,
          maxHeight: 220,
          overflowY: 'auto',
          boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
        }}>
          {filtered.map((opt, i) => (
            <div key={opt}
              onMouseDown={e => { e.preventDefault(); select(opt); }}
              onMouseEnter={() => setActiveIdx(i)}
              style={{
                padding: '10px 14px',
                fontSize: 14,
                cursor: 'pointer',
                background: i === activeIdx ? 'rgba(30,138,82,0.22)' : 'transparent',
                color: i === activeIdx ? C.greenBright : C.textSecondary,
                transition: 'background 0.1s ease',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
              {i === activeIdx && (
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" style={{ width: 10, height: 10, flexShrink: 0 }}>
                  <path d="M2 6l2.5 2.5L10 3" />
                </svg>
              )}
              <span>{opt}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Google Places Combobox ─── */
interface PlacesPrediction {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText?: string;
}

interface PlacesComboboxProps {
  state: string;
  value: string;
  onSelect: (val: string) => void;
  onClear: () => void;
  placeholder: string;
  disabled?: boolean;
  showError?: boolean;
  errorMessage?: string;
  icon?: React.ReactNode;
  sessionToken: string;
  onSessionRefresh: () => void;
}

function PlacesCombobox({
  state, value, onSelect, onClear, placeholder, disabled,
  showError, errorMessage, icon, sessionToken, onSessionRefresh,
}: PlacesComboboxProps) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [predictions, setPredictions] = useState<PlacesPrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync display when value changes externally (e.g. clear)
  useEffect(() => { if (!open) setQuery(value); }, [value, open]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery(value);
        setPredictions([]);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [value]);

  const fetchPredictions = (input: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (input.length < 2) { setPredictions([]); setLoading(false); return; }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ input, state, sessiontoken: sessionToken });
        const res = await fetch(`/api/places?${params}`);

        if (!res.ok) {
          console.error('[PlacesCombobox] HTTP error:', res.status, res.statusText);
          setPredictions([]);
          return;
        }

        const data = await res.json();
        if (data.error) {
          console.error('[PlacesCombobox] API error:', data.status, data.error);
        }
        setPredictions(data.predictions ?? []);
      } catch (err) {
        console.error('[PlacesCombobox] Fetch failed:', err);
        setPredictions([]);
      } finally {
        setLoading(false);
      }
    }, 200);
  };

  const select = (prediction: PlacesPrediction) => {
    setQuery(prediction.mainText);
    onSelect(prediction.mainText);
    setPredictions([]);
    setOpen(false);
    setActiveIdx(-1);
    onSessionRefresh(); // new session after selection
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setQuery(v);
    setOpen(true);
    setActiveIdx(-1);
    if (!v) { onClear(); setPredictions([]); return; }
    fetchPredictions(v);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || predictions.length === 0) {
      if (e.key === 'ArrowDown') { setOpen(true); e.preventDefault(); }
      return;
    }
    if (e.key === 'ArrowDown') { setActiveIdx(i => Math.min(i + 1, predictions.length - 1)); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { setActiveIdx(i => Math.max(i - 1, 0)); e.preventDefault(); }
    else if (e.key === 'Enter' && activeIdx >= 0) { select(predictions[activeIdx]); e.preventDefault(); }
    else if (e.key === 'Escape') { setOpen(false); setQuery(value); setPredictions([]); }
  };

  const isError = showError && !value;
  const borderColor = isError ? 'rgba(239,68,68,0.65)' : open ? C.borderFocus : C.border;
  const bg = isError ? 'rgba(239,68,68,0.05)' : open ? 'rgba(30,138,82,0.06)' : 'rgba(255,255,255,0.05)';
  const showList = open && !disabled && (loading || predictions.length > 0);

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        {icon && (
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: isError ? 'rgba(239,68,68,0.7)' : open ? C.greenBright : C.textMuted, transition: 'color 0.2s', pointerEvents: 'none', zIndex: 1 }}>
            {icon}
          </span>
        )}
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          disabled={disabled}
          onChange={handleChange}
          onFocus={() => { setOpen(true); if (query.length >= 2) fetchPredictions(query); }}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          style={{
            ...inputStyle,
            paddingLeft: icon ? 42 : 16,
            paddingRight: 36,
            border: `1px solid ${borderColor}`,
            background: bg,
            opacity: disabled ? 0.45 : 1,
            cursor: disabled ? 'not-allowed' : 'text',
          }}
        />
        <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: C.textMuted, pointerEvents: 'none' }}>
          {loading ? (
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width: 13, height: 13, animation: 'spin 0.7s linear infinite' }}>
              <path d="M8 2v3M8 11v3M2 8h3M11 8h3M3.5 3.5l2.1 2.1M10.4 10.4l2.1 2.1M3.5 12.5l2.1-2.1M10.4 5.6l2.1-2.1" />
            </svg>
          ) : (
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}>
              <path d="M4 6l4 4 4-4" />
            </svg>
          )}
        </span>
      </div>

      {isError && errorMessage && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6, fontSize: 12, color: 'rgba(239,68,68,0.9)', fontWeight: 500 }}>
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width: 11, height: 11, flexShrink: 0 }}>
            <circle cx="7" cy="7" r="6" /><path d="M7 4v3M7 10v.5" />
          </svg>
          {errorMessage}
        </div>
      )}

      {showList && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 200,
          background: '#0c1828',
          border: `1px solid ${C.border}`,
          borderRadius: 10,
          maxHeight: 220,
          overflowY: 'auto',
          boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
        }}>
          {loading && predictions.length === 0 ? (
            <div style={{ padding: '12px 14px', fontSize: 13, color: C.textMuted, display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width: 12, height: 12, animation: 'spin 0.7s linear infinite', flexShrink: 0 }}>
                <path d="M8 2v3M8 11v3M2 8h3M11 8h3M3.5 3.5l2.1 2.1M10.4 10.4l2.1 2.1M3.5 12.5l2.1-2.1M10.4 5.6l2.1-2.1" />
              </svg>
              Searching...
            </div>
          ) : predictions.map((p, i) => (
            <div key={p.placeId}
              onMouseDown={e => { e.preventDefault(); select(p); }}
              onMouseEnter={() => setActiveIdx(i)}
              style={{
                padding: '10px 14px',
                fontSize: 14,
                cursor: 'pointer',
                background: i === activeIdx ? 'rgba(30,138,82,0.22)' : 'transparent',
                color: i === activeIdx ? C.greenBright : C.textSecondary,
                transition: 'background 0.1s ease',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
              {i === activeIdx && (
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" style={{ width: 10, height: 10, flexShrink: 0 }}>
                  <path d="M2 6l2.5 2.5L10 3" />
                </svg>
              )}
              <div>
                <div style={{ fontWeight: 600 }}>{p.mainText}</div>
                {p.secondaryText && (
                  <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{p.secondaryText}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Airport Autocomplete Combobox ─── */
interface AirportSuggestion {
  code: string;
  name: string;
  display: string;
}

interface AirportComboboxProps {
  value: string;
  onSelect: (city: string, code: string) => void;
  onClear: () => void;
  placeholder: string;
  optional?: boolean;
  showError?: boolean;
}

function AirportCombobox({ value, onSelect, onClear, placeholder, optional, showError }: AirportComboboxProps) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<AirportSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { if (!open) setQuery(value); }, [value, open]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery(value);
        setSuggestions([]);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [value]);

  const fetchSuggestions = (input: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (input.length < 2) { setSuggestions([]); setLoading(false); return; }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/flights/autocomplete?input=${encodeURIComponent(input)}`);
        const data = await res.json();
        setSuggestions(Array.isArray(data) ? data : []);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 500);
  };

  const select = (s: AirportSuggestion) => {
    setQuery(s.display);
    onSelect(s.name, s.code);
    setSuggestions([]);
    setOpen(false);
    setActiveIdx(-1);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setQuery(v);
    setOpen(true);
    setActiveIdx(-1);
    if (!v) { onClear(); setSuggestions([]); return; }
    fetchSuggestions(v);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || suggestions.length === 0) { if (e.key === 'ArrowDown') { setOpen(true); e.preventDefault(); } return; }
    if (e.key === 'ArrowDown') { setActiveIdx(i => Math.min(i + 1, suggestions.length - 1)); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { setActiveIdx(i => Math.max(i - 1, 0)); e.preventDefault(); }
    else if (e.key === 'Enter' && activeIdx >= 0) { select(suggestions[activeIdx]); e.preventDefault(); }
    else if (e.key === 'Escape') { setOpen(false); setQuery(value); setSuggestions([]); }
  };

  const isError = showError && !optional && !value;
  const borderColor = isError ? 'rgba(239,68,68,0.65)' : open ? C.borderFocus : C.border;
  const bg = isError ? 'rgba(239,68,68,0.05)' : open ? 'rgba(30,138,82,0.06)' : 'rgba(255,255,255,0.05)';
  const showList = open && (loading || suggestions.length > 0);

  const planeIcon = (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
      <path d="M2.5 13.5L6 10l-2.5-5L5 4l6 4 4-2a1.5 1.5 0 0 1 0 3l-4-2-2 6-1.5.5L6 12l-3.5 1.5z" />
    </svg>
  );

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: isError ? 'rgba(239,68,68,0.7)' : open ? C.greenBright : C.textMuted, transition: 'color 0.2s', pointerEvents: 'none', zIndex: 1 }}>
          {planeIcon}
        </span>
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleChange}
          onFocus={() => { setOpen(true); if (query.length >= 2) fetchSuggestions(query); }}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          style={{
            ...inputStyle,
            paddingLeft: 42,
            paddingRight: 36,
            border: `1px solid ${borderColor}`,
            background: bg,
          }}
        />
        <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: C.textMuted, pointerEvents: 'none' }}>
          {loading ? (
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width: 13, height: 13, animation: 'spin 0.7s linear infinite' }}>
              <path d="M8 2v3M8 11v3M2 8h3M11 8h3M3.5 3.5l2.1 2.1M10.4 10.4l2.1 2.1M3.5 12.5l2.1-2.1M10.4 5.6l2.1-2.1" />
            </svg>
          ) : (
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}>
              <path d="M4 6l4 4 4-4" />
            </svg>
          )}
        </span>
      </div>

      {isError && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6, fontSize: 12, color: 'rgba(239,68,68,0.9)', fontWeight: 500 }}>
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width: 11, height: 11, flexShrink: 0 }}>
            <circle cx="7" cy="7" r="6" /><path d="M7 4v3M7 10v.5" />
          </svg>
          Please select your departure airport
        </div>
      )}

      {showList && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 200,
          background: '#0c1828', border: `1px solid ${C.border}`, borderRadius: 10,
          maxHeight: 220, overflowY: 'auto', boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
        }}>
          {loading && suggestions.length === 0 ? (
            <div style={{ padding: '12px 14px', fontSize: 13, color: C.textMuted, display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width: 12, height: 12, animation: 'spin 0.7s linear infinite', flexShrink: 0 }}>
                <path d="M8 2v3M8 11v3M2 8h3M11 8h3M3.5 3.5l2.1 2.1M10.4 10.4l2.1 2.1M3.5 12.5l2.1-2.1M10.4 5.6l2.1-2.1" />
              </svg>
              Searching airports...
            </div>
          ) : suggestions.map((s, i) => (
            <div key={s.code}
              onMouseDown={e => { e.preventDefault(); select(s); }}
              onMouseEnter={() => setActiveIdx(i)}
              style={{
                padding: '10px 14px', fontSize: 14, cursor: 'pointer',
                background: i === activeIdx ? 'rgba(30,138,82,0.22)' : 'transparent',
                color: i === activeIdx ? C.greenBright : C.textSecondary,
                transition: 'background 0.1s ease',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
              <span style={{
                fontWeight: 700, fontSize: 12,
                color: i === activeIdx ? C.greenBright : C.textMuted,
                fontFamily: 'monospace', letterSpacing: '0.05em', flexShrink: 0,
                background: i === activeIdx ? 'rgba(52,212,117,0.1)' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${i === activeIdx ? 'rgba(52,212,117,0.3)' : C.border}`,
                borderRadius: 5, padding: '1px 6px',
              }}>{s.code}</span>
              <span>{s.name || s.display}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Step 2.5: Flight Details ─── */
function StepFlight({ data, onChange, showErrors }: { data: FormData; onChange: (u: Partial<FormData>) => void; showErrors: boolean }) {
  const isFlying = data.transportation === 'Flying';

  const cabinOptions = [
    { label: 'Economy', value: 1 },
    { label: 'Premium Economy', value: 2 },
    { label: 'Business', value: 3 },
    { label: 'First Class', value: 4 },
  ];

  const pillStyle = (selected: boolean): React.CSSProperties => ({
    background: selected ? C.selectedBg : C.surface,
    border: `1px solid ${selected ? C.selectedBorder : C.border}`,
    borderRadius: 100, padding: '9px 18px', cursor: 'pointer',
    fontSize: 13, fontWeight: selected ? 600 : 400,
    color: selected ? C.greenBright : C.textSecondary,
    transition: 'all 0.2s ease',
    boxShadow: selected ? '0 0 12px rgba(52,212,117,0.12)' : 'none',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div>
        <h2 className="et-display" style={{ fontSize: 'clamp(26px,5vw,36px)', fontWeight: 700, color: C.textPrimary, marginBottom: 8, lineHeight: 1.2 }}>
          Flight Details
        </h2>
        <p style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.6 }}>
          {isFlying
            ? "Tell us where you're flying from and your cabin preference."
            : "Optionally add your departure airport and cabin preference."}
        </p>
      </div>

      {/* Section 1: Departure Airport */}
      <div>
        <FieldLabel>
          Where are you flying from?{' '}
          {!isFlying && <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 400 }}>(optional)</span>}
        </FieldLabel>
        <AirportCombobox
          value={data.departureCode ? `${data.departureCity} (${data.departureCode})` : ''}
          onSelect={(city, code) => onChange({ departureCity: city, departureCode: code })}
          onClear={() => onChange({ departureCity: '', departureCode: '' })}
          placeholder="e.g. Los Angeles, New York, Chicago..."
          optional={!isFlying}
          showError={showErrors}
        />
        {!isFlying && (
          <div style={{
            marginTop: 10, padding: '10px 13px',
            background: 'rgba(255,255,255,0.03)',
            border: `1px solid ${C.border}`,
            borderRadius: 8, fontSize: 12, color: C.textMuted, lineHeight: 1.5,
          }}>
            Optional — leave blank if you're still deciding on transportation
          </div>
        )}
      </div>

      {/* Section 2: Cabin Class */}
      <div>
        <FieldLabel>Cabin class preference</FieldLabel>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {cabinOptions.map(opt => (
            <button key={opt.value}
              onClick={() => onChange({ cabinClass: opt.value })}
              style={pillStyle(data.cabinClass === opt.value)}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Step progress ─── */
function ProgressBar({ step, steps }: { step: number; steps: string[] }) {
  return (
    <div className="w-full mb-4">
      {/* Step labels */}
      <div className="flex justify-between mb-2 gap-2">
        {steps.map((label, i) => (
          <div key={i} className="flex-1 text-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={[
                  'w-[30px] h-[30px] rounded-full flex items-center justify-center text-[13px] font-semibold shrink-0 transition-all duration-[350ms] ease-out',
                  i < step
                    ? 'bg-[linear-gradient(140deg,#1e8a52,#0d5530)] border-0 text-[#34d475]'
                    : i === step
                    ? 'bg-[rgba(30,138,82,0.2)] border-[1.5px] border-[rgba(52,212,117,0.6)] text-[#34d475]'
                    : 'bg-[rgba(255,255,255,0.06)] border-[1.5px] border-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.38)]',
                ].join(' ')}
              >
                {i < step ? (
                  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                    <path d="M2 7l3.5 3.5L12 3" />
                  </svg>
                ) : i + 1}
              </div>
              <span
                className={[
                  'step-label hidden text-[11px] font-medium tracking-[0.02em] transition-colors duration-300',
                  i === step
                    ? 'text-[#34d475]'
                    : i < step
                    ? 'text-[rgba(255,255,255,0.62)]'
                    : 'text-[rgba(255,255,255,0.38)]',
                ].join(' ')}
              >{label}</span>
            </div>
          </div>
        ))}
      </div>
      {/* Track */}
      <div className="h-[3px] rounded-sm overflow-hidden bg-[rgba(255,255,255,0.08)]">
        <div
          className="h-full rounded-sm bg-[linear-gradient(90deg,#34d475,#1e8a52)] shadow-[0_0_10px_rgba(52,212,117,0.4)]"
          style={{
            width: steps.length > 1 ? `${(step / (steps.length - 1)) * 100}%` : '0%',
            transition: 'width 0.5s cubic-bezier(0.34,1.56,0.64,1)',
          }}
        />
      </div>
      {/* Current step label */}
      <div className="text-center mt-2 text-[13px] font-medium tracking-[0.02em] text-[rgba(255,255,255,0.38)]">
        Step {step + 1} of {steps.length} — <span className="text-[#34d475]">{steps[step]}</span>
      </div>
    </div>
  );
}

/* ─── Summary sidebar ─── */
function Sidebar({ data, onRestart, step }: { data: FormData; onRestart: () => void; step: number }) {
  const [restartTooltip, setRestartTooltip] = useState(false);
  const days = daysBetween(data.startDate, data.endDate);
  const groupLabels: Record<string, string> = { solo: 'Just Me', couple: 'Couple', small: 'Small Group (3–5)', large: 'Large Group (6+)' };
  const styleEmojis: Record<string, string> = {
    adventure: '⛺', culture: '🏛️', food: '🍽️', relaxation: '🧘', family: '👨‍👩‍👧', nightlife: '🎭',
  };
  const filledDests = data.destinations.filter(d => d.state || d.city);
  const isEmpty = filledDests.length === 0 && !data.startDate && !data.groupSize && data.travelStyles.length === 0;

  return (
    <>
      <div style={{
        background: step <= 2 ? 'rgba(3,8,16,0.80)' : 'rgba(255,255,255,0.03)',
        backdropFilter: step <= 2 ? 'blur(18px)' : 'none',
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        padding: '24px 20px',
        transition: 'background 0.65s ease',
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: C.textMuted, textTransform: 'uppercase', marginBottom: 18 }}>
          Your Trip So Far
        </div>

        {isEmpty ? (
          <div style={{ color: C.textMuted, fontSize: 13, lineHeight: 1.6 }}>
            Fill in the form and your selections will appear here.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filledDests.length > 0 && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>📍</span>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: C.textMuted, textTransform: 'uppercase', marginBottom: 2 }}>
                    {filledDests.length === 1 ? 'Destination' : 'Destinations'}
                  </div>
                  {filledDests.map((d, i) => (
                    <div key={i} style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.5 }}>
                      {filledDests.length > 1 && <span style={{ color: C.textMuted, fontSize: 11 }}>{i + 1}. </span>}
                      {[d.city, d.state].filter(Boolean).join(', ')}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {data.startDate && data.endDate && (
              <SidebarRow icon="📅" label="Dates" value={`${fmtDate(data.startDate)} → ${fmtDate(data.endDate)}${days ? ` (${days}d)` : ''}`} />
            )}
            {data.groupSize && (
              <SidebarRow icon="👥" label="Group" value={groupLabels[data.groupSize] ?? ''} />
            )}
            {(data.groupSize === 'small' || data.groupSize === 'large') && data.groupCount > 0 && (
              <SidebarRow icon="🔢" label="Travelers" value={`${data.groupCount} people`} />
            )}
            {data.budget >= 100 && (
              <SidebarRow icon="💰" label="Total budget" value={data.budget >= 100000 ? 'Unlimited' : `$${data.budget.toLocaleString()}`} />
            )}
            {data.budget >= 100 && data.groupSize && (() => {
              const cnt = data.groupSize === 'solo' ? 1 : data.groupSize === 'couple' ? 2 : data.groupCount > 0 ? data.groupCount : (data.groupSize === 'small' ? 3 : 6);
              const pp = data.budget >= 100000 ? null : Math.round(data.budget / cnt);
              return pp !== null ? <SidebarRow icon="👤" label="Per person" value={`$${pp.toLocaleString()}`} /> : null;
            })()}
            {data.flightBudget > 0 && (
              <SidebarRow icon="✈️" label="Flight budget" value={`$${data.flightBudget.toLocaleString()}/person`} />
            )}
            {data.accommodationBudget > 0 && (
              <SidebarRow icon="🏨" label="Accommodation" value={`$${data.accommodationBudget.toLocaleString()}/night`} />
            )}
            {data.travelStyles.length > 0 && (
              <SidebarRow icon="✨" label="Vibe" value={data.travelStyles.map(s => (styleEmojis[s] ?? '') + ' ' + s).join(', ')} />
            )}
            {data.transportation && (
              <SidebarRow icon="🚗" label="Getting there" value={data.transportation} />
            )}
            {data.accommodation && (
              <SidebarRow icon="🏠" label="Staying" value={data.accommodation} />
            )}
          </div>
        )}
      </div>

      {/* Restart button — separate card below */}
      <div style={{ marginTop: 10, position: 'relative' }}
        onMouseEnter={() => setRestartTooltip(true)}
        onMouseLeave={() => setRestartTooltip(false)}
      >
        {restartTooltip && (
          <div style={{
            position: 'absolute', bottom: 'calc(100% + 8px)', right: 0,
            background: '#0c1828', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 8, padding: '8px 12px', fontSize: 12,
            color: 'rgba(255,255,255,0.85)',
            zIndex: 100, pointerEvents: 'none',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            maxWidth: 220, whiteSpace: 'normal',
          }}>
            ⚠️ This will delete all your entered data and restart from Step 1
          </div>
        )}
        <button
          onClick={onRestart}
          style={{
            width: '100%', background: '#dc2626', border: 'none', borderRadius: 8,
            padding: '8px 14px', fontSize: 12, fontWeight: 600,
            color: 'white', cursor: 'pointer',
            transition: 'background 0.15s ease',
            letterSpacing: '0.01em',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#b91c1c'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#dc2626'; }}
        >
          Restart
        </button>
      </div>
    </>
  );
}

function SidebarRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: C.textMuted, textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.4 }}>{value}</div>
      </div>
    </div>
  );
}

function fmtDate(d: string) {
  if (!d) return '';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/* ─── Input label helper ─── */
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 13, fontWeight: 600, color: C.textSecondary, letterSpacing: '0.01em', marginBottom: 8 }}>
      {children}
    </div>
  );
}

/* ─── Step 1: Destinations + Dates ─── */
function DestinationCard({
  dest, idx, total, onUpdate, onRemove, onDragStart, onDragOver, onDragEnd, isDragging, showErrors,
}: {
  dest: Destination; idx: number; total: number;
  onUpdate: (partial: Partial<Destination>) => void;
  onRemove: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  showErrors: boolean;
}) {
  const [sessionToken, setSessionToken] = useState(() => crypto.randomUUID());
  const refreshSession = () => setSessionToken(crypto.randomUUID());

  const pinIcon = (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
      <path d="M10 2C6.69 2 4 4.69 4 8c0 4.13 5.44 9.67 5.67 9.9.18.19.49.19.66 0C10.56 17.67 16 12.13 16 8c0-3.31-2.69-6-6-6z" />
      <circle cx="10" cy="8" r="2" />
    </svg>
  );
  const badgeColors = ['#1e8a52', '#0d5530', '#155e3b', '#0a4a2e', '#177044'];
  const badgeColor = badgeColors[idx % badgeColors.length];

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      style={{
        background: isDragging ? 'rgba(30,138,82,0.08)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${isDragging ? C.selectedBorder : C.border}`,
        borderRadius: 14,
        padding: '18px 18px 20px',
        transition: 'border-color 0.2s ease, background 0.2s ease, opacity 0.2s ease',
        opacity: isDragging ? 0.6 : 1,
        cursor: 'grab',
        position: 'relative',
      }}
    >
      {/* Header row: drag handle + badge + remove */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        {/* Drag handle */}
        {total > 1 && (
          <div style={{ color: C.textMuted, flexShrink: 0, cursor: 'grab', paddingTop: 1 }} title="Drag to reorder">
            <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 14, height: 14 }}>
              <circle cx="5" cy="4" r="1.4" /><circle cx="11" cy="4" r="1.4" />
              <circle cx="5" cy="8" r="1.4" /><circle cx="11" cy="8" r="1.4" />
              <circle cx="5" cy="12" r="1.4" /><circle cx="11" cy="12" r="1.4" />
            </svg>
          </div>
        )}

        {/* Number badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: `${badgeColor}22`,
          border: `1px solid ${badgeColor}55`,
          borderRadius: 100, padding: '4px 12px 4px 8px',
          fontSize: 12, fontWeight: 700, color: C.greenBright, flexShrink: 0,
          letterSpacing: '0.02em',
        }}>
          <div style={{
            width: 18, height: 18, borderRadius: '50%', background: `linear-gradient(140deg, ${badgeColor}, ${badgeColor}cc)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 800, color: 'white', flexShrink: 0,
          }}>
            {idx + 1}
          </div>
          Stop {idx + 1}
        </div>

        {/* Remove button */}
        {total > 1 && (
          <button
            onClick={onRemove}
            title="Remove this destination"
            style={{
              marginLeft: 'auto', background: 'transparent',
              border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8,
              padding: '4px 8px', cursor: 'pointer', color: 'rgba(239,68,68,0.65)',
              fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4,
              transition: 'all 0.15s ease',
              flexShrink: 0,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.1)'; (e.currentTarget as HTMLButtonElement).style.color = 'rgba(239,68,68,0.9)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'rgba(239,68,68,0.65)'; }}
          >
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" style={{ width: 11, height: 11 }}>
              <path d="M2 2l10 10M12 2L2 12" />
            </svg>
            Remove
          </button>
        )}
      </div>

      {/* State + City fields */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <FieldLabel>State</FieldLabel>
          <Combobox
            options={US_STATES}
            value={dest.state}
            onSelect={val => { onUpdate({ state: val, city: '' }); refreshSession(); }}
            onClear={() => { onUpdate({ state: '', city: '' }); refreshSession(); }}
            placeholder="Select state..."
            showError={showErrors}
            errorMessage="Required"
            icon={pinIcon}
            showWhenEmpty={true}
          />
        </div>
        <div>
          <FieldLabel>{dest.state ? `City in ${dest.state}` : 'City / Area'}</FieldLabel>
          <PlacesCombobox
            state={dest.state}
            value={dest.city}
            onSelect={val => onUpdate({ city: val })}
            onClear={() => onUpdate({ city: '' })}
            placeholder={dest.state ? `Search ${dest.state}...` : 'Select state first'}
            disabled={!dest.state}
            showError={showErrors}
            errorMessage="Required"
            icon={pinIcon}
            sessionToken={sessionToken}
            onSessionRefresh={refreshSession}
          />
        </div>
      </div>
    </div>
  );
}

function Step1({ data, onChange, showErrors }: { data: FormData; onChange: (u: Partial<FormData>) => void; showErrors: boolean }) {
  const today = new Date().toISOString().split('T')[0];
  const [s1Focus, setS1Focus] = useState(false);
  const [s2Focus, setS2Focus] = useState(false);
  const [dragSrcIdx, setDragSrcIdx] = useState<number | null>(null);

  const dur = tripDuration(data.startDate, data.endDate);
  const startInPast = !!data.startDate && data.startDate < today;
  const endBeforeStart = !!data.endDate && !!data.startDate && data.endDate < data.startDate;

  const updateDest = (idx: number, partial: Partial<Destination>) => {
    const newDests = data.destinations.map((d, i) => i === idx ? { ...d, ...partial } : d);
    onChange({ destinations: newDests });
  };

  const addDest = () => {
    if (data.destinations.length >= 5) return;
    onChange({ destinations: [...data.destinations, { state: '', city: '' }] });
  };

  const removeDest = (idx: number) => {
    onChange({ destinations: data.destinations.filter((_, i) => i !== idx) });
  };

  const handleDragOver = (e: React.DragEvent, toIdx: number) => {
    e.preventDefault();
    if (dragSrcIdx === null || dragSrcIdx === toIdx) return;
    const newDests = [...data.destinations];
    const [removed] = newDests.splice(dragSrcIdx, 1);
    newDests.splice(toIdx, 0, removed);
    onChange({ destinations: newDests });
    setDragSrcIdx(toIdx);
  };

  const routeStops = data.destinations.filter(d => d.city && d.state).map(d => d.city);
  const routePreview = routeStops.length >= 2 ? routeStops.join(' → ') : '';

  const startBorder = (showErrors && !data.startDate) || startInPast
    ? 'rgba(239,68,68,0.65)' : s1Focus ? C.borderFocus : C.border;
  const endBorder = (showErrors && !data.endDate) || endBeforeStart
    ? 'rgba(239,68,68,0.65)' : s2Focus ? C.borderFocus : C.border;
  const startBg = startInPast ? 'rgba(239,68,68,0.05)' : s1Focus ? 'rgba(30,138,82,0.06)' : 'rgba(255,255,255,0.05)';
  const endBg = endBeforeStart ? 'rgba(239,68,68,0.05)' : s2Focus ? 'rgba(30,138,82,0.06)' : 'rgba(255,255,255,0.05)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div>
        <h2 className="et-display" style={{ fontSize: 'clamp(26px,5vw,36px)', fontWeight: 700, color: C.textPrimary, marginBottom: 8, lineHeight: 1.2 }}>
          Where are you headed?
        </h2>
        <p style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.6 }}>
          Add one or more US destinations and when you want to go.
        </p>
      </div>

      {/* Destination cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {data.destinations.map((dest, idx) => (
          <DestinationCard
            key={idx}
            dest={dest}
            idx={idx}
            total={data.destinations.length}
            onUpdate={partial => updateDest(idx, partial)}
            onRemove={() => removeDest(idx)}
            onDragStart={() => setDragSrcIdx(idx)}
            onDragOver={e => handleDragOver(e, idx)}
            onDragEnd={() => setDragSrcIdx(null)}
            isDragging={dragSrcIdx === idx}
            showErrors={showErrors}
          />
        ))}
      </div>

      {/* Add / max message */}
      {data.destinations.length < 5 ? (
        <button
          onClick={addDest}
          style={{
            background: 'transparent',
            border: `1.5px dashed ${C.border}`,
            borderRadius: 12, padding: '12px 20px',
            fontSize: 14, fontWeight: 600, color: C.textMuted,
            cursor: 'pointer', width: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = C.greenBright;
            (e.currentTarget as HTMLButtonElement).style.color = C.greenBright;
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(52,212,117,0.04)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = C.border;
            (e.currentTarget as HTMLButtonElement).style.color = C.textMuted;
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          }}
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" style={{ width: 14, height: 14 }}>
            <path d="M8 2v12M2 8h12" />
          </svg>
          Add Another Destination
        </button>
      ) : (
        <div style={{
          textAlign: 'center', fontSize: 13, color: C.textMuted,
          padding: '10px 16px',
          background: 'rgba(255,255,255,0.03)',
          border: `1px solid ${C.border}`,
          borderRadius: 10,
        }}>
          Maximum 5 destinations reached
        </div>
      )}

      {/* Route preview */}
      {routePreview && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'rgba(30,138,82,0.08)',
          border: '1px solid rgba(52,212,117,0.2)',
          borderRadius: 10, padding: '10px 16px',
          animation: 'fadeUp 0.3s ease-out both',
        }}>
          <svg viewBox="0 0 20 20" fill="none" stroke={C.greenBright} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15, flexShrink: 0 }}>
            <path d="M3 10h14M10 3l7 7-7 7" />
          </svg>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.greenBright, letterSpacing: '0.01em' }}>
            {routePreview}
          </span>
        </div>
      )}

      {/* Dates */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <FieldLabel>When do you leave?</FieldLabel>
          <input
            type="date"
            value={data.startDate}
            min={today}
            onChange={e => onChange({ startDate: e.target.value })}
            onFocus={() => setS1Focus(true)}
            onBlur={() => setS1Focus(false)}
            style={{ ...inputStyle, border: `1px solid ${startBorder}`, background: startBg, colorScheme: 'dark' }}
          />
          {startInPast && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6, fontSize: 12, color: 'rgba(239,68,68,0.9)', fontWeight: 500 }}>
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width: 11, height: 11, flexShrink: 0 }}><circle cx="7" cy="7" r="6" /><path d="M7 4v3M7 10v.5" /></svg>
              Please select a future date — your trip can't start in the past!
            </div>
          )}
          {showErrors && !data.startDate && !startInPast && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6, fontSize: 12, color: 'rgba(239,68,68,0.9)', fontWeight: 500 }}>
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width: 11, height: 11, flexShrink: 0 }}><circle cx="7" cy="7" r="6" /><path d="M7 4v3M7 10v.5" /></svg>
              Please select a departure date
            </div>
          )}
        </div>

        <div>
          <FieldLabel>When do you return?</FieldLabel>
          <input
            type="date"
            value={data.endDate}
            min={data.startDate || today}
            onChange={e => onChange({ endDate: e.target.value })}
            onFocus={() => setS2Focus(true)}
            onBlur={() => setS2Focus(false)}
            style={{ ...inputStyle, border: `1px solid ${endBorder}`, background: endBg, colorScheme: 'dark' }}
          />
          {endBeforeStart && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6, fontSize: 12, color: 'rgba(239,68,68,0.9)', fontWeight: 500 }}>
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width: 11, height: 11, flexShrink: 0 }}><circle cx="7" cy="7" r="6" /><path d="M7 4v3M7 10v.5" /></svg>
              Your return date must be after your departure date
            </div>
          )}
          {showErrors && !data.endDate && !endBeforeStart && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6, fontSize: 12, color: 'rgba(239,68,68,0.9)', fontWeight: 500 }}>
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width: 11, height: 11, flexShrink: 0 }}><circle cx="7" cy="7" r="6" /><path d="M7 4v3M7 10v.5" /></svg>
              Please select a return date
            </div>
          )}
        </div>
      </div>

      {/* Duration message */}
      {dur !== null && !startInPast && !endBeforeStart && (
        dur.nights === 0 ? (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(52,212,117,0.1)', border: '1px solid rgba(52,212,117,0.25)',
            borderRadius: 100, padding: '7px 16px', fontSize: 13, fontWeight: 600,
            color: C.greenBright, alignSelf: 'flex-start', animation: 'fadeUp 0.3s ease-out both',
          }}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" style={{ width: 14, height: 14 }}><rect x="2" y="3" width="12" height="11" rx="2" /><path d="M5 1v4M11 1v4M2 7h12" /></svg>
            Your trip is 1 day and 0 nights long
          </div>
        ) : (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(52,212,117,0.1)', border: '1px solid rgba(52,212,117,0.25)',
            borderRadius: 100, padding: '7px 16px', fontSize: 13, fontWeight: 600,
            color: C.greenBright, alignSelf: 'flex-start', animation: 'fadeUp 0.3s ease-out both',
          }}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" style={{ width: 14, height: 14 }}><rect x="2" y="3" width="12" height="11" rx="2" /><path d="M5 1v4M11 1v4M2 7h12" /></svg>
            Your trip is {dur.days} day{dur.days !== 1 ? 's' : ''} and {dur.nights} night{dur.nights !== 1 ? 's' : ''} long
          </div>
        )
      )}
    </div>
  );
}

/* ─── Step 3 (rendered at step index 2): Budget + Group ─── */
function Step2({ data, onChange, showErrors }: { data: FormData; onChange: (u: Partial<FormData>) => void; showErrors: boolean }) {
  const groups: { key: FormData['groupSize']; icon: string; label: string; sub: string; defaultCount: number }[] = [
    { key: 'solo', icon: '🧍', label: 'Just Me', sub: 'Solo adventure', defaultCount: 1 },
    { key: 'couple', icon: '👫', label: 'Couple', sub: '2 travelers', defaultCount: 2 },
    { key: 'small', icon: '👨‍👩‍👧', label: 'Small Group', sub: '3–5 people', defaultCount: 3 },
    { key: 'large', icon: '🎉', label: 'Large Group', sub: '6+ people', defaultCount: 6 },
  ];

  const [budgetInput, setBudgetInput] = useState<string>(
    data.budget >= 100000 ? 'Unlimited' : data.budget > 0 ? data.budget.toLocaleString() : ''
  );
  const [flightInput, setFlightInput] = useState<string>(data.flightBudget > 0 ? data.flightBudget.toLocaleString() : '');
  const [accomInput, setAccomInput] = useState<string>(data.accommodationBudget > 0 ? data.accommodationBudget.toLocaleString() : '');
  const [showMinWarning, setShowMinWarning] = useState(false);

  const SLIDER_MIN = 100;
  const SLIDER_MAX = 10000;

  const isFlying = data.transportation === 'Flying' || data.transportation === 'Either / Flexible';
  const flightRequired = data.transportation === 'Flying';
  const isCamping = data.accommodation === 'Camping';
  const needsGroupCount = data.groupSize === 'small' || data.groupSize === 'large';

  const headCount =
    data.groupSize === 'solo' ? 1
    : data.groupSize === 'couple' ? 2
    : data.groupCount > 0 ? data.groupCount
    : data.groupSize === 'small' ? 3
    : data.groupSize === 'large' ? 6
    : 1;

  const perPerson = data.budget >= 100 && data.budget < 100000 && headCount > 0
    ? Math.round(data.budget / headCount)
    : null;

  // ── Budget validation calculations ──
  const duration = tripDuration(data.startDate, data.endDate);
  const numberOfNights = duration ? duration.nights : 0;

  const flightAtZero = perPerson !== null && data.flightBudget > 0 && data.flightBudget === perPerson;
  const flightOverBudget = perPerson !== null && data.flightBudget > 0 && data.flightBudget > perPerson;
  const flightValid =
    !isFlying
    || (!flightRequired && data.flightBudget === 0)
    || (data.flightBudget > 0 && !flightOverBudget);

  const remainingAfterFlight: number | null = (() => {
    if (perPerson === null) return null;
    if (!isFlying || data.flightBudget === 0) return perPerson;
    return perPerson - data.flightBudget;
  })();

  const isPerPersonAccom = ['Hotel', 'Hostel', 'Flexible'].includes(data.accommodation);
  let accommodationPerPersonTotal = 0;
  let totalAccommodationCost = 0;
  if (!isCamping && data.accommodationBudget > 0 && numberOfNights > 0) {
    if (isPerPersonAccom) {
      // Hotel/Hostel/Flexible: budget is per person per night
      accommodationPerPersonTotal = data.accommodationBudget * numberOfNights;
      totalAccommodationCost = data.accommodationBudget * numberOfNights * headCount;
    } else {
      // Airbnb/VRBO: budget is total per night (shared)
      totalAccommodationCost = data.accommodationBudget * numberOfNights;
      accommodationPerPersonTotal = totalAccommodationCost / headCount;
    }
  }

  const remainingAfterAccom = remainingAfterFlight !== null && accommodationPerPersonTotal > 0
    ? Math.round(remainingAfterFlight - accommodationPerPersonTotal)
    : null;
  const accomAtZero = remainingAfterAccom === 0;
  const accomOverBudget = remainingAfterAccom !== null && remainingAfterAccom < 0;
  const accomExceedsBudget = accomOverBudget;
  const accomLocked = flightRequired && data.flightBudget === 0;
  const accomValid = isCamping || (!accomLocked && data.accommodationBudget > 0 && !accomExceedsBudget);

  const totalFlightCost = isFlying && flightValid && data.flightBudget > 0 ? data.flightBudget * headCount : 0;
  const hasFlightBudget = !isFlying || (data.flightBudget > 0 && flightValid);
  const hasAccomBudget = isCamping || (data.accommodationBudget > 0 && accomValid);
  const showSummary = perPerson !== null && data.budget >= 100 && hasFlightBudget && hasAccomBudget;
  const remainingPerPerson = isCamping
    ? (remainingAfterFlight ?? perPerson ?? 0)
    : (remainingAfterAccom ?? 0);

  const accomTypeName = data.accommodation || 'accommodation';

  const accomInfo = () => {
    if (data.accommodation === 'Hotel') return { label: 'Hotel budget per person per night', placeholder: '150' };
    if (data.accommodation === 'Airbnb / VRBO') return { label: 'Airbnb/VRBO budget per night (total, shared)', placeholder: '200' };
    if (data.accommodation === 'Hostel') return { label: 'Hostel budget per person per night', placeholder: '50' };
    return { label: 'Accommodation budget per person per night', placeholder: '100' };
  };

  const displayBudget = data.budget >= 100000 ? 'Unlimited' : data.budget >= 100 ? `$${data.budget.toLocaleString()}` : '—';

  const handleBudgetInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    if (raw === '') { setBudgetInput(''); setShowMinWarning(false); return; }
    const num = parseInt(raw, 10);
    if (num > 99999) { setBudgetInput('Unlimited'); setShowMinWarning(false); onChange({ budget: 100000 }); return; }
    setBudgetInput(num.toLocaleString());
    if (num < 100) { setShowMinWarning(true); } else { setShowMinWarning(false); onChange({ budget: num }); }
  };

  const makeSubHandler = (
    setter: React.Dispatch<React.SetStateAction<string>>,
    field: 'flightBudget' | 'accommodationBudget'
  ) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setter(raw === '' ? '' : parseInt(raw, 10).toLocaleString());
    onChange({ [field]: raw === '' ? 0 : parseInt(raw, 10) } as Partial<FormData>);
  };

  const sliderValue = data.budget <= 0 ? SLIDER_MIN : Math.min(data.budget >= 100000 ? SLIDER_MAX : data.budget, SLIDER_MAX);

  const handleSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = Number(e.target.value);
    onChange({ budget: num });
    setBudgetInput(num.toLocaleString());
    setShowMinWarning(false);
  };

  const errIcon = (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width: 11, height: 11, flexShrink: 0 }}>
      <circle cx="7" cy="7" r="6" /><path d="M7 4v3M7 10v.5" />
    </svg>
  );

  const ErrMsg = ({ msg }: { msg: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6, fontSize: 12, color: 'rgba(248,113,113,0.9)', fontWeight: 500 }}>
      {errIcon}{msg}
    </div>
  );

  const subInputStyle = (hasError: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center',
    background: C.surface,
    border: `1px solid ${hasError ? 'rgba(248,113,113,0.65)' : C.border}`,
    borderRadius: 10, overflow: 'hidden',
    transition: 'border-color 0.2s ease',
  });

  const groupCountMin = data.groupSize === 'small' ? 3 : 6;
  const groupCountMax = data.groupSize === 'small' ? 5 : 30;
  const currentCount = data.groupCount > 0 ? data.groupCount : groupCountMin;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div>
        <h2 className="et-display" style={{ fontSize: 'clamp(26px,5vw,36px)', fontWeight: 700, color: C.textPrimary, marginBottom: 8, lineHeight: 1.2 }}>
          Budget & group size
        </h2>
        <p style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.6 }}>
          Tell us who's coming and how much you want to spend.
        </p>
      </div>

      {/* ── Section 1: Who's coming ── */}
      <div>
        <FieldLabel>Who's coming?</FieldLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
          {groups.map(g => (
            <button key={g.key!}
              onClick={() => {
                const cnt = g.key === 'solo' ? 1 : g.key === 'couple' ? 2 : (data.groupCount > 0 ? data.groupCount : g.defaultCount);
                onChange({ groupSize: g.key!, groupCount: cnt });
              }}
              style={{
                background: data.groupSize === g.key ? C.selectedBg : C.surface,
                border: `1px solid ${showErrors && !data.groupSize ? 'rgba(248,113,113,0.65)' : data.groupSize === g.key ? C.selectedBorder : C.border}`,
                borderRadius: 12, padding: '16px', cursor: 'pointer',
                color: C.textPrimary, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12,
                transition: 'all 0.2s ease',
                boxShadow: data.groupSize === g.key ? '0 0 18px rgba(52,212,117,0.12)' : 'none',
              }}>
              <span style={{ fontSize: 24 }}>{g.icon}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{g.label}</div>
                <div style={{ fontSize: 12, color: data.groupSize === g.key ? C.greenBright : C.textMuted }}>{g.sub}</div>
              </div>
            </button>
          ))}
        </div>
        {showErrors && !data.groupSize && <ErrMsg msg="Please select your group size" />}

        {/* Group count stepper */}
        {needsGroupCount && (
          <div style={{ marginTop: 16, animation: 'fadeUp 0.25s ease' }}>
            <FieldLabel>
              How many people?{' '}
              <span style={{ fontWeight: 400, color: C.textMuted }}>({data.groupSize === 'small' ? '3–5' : '6–30'})</span>
            </FieldLabel>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, maxWidth: 220 }}>
              <button
                onClick={() => onChange({ groupCount: Math.max(groupCountMin, currentCount - 1) })}
                style={{
                  width: 42, height: 42, borderRadius: 10, border: `1px solid ${C.border}`,
                  background: C.surface, color: C.textPrimary, fontSize: 22, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  transition: 'background 0.15s ease',
                }}>−</button>
              <div style={{
                flex: 1, textAlign: 'center', fontSize: 24, fontWeight: 700, color: C.greenBright,
                border: `1px solid ${showErrors && needsGroupCount && data.groupCount < groupCountMin ? 'rgba(248,113,113,0.65)' : C.border}`,
                borderRadius: 10, padding: '8px 0',
                background: C.surface,
              }}>
                {currentCount}
              </div>
              <button
                onClick={() => onChange({ groupCount: Math.min(groupCountMax, currentCount + 1) })}
                style={{
                  width: 42, height: 42, borderRadius: 10, border: `1px solid ${C.border}`,
                  background: C.surface, color: C.textPrimary, fontSize: 22, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  transition: 'background 0.15s ease',
                }}>+</button>
            </div>
          </div>
        )}
      </div>

      {/* ── Section 2: Total budget ── */}
      <div>
        <FieldLabel>What's your budget in total (everyone together)?</FieldLabel>
        <div style={{ fontSize: 26, fontWeight: 800, color: C.textPrimary, letterSpacing: '-0.03em', marginBottom: perPerson ? 4 : 16, lineHeight: 1 }}>
          <span style={{ color: C.greenBright }}>{displayBudget}</span>
        </div>
        {perPerson !== null && (
          <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 16 }}>
            That's{' '}
            <span style={{ color: C.greenBright, fontWeight: 600 }}>${perPerson.toLocaleString()}</span>
            {' '}per person
          </div>
        )}
        <div style={{
          display: 'flex', alignItems: 'center',
          background: C.surface,
          border: `1px solid ${showMinWarning || (showErrors && data.budget < 100) ? '#f87171' : C.border}`,
          borderRadius: 12, overflow: 'hidden',
          marginBottom: 6,
          transition: 'border-color 0.2s ease',
        }}>
          <span style={{ padding: '16px 14px 16px 18px', fontSize: 22, fontWeight: 700, color: C.greenBright, borderRight: `1px solid ${C.border}`, lineHeight: 1, userSelect: 'none' }}>$</span>
          <input
            type="text" inputMode="numeric"
            value={budgetInput}
            onChange={handleBudgetInput}
            placeholder="Enter your budget"
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', padding: '16px 18px', fontSize: 22, fontWeight: 600, color: C.textPrimary, letterSpacing: '-0.01em' }}
          />
        </div>
        {(showMinWarning || (showErrors && data.budget < 100)) && (
          <div style={{ fontSize: 12, color: '#f87171', marginBottom: 4, paddingLeft: 4 }}>Minimum budget is $100</div>
        )}
        <div style={{ marginTop: 20 }}>
          <FieldLabel>Or use the slider</FieldLabel>
          <div style={{ position: 'relative', height: 6, background: C.border, borderRadius: 3 }}>
            <div style={{
              position: 'absolute', left: 0, top: 0, height: '100%', borderRadius: 3,
              width: `${((sliderValue - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN)) * 100}%`,
              background: 'linear-gradient(90deg,#34d475,#1e8a52)',
              boxShadow: '0 0 8px rgba(52,212,117,0.35)',
            }} />
          </div>
          <input type="range" min={SLIDER_MIN} max={SLIDER_MAX} step={100} value={sliderValue}
            onChange={handleSlider}
            style={{ width: '100%', margin: '8px 0 0', appearance: 'none', background: 'transparent', cursor: 'pointer', accentColor: C.greenBright }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.textMuted, marginTop: 2 }}>
            <span>$100</span><span>$10,000 (type for more)</span>
          </div>
        </div>
      </div>

      {/* ── Section 3: Budget breakdown ── */}
      <div style={{ animation: 'fadeUp 0.3s ease' }}>
        <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', color: C.textMuted, textTransform: 'uppercase', marginBottom: 16, paddingBottom: 10, borderBottom: `1px solid ${C.border}` }}>
          Budget Breakdown
        </div>

        {/* Per person budget banner */}
        {perPerson !== null && (
          <div style={{
            background: 'rgba(52,212,117,0.06)',
            border: '1px solid rgba(52,212,117,0.18)',
            borderRadius: 10,
            padding: '12px 16px',
            marginBottom: 18,
            fontSize: 14,
            color: C.textSecondary,
          }}>
            Your budget per person:{' '}
            <span style={{ color: C.greenBright, fontWeight: 700 }}>
              ${perPerson.toLocaleString()}
            </span>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Flight budget */}
          {isFlying && (
            <div>
              <FieldLabel>
                Flight budget per person (round trip){' '}
                {flightRequired && <span style={{ color: '#f87171' }}>*</span>}
                {!flightRequired && <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 400 }}>(optional)</span>}
              </FieldLabel>
              <div style={subInputStyle(showErrors && flightRequired && !data.flightBudget)}>
                <span style={{ padding: '13px 12px 13px 16px', fontSize: 17, fontWeight: 700, color: C.greenBright, borderRight: `1px solid ${C.border}`, lineHeight: 1, userSelect: 'none' }}>$</span>
                <input type="text" inputMode="numeric" value={flightInput}
                  onChange={makeSubHandler(setFlightInput, 'flightBudget')}
                  placeholder="e.g. 300"
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', padding: '13px 16px', fontSize: 15, fontWeight: 500, color: C.textPrimary }} />
              </div>
              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 5, paddingLeft: 2 }}>Round trip per person</div>

              {/* Flight validation feedback */}
              {data.flightBudget > 0 && perPerson !== null && (
                flightOverBudget ? (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginTop: 8, padding: '10px 13px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 8, fontSize: 13, color: 'rgba(248,113,113,0.9)', lineHeight: 1.5 }}>
                    {errIcon}
                    <span>
                      ${data.flightBudget.toLocaleString()}/person flight cost exceeds your per-person budget of <strong>${perPerson.toLocaleString()}</strong> by <strong>${(data.flightBudget - perPerson).toLocaleString()}</strong>. Please enter a lower amount.
                    </span>
                  </div>
                ) : flightAtZero ? (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginTop: 8, padding: '10px 13px', background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.35)', borderRadius: 8, fontSize: 13, color: 'rgba(234,179,8,0.95)', lineHeight: 1.5 }}>
                    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13, flexShrink: 0, marginTop: 1 }}>
                      <path d="M7 2v5M7 10v.5" /><circle cx="7" cy="7" r="6" />
                    </svg>
                    <span>
                      You'll have <strong>$0 left</strong> after flights — consider upping your budget or reconsidering your choices.
                    </span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 8, padding: '10px 13px', background: 'rgba(52,212,117,0.07)', border: '1px solid rgba(52,212,117,0.22)', borderRadius: 8, fontSize: 13, color: C.greenBright, lineHeight: 1.5 }}>
                    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 12, height: 12, flexShrink: 0 }}>
                      <path d="M2 7l3.5 3.5L12 3" />
                    </svg>
                    Remaining after flights:{' '}
                    <strong style={{ marginLeft: 3 }}>${remainingAfterFlight?.toLocaleString()}/person</strong>
                  </div>
                )
              )}
              {showErrors && flightRequired && !data.flightBudget && <ErrMsg msg="Flight budget is required" />}
            </div>
          )}

          {/* Accommodation budget */}
          {!isCamping ? (
            <div style={{
              opacity: accomLocked ? 0.42 : 1,
              pointerEvents: accomLocked ? 'none' : 'auto',
              transition: 'opacity 0.3s ease, filter 0.3s ease',
              filter: accomLocked ? 'saturate(0.25)' : 'none',
            }}>
              <FieldLabel>{accomInfo().label} <span style={{ color: '#f87171' }}>*</span></FieldLabel>
              <div style={subInputStyle(showErrors && !data.accommodationBudget && !accomLocked)}>
                <span style={{ padding: '13px 12px 13px 16px', fontSize: 17, fontWeight: 700, color: C.greenBright, borderRight: `1px solid ${C.border}`, lineHeight: 1, userSelect: 'none' }}>$</span>
                <input type="text" inputMode="numeric" value={accomInput}
                  onChange={makeSubHandler(setAccomInput, 'accommodationBudget')}
                  placeholder={`e.g. ${accomInfo().placeholder}`}
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', padding: '13px 16px', fontSize: 15, fontWeight: 500, color: C.textPrimary }} />
              </div>

              {/* Accommodation validation feedback */}
              {!accomLocked && data.accommodationBudget > 0 && remainingAfterFlight !== null && (
                accomOverBudget ? (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginTop: 8, padding: '10px 13px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 8, fontSize: 13, color: 'rgba(248,113,113,0.9)', lineHeight: 1.5 }}>
                    {errIcon}
                    <span>
                      Accommodation cost exceeds your remaining budget of <strong>${Math.round(remainingAfterFlight ?? 0).toLocaleString()}/person</strong>
                      {' '}(${Math.round(accommodationPerPersonTotal).toLocaleString()}/person for {numberOfNights} night{numberOfNights !== 1 ? 's' : ''})
                    </span>
                  </div>
                ) : accomAtZero ? (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginTop: 8, padding: '10px 13px', background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.35)', borderRadius: 8, fontSize: 13, color: 'rgba(234,179,8,0.95)', lineHeight: 1.5 }}>
                    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13, flexShrink: 0, marginTop: 1 }}>
                      <path d="M7 2v5M7 10v.5" /><circle cx="7" cy="7" r="6" />
                    </svg>
                    <span>
                      Total accommodation: <strong>${Math.round(totalAccommodationCost).toLocaleString()}</strong> (${Math.round(accommodationPerPersonTotal).toLocaleString()}/person for {numberOfNights} night{numberOfNights !== 1 ? 's' : ''}). You'll have <strong>$0 left</strong> — consider upping your budget or reconsidering your choices.
                    </span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 8, padding: '10px 13px', background: 'rgba(52,212,117,0.07)', border: '1px solid rgba(52,212,117,0.22)', borderRadius: 8, fontSize: 13, color: C.greenBright, lineHeight: 1.5 }}>
                    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 12, height: 12, flexShrink: 0 }}>
                      <path d="M2 7l3.5 3.5L12 3" />
                    </svg>
                    <span>
                      ${Math.round(accommodationPerPersonTotal).toLocaleString()}/person for {numberOfNights} night{numberOfNights !== 1 ? 's' : ''}
                      {' · '}Remaining after flights &amp; accommodation:{' '}
                      <strong>${(remainingAfterAccom ?? 0).toLocaleString()}/person</strong>
                    </span>
                  </div>
                )
              )}
              {showErrors && !data.accommodationBudget && !accomLocked && <ErrMsg msg="Accommodation budget is required" />}
            </div>
          ) : (
            <div style={{
              background: 'rgba(52,212,117,0.06)', border: '1px solid rgba(52,212,117,0.14)',
              borderRadius: 10, padding: '12px 16px', fontSize: 13, color: C.textMuted, lineHeight: 1.5,
            }}>
              🏕️ <span style={{ color: C.textSecondary }}>Camping fees are usually $20–50/night</span> — we'll factor that in automatically
            </div>
          )}

          {/* Trip budget summary card */}
          {showSummary && (
            <div style={{
              background: 'rgba(255,255,255,0.035)',
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: '18px 20px',
              marginTop: 4,
              animation: 'fadeUp 0.3s ease',
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: C.textMuted, textTransform: 'uppercase', marginBottom: 14 }}>
                Budget Summary
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: C.textSecondary }}>
                  <span>Total budget</span>
                  <span style={{ color: C.textPrimary, fontWeight: 600 }}>${data.budget.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: C.textSecondary }}>
                  <span>Per person</span>
                  <span style={{ color: C.textPrimary, fontWeight: 600 }}>${perPerson!.toLocaleString()}</span>
                </div>
                <div style={{ height: 1, background: C.border, margin: '3px 0' }} />
                {isFlying && data.flightBudget > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: C.textSecondary }}>
                    <span>Flights (round trip)</span>
                    <span>−${data.flightBudget.toLocaleString()}</span>
                  </div>
                )}
                {!isCamping && data.accommodationBudget > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: C.textSecondary }}>
                    <span>{accomTypeName}</span>
                    <span>−${Math.round(accommodationPerPersonTotal).toLocaleString()}</span>
                  </div>
                )}
                {isCamping && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: C.textSecondary }}>
                    <span>Camping (auto-estimated)</span>
                    <span style={{ color: C.textMuted }}>~$20–50/night</span>
                  </div>
                )}
                <div style={{ height: 1, background: C.border, margin: '3px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                  <span style={{ color: C.textSecondary }}>Remaining per person</span>
                  <span style={{
                    color: remainingPerPerson > perPerson! * 0.2
                      ? C.greenBright
                      : remainingPerPerson > perPerson! * 0.1
                        ? '#fbbf24'
                        : '#f87171',
                  }}>
                    ${Math.round(remainingPerPerson).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

/* ─── Step 3: Vibe + Transport + Accommodation ─── */
function Step3({ data, onChange }: { data: FormData; onChange: (u: Partial<FormData>) => void }) {
  const vibes: { key: string; icon: string; label: string }[] = [
    { key: 'adventure', icon: '⛺', label: 'Adventure & Outdoors' },
    { key: 'culture', icon: '🏛️', label: 'City & Culture' },
    { key: 'food', icon: '🍽️', label: 'Food & Dining' },
    { key: 'relaxation', icon: '🧘', label: 'Relaxation & Wellness' },
    { key: 'family', icon: '👨‍👩‍👧', label: 'Family Friendly' },
    { key: 'nightlife', icon: '🎭', label: 'Nightlife & Entertainment' },
  ];
  const transports = ['Flying', 'Driving', 'Either / Flexible'];
  const accommodations = ['Hotel', 'Airbnb / VRBO', 'Hostel', 'Camping', 'Flexible'];

  const toggleStyle = (key: string) => {
    const styles = data.travelStyles.includes(key)
      ? data.travelStyles.filter(s => s !== key)
      : [...data.travelStyles, key];
    onChange({ travelStyles: styles });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div>
        <h2 className="et-display" style={{ fontSize: 'clamp(26px,5vw,36px)', fontWeight: 700, color: C.textPrimary, marginBottom: 8, lineHeight: 1.2 }}>
          Customize your experience
        </h2>
        <p style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.6 }}>
          Pick your travel style, how you're getting there, and where you'll sleep.
        </p>
      </div>

      {/* Travel style */}
      <div>
        <FieldLabel>What's your vibe? <span style={{ fontWeight: 400, color: C.textMuted }}>(pick all that apply)</span></FieldLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
          {vibes.map(v => {
            const sel = data.travelStyles.includes(v.key);
            return (
              <button key={v.key} onClick={() => toggleStyle(v.key)}
                style={{
                  background: sel ? C.selectedBg : C.surface,
                  border: `1px solid ${sel ? C.selectedBorder : C.border}`,
                  borderRadius: 12, padding: '14px', cursor: 'pointer',
                  color: C.textPrimary, display: 'flex', alignItems: 'center', gap: 10,
                  transition: 'all 0.2s ease',
                  boxShadow: sel ? '0 0 16px rgba(52,212,117,0.12)' : 'none',
                }}>
                <span style={{ fontSize: 20 }}>{v.icon}</span>
                <span style={{ fontSize: 13, fontWeight: sel ? 600 : 400, textAlign: 'left', lineHeight: 1.3 }}>{v.label}</span>
                {sel && (
                  <span style={{ marginLeft: 'auto', color: C.greenBright, flexShrink: 0 }}>
                    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}>
                      <path d="M2 7l3.5 3.5L12 3" />
                    </svg>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Transportation */}
      <div>
        <FieldLabel>How are you getting there?</FieldLabel>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {transports.map(t => (
            <button key={t} onClick={() => {
              const updates: Partial<FormData> = { transportation: t };
              if (t === 'Driving') {
                updates.departureCity = '';
                updates.departureCode = '';
              }
              onChange(updates);
            }}
              style={{
                background: data.transportation === t ? C.selectedBg : C.surface,
                border: `1px solid ${data.transportation === t ? C.selectedBorder : C.border}`,
                borderRadius: 100, padding: '9px 18px', cursor: 'pointer',
                fontSize: 13, fontWeight: data.transportation === t ? 600 : 400,
                color: data.transportation === t ? C.greenBright : C.textSecondary,
                transition: 'all 0.2s ease',
              }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Accommodation */}
      <div>
        <FieldLabel>Where do you want to stay?</FieldLabel>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {accommodations.map(a => (
            <button key={a} onClick={() => onChange({ accommodation: a })}
              style={{
                background: data.accommodation === a ? C.selectedBg : C.surface,
                border: `1px solid ${data.accommodation === a ? C.selectedBorder : C.border}`,
                borderRadius: 100, padding: '9px 18px', cursor: 'pointer',
                fontSize: 13, fontWeight: data.accommodation === a ? 600 : 400,
                color: data.accommodation === a ? C.greenBright : C.textSecondary,
                transition: 'all 0.2s ease',
              }}>
              {a}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Step 4: Must-haves + Submit ─── */
function Step4({ data, onChange, onSubmit, loading, submitError }: { data: FormData; onChange: (u: Partial<FormData>) => void; onSubmit: () => void; loading: boolean; submitError?: string | null }) {
  const [focus, setFocus] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div>
        <h2 className="et-display" style={{ fontSize: 'clamp(26px,5vw,36px)', fontWeight: 700, color: C.textPrimary, marginBottom: 8, lineHeight: 1.2 }}>
          Anything else?
        </h2>
        <p style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.6 }}>
          Share any must-dos, bucket list items, or special requests — our AI will weave them in.
        </p>
      </div>

      <div>
        <FieldLabel>Must-haves <span style={{ fontWeight: 400, color: C.textMuted }}>(optional)</span></FieldLabel>
        <textarea
          rows={5}
          placeholder="e.g. I want to see the Statue of Liberty, must try local BBQ, need pet-friendly spots..."
          value={data.mustHaves}
          onChange={e => onChange({ mustHaves: e.target.value })}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={{
            ...inputStyle,
            resize: 'vertical',
            lineHeight: 1.6,
            border: `1px solid ${focus ? C.borderFocus : C.border}`,
            background: focus ? 'rgba(30,138,82,0.06)' : 'rgba(255,255,255,0.05)',
          }}
        />
      </div>

      {/* Quick summary */}
      <div style={{
        background: 'rgba(52,212,117,0.06)',
        border: '1px solid rgba(52,212,117,0.15)',
        borderRadius: 12, padding: '16px 18px',
      }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.greenBright, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
          Ready to plan
        </div>
        <div style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.7 }}>
          {data.destinations.filter(d => d.city || d.state).length > 0 && (
            <span>
              <strong style={{ color: C.textPrimary }}>
                {data.destinations.filter(d => d.city || d.state).map(d => [d.city, d.state].filter(Boolean).join(', ')).join(' → ')}
              </strong>
              {data.startDate && data.endDate ? ` · ${daysBetween(data.startDate, data.endDate)} night${daysBetween(data.startDate, data.endDate) !== 1 ? 's' : ''}` : ''}
            </span>
          )}
          {data.groupSize && (
            <span>{' · '}{data.groupSize === 'solo' ? 'Solo' : data.groupSize === 'couple' ? 'Couple' : data.groupSize === 'small' ? 'Small group' : 'Large group'}
              {(data.groupSize === 'small' || data.groupSize === 'large') && data.groupCount > 0 ? ` (${data.groupCount})` : ''}</span>
          )}
          {data.budget >= 100 && <span>{' · '}{data.budget >= 100000 ? 'Unlimited' : `$${data.budget.toLocaleString()}`} total</span>}
          {data.flightBudget > 0 && <span>{' · '}${data.flightBudget.toLocaleString()} flights</span>}
          {data.accommodationBudget > 0 && <span>{' · '}${data.accommodationBudget.toLocaleString()} accom.</span>}
          {data.travelStyles.length > 0 && <span>{' · '}{data.travelStyles.length} vibe{data.travelStyles.length > 1 ? 's' : ''} selected</span>}
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={onSubmit}
        disabled={loading || !data.destinations.every(d => d.state && d.city) || !data.startDate || !data.endDate}
        style={{
          width: '100%',
          background: loading || !data.destinations.every(d => d.state && d.city) ? 'rgba(30,138,82,0.4)' : 'linear-gradient(140deg,#1e8a52 0%,#0d5530 100%)',
          border: '1px solid rgba(50,160,100,0.35)',
          borderRadius: 12, padding: '16px 24px',
          fontSize: 16, fontWeight: 700, color: 'white',
          cursor: loading || !data.destinations.every(d => d.state && d.city) ? 'not-allowed' : 'pointer',
          transition: 'all 0.25s ease',
          boxShadow: loading || !data.destinations.every(d => d.state && d.city) ? 'none' : '0 0 28px rgba(26,130,78,0.35)',
          letterSpacing: '-0.01em',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        }}>
        {loading ? (
          <>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 18, height: 18, animation: 'spin 0.8s linear infinite' }}>
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
            Generating your itinerary...
          </>
        ) : (
          <>Plan My Trip 🗺️</>
        )}
      </button>

      {(!data.destinations.every(d => d.state && d.city) || !data.startDate || !data.endDate) && (
        <p style={{ fontSize: 12, color: C.textMuted, textAlign: 'center', marginTop: -16 }}>
          Please complete all destinations and dates in Step 1 to continue.
        </p>
      )}

      {submitError && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 10,
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 10, padding: '13px 16px',
          fontSize: 13, color: 'rgba(239,68,68,0.9)', lineHeight: 1.5,
        }}>
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width: 14, height: 14, flexShrink: 0, marginTop: 1 }}>
            <circle cx="7" cy="7" r="6" /><path d="M7 4v3M7 10v.5" />
          </svg>
          {submitError}
        </div>
      )}
    </div>
  );
}

/* ─── Token Usage Banner ─── */
function TokenUsageBanner({ usage }: { usage: { tokens_used: number; ceiling: number } | null }) {
  if (!usage) return null;
  const { tokens_used, ceiling } = usage;
  const pct = Math.min((tokens_used / ceiling) * 100, 100);
  const remaining = Math.max(ceiling - tokens_used, 0);
  const estGenerations = Math.floor(remaining / 4000);

  const barColor = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#34d475';
  const barGlow = pct >= 90 ? '0 0 8px rgba(239,68,68,0.45)' : pct >= 70 ? '0 0 8px rgba(245,158,11,0.4)' : '0 0 8px rgba(52,212,117,0.35)';

  return (
    <div style={{
      background: 'rgba(3,8,16,0.78)',
      backdropFilter: 'blur(18px)',
      border: `1px solid ${pct >= 90 ? 'rgba(239,68,68,0.22)' : C.border}`,
      borderRadius: 12,
      padding: '12px 16px',
      marginBottom: 10,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: C.textMuted, textTransform: 'uppercase' }}>
          AI Credits this month
        </span>
        <span style={{ fontSize: 11, color: C.textMuted }}>
          {remaining.toLocaleString()} remaining
        </span>
      </div>

      <div style={{ height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden', marginBottom: 7 }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: barColor,
          borderRadius: 2,
          boxShadow: barGlow,
          transition: 'width 0.6s cubic-bezier(0.34,1.56,0.64,1)',
        }} />
      </div>

      <div style={{ fontSize: 11, color: C.textMuted }}>
        {tokens_used.toLocaleString()} / 50,000 used
      </div>

      {pct >= 90 && (
        <div style={{
          marginTop: 8, padding: '8px 10px',
          background: 'rgba(239,68,68,0.07)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 8, fontSize: 11,
          color: 'rgba(248,113,113,0.9)', lineHeight: 1.55,
        }}>
          You're running low on AI credits for this month. You have {estGenerations} generation{estGenerations !== 1 ? 's' : ''} remaining (approx).
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════ */
export default function PlanPageClient() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [userEmail, setUserEmail] = useState('');
  const [usage, setUsage] = useState<{ tokens_used: number; ceiling: number } | null>(null);
  const [animDir, setAnimDir] = useState<'forward' | 'back'>('forward');
  const [visible, setVisible] = useState(true);
  const [showErrors, setShowErrors] = useState(false);
  const [savedIndicator, setSavedIndicator] = useState(false);
  const [showRestartDialog, setShowRestartDialog] = useState(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextSave = useRef(true);

  const update = (partial: Partial<FormData>) => setForm(f => ({ ...f, ...partial }));

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/auth');
  }

  // Restore from localStorage on mount + fetch user email
  useEffect(() => {
    try {
      const saved = localStorage.getItem('easytrip-plan');
      if (saved) {
        const data = JSON.parse(saved);
        if (typeof data.currentStep === 'number') setStep(data.currentStep);
        if (data.form) setForm({ ...EMPTY_FORM, ...data.form });
      }
    } catch (e) {
      console.error('Failed to restore progress:', e);
    }
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user?.email) setUserEmail(user.email);
      if (user?.id) {
        const month = new Date().toISOString().slice(0, 7);
        const { data } = await supabase
          .from('usage_records')
          .select('tokens_used, ceiling')
          .eq('user_id', user.id)
          .eq('month', month)
          .maybeSingle();
        setUsage(data ? { tokens_used: data.tokens_used, ceiling: data.ceiling ?? 50000 } : { tokens_used: 0, ceiling: 50000 });
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Save to localStorage on any state change (skip first render)
  useEffect(() => {
    if (skipNextSave.current) { skipNextSave.current = false; return; }
    try {
      localStorage.setItem('easytrip-plan', JSON.stringify({ currentStep: step, form }));
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      setSavedIndicator(true);
      savedTimerRef.current = setTimeout(() => setSavedIndicator(false), 2000);
    } catch (e) {
      console.error('Failed to save progress:', e);
    }
  }, [step, form]);

  useEffect(() => {
    if (!loading) { setLoadingMsgIdx(0); return; }
    const id = setInterval(() => setLoadingMsgIdx(i => (i + 1) % LOADING_MESSAGES.length), 3000);
    return () => clearInterval(id);
  }, [loading]);

  const handleRestart = () => {
    try { localStorage.removeItem('easytrip-plan'); } catch (e) {}
    setForm(EMPTY_FORM);
    setStep(0);
    setShowRestartDialog(false);
    setShowErrors(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goTo = (next: number) => {
    if (next === step) return;
    setAnimDir(next > step ? 'forward' : 'back');
    setShowErrors(false);
    setVisible(false);
    setTimeout(() => {
      setStep(next);
      setVisible(true);
    }, 220);
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    setLoading(true);

    const headCount =
      form.groupSize === 'solo' ? 1
      : form.groupSize === 'couple' ? 2
      : form.groupCount > 0 ? form.groupCount
      : form.groupSize === 'small' ? 3
      : 6;

    const requestBody = {
      destinations: form.destinations,
      startDate: form.startDate,
      endDate: form.endDate,
      groupSize: form.groupSize,
      numberOfPeople: headCount,
      travelStyles: form.travelStyles,
      transportation: form.transportation,
      accommodation: form.accommodation,
      totalBudget: form.budget,
      budgetPerPerson: form.budget >= 100000 ? 0 : Math.round(form.budget / headCount),
      ...(form.flightBudget > 0 && { flightBudgetPerPerson: form.flightBudget }),
      ...(form.accommodationBudget > 0 && { accommodationBudget: form.accommodationBudget }),
      ...(form.mustHaves && { mustHaves: form.mustHaves }),
      ...(form.departureCode && { departureCode: form.departureCode, departureCity: form.departureCity }),
      cabinClass: form.cabinClass,
    };

    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        if (res.status === 429) {
          setSubmitError("You've reached your monthly AI limit. Please try again next month.");
        } else if (res.status === 401) {
          setSubmitError('Please sign in to generate a trip.');
        } else {
          setSubmitError('Something went wrong. Please try again.');
        }
        setLoading(false);
        return;
      }

      const { tripId } = await res.json();
      try { localStorage.removeItem('easytrip-plan'); } catch (e) {}
      router.push(`/trips/${tripId}`);
    } catch {
      setSubmitError('Connection failed. Check your internet and try again.');
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const isFlying = form.transportation === 'Flying' || form.transportation === 'Either / Flexible';
  const steps = isFlying ? STEPS_FLIGHT : STEPS_BASE;
  const budgetStep = isFlying ? 3 : 2;
  const mustHaveStep = isFlying ? 4 : 3;

  const canProceed = () => {
    if (step === 0) {
      const allDestsValid = form.destinations.every(d => !!d.state && !!d.city);
      return (
        allDestsValid &&
        !!form.startDate && form.startDate >= today &&
        !!form.endDate && form.endDate >= form.startDate
      );
    }
    if (step === 1) return true;
    // Step 2 is either Flight Details (flying) or Budget & Group (driving)
    if (step === 2 && isFlying) {
      // Flight step: departure required only if Flying (not Either/Flexible)
      if (form.transportation === 'Flying' && !form.departureCode) return false;
      return true;
    }
    if (step === budgetStep) {
      const isCamping = form.accommodation === 'Camping';
      const needsCount = form.groupSize === 'small' || form.groupSize === 'large';
      if (!form.groupSize) return false;
      if (needsCount && form.groupCount < 3) return false;
      if (form.budget < 100) return false;
      const flightReq = form.transportation === 'Flying';
      if (flightReq && form.flightBudget <= 0) return false;
      if (!isCamping && form.accommodationBudget <= 0) return false;
      const hc = form.groupSize === 'solo' ? 1
        : form.groupSize === 'couple' ? 2
        : form.groupCount > 0 ? form.groupCount
        : form.groupSize === 'small' ? 3 : 6;
      if (form.budget < 100000) {
        const bpp = Math.round(form.budget / hc);
        if (form.flightBudget > 0 && form.flightBudget >= bpp) return false;
        if (!isCamping) {
          const rem = bpp - (form.flightBudget > 0 ? form.flightBudget : 0);
          const nights = tripDuration(form.startDate, form.endDate)?.nights ?? 0;
          const isPerPerson = ['Hotel', 'Hostel', 'Flexible'].includes(form.accommodation);
          const accomPPTotal = isPerPerson
            ? form.accommodationBudget * nights
            : (form.accommodationBudget * nights) / hc;
          if (accomPPTotal >= rem) return false;
        }
      }
      return true;
    }
    return true;
  };

  const handleNext = () => {
    if (!canProceed()) { setShowErrors(true); return; }
    goTo(step + 1);
  };

  return (
    <div suppressHydrationWarning style={{ minHeight: '100vh', background: C.bg, fontFamily: "'DM Sans', system-ui, sans-serif", color: 'white' }}>

      {/* Background */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {/* USA map — step 0 only */}
        <img
          src="/features/USA map.jpg"
          alt=""
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'center',
            opacity: step === 0 ? 1 : 0,
            transition: 'opacity 0.65s ease',
          }}
        />
        {/* Dark overlay over map */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(3,8,16,0.52) 0%, rgba(3,8,16,0.42) 50%, rgba(3,8,16,0.62) 100%)',
          opacity: step === 0 ? 1 : 0,
          transition: 'opacity 0.65s ease',
        }} />
        {/* Vibe image — step 1 only */}
        <img
          src="/features/vibepageimage.jpg"
          alt=""
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'center',
            opacity: step === 1 ? 1 : 0,
            transition: 'opacity 0.65s ease',
          }}
        />
        {/* Dark overlay over vibe image */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(3,8,16,0.55) 0%, rgba(3,8,16,0.45) 50%, rgba(3,8,16,0.65) 100%)',
          opacity: step === 1 ? 1 : 0,
          transition: 'opacity 0.65s ease',
        }} />
        {/* Outdoor image — Budget & Group step */}
        <img
          src="/features/outdoor image.jpg"
          alt=""
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'center',
            opacity: step === budgetStep ? 1 : 0,
            transition: 'opacity 0.65s ease',
          }}
        />
        {/* Dark overlay over outdoor image */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(3,8,16,0.58) 0%, rgba(3,8,16,0.48) 50%, rgba(3,8,16,0.68) 100%)',
          opacity: step === budgetStep ? 1 : 0,
          transition: 'opacity 0.65s ease',
        }} />
        {/* Aurora blobs — steps beyond budget */}
        <div className="aurora-a" style={{ position: 'absolute', top: '-10%', left: '20%', width: 700, height: 500, borderRadius: '50%', background: 'radial-gradient(ellipse at center, rgba(26,130,78,0.18) 0%, transparent 70%)', opacity: step > budgetStep ? 1 : 0, transition: 'opacity 0.65s ease' }} />
        <div className="aurora-b" style={{ position: 'absolute', bottom: '10%', right: '15%', width: 500, height: 400, borderRadius: '50%', background: 'radial-gradient(ellipse at center, rgba(13,107,53,0.14) 0%, transparent 70%)', opacity: step > budgetStep ? 1 : 0, transition: 'opacity 0.65s ease' }} />
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.03 }}>
          <filter id="grain-plan"><feTurbulence type="fractalNoise" baseFrequency="0.68" numOctaves="3" stitchTiles="stitch" /><feColorMatrix type="saturate" values="0" /></filter>
          <rect width="100%" height="100%" filter="url(#grain-plan)" />
        </svg>
      </div>

      {/* Nav */}
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
              Plan a Trip
            </a>
            <a
              href="/trips"
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
            <button onClick={handleLogout} style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: 7,
              padding: '8px 15px',
              fontSize: 13,
              fontWeight: 500,
              color: C.textMuted,
              cursor: 'pointer',
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

      {/* Main layout */}
      <div style={{
        position: 'relative', zIndex: 1,
        maxWidth: 1100, margin: '0 auto',
        padding: '100px 24px 80px',
        display: 'grid',
        gridTemplateColumns: 'minmax(0,1fr)',
        gap: 32,
      }} className="plan-grid">
        
        {/* Form column */}
        {/* HERE */}
        <div style={{ minWidth: 0 }}>
          <TokenUsageBanner usage={usage} />
          <div style={{
            background: step <= budgetStep ? 'rgba(3,8,16,0.78)' : 'transparent',
            backdropFilter: step <= budgetStep ? 'blur(18px)' : 'none',
            borderRadius: step <= budgetStep ? 16 : 0,
            padding: step <= budgetStep ? '12px 20px 6px' : '0',
            marginBottom: step <= budgetStep ? 8 : 0,
            transition: 'background 0.65s ease, padding 0.65s ease, margin 0.65s ease',
          }}>
            <ProgressBar step={step} steps={steps} />
          </div>

          {/* Step panel */}
          <div style={{
            background: step <= budgetStep ? 'rgba(3,8,16,0.74)' : 'rgba(255,255,255,0.03)',
            backdropFilter: step <= budgetStep ? 'blur(18px) saturate(1.2)' : 'none',
            border: `1px solid ${C.border}`,
            borderRadius: 20,
            padding: 'clamp(24px,4vw,40px)',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : animDir === 'forward' ? 'translateY(14px)' : 'translateY(-14px)',
            transition: 'opacity 0.22s ease, transform 0.22s ease, background 0.65s ease, backdrop-filter 0.65s ease',
          }}>
            {step === 0 && <Step1 data={form} onChange={update} showErrors={showErrors} />}
            {step === 1 && <Step3 data={form} onChange={update} />}
            {step === 2 && isFlying && <StepFlight data={form} onChange={update} showErrors={showErrors} />}
            {step === budgetStep && <Step2 data={form} onChange={update} showErrors={showErrors} />}
            {step === mustHaveStep && <Step4 data={form} onChange={update} onSubmit={handleSubmit} loading={loading} submitError={submitError} />}
          </div>

          {/* Nav buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
            {step === 0 ? (
              <button
                onClick={() => router.push('/')}
                style={{
                  background: 'transparent',
                  border: `1px solid ${C.border}`,
                  borderRadius: 10, padding: '11px 22px',
                  fontSize: 14, fontWeight: 500,
                  color: C.textSecondary,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
                  <path d="M10 4L6 8l4 4" />
                </svg>
                Exit
              </button>
            ) : (
              <button
                onClick={() => goTo(step - 1)}
                style={{
                  background: 'transparent',
                  border: `1px solid ${C.border}`,
                  borderRadius: 10, padding: '11px 22px',
                  fontSize: 14, fontWeight: 500,
                  color: C.textSecondary,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
                  <path d="M10 4L6 8l4 4" />
                </svg>
                Back
              </button>
            )}

            {step < steps.length - 1 && (
              <button
                onClick={handleNext}
                style={{
                  background: canProceed() ? 'linear-gradient(140deg,#1e8a52 0%,#0d5530 100%)' : 'rgba(30,138,82,0.25)',
                  border: '1px solid rgba(50,160,100,0.35)',
                  borderRadius: 10, padding: '11px 26px',
                  fontSize: 14, fontWeight: 600, color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  boxShadow: canProceed() ? '0 0 20px rgba(26,130,78,0.3)' : 'none',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                Next
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
                  <path d="M6 4l4 4-4 4" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Sidebar — rendered below form on mobile, right column on desktop */}
        <div className="plan-sidebar">
          <div style={{ position: 'sticky', top: 90 }}>
            {/* HERE */}
            <Sidebar data={form} onRestart={() => setShowRestartDialog(true)} step={step} />
          </div>
        </div>
      </div>

      {/* Progress saved indicator */}
      {savedIndicator && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 100,
          background: 'rgba(30,138,82,0.15)',
          border: '1px solid rgba(52,212,117,0.3)',
          borderRadius: 10, padding: '8px 14px',
          fontSize: 12, fontWeight: 600, color: C.greenBright,
          display: 'flex', alignItems: 'center', gap: 6,
          animation: 'fadeUp 0.3s ease-out both',
          backdropFilter: 'blur(8px)',
          pointerEvents: 'none',
        }}>
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 12, height: 12, flexShrink: 0 }}>
            <path d="M2 7l3.5 3.5L12 3" />
          </svg>
          Progress saved
        </div>
      )}

      {/* Full-screen loading overlay */}
      {loading && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'rgba(3,8,16,0.9)',
          backdropFilter: 'blur(10px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 28,
        }}>
          {/* Spinner */}
          <div style={{ position: 'relative', width: 60, height: 60 }}>
            <svg viewBox="0 0 60 60" fill="none" style={{ width: 60, height: 60, position: 'absolute', inset: 0 }}>
              <circle cx="30" cy="30" r="26" stroke="rgba(52,212,117,0.12)" strokeWidth="3" />
            </svg>
            <svg viewBox="0 0 60 60" fill="none" style={{ width: 60, height: 60, position: 'absolute', inset: 0, animation: 'spin 0.9s linear infinite' }}>
              <path d="M30 4a26 26 0 0 1 26 26" stroke="#34d475" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <LogoIcon size={22} />
            </div>
          </div>

          {/* Rotating message */}
          <div style={{
            fontSize: 16, fontWeight: 600,
            color: 'rgba(255,255,255,0.9)',
            textAlign: 'center', maxWidth: 320,
            letterSpacing: '-0.01em',
          }}>
            {LOADING_MESSAGES[loadingMsgIdx]}
          </div>

          {/* Sub-label */}
          <div style={{
            fontSize: 12, color: 'rgba(255,255,255,0.35)',
            textAlign: 'center',
          }}>
            This may take 60–90 seconds
          </div>
        </div>
      )}

      {/* Restart confirmation dialog */}
      {showRestartDialog && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24,
            animation: 'fadeUp 0.2s ease',
          }}
          onClick={e => { if (e.target === e.currentTarget) setShowRestartDialog(false); }}
        >
          <div style={{
            background: '#0c1828',
            border: `1px solid ${C.border}`,
            borderRadius: 20, padding: '32px 28px',
            maxWidth: 400, width: '100%',
            boxShadow: '0 24px 64px rgba(0,0,0,0.8)',
          }}>
            <div style={{ fontSize: 32, textAlign: 'center', marginBottom: 12 }}>⚠️</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: C.textPrimary, textAlign: 'center', lineHeight: 1.3, margin: '0 0 10px' }}>
              Are you sure you want to restart?
            </h3>
            <p style={{ fontSize: 14, color: C.textSecondary, textAlign: 'center', lineHeight: 1.6, margin: '0 0 24px' }}>
              All your progress will be permanently deleted.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowRestartDialog(false)}
                style={{
                  flex: 1, padding: '12px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.06)',
                  border: `1px solid ${C.border}`,
                  color: C.textSecondary, fontSize: 14, fontWeight: 600,
                  cursor: 'pointer', transition: 'background 0.15s ease',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'; }}
              >
                Cancel
              </button>
              <button
                onClick={handleRestart}
                style={{
                  flex: 1, padding: '12px', borderRadius: 10,
                  background: '#dc2626', border: 'none',
                  color: 'white', fontSize: 14, fontWeight: 600,
                  cursor: 'pointer', transition: 'background 0.15s ease',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#b91c1c'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#dc2626'; }}
              >
                Yes, Restart
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

        input[type="range"] {
          -webkit-appearance: none;
          height: 6px;
          background: transparent;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px; height: 20px;
          border-radius: 50%;
          background: #34d475;
          border: 2px solid #030810;
          box-shadow: 0 0 10px rgba(52,212,117,0.45);
          cursor: pointer;
          margin-top: -7px;
        }
        input[type="range"]::-webkit-slider-runnable-track {
          height: 6px;
          background: transparent;
          border-radius: 3px;
        }
        input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(0.6);
          cursor: pointer;
        }

        @media (min-width: 860px) {
          .plan-grid {
            grid-template-columns: minmax(0,1fr) 280px !important;
            align-items: start;
          }
          .plan-sidebar {
            display: block !important;
          }
        }
        .plan-sidebar {
          display: none;
        }
        @media (max-width: 859px) {
          .plan-sidebar {
            display: block;
          }
        }
      `}</style>
    </div>
  );
}
