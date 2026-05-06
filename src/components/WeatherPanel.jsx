import { Cloud, Sun, CloudRain, CloudSnow, Wind, Droplets } from 'lucide-react';

function WeatherIcon({ forecast, size = 16 }) {
  const f = (forecast ?? '').toLowerCase();
  if (f.includes('snow'))  return <CloudSnow  size={size} className="text-blue-300" />;
  if (f.includes('rain') || f.includes('shower') || f.includes('drizzle'))
    return <CloudRain size={size} className="text-blue-400" />;
  if (f.includes('thunder')) return <CloudRain size={size} className="text-yellow-400" />;
  if (f.includes('cloud') || f.includes('overcast'))
    return <Cloud size={size} className="text-slate-300" />;
  return <Sun size={size} className="text-yellow-300" />;
}

function DayCard({ period }) {
  if (!period) return null;
  const dayLabel = period.name.replace('This ', '').replace('Tonight', 'Tonight');

  return (
    <div className="flex flex-col items-center gap-1 min-w-[52px] px-2 py-1.5 rounded-lg bg-slate-800/60">
      <span className="text-[10px] text-slate-400 font-medium truncate max-w-full">{dayLabel}</span>
      <WeatherIcon forecast={period.shortForecast} size={18} />
      <span className="text-sm font-semibold text-white">{period.temp}°</span>
      {period.precipChance != null && period.precipChance > 10 && (
        <span className="text-[10px] text-blue-400 flex items-center gap-0.5">
          <Droplets size={9} />{period.precipChance}%
        </span>
      )}
    </div>
  );
}

export default function WeatherPanel({ periods, loading }) {
  if (loading) {
    return (
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="min-w-[52px] h-20 rounded-lg bg-slate-800/40 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!periods?.length) {
    return <p className="text-xs text-slate-500 italic">Weather unavailable</p>;
  }

  // Show daytime periods only (skip night pairs) — max 5 days
  const daytime = periods.filter(p => p.isDaytime).slice(0, 5);
  const today = periods[0]; // first period may be today daytime or tonight

  return (
    <div className="space-y-2">
      {/* Today's summary line */}
      {today && (
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <WeatherIcon forecast={today.shortForecast} size={14} />
          <span className="truncate">{today.shortForecast}</span>
          {today.windSpeed && (
            <span className="flex items-center gap-1 text-slate-500 ml-auto flex-shrink-0">
              <Wind size={10} />{today.windSpeed}
            </span>
          )}
        </div>
      )}
      {/* 5-day strip */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
        {daytime.map((p, i) => <DayCard key={i} period={p} />)}
      </div>
    </div>
  );
}
