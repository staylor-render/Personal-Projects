// Bucket list fly fishing destinations — no real-time flow data,
// condition is season-based + live weather from Open-Meteo

// Months are 1-indexed. hemisphere: 'north' | 'south'
export const BUCKET_LIST = [
  {
    id: 'madison-river',
    name: 'Madison River',
    region: 'Montana, USA',
    lat: 45.3516,
    lon: -111.6468,
    hemisphere: 'north',
    flag: '🇺🇸',
    species: ['Rainbow Trout', 'Brown Trout'],
    primeMonths: [6, 7, 8, 9, 10],       // Jun–Oct
    goodMonths:  [5, 11],                  // May, Nov
    closedMonths: [],
    description: 'The "50-mile riffle" — legendary freestone river through Yellowstone country. Dense hatches of salmonflies, PMDs, and hoppers. One of the most storied dry fly rivers on earth.',
    keyRivers: ['Madison River', 'Gallatin River', 'Yellowstone River'],
    nearestTown: 'Ennis, MT',
    featuredHatches: ['Salmonfly', 'PMD', 'Hopper', 'Caddis', 'Baetis'],
    travelTip: 'Book guides 6–12 months out for July. Ennis is the hub town. Bring 4–6wt.',
    bestFor: 'Dry fly, nymphing',
  },
  {
    id: 'snake-river',
    name: 'Snake River / South Fork',
    region: 'Wyoming, USA',
    lat: 43.4799,
    lon: -110.7624,
    hemisphere: 'north',
    flag: '🇺🇸',
    species: ['Cutthroat Trout', 'Brown Trout', 'Rainbow Trout'],
    primeMonths: [7, 8, 9],
    goodMonths:  [6, 10],
    closedMonths: [],
    description: 'Native Snake River fine-spotted cutthroat in the shadow of the Tetons. Float fishing through braided channels with dry flies. Postcard scenery and willing fish.',
    keyRivers: ['Snake River', 'South Fork Snake', 'Green River'],
    nearestTown: 'Jackson, WY',
    featuredHatches: ['PMx', 'Caddis', 'Hopper', 'Pale Morning Dun'],
    travelTip: 'Pair with a Grand Teton / Yellowstone trip. South Fork (Idaho side) has bigger browns.',
    bestFor: 'Float fishing, dry fly',
  },
  {
    id: 'new-zealand',
    name: 'South Island Rivers',
    region: 'New Zealand',
    lat: -44.9778,
    lon: 168.6626,
    hemisphere: 'south',
    flag: '🇳🇿',
    species: ['Brown Trout', 'Rainbow Trout'],
    // NZ fishing season: Oct 1 – Apr 30 (Southern hemisphere spring/summer/fall)
    primeMonths: [11, 12, 1, 2, 3],      // Nov–Mar
    goodMonths:  [10, 4],                  // Oct, Apr
    closedMonths: [5, 6, 7, 8, 9],        // May–Sep (closed season)
    description: 'Crystal-clear glacial rivers sight-fishing to large, wild browns. Requires stealth — fish average 4–8 lbs. The Mataura, Oreti, Wairau, and backcountry Nelson rivers are world-class.',
    keyRivers: ['Mataura River', 'Oreti River', 'Wairau River', 'Motueka River'],
    nearestTown: 'Queenstown / Nelson',
    featuredHatches: ['Cicada', 'Caddis', 'Mayfly', 'Willow Grub'],
    travelTip: 'Hire a local guide for backcountry access. Sight fishing demands a 5wt and good polarized glasses.',
    bestFor: 'Sight fishing, backcountry',
  },
  {
    id: 'patagonia',
    name: 'Patagonia Rivers',
    region: 'Argentina / Chile',
    lat: -40.9489,
    lon: -71.0834,
    hemisphere: 'south',
    flag: '🇦🇷',
    species: ['Brown Trout', 'Rainbow Trout', 'Brook Trout'],
    primeMonths: [11, 12, 1, 2, 3],      // Nov–Mar (Southern summer)
    goodMonths:  [10, 4],
    closedMonths: [5, 6, 7, 8, 9],
    description: 'Remote rivers in the Andes with enormous trout and zero pressure. The Chimehuin, Malleo, and Rio Grande are legendary. Brook trout up to 10 lbs in Tierra del Fuego.',
    keyRivers: ['Rio Chimehuin', 'Rio Malleo', 'Rio Grande (TDF)', 'Rio Limay'],
    nearestTown: 'San Martín de los Andes / Bariloche',
    featuredHatches: ['Cicada', 'Caddis', 'Hopper', 'Stonefly'],
    travelTip: 'All-inclusive lodges (estancias) are the best way in. Book a year ahead for Rio Grande sea-run browns.',
    bestFor: 'Large trout, remote wilderness, sea-run browns',
  },
];

// Returns 'prime' | 'good' | 'offseason' based on current month
export function getSeasonCondition(destination) {
  const now = new Date();
  // Adjust month for southern hemisphere (their summer = our winter)
  const month = now.getMonth() + 1; // 1-indexed

  if (destination.closedMonths.includes(month)) return 'offseason';
  if (destination.primeMonths.includes(month))  return 'prime';
  if (destination.goodMonths.includes(month))   return 'good';
  return 'offseason';
}

export const SEASON_CONFIG = {
  prime:     { label: 'Prime Season',  color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-500/40', dot: 'bg-emerald-400' },
  good:      { label: 'Good Season',   color: 'text-amber-400',   bg: 'bg-amber-400/10',   border: 'border-amber-500/40',   dot: 'bg-amber-400' },
  offseason: { label: 'Off Season',    color: 'text-slate-400',   bg: 'bg-slate-700/30',   border: 'border-slate-600/40',   dot: 'bg-slate-500' },
};
