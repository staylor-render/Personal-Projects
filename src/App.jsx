import { useState, useMemo } from 'react';
import { RIVERS } from './data/rivers.js';
import { useUSGSData } from './hooks/useUSGSData.js';
import { useWeatherData } from './hooks/useWeatherData.js';
import {
  getFlowCondition,
  getTempCondition,
  getWeatherCondition,
  getOverallCondition,
  celsiusToFahrenheit,
} from './utils/conditions.js';
import Header from './components/Header.jsx';
import FilterBar from './components/FilterBar.jsx';
import RiverCard from './components/RiverCard.jsx';

function parseDriveHours(str) {
  // e.g. "3h 45m" → 3.75
  const match = str.match(/(\d+)h(?:\s*(\d+)m)?/);
  if (!match) return 999;
  return parseInt(match[1]) + (parseInt(match[2] ?? '0') / 60);
}

function getOverallForRiver(river, usgsData, weatherPeriods) {
  const stationData = usgsData?.[river.usgsStationId] ?? {};
  const flowCfs = stationData['00060']?.value ?? null;
  const tempC   = stationData['00010']?.value ?? null;
  const tempF   = tempC != null ? celsiusToFahrenheit(tempC) : null;
  const flowCond    = getFlowCondition(flowCfs, river);
  const tempCond    = getTempCondition(tempF);
  const weatherCond = getWeatherCondition(weatherPeriods);
  return getOverallCondition(flowCond, tempCond, weatherCond);
}

export default function App() {
  const { data: usgsData, loading: usgsLoading, error: usgsError, lastFetched, refresh } = useUSGSData();
  const { data: weatherData, loading: weatherLoading } = useWeatherData();

  const [maxDrive, setMaxDrive]     = useState(999);
  const [condFilter, setCondFilter] = useState('all');

  const filteredRivers = useMemo(() => {
    return RIVERS.filter(river => {
      const hours = parseDriveHours(river.driveTime);
      if (hours > maxDrive) return false;

      if (condFilter !== 'all') {
        const overall = getOverallForRiver(river, usgsData, weatherData[river.id]);
        if (condFilter === 'ideal' && overall !== 'ideal') return false;
        if (condFilter === 'good' && overall === 'poor')   return false;
      }

      return true;
    });
  }, [maxDrive, condFilter, usgsData, weatherData]);

  // Sort: ideal → fair → poor, then by drive time
  const sortedRivers = useMemo(() => {
    const ORDER = { ideal: 0, fair: 1, poor: 2, unknown: 3 };
    return [...filteredRivers].sort((a, b) => {
      const oa = getOverallForRiver(a, usgsData, weatherData[a.id]);
      const ob = getOverallForRiver(b, usgsData, weatherData[b.id]);
      if (ORDER[oa] !== ORDER[ob]) return ORDER[oa] - ORDER[ob];
      return parseDriveHours(a.driveTime) - parseDriveHours(b.driveTime);
    });
  }, [filteredRivers, usgsData, weatherData]);

  return (
    <div className="min-h-screen bg-slate-950">
      <Header
        lastFetched={lastFetched}
        onRefresh={refresh}
        loading={usgsLoading}
      />

      <main className="max-w-7xl mx-auto px-4 pb-12">
        <FilterBar
          maxDrive={maxDrive}
          onMaxDrive={setMaxDrive}
          condFilter={condFilter}
          onCondFilter={setCondFilter}
          count={sortedRivers.length}
          total={RIVERS.length}
        />

        {usgsError && (
          <div className="mb-4 p-3 rounded-xl bg-red-900/30 border border-red-700/40 text-red-300 text-sm">
            ⚠ USGS data unavailable: {usgsError}. Flow readings may be stale.
          </div>
        )}

        {usgsLoading && (
          <div className="mb-4 p-3 rounded-xl bg-slate-800/50 border border-slate-700/30 text-slate-400 text-sm flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-river-500 animate-ping" />
            Loading live USGS flow data…
          </div>
        )}

        {sortedRivers.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <p className="text-4xl mb-3">🎣</p>
            <p className="text-lg font-medium">No rivers match your filters</p>
            <p className="text-sm mt-1">Try widening the drive time or condition filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {sortedRivers.map(river => (
              <RiverCard
                key={river.id}
                river={river}
                usgsData={usgsData}
                weatherPeriods={weatherData[river.id]}
                weatherLoading={weatherLoading}
              />
            ))}
          </div>
        )}

        <footer className="mt-12 text-center text-xs text-slate-600 space-y-1">
          <p>Flow & temperature data from <a href="https://waterservices.usgs.gov" target="_blank" rel="noopener noreferrer" className="text-river-600 hover:text-river-400">USGS Water Services</a></p>
          <p>Weather forecasts from <a href="https://www.weather.gov" target="_blank" rel="noopener noreferrer" className="text-river-600 hover:text-river-400">National Weather Service</a></p>
          <p className="pt-1">Always check CDFW regulations and local conditions before fishing. Flow conditions are advisory only.</p>
        </footer>
      </main>
    </div>
  );
}
