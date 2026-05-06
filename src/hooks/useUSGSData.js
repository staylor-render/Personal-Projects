import { useState, useEffect, useCallback } from 'react';
import { RIVERS } from '../data/rivers.js';
import { BUCKET_LIST } from '../data/bucketList.js';

// All USGS station IDs to fetch in one request (NorCal + US bucket list)
function getAllStationIds() {
  const bucketIds = BUCKET_LIST
    .filter(d => d.usgsStationId)
    .map(d => d.usgsStationId);
  return [...RIVERS.map(r => r.usgsStationId), ...bucketIds];
}

const USGS_BASE = 'https://waterservices.usgs.gov/nwis/iv/';

// 48 hours of 15-min data — enough for trend detection and a sparkline
const PERIOD = 'P2D';

// 00060 = discharge (cfs), 00010 = water temperature (°C)
const PARAMS = '00060,00010';

function parseTimeSeries(data) {
  const results = {};

  if (!data?.value?.timeSeries) return results;

  for (const series of data.value.timeSeries) {
    const siteId = series.sourceInfo?.siteCode?.[0]?.value;
    const paramCode = series.variable?.variableCode?.[0]?.value;
    const rawValues = series.values?.[0]?.value ?? [];

    if (!siteId || !paramCode || rawValues.length === 0) continue;

    // Filter out masked/missing values (USGS uses "-999999" for no-data)
    const valid = rawValues.filter(v => parseFloat(v.value) > -999000);
    if (valid.length === 0) continue;

    if (!results[siteId]) results[siteId] = {};

    const latest = valid[valid.length - 1];
    // Compare to reading ~6 hours ago for trend
    const sixHoursBack = valid[Math.max(0, valid.length - 25)];

    const latestVal = parseFloat(latest.value);
    const earlierVal = parseFloat(sixHoursBack.value);
    const pctChange = ((latestVal - earlierVal) / earlierVal) * 100;

    let trend = 'stable';
    if (pctChange > 5) trend = 'rising';
    else if (pctChange < -5) trend = 'falling';

    // Build sparkline from last 24 hours (96 readings at 15-min intervals)
    const sparkline = valid
      .slice(-96)
      .map(v => ({ t: v.dateTime, v: parseFloat(v.value) }));

    results[siteId][paramCode] = {
      value: latestVal,
      dateTime: latest.dateTime,
      unit: series.variable?.unit?.unitCode ?? '',
      trend,
      sparkline,
    };
  }

  return results;
}

export function useUSGSData() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const siteIds = getAllStationIds().join(',');
      const url = `${USGS_BASE}?format=json&sites=${siteIds}&parameterCd=${PARAMS}&period=${PERIOD}&siteStatus=active`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`USGS API error: ${res.status}`);
      const json = await res.json();

      setData(parseTimeSeries(json));
      setLastFetched(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    // Refresh every 30 minutes
    const interval = setInterval(fetchAll, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  return { data, loading, error, lastFetched, refresh: fetchAll };
}
