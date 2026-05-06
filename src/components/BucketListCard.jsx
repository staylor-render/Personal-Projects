import { useState } from 'react';
import { Globe, ChevronDown, ChevronUp, Plane, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getSeasonCondition, SEASON_CONFIG } from '../data/bucketList.js';
import { wmoIcon } from '../hooks/useOpenMeteo.js';
import {
  formatFlow, formatTemp, formatDateTime,
  celsiusToFahrenheit, getFlowCondition, getTempCondition, CONDITION_CONFIG,
} from '../utils/conditions.js';
import ConditionBadge from './ConditionBadge.jsx';
import Sparkline from './Sparkline.jsx';

function TrendIcon({ trend }) {
  if (trend === 'rising')  return <TrendingUp  size={13} className="text-red-400" />;
  if (trend === 'falling') return <TrendingDown size={13} className="text-blue-400" />;
  return <Minus size={13} className="text-slate-500" />;
}

function SeasonBadge({ destination }) {
  const season = getSeasonCondition(destination);
  const cfg = SEASON_CONFIG[season];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold tracking-wide border text-xs px-3 py-1 ${cfg.color} ${cfg.bg} ${cfg.border}`}>
      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function WeatherStrip({ days }) {
  if (!days?.length) return <p className="text-xs text-slate-500 italic">Weather unavailable</p>;
  return (
    <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
      {days.slice(0, 5).map((day, i) => (
        <div key={i} className="flex flex-col items-center gap-1 min-w-[52px] px-2 py-1.5 rounded-lg bg-slate-800/60">
          <span className="text-[10px] text-slate-400">
            {i === 0 ? 'Today' : new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
          </span>
          <span className="text-lg leading-none">{wmoIcon(day.weatherCode)}</span>
          <span className="text-sm font-semibold text-white">{day.tempMax}°</span>
          {day.precipitation > 0 && (
            <span className="text-[10px] text-blue-400">{day.precipitation.toFixed(0)}mm</span>
          )}
        </div>
      ))}
    </div>
  );
}

export default function BucketListCard({ destination, weatherDays, usgsData }) {
  const [expanded, setExpanded] = useState(false);
  const season = getSeasonCondition(destination);
  const cfg = SEASON_CONFIG[season];

  // Live USGS data — only present for US destinations
  const stationData = destination.usgsStationId ? (usgsData?.[destination.usgsStationId] ?? {}) : {};
  const flowEntry = stationData['00060'];
  const tempEntry = stationData['00010'];
  const flowCfs = flowEntry?.value ?? null;
  const tempC   = tempEntry?.value ?? null;
  const tempF   = tempC != null ? celsiusToFahrenheit(tempC) : null;
  const flowCond = destination.idealFlow ? getFlowCondition(flowCfs, destination) : 'unknown';
  const tempCond = getTempCondition(tempF);
  const hasLiveData = !!destination.usgsStationId;

  return (
    <article className={`rounded-2xl border bg-slate-900 overflow-hidden transition-all duration-200 ${cfg.border} hover:shadow-lg hover:shadow-black/30`}>
      <div className={`h-1 w-full ${cfg.dot}`} />

      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-white leading-tight flex items-center gap-2">
              <span>{destination.flag}</span>
              <span className="truncate">{destination.name}</span>
            </h2>
            <p className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
              <Globe size={11} className="flex-shrink-0" />
              {destination.region}
            </p>
          </div>
          <SeasonBadge destination={destination} />
        </div>

        {/* Species */}
        <div className="flex flex-wrap gap-1.5">
          {destination.species.map(s => (
            <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-river-900/60 text-river-300 border border-river-800/40">
              {s}
            </span>
          ))}
        </div>

        {/* Live USGS flow + temp — US destinations only */}
        {hasLiveData && (
          <div className="space-y-2 bg-slate-800/40 rounded-xl p-3">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Live Conditions (USGS)</p>

            {/* Flow */}
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-400">Flow</span>
                <div className="flex items-center gap-2">
                  {flowEntry?.trend && <TrendIcon trend={flowEntry.trend} />}
                  <span className={`text-sm font-semibold ${(CONDITION_CONFIG[flowCond] ?? CONDITION_CONFIG.unknown).color}`}>
                    {formatFlow(flowCfs)}
                  </span>
                  <ConditionBadge condition={flowCond} size="sm" />
                </div>
              </div>
              {flowEntry?.sparkline && (
                <Sparkline
                  data={flowEntry.sparkline}
                  color={flowCond === 'ideal' ? '#34d399' : flowCond === 'fair' ? '#fbbf24' : '#f87171'}
                  height={28}
                />
              )}
            </div>

            <div className="border-t border-slate-700/50" />

            {/* Water temp */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-slate-400">Water Temp</span>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold ${(CONDITION_CONFIG[tempCond] ?? CONDITION_CONFIG.unknown).color}`}>
                  {formatTemp(tempC)}
                </span>
                <ConditionBadge condition={tempCond} size="sm" />
              </div>
            </div>

            {flowEntry?.dateTime && (
              <p className="text-[10px] text-slate-600 text-right">
                Last reading {formatDateTime(flowEntry.dateTime)}
              </p>
            )}

            <div className="text-[11px] text-slate-500">
              Ideal range: <span className="text-slate-400 font-medium">
                {destination.idealFlow.min.toLocaleString()}–{destination.idealFlow.max.toLocaleString()} cfs
              </span>
            </div>
          </div>
        )}

        {/* Best for */}
        <p className="text-xs text-slate-400 italic">{destination.bestFor}</p>

        {/* Weather */}
        <div className="space-y-1.5">
          <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Current Weather</h3>
          <WeatherStrip days={weatherDays} />
        </div>

        {/* Key rivers */}
        <div className="space-y-1">
          <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Key Rivers</p>
          <div className="flex flex-wrap gap-1">
            {destination.keyRivers.map(r => (
              <span key={r} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">{r}</span>
            ))}
          </div>
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(e => !e)}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors w-full justify-center pt-1"
        >
          {expanded ? <><ChevronUp size={13} /> Less info</> : <><ChevronDown size={13} /> More info</>}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-slate-800 px-4 pb-4 pt-3 space-y-3 bg-slate-950/40">
          <p className="text-xs text-slate-300 leading-relaxed">{destination.description}</p>

          <div className="space-y-1 text-xs">
            <p className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Featured Hatches</p>
            <div className="flex flex-wrap gap-1">
              {destination.featuredHatches.map(h => (
                <span key={h} className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 text-[10px]">{h}</span>
              ))}
            </div>
          </div>

          <div className="space-y-1 text-xs">
            <p className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Travel Tip</p>
            <p className="text-slate-300 flex gap-2">
              <Plane size={12} className="flex-shrink-0 mt-0.5 text-river-400" />
              {destination.travelTip}
            </p>
          </div>

          <div className="space-y-1 text-xs">
            <p className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Nearest Hub</p>
            <p className="text-slate-300">{destination.nearestTown}</p>
          </div>
        </div>
      )}
    </article>
  );
}
