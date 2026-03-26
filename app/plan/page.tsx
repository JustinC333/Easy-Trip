'use client';

import { useState, useEffect } from 'react';

/* ─── Types ─── */
interface FormData {
  state: string;
  city: string;
  startDate: string;
  endDate: string;
  budget: number;
  budgetTier: 'budget' | 'moderate' | 'luxury' | '';
  groupSize: 'solo' | 'couple' | 'small' | 'large' | '';
  travelStyles: string[];
  transportation: string;
  accommodation: string;
  mustHaves: string;
}

const EMPTY_FORM: FormData = {
  state: '',
  city: '',
  startDate: '',
  endDate: '',
  budget: 2500,
  budgetTier: '',
  groupSize: '',
  travelStyles: [],
  transportation: '',
  accommodation: '',
  mustHaves: '',
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

const STATE_CITIES: Record<string, string[]> = {
  Alabama: ['Birmingham','Montgomery','Huntsville','Mobile','Tuscaloosa','Gulf Shores','Orange Beach','Decatur','Florence','Dothan'],
  Alaska: ['Anchorage','Fairbanks','Juneau','Sitka','Ketchikan','Denali National Park','Kenai Fjords','Glacier Bay','Homer','Kodiak'],
  Arizona: ['Phoenix','Tucson','Scottsdale','Sedona','Flagstaff','Grand Canyon','Tempe','Mesa','Prescott','Page','Lake Havasu City','Antelope Canyon','Monument Valley','Petrified Forest'],
  Arkansas: ['Little Rock','Fayetteville','Fort Smith','Hot Springs','Bentonville','Eureka Springs','Jonesboro','Conway','Ozark Mountains'],
  California: ['Los Angeles','San Francisco','San Diego','San Jose','Sacramento','Santa Barbara','Santa Monica','Monterey','Napa Valley','Palm Springs','Big Sur','Lake Tahoe','Yosemite Valley','Joshua Tree','Malibu','Carmel','Santa Cruz','Berkeley','Oakland','Long Beach','Anaheim','Fresno','Redwood National Park','Death Valley','Catalina Island','Sonoma','Muir Woods'],
  Colorado: ['Denver','Colorado Springs','Boulder','Aspen','Vail','Telluride','Breckenridge','Estes Park','Rocky Mountain National Park','Fort Collins','Pueblo','Durango','Grand Junction','Steamboat Springs','Keystone','Crested Butte'],
  Connecticut: ['Hartford','New Haven','Stamford','Bridgeport','Mystic','Greenwich','Norwalk','Waterbury','New London'],
  Delaware: ['Wilmington','Dover','Rehoboth Beach','Lewes','Newark','Bethany Beach'],
  Florida: ['Miami','Orlando','Tampa','Jacksonville','Key West','Fort Lauderdale','Naples','Sarasota','St. Augustine','Clearwater','Daytona Beach','Gainesville','Pensacola','Panama City Beach','Fort Myers','Boca Raton','West Palm Beach','Tallahassee','Cape Canaveral','Everglades National Park','Destin','Marco Island','Amelia Island','St. Petersburg'],
  Georgia: ['Atlanta','Savannah','Athens','Augusta','Macon','Columbus','Brunswick','Tybee Island','Blue Ridge','Dahlonega','Jekyll Island','St. Simons Island','Chattahoochee National Forest'],
  Hawaii: ['Honolulu','Maui','Kauai','Big Island','Lahaina','Waikiki','Hilo','Kailua-Kona','Na Pali Coast','Waimea Canyon','Volcanoes National Park','Lanai','Molokai','Poipu','Wailea','Haleiwa'],
  Idaho: ['Boise','Sun Valley','Coeur d\'Alene','Idaho Falls','Twin Falls','Sandpoint','McCall','Pocatello','Lewiston','Shoshone Falls'],
  Illinois: ['Chicago','Springfield','Rockford','Peoria','Champaign','Aurora','Naperville','Galena','Bloomington','Decatur','Oak Park','Evanston'],
  Indiana: ['Indianapolis','Fort Wayne','Bloomington','South Bend','Evansville','Gary','Terre Haute','Carmel','Noblesville','Columbus','Indiana Dunes'],
  Iowa: ['Des Moines','Cedar Rapids','Iowa City','Davenport','Sioux City','Waterloo','Dubuque','Ames','Council Bluffs'],
  Kansas: ['Wichita','Kansas City','Topeka','Overland Park','Lawrence','Manhattan','Salina','Hutchinson'],
  Kentucky: ['Louisville','Lexington','Bowling Green','Covington','Owensboro','Frankfort','Mammoth Cave','Paducah','Bardstown','Ashland'],
  Louisiana: ['New Orleans','Baton Rouge','Lafayette','Shreveport','Lake Charles','Alexandria','Houma','Natchitoches','Morgan City','Cajun Country','French Quarter'],
  Maine: ['Portland','Bar Harbor','Acadia National Park','Augusta','Bangor','Bath','Camden','Kennebunkport','Ogunquit','Boothbay Harbor','Belfast','Freeport'],
  Maryland: ['Baltimore','Annapolis','Ocean City','Frederick','Rockville','Gaithersburg','Hagerstown','Salisbury','Cambridge','Chesapeake Bay'],
  Massachusetts: ['Boston','Cambridge','Salem','Cape Cod','Martha\'s Vineyard','Nantucket','Plymouth','Worcester','Springfield','Provincetown','Gloucester','Newburyport','Lenox','Stockbridge','Concord'],
  Michigan: ['Detroit','Grand Rapids','Ann Arbor','Traverse City','Mackinac Island','Lansing','Flint','Kalamazoo','Petoskey','Holland','Sault Ste. Marie','Pictured Rocks','Sleeping Bear Dunes','Upper Peninsula'],
  Minnesota: ['Minneapolis','St. Paul','Duluth','Rochester','Bloomington','Brainerd','Ely','Boundary Waters','Voyageurs National Park','St. Cloud','Winona'],
  Mississippi: ['Jackson','Biloxi','Gulfport','Natchez','Oxford','Vicksburg','Tupelo','Meridian','Pass Christian'],
  Missouri: ['Kansas City','St. Louis','Springfield','Branson','Jefferson City','Columbia','Joplin','Independence','St. Joseph','Hannibal'],
  Montana: ['Billings','Missoula','Bozeman','Glacier National Park','Helena','Great Falls','Kalispell','Whitefish','Yellowstone (MT)','Butte','Flathead Lake'],
  Nebraska: ['Omaha','Lincoln','Grand Island','Kearney','North Platte','Scottsbluff','Chimney Rock','Sandhills'],
  Nevada: ['Las Vegas','Reno','Lake Tahoe (NV)','Henderson','Carson City','Great Basin National Park','Valley of Fire','Boulder City','Laughlin'],
  'New Hampshire': ['Manchester','Concord','Portsmouth','Nashua','White Mountains','Mount Washington','Lake Winnipesaukee','Bretton Woods','North Conway','Hanover','Hampton Beach'],
  'New Jersey': ['Newark','Jersey City','Atlantic City','Princeton','Hoboken','Cape May','Asbury Park','Trenton','Morristown','Ocean City','Wildwood','Sandy Hook'],
  'New Mexico': ['Albuquerque','Santa Fe','Taos','Las Cruces','Roswell','White Sands','Carlsbad Caverns','Ruidoso','Gallup','Bandelier'],
  'New York': ['New York City','Buffalo','Rochester','Albany','Syracuse','Niagara Falls','Saratoga Springs','The Hamptons','Lake Placid','Ithaca','Long Island','Brooklyn','Manhattan','Hudson Valley','Catskills','Fire Island','Adirondacks'],
  'North Carolina': ['Charlotte','Raleigh','Asheville','Durham','Wilmington','Chapel Hill','Outer Banks','Boone','Greensboro','Winston-Salem','Great Smoky Mountains (NC)','Blue Ridge Parkway','Nags Head','Kill Devil Hills'],
  'North Dakota': ['Fargo','Bismarck','Grand Forks','Theodore Roosevelt National Park','Minot','Jamestown','Medora'],
  Ohio: ['Columbus','Cleveland','Cincinnati','Toledo','Akron','Dayton','Youngstown','Sandusky','Athens','Oxford','Hocking Hills'],
  Oklahoma: ['Oklahoma City','Tulsa','Norman','Lawton','Broken Bow','Tahlequah','Enid','Bartlesville','Woodward'],
  Oregon: ['Portland','Eugene','Bend','Crater Lake','Cannon Beach','Astoria','Salem','Ashland','Medford','Hood River','Sisters','Tillamook','Bandon','Newport','Florence'],
  Pennsylvania: ['Philadelphia','Pittsburgh','Hershey','Gettysburg','Lancaster','Harrisburg','Erie','Allentown','Scranton','Valley Forge','Pocono Mountains','New Hope','Jim Thorpe','Bethlehem'],
  'Rhode Island': ['Providence','Newport','Narragansett','Bristol','Warwick','Pawtucket','Block Island','Westerly'],
  'South Carolina': ['Charleston','Columbia','Myrtle Beach','Hilton Head','Greenville','Beaufort','Pawleys Island','Folly Beach','Rock Hill'],
  'South Dakota': ['Sioux Falls','Rapid City','Mount Rushmore','Badlands National Park','Custer','Deadwood','Lead','Wind Cave','Spearfish','Wall'],
  Tennessee: ['Nashville','Memphis','Knoxville','Chattanooga','Pigeon Forge','Gatlinburg','Great Smoky Mountains','Murfreesboro','Clarksville','Franklin','Johnson City','Bristol'],
  Texas: ['Austin','Houston','San Antonio','Dallas','Fort Worth','El Paso','Corpus Christi','Galveston','South Padre Island','Big Bend National Park','Fredericksburg','Marfa','Lubbock','Amarillo','Waco','New Braunfels','Wimberley','San Marcos','Enchanted Rock'],
  Utah: ['Salt Lake City','Park City','Moab','Zion National Park','Bryce Canyon','Arches National Park','Capitol Reef','Canyonlands','St. George','Provo','Ogden','Logan','Monument Valley (UT)'],
  Vermont: ['Burlington','Stowe','Montpelier','Woodstock','Brattleboro','Manchester','Middlebury','Killington','Mad River Glen','Shelburne'],
  Virginia: ['Richmond','Virginia Beach','Arlington','Norfolk','Charlottesville','Shenandoah Valley','Williamsburg','Alexandria','Roanoke','Lexington','Luray Caverns','Chincoteague','Skyline Drive'],
  Washington: ['Seattle','Spokane','Tacoma','Olympia','Mount Rainier','Olympic National Park','North Cascades','Bellingham','Leavenworth','San Juan Islands','Whidbey Island','Port Townsend','Walla Walla','Wenatchee'],
  'West Virginia': ['Charleston','Huntington','Morgantown','Harpers Ferry','New River Gorge','Beckley','Lewisburg','Elkins','Wheeling','Seneca Rocks'],
  Wisconsin: ['Milwaukee','Madison','Green Bay','Wisconsin Dells','Door County','Apostle Islands','Eau Claire','Oshkosh','La Crosse','Sheboygan','Sturgeon Bay','Lake Geneva'],
  Wyoming: ['Cheyenne','Yellowstone National Park','Grand Teton','Jackson Hole','Cody','Laramie','Casper','Thermopolis','Sheridan','Rock Springs'],
};

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

/* ─── Step progress ─── */
const STEPS = ['Destination & Dates', 'Budget & Group', 'Your Vibe', 'Finish Up'];

function ProgressBar({ step }: { step: number }) {
  return (
    <div style={{ width: '100%', marginBottom: 40 }}>
      {/* Step labels — desktop */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, gap: 8 }}>
        {STEPS.map((label, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7,
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 600,
                background: i < step ? 'linear-gradient(140deg,#1e8a52,#0d5530)' : i === step ? 'rgba(30,138,82,0.2)' : 'rgba(255,255,255,0.06)',
                border: i === step ? `1.5px solid ${C.selectedBorder}` : i < step ? 'none' : `1.5px solid ${C.border}`,
                color: i <= step ? C.greenBright : C.textMuted,
                transition: 'all 0.35s ease',
                flexShrink: 0,
              }}>
                {i < step ? (
                  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
                    <path d="M2 7l3.5 3.5L12 3" />
                  </svg>
                ) : i + 1}
              </div>
              <span style={{
                fontSize: 11, fontWeight: 500, letterSpacing: '0.02em',
                color: i === step ? C.greenBright : i < step ? C.textSecondary : C.textMuted,
                transition: 'color 0.3s ease',
                display: 'none',
              }} className="step-label">{label}</span>
            </div>
          </div>
        ))}
      </div>
      {/* Track */}
      <div style={{ height: 3, background: C.border, borderRadius: 2, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${(step / (STEPS.length - 1)) * 100}%`,
          background: 'linear-gradient(90deg, #34d475, #1e8a52)',
          borderRadius: 2,
          transition: 'width 0.5s cubic-bezier(0.34,1.56,0.64,1)',
          boxShadow: '0 0 10px rgba(52,212,117,0.4)',
        }} />
      </div>
      {/* Current step label */}
      <div style={{ textAlign: 'center', marginTop: 12, fontSize: 13, color: C.textMuted, fontWeight: 500, letterSpacing: '0.02em' }}>
        Step {step + 1} of {STEPS.length} — <span style={{ color: C.greenBright }}>{STEPS[step]}</span>
      </div>
    </div>
  );
}

/* ─── Summary sidebar ─── */
function Sidebar({ data }: { data: FormData }) {
  const days = daysBetween(data.startDate, data.endDate);
  const groupLabels: Record<string, string> = { solo: 'Just Me', couple: 'Couple', small: 'Small Group (3–5)', large: 'Large Group (6+)' };
  const styleEmojis: Record<string, string> = {
    adventure: '⛺', culture: '🏛️', food: '🍽️', relaxation: '🧘', family: '👨‍👩‍👧', nightlife: '🎭',
  };
  const isEmpty = !data.state && !data.city && !data.startDate && !data.groupSize && data.travelStyles.length === 0;

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: `1px solid ${C.border}`,
      borderRadius: 16,
      padding: '24px 20px',
      position: 'sticky',
      top: 90,
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
          {(data.state || data.city) && (
            <SidebarRow icon="📍" label="Destination" value={[data.city, data.state].filter(Boolean).join(', ')} />
          )}
          {data.startDate && data.endDate && (
            <SidebarRow icon="📅" label="Dates" value={`${fmtDate(data.startDate)} → ${fmtDate(data.endDate)}${days ? ` (${days}d)` : ''}`} />
          )}
          {data.budgetTier && (
            <SidebarRow icon="💰" label="Budget" value={`${tierLabel(data.budgetTier)} — $${data.budget.toLocaleString()}`} />
          )}
          {data.groupSize && (
            <SidebarRow icon="👥" label="Group" value={groupLabels[data.groupSize] ?? ''} />
          )}
          {data.travelStyles.length > 0 && (
            <SidebarRow icon="✨" label="Vibe" value={data.travelStyles.map(s => (styleEmojis[s] ?? '') + ' ' + s).join(', ')} />
          )}
          {data.transportation && (
            <SidebarRow icon="✈️" label="Getting there" value={data.transportation} />
          )}
          {data.accommodation && (
            <SidebarRow icon="🏨" label="Staying" value={data.accommodation} />
          )}
        </div>
      )}
    </div>
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

function tierLabel(t: string) {
  if (t === 'budget') return 'Budget';
  if (t === 'moderate') return 'Moderate';
  return 'Luxury';
}

/* ─── Input label helper ─── */
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 13, fontWeight: 600, color: C.textSecondary, letterSpacing: '0.01em', marginBottom: 8 }}>
      {children}
    </div>
  );
}

/* ─── Step 1: State + City + Dates ─── */
function Step1({ data, onChange, showErrors }: { data: FormData; onChange: (u: Partial<FormData>) => void; showErrors: boolean }) {
  const today = new Date().toISOString().split('T')[0];
  const [s1Focus, setS1Focus] = useState(false);
  const [s2Focus, setS2Focus] = useState(false);

  const dur = tripDuration(data.startDate, data.endDate);
  const startInPast = !!data.startDate && data.startDate < today;
  const endBeforeStart = !!data.endDate && !!data.startDate && data.endDate < data.startDate;

  const pinIcon = (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
      <path d="M10 2C6.69 2 4 4.69 4 8c0 4.13 5.44 9.67 5.67 9.9.18.19.49.19.66 0C10.56 17.67 16 12.13 16 8c0-3.31-2.69-6-6-6z" />
      <circle cx="10" cy="8" r="2" />
    </svg>
  );

  const stateOptions = US_STATES;
  const cityOptions = data.state ? (STATE_CITIES[data.state] ?? []) : [];

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
          Tell us your dream US destination and when you want to go.
        </p>
      </div>

      {/* State */}
      <div>
        <FieldLabel>Which state are you traveling to?</FieldLabel>
        <Combobox
          options={stateOptions}
          value={data.state}
          onSelect={val => onChange({ state: val, city: '' })}
          onClear={() => onChange({ state: '', city: '' })}
          placeholder="Type to search all 50 states..."
          showError={showErrors}
          errorMessage="Please select a state"
          icon={pinIcon}
          showWhenEmpty={true}
        />
      </div>

      {/* City */}
      <div>
        <FieldLabel>
          {data.state ? `Where in ${data.state} are you going?` : 'Where are you going?'}
        </FieldLabel>
        <Combobox
          options={cityOptions}
          value={data.city}
          onSelect={val => onChange({ city: val })}
          onClear={() => onChange({ city: '' })}
          placeholder={data.state ? `Type to search cities in ${data.state}...` : 'Select a state first'}
          disabled={!data.state}
          showError={showErrors}
          errorMessage="Please enter a city or area"
          icon={pinIcon}
          showWhenEmpty={false}
        />
      </div>

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

/* ─── Step 2: Budget + Group ─── */
function Step2({ data, onChange }: { data: FormData; onChange: (u: Partial<FormData>) => void }) {
  const tiers: { key: FormData['budgetTier']; label: string; range: string; min: number; max: number }[] = [
    { key: 'budget', label: 'Budget', range: '$500–1,500', min: 500, max: 1500 },
    { key: 'moderate', label: 'Moderate', range: '$1,500–4,000', min: 1500, max: 4000 },
    { key: 'luxury', label: 'Luxury', range: '$4,000+', min: 4000, max: 10000 },
  ];
  const groups: { key: FormData['groupSize']; icon: string; label: string; sub: string }[] = [
    { key: 'solo', icon: '🧍', label: 'Just Me', sub: 'Solo adventure' },
    { key: 'couple', icon: '👫', label: 'Couple', sub: '2 travelers' },
    { key: 'small', icon: '👨‍👩‍👧', label: 'Small Group', sub: '3–5 people' },
    { key: 'large', icon: '🎉', label: 'Large Group', sub: '6+ people' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div>
        <h2 className="et-display" style={{ fontSize: 'clamp(26px,5vw,36px)', fontWeight: 700, color: C.textPrimary, marginBottom: 8, lineHeight: 1.2 }}>
          Budget & group size
        </h2>
        <p style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.6 }}>
          Help us match experiences to your spending comfort and party size.
        </p>
      </div>

      {/* Budget tier buttons */}
      <div>
        <FieldLabel>What's your budget?</FieldLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
          {tiers.map(t => (
            <button key={t.key!} onClick={() => onChange({ budgetTier: t.key!, budget: Math.round((t.min + Math.min(t.max, t.min + 2000)) / 2) })}
              style={{
                background: data.budgetTier === t.key ? C.selectedBg : C.surface,
                border: `1px solid ${data.budgetTier === t.key ? C.selectedBorder : C.border}`,
                borderRadius: 10, padding: '14px 10px', cursor: 'pointer',
                color: C.textPrimary, textAlign: 'center',
                transition: 'all 0.2s ease',
                boxShadow: data.budgetTier === t.key ? '0 0 18px rgba(52,212,117,0.12)' : 'none',
              }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}>{t.label}</div>
              <div style={{ fontSize: 12, color: data.budgetTier === t.key ? C.greenBright : C.textMuted }}>{t.range}</div>
            </button>
          ))}
        </div>

        {/* Slider */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <FieldLabel>Fine-tune: ${data.budget.toLocaleString()}</FieldLabel>
            {data.budget >= 10000 && <span style={{ fontSize: 12, color: C.greenBright }}>No limit</span>}
          </div>
          <div style={{ position: 'relative', height: 6, background: C.border, borderRadius: 3 }}>
            <div style={{
              position: 'absolute', left: 0, top: 0, height: '100%', borderRadius: 3,
              width: `${((data.budget - 500) / 9500) * 100}%`,
              background: 'linear-gradient(90deg,#34d475,#1e8a52)',
              boxShadow: '0 0 8px rgba(52,212,117,0.35)',
            }} />
          </div>
          <input type="range" min={500} max={10000} step={100} value={data.budget}
            onChange={e => onChange({ budget: Number(e.target.value), budgetTier: '' })}
            style={{ width: '100%', margin: '8px 0 0', appearance: 'none', background: 'transparent', cursor: 'pointer', accentColor: C.greenBright }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.textMuted, marginTop: 2 }}>
            <span>$500</span><span>$10,000+</span>
          </div>
        </div>
      </div>

      {/* Group size */}
      <div>
        <FieldLabel>Who's coming?</FieldLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
          {groups.map(g => (
            <button key={g.key!} onClick={() => onChange({ groupSize: g.key! })}
              style={{
                background: data.groupSize === g.key ? C.selectedBg : C.surface,
                border: `1px solid ${data.groupSize === g.key ? C.selectedBorder : C.border}`,
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
            <button key={t} onClick={() => onChange({ transportation: t })}
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
function Step4({ data, onChange, onSubmit, loading }: { data: FormData; onChange: (u: Partial<FormData>) => void; onSubmit: () => void; loading: boolean }) {
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
          {(data.city || data.state) && <span><strong style={{ color: C.textPrimary }}>{[data.city, data.state].filter(Boolean).join(', ')}</strong>{data.startDate && data.endDate ? ` · ${daysBetween(data.startDate, data.endDate)} night${daysBetween(data.startDate, data.endDate) !== 1 ? 's' : ''}` : ''}</span>}
          {data.groupSize && <span>{' · '}{data.groupSize === 'solo' ? 'Solo' : data.groupSize === 'couple' ? 'Couple' : data.groupSize === 'small' ? 'Small group' : 'Large group'}</span>}
          {data.budgetTier && <span>{' · '}{tierLabel(data.budgetTier)} budget</span>}
          {data.travelStyles.length > 0 && <span>{' · '}{data.travelStyles.length} vibe{data.travelStyles.length > 1 ? 's' : ''} selected</span>}
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={onSubmit}
        disabled={loading || !data.state || !data.city || !data.startDate || !data.endDate}
        style={{
          width: '100%',
          background: loading || !data.state || !data.city ? 'rgba(30,138,82,0.4)' : 'linear-gradient(140deg,#1e8a52 0%,#0d5530 100%)',
          border: '1px solid rgba(50,160,100,0.35)',
          borderRadius: 12, padding: '16px 24px',
          fontSize: 16, fontWeight: 700, color: 'white',
          cursor: loading || !data.state || !data.city ? 'not-allowed' : 'pointer',
          transition: 'all 0.25s ease',
          boxShadow: loading || !data.state || !data.city ? 'none' : '0 0 28px rgba(26,130,78,0.35)',
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

      {(!data.state || !data.city || !data.startDate || !data.endDate) && (
        <p style={{ fontSize: 12, color: C.textMuted, textAlign: 'center', marginTop: -16 }}>
          Please complete destination and dates in Step 1 to continue.
        </p>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════ */
export default function PlanPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [animDir, setAnimDir] = useState<'forward' | 'back'>('forward');
  const [visible, setVisible] = useState(true);
  const [showErrors, setShowErrors] = useState(false);

  const update = (partial: Partial<FormData>) => setForm(f => ({ ...f, ...partial }));

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
    setLoading(true);
    // TODO: call AI itinerary API
    await new Promise(r => setTimeout(r, 2200));
    setLoading(false);
    alert('Itinerary generation coming soon!');
  };

  const today = new Date().toISOString().split('T')[0];

  const canProceed = () => {
    if (step === 0) {
      return (
        !!form.state && !!form.city &&
        !!form.startDate && form.startDate >= today &&
        !!form.endDate && form.endDate >= form.startDate
      );
    }
    if (step === 1) return !!form.groupSize && !!form.budgetTier;
    return true;
  };

  const handleNext = () => {
    if (!canProceed()) { setShowErrors(true); return; }
    goTo(step + 1);
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'DM Sans', system-ui, sans-serif", color: 'white' }}>

      {/* Background aurora */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div className="aurora-a" style={{ position: 'absolute', top: '-10%', left: '20%', width: 700, height: 500, borderRadius: '50%', background: 'radial-gradient(ellipse at center, rgba(26,130,78,0.18) 0%, transparent 70%)' }} />
        <div className="aurora-b" style={{ position: 'absolute', bottom: '10%', right: '15%', width: 500, height: 400, borderRadius: '50%', background: 'radial-gradient(ellipse at center, rgba(13,107,53,0.14) 0%, transparent 70%)' }} />
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
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <LogoIcon size={30} />
            <span className="et-display" style={{ fontWeight: 700, fontSize: 20, color: 'white', letterSpacing: '-0.02em' }}>Easy Trip</span>
          </a>
          <div style={{ fontSize: 13, color: C.textMuted }}>
            Step <span style={{ color: C.greenBright, fontWeight: 600 }}>{step + 1}</span> / {STEPS.length}
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
        <div style={{ minWidth: 0 }}>
          <ProgressBar step={step} />

          {/* Step panel */}
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: `1px solid ${C.border}`,
            borderRadius: 20,
            padding: 'clamp(24px,4vw,40px)',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : animDir === 'forward' ? 'translateY(14px)' : 'translateY(-14px)',
            transition: 'opacity 0.22s ease, transform 0.22s ease',
          }}>
            {step === 0 && <Step1 data={form} onChange={update} showErrors={showErrors} />}
            {step === 1 && <Step2 data={form} onChange={update} />}
            {step === 2 && <Step3 data={form} onChange={update} />}
            {step === 3 && <Step4 data={form} onChange={update} onSubmit={handleSubmit} loading={loading} />}
          </div>

          {/* Nav buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
            <button
              onClick={() => goTo(step - 1)}
              disabled={step === 0}
              style={{
                background: 'transparent',
                border: `1px solid ${step === 0 ? 'rgba(255,255,255,0.05)' : C.border}`,
                borderRadius: 10, padding: '11px 22px',
                fontSize: 14, fontWeight: 500,
                color: step === 0 ? C.textMuted : C.textSecondary,
                cursor: step === 0 ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
                <path d="M10 4L6 8l4 4" />
              </svg>
              Back
            </button>

            {step < STEPS.length - 1 && (
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
          <Sidebar data={form} />
        </div>
      </div>

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
