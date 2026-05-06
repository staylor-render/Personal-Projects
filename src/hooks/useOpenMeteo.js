import { useState, useEffect, useCallback } from 'react';
import { BUCKET_LIST } from '../data/bucketList.js';

const BASE = 'https://api.open-meteo.com/v1/forecast';

async function fetchWeather(destination) {
  try {
    const params = new URLSearchParams({
      latitude:  destination.lat,
      longitude: destination.lon,
      daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode',
      temperature_unit: 'fahrenheit',
      timezone: 'auto',
      forecast_days: 7,
    });
    const res = await fetch(`${BASE}?${params}`);
    if (!res.ok) throw new Error(`Open-Meteo error: ${res.status}`);
    const json = await res.json();

    const { daily } = json;
    return daily.time.map((date, i) => ({
      date,
      tempMax: Math.round(daily.temperature_2m_max[i]),
      tempMin: Math.round(daily.temperature_2m_min[i]),
      precipitation: daily.precipitation_sum[i],
      weatherCode: daily.weathercode[i],
      description: wmoDescription(daily.weathercode[i]),
    }));
  } catch {
    return null;
  }
}

// WMO weather code → human readable
function wmoDescription(code) {
  if (code === 0)              return 'Clear sky';
  if (code <= 2)               return 'Partly cloudy';
  if (code === 3)              return 'Overcast';
  if (code <= 49)              return 'Foggy';
  if (code <= 55)              return 'Drizzle';
  if (code <= 67)              return 'Rain';
  if (code <= 77)              return 'Snow';
  if (code <= 82)              return 'Rain showers';
  if (code <= 86)              return 'Snow showers';
  if (code <= 99)              return 'Thunderstorm';
  return 'Unknown';
}

export function wmoIcon(code) {
  if (code === 0)   return '☀️';
  if (code <= 2)    return '⛅';
  if (code === 3)   return '☁️';
  if (code <= 49)   return '🌫️';
  if (code <= 67)   return '🌧️';
  if (code <= 77)   return '❄️';
  if (code <= 82)   return '🌦️';
  if (code <= 86)   return '🌨️';
  if (code <= 99)   return '⛈️';
  return '🌡️';
}

export function useOpenMeteo() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const results = {};
    for (let i = 0; i < BUCKET_LIST.length; i++) {
      if (i > 0) await new Promise(r => setTimeout(r, 200));
      const dest = BUCKET_LIST[i];
      results[dest.id] = await fetchWeather(dest);
    }
    setData(results);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  return { data, loading };
}
