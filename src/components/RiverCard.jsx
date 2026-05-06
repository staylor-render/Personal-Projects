import { TrendingUp, TrendingDown, Minus, MapPin, Clock, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import ConditionBadge from './ConditionBadge.jsx';
import WeatherPanel from './WeatherPanel.jsx';
import Sparkline from './Sparkline.jsx';
import {
  formatFlow,
  formatTemp,
  formatDateTime,
  celsiusToFahrenheit,
  getFlowCondition,
  getTempCondition,
  getWeatherCondition,
  getOverallCondition,
  CONDITION_CONFIG,
} from '../utils/conditions.js';

function TrendIcon({ trend }) {
  if (trend === 'rising')  return <TrendingUp  size={13} className="text-red-400"   aria-label="Rising" />;
  if (trend === 'falling') return <TrendingDown size={13} className="text-blue-400"  aria-label="Falling" />;
  return <Minus size={13} className="text-slate-500" aria-label="Stable" />;
}

function StatRow({ label, value, condition, trend, sparkline, sparkColor }) {
  const cfg = CONDITION_CONFIG[condition] ?? CONDITION_CONFIG.unknown;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-slate-400">{label}</span>
        <div className="flex items-center gap-2">
          {trend && <TrendIcon trend={trend} />}
          <span className={`text-sm font-semibold ${cfg.color}`}>{value}</span>
          <ConditionBadge condition={condition} size="sm" />
        </div>
      </div>
      {sparkline && (
        <Sparkline data={sparkline} color={sparkColor} height={28} />
      )}
    </div>
  );
}

export default function RiverCard({ river, usgsData, weatherPeriods, weatherLoading }) {
  const [expanded, setExpanded] = useState(false);

  const stationData = usgsData?.[river.usgsStationId] ?? {};
  const flowEntry = stationData['00060'];
  const tempEntry = stationData['00010'];

  const flowCfs = flowEntry?.value ?? null;
  const tempC   = tempEntry?.value ?? null;
  const tempF   = tempC != null ? celsiusToFahrenheit(tempC) : null;

  const flowCond    = getFlowCondition(flowCfs, river);
  const tempCond    = getTempCondition(tempF);
  const weatherCond = getWeatherCondition(weatherPeriods);
  const overall     = getOverallCondition(flowCond, tempCond, weatherCond);

  const overallCfg = CONDITION_CONFIG[overall] ?? CONDITION_CONFIG.unknown;

  const usgsUrl = `https://waterdata.usgs.gov/monitoring-location/${river.usgsStationId}/`;

  return (
    <article
      className={`rounded-2xl border bg-slate-900 overflow-hidden transition-all duration-200
        ${overallCfg.border} hover:shadow-lg hover:shadow-black/30`}
    >
      {/* Top color bar */}
      <div className={`h-1 w-full ${overallCfg.dot}`} />

      <div className="p-4 space-y-4">

        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-white leading-tight truncate">
              {river.name}
            </h2>
            <p className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
              <MapPin size={11} className="flex-shrink-0" />
              {river.location}
              <span className="mx-1 text-slate-600">·</span>
              <Clock size={11} className="flex-shrink-0" />
              {river.driveTime}
            </p>
          </div>
          <ConditionBadge condition={overall} />
        </div>

        {/* Flow & Temp metrics */}
        <div className="space-y-2 bg-slate-800/40 rounded-xl p-3">
          <StatRow
            label="Flow"
            value={formatFlow(flowCfs)}
            condition={flowCond}
            trend={flowEntry?.trend}
            sparkline={flowEntry?.sparkline}
            sparkColor={flowCond === 'ideal' ? '#34d399' : flowCond === 'fair' ? '#fbbf24' : '#f87171'}
          />

          <div className="border-t border-slate-700/50" />

          <StatRow
            label="Water Temp"
            value={formatTemp(tempC)}
            condition={tempCond}
          />

          {flowEntry?.dateTime && (
            <p className="text-[10px] text-slate-600 text-right">
              Last reading {formatDateTime(flowEntry.dateTime)}
            </p>
          )}
        </div>

        {/* Ideal flow range info */}
        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <span className="flex-shrink-0">Ideal range:</span>
          <span className="font-medium text-slate-400">
            {river.idealFlow.min.toLocaleString()}–{river.idealFlow.max.toLocaleString()} cfs
          </span>
          <span className="flex-shrink-0 ml-1">·</span>
          <span className="text-river-400 font-medium">{river.type}</span>
        </div>

        {/* Weather */}
        <div className="space-y-1.5">
          <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Forecast
          </h3>
          <WeatherPanel periods={weatherPeriods} loading={weatherLoading} />
        </div>

        {/* Species tags */}
        <div className="flex flex-wrap gap-1.5">
          {river.species.map(s => (
            <span
              key={s}
              className="text-[10px] px-2 py-0.5 rounded-full bg-river-900/60 text-river-300 border border-river-800/40"
            >
              {s}
            </span>
          ))}
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(e => !e)}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors w-full justify-center pt-1"
        >
          {expanded ? (
            <><ChevronUp size={13} /> Less info</>
          ) : (
            <><ChevronDown size={13} /> More info</>
          )}
        </button>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-slate-800 px-4 pb-4 pt-3 space-y-3 bg-slate-950/40">
          <p className="text-xs text-slate-300 leading-relaxed">{river.description}</p>

          <div className="space-y-1 text-xs">
            <p className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Regulations</p>
            <p className="text-slate-300">{river.regulations}</p>
          </div>

          <div className="space-y-1 text-xs">
            <p className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Featured Hatches</p>
            <div className="flex flex-wrap gap-1">
              {river.featuredHatches.map(h => (
                <span key={h} className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 text-[10px]">{h}</span>
              ))}
            </div>
          </div>

          <div className="space-y-1 text-xs">
            <p className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Best Seasons</p>
            <p className="text-slate-300">{river.bestSeasons.join(', ')}</p>
          </div>

          <div className="space-y-1 text-xs">
            <p className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Directions from Orinda</p>
            <p className="text-slate-300">{river.driveNotes}</p>
          </div>

          <a
            href={usgsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[11px] text-river-400 hover:text-river-300 transition-colors"
          >
            <ExternalLink size={11} />
            View USGS gauge data
          </a>
        </div>
      )}
    </article>
  );
}
