// Scoring logic for trout fishing conditions

// Water temp thresholds (°F)
const TEMP = {
  tooLow:     40,   // trout sluggish / iced
  fairLow:    45,
  idealLow:   50,
  idealHigh:  65,
  fairHigh:   70,
  tooHigh:    75,   // trout stressed, often illegal to target
};

export function celsiusToFahrenheit(c) {
  return (c * 9) / 5 + 32;
}

export function getTempCondition(tempF) {
  if (tempF == null || isNaN(tempF)) return 'unknown';
  if (tempF < TEMP.tooLow)   return 'poor';
  if (tempF < TEMP.fairLow)  return 'fair';
  if (tempF < TEMP.idealLow) return 'fair';
  if (tempF <= TEMP.idealHigh) return 'ideal';
  if (tempF <= TEMP.fairHigh)  return 'fair';
  if (tempF <= TEMP.tooHigh)   return 'fair';
  return 'poor';
}

export function getFlowCondition(cfs, river) {
  if (cfs == null || isNaN(cfs)) return 'unknown';
  const { idealFlow, fairFlow } = river;

  if (cfs >= idealFlow.min && cfs <= idealFlow.max) return 'ideal';
  if (cfs >= fairFlow.min && cfs <= fairFlow.max)   return 'fair';
  return 'poor';
}

// Assess weather suitability for fly fishing
// Returns 'ideal' | 'fair' | 'poor' based on today's daytime forecast
export function getWeatherCondition(periods) {
  if (!periods?.length) return 'unknown';
  const today = periods.find(p => p.isDaytime) ?? periods[0];
  if (!today) return 'unknown';

  const shortForecast = today.shortForecast?.toLowerCase() ?? '';
  const highTemp = today.temp;
  const precipChance = today.precipChance ?? 0;

  // Heavy rain or snow → poor
  if (shortForecast.includes('heavy rain') || shortForecast.includes('thunderstorm') || shortForecast.includes('snow')) {
    return 'poor';
  }
  // Very hot → fair at best (fish go deep mid-day)
  if (highTemp > 95) return 'poor';
  if (highTemp > 85) return 'fair';

  // High precip chance → fair (can still fish but uncomfy; rising flows)
  if (precipChance > 60) return 'fair';

  // Overcast or light rain → often ideal for trout (less angler pressure, fish less wary)
  if (shortForecast.includes('overcast') || shortForecast.includes('cloudy')) return 'ideal';

  // Sunny / clear → fair to ideal (bright sun makes fish spooky mid-day, but mornings/evenings great)
  if (shortForecast.includes('sunny') || shortForecast.includes('clear')) return 'fair';

  return 'fair';
}

const SCORE_MAP = { ideal: 2, fair: 1, poor: 0, unknown: 1 };

// Composite fishability rating
export function getOverallCondition(flowCond, tempCond, weatherCond) {
  const score = SCORE_MAP[flowCond] + SCORE_MAP[tempCond] + SCORE_MAP[weatherCond];

  // Any "poor" hard-fails to poor (e.g. dangerously high water or hot temp)
  if (flowCond === 'poor' || tempCond === 'poor') return 'poor';

  if (score >= 5) return 'ideal';
  if (score >= 3) return 'fair';
  return 'poor';
}

export const CONDITION_CONFIG = {
  ideal:   { label: 'Ideal',   color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-500/40', dot: 'bg-emerald-400' },
  fair:    { label: 'Fair',    color: 'text-amber-400',   bg: 'bg-amber-400/10',   border: 'border-amber-500/40',   dot: 'bg-amber-400' },
  poor:    { label: 'Poor',    color: 'text-red-400',     bg: 'bg-red-400/10',     border: 'border-red-500/40',     dot: 'bg-red-400' },
  unknown: { label: 'No Data', color: 'text-slate-400',   bg: 'bg-slate-400/10',   border: 'border-slate-500/40',   dot: 'bg-slate-400' },
};

// Friendly display helpers
export function formatFlow(cfs) {
  if (cfs == null || isNaN(cfs)) return 'N/A';
  return `${Math.round(cfs).toLocaleString()} cfs`;
}

export function formatTemp(tempC) {
  if (tempC == null || isNaN(tempC)) return 'N/A';
  const f = celsiusToFahrenheit(tempC);
  return `${f.toFixed(1)}°F`;
}

export function formatDateTime(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '';
  }
}
