import { useState, useEffect, useCallback } from 'react';
import { RIVERS } from '../data/rivers.js';

const NWS_BASE = 'https://api.weather.gov';

// Rough NWS office grid assignments for Northern CA rivers
// Pre-resolved to avoid one extra round-trip per river
const NWS_GRIDS = {
  'sac-upper':      { office: 'STO', x: 55,  y: 111 },
  'sac-tailwater':  { office: 'STO', x: 48,  y: 101 },
  'hat-creek':      { office: 'STO', x: 79,  y: 108 },
  'fall-river':     { office: 'STO', x: 85,  y: 110 },
  'mccloud':        { office: 'STO', x: 55,  y: 114 },
  'trinity-lewiston':{ office: 'EKA', x: 48,  y: 60  },
  'feather-nf':     { office: 'STO', x: 75,  y: 97  },
  'yuba-south':     { office: 'STO', x: 78,  y: 90  },
  'american-nf':    { office: 'STO', x: 83,  y: 87  },
  'truckee':        { office: 'REV', x: 34,  y: 75  },
  'russian-river':  { office: 'MTR', x: 66,  y: 108 },
};

async function fetchForecastForRiver(river) {
  try {
    // Use dynamic points lookup — more reliable than hardcoded grids
    const pointsRes = await fetch(
      `${NWS_BASE}/points/${river.lat.toFixed(4)},${river.lon.toFixed(4)}`,
      { headers: { 'User-Agent': 'NorCalFlyFishing/1.0 (contact@example.com)' } }
    );
    if (!pointsRes.ok) throw new Error(`Points API: ${pointsRes.status}`);
    const pointsData = await pointsRes.json();

    const forecastUrl = pointsData.properties?.forecast;
    if (!forecastUrl) throw new Error('No forecast URL');

    const forecastRes = await fetch(forecastUrl, {
      headers: { 'User-Agent': 'NorCalFlyFishing/1.0 (contact@example.com)' },
    });
    if (!forecastRes.ok) throw new Error(`Forecast API: ${forecastRes.status}`);
    const forecastData = await forecastRes.json();

    const periods = forecastData.properties?.periods ?? [];
    // Return next 8 periods (4 days: day + night pairs)
    return periods.slice(0, 8).map(p => ({
      name: p.name,
      temp: p.temperature,
      tempUnit: p.temperatureUnit,
      isDaytime: p.isDaytime,
      shortForecast: p.shortForecast,
      detailedForecast: p.detailedForecast,
      windSpeed: p.windSpeed,
      windDirection: p.windDirection,
      icon: p.icon,
      precipChance: p.probabilityOfPrecipitation?.value ?? null,
    }));
  } catch {
    return null;
  }
}

export function useWeatherData() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    // Stagger requests slightly to avoid rate-limiting NWS
    const results = {};
    for (let i = 0; i < RIVERS.length; i++) {
      const river = RIVERS[i];
      if (i > 0) await new Promise(r => setTimeout(r, 300));
      results[river.id] = await fetchForecastForRiver(river);
    }
    setData(results);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    // NWS forecast updates every hour
    const interval = setInterval(fetchAll, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  return { data, loading };
}
