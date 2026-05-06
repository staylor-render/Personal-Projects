import { useState, useMemo } from 'react';
import { Map, Fish, Globe } from 'lucide-react';
import { RIVERS } from './data/rivers.js';
import { BUCKET_LIST } from './data/bucketList.js';
import { useUSGSData } from './hooks/useUSGSData.js';
import { useWeatherData } from './hooks/useWeatherData.js';
import { useOpenMeteo } from './hooks/useOpenMeteo.js';
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
import BucketListCard from './components/BucketListCard.jsx';
import MapView from './components/MapView.jsx';

function parseDriveHours(str) {
  const match = str.match(/(\d+)h(?:\s*(\d+)m)?/);
  if (!match) return 999;
  return parseInt(match[1]) + (parseInt(match[2] ?? '0') / 60);
}

function getOverallForRiver(river, usgsData, weatherPeriods) {
  const stationData = usgsData?.[river.usgsStationId] ?? {};
  const flowCfs = stationData['00060']?.value ?? null;
  const tempC   = stationData['00010']?.value ?? null;
  const tempF   = tempC != null ? celsiusToFahrenheit(tempC) : null;
  return getOverallCondition(
    getFlowCondition(flowCfs, river),
    getTempCondition(tempF),
    getWeatherCondition(weatherPeriods)
  );
}

const TABS = [
  { id: 'norCal',  label: 'NorCal Rivers', icon: Fish },
  { id: 'bucket',  label: 'Bucket List',   icon: Globe },
  { id: 'map',     label: 'Map',           icon: Map },
];

export default function App() {
  const { data: usgsData, loading: usgsLoading, error: usgsError, lastFetched, refresh } = useUSGSData();
  const { data: weatherData, loading: weatherLoading } = useWeatherData();
  const { data: openMeteoData } = useOpenMeteo();

  const [activeTab, setActiveTab]   = useState('norCal');
  const [mapView, setMapView]       = useState('local'); // 'local' | 'world'
  const [maxDrive, setMaxDrive]     = useState(999);
  const [condFilter, setCondFilter] = useState('all');

  const filteredRivers = useMemo(() => {
    return RIVERS.filter(river => {
      if (parseDriveHours(river.driveTime) > maxDrive) return false;
      if (condFilter !== 'all') {
        const overall = getOverallForRiver(river, usgsData, weatherData[river.id]);
        if (condFilter === 'ideal' && overall !== 'ideal') return false;
        if (condFilter === 'good'  && overall === 'poor')  return false;
      }
      return true;
    });
  }, [maxDrive, condFilter, usgsData, weatherData]);

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
      <Header lastFetched={lastFetched} onRefresh={refresh} loading={usgsLoading} />

      <main className="max-w-7xl mx-auto px-4 pb-12">
        {/* Tab bar */}
        <div className="flex gap-1 mt-4 mb-2 bg-slate-900 rounded-xl p-1 w-fit">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-river-700 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* NorCal Rivers tab */}
        {activeTab === 'norCal' && (
          <>
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
                ⚠ USGS data unavailable: {usgsError}
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
          </>
        )}

        {/* Bucket List tab */}
        {activeTab === 'bucket' && (
          <div className="mt-4">
            <p className="text-slate-400 text-sm mb-4">
              Bucket list destinations with live weather and season conditions.
              <span className="ml-2 inline-flex items-center gap-1 text-emerald-400">● Prime</span>
              <span className="ml-2 inline-flex items-center gap-1 text-amber-400">● Good</span>
              <span className="ml-2 inline-flex items-center gap-1 text-slate-400">● Off Season</span>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
              {BUCKET_LIST.map(dest => (
                <BucketListCard
                  key={dest.id}
                  destination={dest}
                  weatherDays={openMeteoData[dest.id]}
                />
              ))}
            </div>
          </div>
        )}

        {/* Map tab */}
        {activeTab === 'map' && (
          <div className="mt-4 space-y-4">
            {/* Map view toggle */}
            <div className="flex items-center gap-3">
              <div className="flex gap-1 bg-slate-900 rounded-xl p-1">
                <button
                  onClick={() => setMapView('local')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    mapView === 'local' ? 'bg-river-700 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  NorCal
                </button>
                <button
                  onClick={() => setMapView('world')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    mapView === 'world' ? 'bg-river-700 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  World
                </button>
              </div>
              {/* Legend */}
              <div className="flex items-center gap-3 text-xs text-slate-400 ml-2">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" /> Ideal / Prime</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-400 inline-block" /> Fair / Good</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-400 inline-block" /> Poor</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-slate-500 inline-block" /> Off Season</span>
              </div>
            </div>
            <MapView
              usgsData={usgsData}
              weatherData={weatherData}
              openMeteoData={openMeteoData}
              view={mapView}
            />
            <p className="text-xs text-slate-600 text-center">
              Circle markers = NorCal rivers (live USGS data) · Pin markers = Bucket list destinations (season + weather)
            </p>
          </div>
        )}

        <footer className="mt-12 text-center text-xs text-slate-600 space-y-1">
          <p>Flow & temperature: <a href="https://waterservices.usgs.gov" target="_blank" rel="noopener noreferrer" className="text-river-600 hover:text-river-400">USGS Water Services</a> · Weather: <a href="https://www.weather.gov" target="_blank" rel="noopener noreferrer" className="text-river-600 hover:text-river-400">NWS</a> & <a href="https://open-meteo.com" target="_blank" rel="noopener noreferrer" className="text-river-600 hover:text-river-400">Open-Meteo</a></p>
          <p>Always check CDFW regulations and local conditions before fishing.</p>
        </footer>
      </main>
    </div>
  );
}
