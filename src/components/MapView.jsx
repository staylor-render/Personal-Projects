import { MapContainer, TileLayer, CircleMarker, Marker, Popup, useMap } from 'react-leaflet';
import { divIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { RIVERS } from '../data/rivers.js';
import { BUCKET_LIST, getSeasonCondition, SEASON_CONFIG } from '../data/bucketList.js';
import {
  getFlowCondition,
  getTempCondition,
  getWeatherCondition,
  getOverallCondition,
  celsiusToFahrenheit,
  formatFlow,
  formatTemp,
  formatDateTime,
} from '../utils/conditions.js';

const CONDITION_COLORS = {
  ideal:   '#34d399',
  fair:    '#fbbf24',
  poor:    '#f87171',
  unknown: '#94a3b8',
};

const SEASON_COLORS = {
  prime:     '#34d399',
  good:      '#fbbf24',
  offseason: '#475569',
};

function FitBounds({ bounds }) {
  const map = useMap();
  if (bounds) map.fitBounds(bounds, { padding: [40, 40] });
  return null;
}

function RiverMarker({ river, usgsData, weatherPeriods }) {
  const stationData = usgsData?.[river.usgsStationId] ?? {};
  const flowCfs = stationData['00060']?.value ?? null;
  const tempC   = stationData['00010']?.value ?? null;
  const tempF   = tempC != null ? celsiusToFahrenheit(tempC) : null;

  const flowCond    = getFlowCondition(flowCfs, river);
  const tempCond    = getTempCondition(tempF);
  const weatherCond = getWeatherCondition(weatherPeriods);
  const overall     = getOverallCondition(flowCond, tempCond, weatherCond);
  const color       = CONDITION_COLORS[overall];

  return (
    <CircleMarker
      center={[river.lat, river.lon]}
      radius={10}
      pathOptions={{ color, fillColor: color, fillOpacity: 0.85, weight: 2 }}
    >
      <Popup className="river-popup">
        <div className="min-w-[180px] text-sm font-sans">
          <p className="font-bold text-base mb-0.5">{river.name}</p>
          <p className="text-gray-500 text-xs mb-2">{river.location} · {river.driveTime} from Orinda</p>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500">Flow</span>
              <span className="font-semibold">{formatFlow(flowCfs)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Water Temp</span>
              <span className="font-semibold">{formatTemp(tempC)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Condition</span>
              <span className="font-semibold capitalize" style={{ color }}>{overall}</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">{river.species.join(', ')}</p>
        </div>
      </Popup>
    </CircleMarker>
  );
}

function BucketListMarker({ destination, weatherDays, usgsData }) {
  const season = getSeasonCondition(destination);
  const cfg    = SEASON_CONFIG[season];
  const today  = weatherDays?.[0];

  // For US destinations with USGS data, blend season + live flow into marker color
  const stationData = destination.usgsStationId ? (usgsData?.[destination.usgsStationId] ?? {}) : {};
  const flowCfs  = stationData['00060']?.value ?? null;
  const flowCond = destination.idealFlow ? getFlowCondition(flowCfs, destination) : null;
  const liveColor = flowCond ? CONDITION_COLORS[flowCond] : null;
  const color = liveColor ?? SEASON_COLORS[season];

  const icon = divIcon({
    html: `<div style="
      background:${color};
      width:28px;height:28px;
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      border:2px solid rgba(255,255,255,0.6);
      box-shadow:0 2px 6px rgba(0,0,0,0.4);
    "></div>`,
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -30],
  });

  return (
    <Marker position={[destination.lat, destination.lon]} icon={icon}>
      <Popup>
        <div className="min-w-[200px] text-sm font-sans">
          <p className="font-bold text-base mb-0.5">
            {destination.flag} {destination.name}
          </p>
          <p className="text-gray-500 text-xs mb-2">{destination.region}</p>
          <div className="flex items-center gap-1.5 mb-2">
            <span className="inline-block w-2 h-2 rounded-full" style={{ background: color }} />
            <span className="font-semibold text-xs" style={{ color }}>{cfg.label}</span>
          </div>
          {today && (
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500">Today</span>
              <span className="font-semibold">{today.tempMax}°F / {today.tempMin}°F</span>
            </div>
          )}
          <p className="text-xs text-gray-400 mt-2">{destination.species.join(', ')}</p>
          <p className="text-xs text-gray-400 italic mt-1">{destination.bestFor}</p>
        </div>
      </Popup>
    </Marker>
  );
}

export default function MapView({ usgsData, weatherData, openMeteoData, view }) {
  // 'local' = zoomed to NorCal, 'world' = full world view
  const isWorld = view === 'world';

  const center = isWorld ? [20, 0] : [39.5, -121.5];
  const zoom   = isWorld ? 2 : 6;

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-800" style={{ height: '600px' }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%', background: '#0f172a' }}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={19}
        />

        {/* NorCal rivers */}
        {RIVERS.map(river => (
          <RiverMarker
            key={river.id}
            river={river}
            usgsData={usgsData}
            weatherPeriods={weatherData[river.id]}
          />
        ))}

        {/* Bucket list destinations */}
        {(isWorld || !isWorld) && BUCKET_LIST.map(dest => (
          <BucketListMarker
            key={dest.id}
            destination={dest}
            weatherDays={openMeteoData[dest.id]}
            usgsData={usgsData}
          />
        ))}
      </MapContainer>
    </div>
  );
}
