import React, { useState, useEffect, useRef } from 'react';
import './index.css';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, CircleMarker, Popup, Circle, useMap } from 'react-leaflet';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line, Scatter } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const API = 'http://localhost:8005';
const WS  = 'ws://localhost:8005';
const MAX_CAPACITY_KW = 8000;

// Substation display names for Palo Alto grid
const SUBSTATION_NAMES = {
  'SUB-PA-01': 'Downtown Corridor',
  'SUB-PA-02': 'California Ave',
  'SUB-PA-03': 'Stanford Research Park',
  'SUB-PA-04': 'Foothills / Midtown',
  'SUB-101': 'Downtown Corridor',
  'SUB-102': 'California Ave',
  'SUB-103': 'Stanford Research Park',
  'SUB-104': 'Foothills / Midtown',
};

// Clean Inline SVG Icons
const Icons = {
  Zap: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  BarChart: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  LineChart: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  Map: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" y1="2" x2="8" y2="18" />
      <line x1="16" y1="6" x2="16" y2="22" />
    </svg>
  ),
  Grid: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  ),
  Pause: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  ),
  Play: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  ),
  AlertTriangle: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  CheckCircle: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  Cpu: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <line x1="9" y1="1" x2="9" y2="4" /><line x1="15" y1="1" x2="15" y2="4" />
      <line x1="9" y1="20" x2="9" y2="23" /><line x1="15" y1="20" x2="15" y2="23" />
      <line x1="20" y1="9" x2="23" y2="9" /><line x1="20" y1="14" x2="23" y2="14" />
      <line x1="1" y1="9" x2="4" y2="9" /><line x1="1" y1="14" x2="4" y2="14" />
    </svg>
  ),
  Database: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  ),
  Radio: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="2" />
      <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" />
    </svg>
  ),
  Layers: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  ),
  Activity: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
};

function MapBoundsUpdater({ stations }) {
  const map = useMap();
  const centeredRef = useRef(false);

  useEffect(() => {
    if (!stations || stations.length === 0) return;
    const lats = stations.map(s => s.latitude).filter(Boolean);
    const lons = stations.map(s => s.longitude).filter(Boolean);
    if (lats.length > 0 && lons.length > 0 && !centeredRef.current) {
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLon = Math.min(...lons);
      const maxLon = Math.max(...lons);
      map.fitBounds([
        [minLat - 0.006, minLon - 0.006],
        [maxLat + 0.006, maxLon + 0.006]
      ], { padding: [25, 25], maxZoom: 14 });
      centeredRef.current = true;
    }
  }, [stations, map]);

  return null;
}

function App() {
  const [metrics, setMetrics] = useState([]);
  const [stations, setStations] = useState([]);
  const [clusters, setClusters] = useState(null);
  const [systemStatus, setSystemStatus] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loadHistory, setLoadHistory] = useState([]);
  const [mapFilter, setMapFilter] = useState('all');
  const [mapViewMode, setMapViewMode] = useState('map'); // 'map' or 'scatter'
  const [tileProvider, setTileProvider] = useState('esri'); // 'esri' or 'osm'
  
  // Freeze / Pause Stream Control
  const [isPaused, setIsPaused] = useState(false);
  const [refreshIntervalSec, setRefreshIntervalSec] = useState(5);
  
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;
  
  const latestMetricsRef = useRef([]);
  const latestClustersRef = useRef(null);
  const latestStationsRef = useRef([]);
  const wsRef = useRef(null);

  // Clock
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Continuous Telemetry Ingest via WebSocket
  useEffect(() => {
    const connectWs = () => {
      const ws = new WebSocket(`${WS}/ws/live-telemetry`);
      wsRef.current = ws;
      ws.onopen = () => setSocketConnected(true);
      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === 'GRID_UPDATE') {
          latestMetricsRef.current = msg.data || [];
          if (msg.clusters) latestClustersRef.current = { trained: true, data: msg.clusters };
        }
      };
      ws.onclose = () => { setSocketConnected(false); setTimeout(connectWs, 3000); };
    };
    connectWs();
    return () => { if (wsRef.current) wsRef.current.close(); };
  }, []);

  // Station & System Status Poller
  useEffect(() => {
    const fetchExtra = () => {
      fetch(`${API}/api/v1/stations`).then(r => r.json()).then(d => { if (d.data) latestStationsRef.current = d.data; }).catch(() => {});
      fetch(`${API}/api/v1/clusters`).then(r => r.json()).then(d => { if (d.trained) latestClustersRef.current = d; }).catch(() => {});
      fetch(`${API}/api/v1/system-status`).then(r => r.json()).then(d => setSystemStatus(d)).catch(() => {});
    };
    fetchExtra();
    const interval = setInterval(fetchExtra, 5000);
    return () => clearInterval(interval);
  }, []);

  // UI Sync playback loop (strictly respects isPaused)
  useEffect(() => {
    const syncUI = () => {
      if (isPausedRef.current) return;
      if (latestMetricsRef.current.length > 0) {
        setMetrics([...latestMetricsRef.current]);
        
        // Append to historical trend strictly when active / not paused
        const totalLoad = latestMetricsRef.current.reduce((a, c) => a + (c.total_load_kw || 0), 0);
        const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        setLoadHistory(prev => {
          const next = [...prev, { time: timestamp, load: Math.round(totalLoad) }];
          return next.slice(-25);
        });
      }
      if (latestClustersRef.current) setClusters(latestClustersRef.current);
      if (latestStationsRef.current.length > 0) setStations([...latestStationsRef.current]);
    };
    syncUI();
    const playbackInterval = setInterval(syncUI, refreshIntervalSec * 1000);
    return () => clearInterval(playbackInterval);
  }, [refreshIntervalSec]);

  // Network stats
  const totalNetworkLoad = metrics.reduce((a, c) => a + (c.total_load_kw || 0), 0);
  const avgVoltage = metrics.length ? metrics.reduce((a, c) => a + (c.avg_voltage_v || 0), 0) / metrics.length : 400.0;
  const totalAnomalies = metrics.reduce((a, c) => a + (c.has_anomalies || 0), 0);
  const activeStations = stations.filter(s => s.is_charging).length;
  const capacityPct = Math.min((totalNetworkLoad / MAX_CAPACITY_KW) * 100, 100);
  const clustersTrained = clusters && clusters.trained && clusters.data && clusters.data.length > 0;

  // Substation Bar Chart Data
  const barData = {
    labels: metrics.map(m => SUBSTATION_NAMES[m.substation_id] || m.substation_id),
    datasets: [{
      label: 'Active Load (kW)',
      data: metrics.map(m => Math.round(m.total_load_kw || 0)),
      backgroundColor: metrics.map(m => (m.has_anomalies ? 'rgba(224, 82, 100, 0.85)' : 'rgba(45, 212, 168, 0.85)')),
      borderColor: metrics.map(m => (m.has_anomalies ? '#e05264' : '#2dd4a8')),
      borderWidth: 1.5,
      borderRadius: 8,
      borderSkipped: false,
    }],
  };
  
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(24, 24, 27, 0.95)',
        titleColor: '#e8e6e3',
        bodyColor: '#a09b93',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 10,
        callbacks: {
          label: (ctx) => `Load: ${ctx.parsed.y.toLocaleString()} kW`
        }
      }
    },
    scales: {
      y: {
        min: 0,
        ticks: { color: '#a09b93', font: { family: 'JetBrains Mono', size: 10 } },
        grid: { color: 'rgba(255,255,255,0.06)' },
        border: { display: false }
      },
      x: {
        ticks: { color: '#a09b93', font: { family: 'Outfit', size: 11, weight: '500' } },
        grid: { display: false },
        border: { display: false }
      },
    },
  };

  // Dynamic Y bounds for line chart to make the waveform look alive
  const minHistoricalLoad = loadHistory.length > 0 ? Math.min(...loadHistory.map(h => h.load)) : 3000;
  const maxHistoricalLoad = loadHistory.length > 0 ? Math.max(...loadHistory.map(h => h.load)) : 5000;
  const yAxisMin = Math.max(0, Math.floor(minHistoricalLoad / 100) * 100 - 300);
  const yAxisMax = Math.ceil(maxHistoricalLoad / 100) * 100 + 300;

  const lineData = {
    labels: loadHistory.map(h => h.time),
    datasets: [{
      label: 'Network Load (kW)',
      data: loadHistory.map(h => h.load),
      borderColor: '#e6a817',
      backgroundColor: 'rgba(230, 168, 23, 0.08)',
      tension: 0.35,
      fill: true,
      pointRadius: 2.5,
      pointBackgroundColor: '#e6a817',
      pointBorderColor: '#121212',
      pointBorderWidth: 1.5,
      borderWidth: 2.5,
    }],
  };
  
  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: isPaused ? false : { duration: 300 },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(24, 24, 27, 0.95)',
        titleColor: '#e8e6e3',
        bodyColor: '#a09b93',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: (ctx) => `Aggregate Load: ${ctx.parsed.y.toLocaleString()} kW`
        }
      }
    },
    scales: {
      y: {
        min: yAxisMin,
        max: yAxisMax,
        ticks: { color: '#a09b93', font: { family: 'JetBrains Mono', size: 10 } },
        grid: { color: 'rgba(255,255,255,0.06)' },
        border: { display: false }
      },
      x: {
        ticks: { color: '#6b6560', font: { family: 'JetBrains Mono', size: 10 }, maxRotation: 0 },
        grid: { display: false },
        border: { display: false }
      },
    },
  };

  // Scatter Plot Data (Spatial Coordinates)
  const idlePoints = stations.filter(s => !s.is_charging && !s.has_anomaly).map(s => ({ x: s.longitude, y: s.latitude, id: s.station_id, load: s.estimated_load_kw }));
  const chargingPoints = stations.filter(s => s.is_charging && !s.has_anomaly).map(s => ({ x: s.longitude, y: s.latitude, id: s.station_id, load: s.estimated_load_kw }));
  const anomalyPoints = stations.filter(s => s.has_anomaly).map(s => ({ x: s.longitude, y: s.latitude, id: s.station_id, load: s.estimated_load_kw }));
  const clusterPoints = (clusters && clusters.data) ? clusters.data.map(c => ({ x: c.longitude, y: c.latitude, id: `Hub-${c.hub_id}` })) : [];

  const scatterData = {
    datasets: [
      { label: 'Idle Charger', data: idlePoints, backgroundColor: '#2dd4a8', pointRadius: 5 },
      { label: 'Active Charging', data: chargingPoints, backgroundColor: '#e6a817', pointRadius: 6 },
      { label: 'Grid Anomaly', data: anomalyPoints, backgroundColor: '#e05264', pointRadius: 8 },
      { label: 'K-Means Hub', data: clusterPoints, backgroundColor: '#a78bfa', pointRadius: 10, pointStyle: 'rectRot' },
    ],
  };

  const scatterOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top', labels: { color: '#a09b93', font: { family: 'Outfit', size: 11 }, usePointStyle: true, boxWidth: 8 } },
      tooltip: {
        backgroundColor: 'rgba(24, 24, 27, 0.95)',
        titleColor: '#e8e6e3',
        bodyColor: '#a09b93',
        borderColor: 'rgba(255,255,255,0.12)',
        borderWidth: 1,
        callbacks: {
          label: (ctx) => {
            const raw = ctx.raw;
            if (!raw || raw.x == null || raw.y == null) return '';
            return `${raw.id || 'Point'}: Lat ${Number(raw.y).toFixed(4)}°N, Lon ${Number(raw.x).toFixed(4)}°W (${raw.load ? raw.load + ' kW' : 'Hub Centroid'})`;
          },
        },
      },
    },
    scales: {
      x: {
        type: 'linear',
        position: 'bottom',
        title: { display: true, text: 'Longitude (°W)', color: '#e6a817', font: { family: 'Outfit', size: 12, weight: '600' } },
        ticks: { color: '#908a82', font: { family: 'JetBrains Mono', size: 10 } },
        grid: { color: 'rgba(255,255,255,0.06)' },
      },
      y: {
        title: { display: true, text: 'Latitude (°N)', color: '#e6a817', font: { family: 'Outfit', size: 12, weight: '600' } },
        ticks: { color: '#908a82', font: { family: 'JetBrains Mono', size: 10 } },
        grid: { color: 'rgba(255,255,255,0.06)' },
      },
    },
  };

  const getLoadLevel = (kw) => {
    const stationCap = MAX_CAPACITY_KW / (metrics.length || 1);
    const pct = kw / stationCap;
    if (pct > 0.85) return 'critical';
    if (pct > 0.6) return 'warning';
    return 'normal';
  };

  const stationColor = (s) => {
    if (s.has_anomaly) return '#e05264';
    if (s.is_charging) return '#e6a817';
    return '#2dd4a8';
  };

  const CLUSTER_COLORS = ['rgba(230,168,23,0.12)', 'rgba(45,212,168,0.10)', 'rgba(167,139,250,0.10)'];
  const CLUSTER_BORDERS = ['#e6a817', '#2dd4a8', '#a78bfa'];

  const sysItems = [
    { key: 'kafka', icon: <Icons.Radio />, name: 'Kafka Ingest', fallbackDetail: 'ev-telemetry topic' },
    { key: 'processor', icon: <Icons.Cpu />, name: 'Window Processor', fallbackDetail: '5s tumbling windows' },
    { key: 'ml_kmeans', icon: <Icons.Layers />, name: 'MLlib K-Means', fallbackDetail: '3 Centroids Active' },
    { key: 'database', icon: <Icons.Database />, name: 'SQLite Store', fallbackDetail: 'grid_metrics.db' },
  ];

  return (
    <div className="app-shell">
      {/* TOP BAR */}
      <header className="topbar">
        <div className="topbar-left">
          <div className="topbar-logo">
            <Icons.Zap />
          </div>
          <div>
            <div className="topbar-title">GridPulse Analytics</div>
            <div className="topbar-subtitle">
              Palo Alto, CA EV Charging Network · Smart Grid Monitor (259,417 Big Data Sessions)
            </div>
          </div>
        </div>

        <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Stream Pause / Freeze Control */}
          <button
            onClick={() => setIsPaused(prev => !prev)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              border: isPaused ? '1px solid var(--accent-amber)' : '1px solid rgba(255,255,255,0.12)',
              background: isPaused ? 'rgba(230, 168, 23, 0.15)' : 'rgba(255,255,255,0.05)',
              color: isPaused ? 'var(--accent-amber)' : 'var(--text-primary)',
              fontFamily: 'Outfit',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            {isPaused ? <><Icons.Play /> Resume Stream</> : <><Icons.Pause /> Pause Stream</>}
          </button>

          {/* Refresh Rate Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
            <span>Rate:</span>
            <select
              value={refreshIntervalSec}
              onChange={(e) => setRefreshIntervalSec(Number(e.target.value))}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--text-secondary)',
                padding: '4px 6px',
                borderRadius: '6px',
                fontFamily: 'JetBrains Mono',
                fontSize: '0.72rem',
                cursor: 'pointer',
              }}
            >
              <option value={5} style={{ background: '#1c1c1e', color: '#fff' }}>5s</option>
              <option value={15} style={{ background: '#1c1c1e', color: '#fff' }}>15s</option>
              <option value={30} style={{ background: '#1c1c1e', color: '#fff' }}>30s</option>
            </select>
          </div>

          <div className="timestamp-display">{currentTime.toLocaleTimeString('en-US', { hour12: false })}</div>
          <div className={`status-chip ${isPaused ? 'warning' : socketConnected ? 'live' : 'offline'}`}>
            <span className="status-dot"></span>
            {isPaused ? 'Stream Paused' : socketConnected ? 'Live Stream' : 'Disconnected'}
          </div>
        </div>
      </header>

      {/* PAUSE BANNER */}
      {isPaused && (
        <div style={{
          background: 'rgba(230, 168, 23, 0.12)',
          borderBottom: '1px solid rgba(230, 168, 23, 0.3)',
          color: 'var(--accent-amber)',
          padding: '8px 2rem',
          fontSize: '0.8rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icons.Pause />
            <span><strong>TELEMETRY STREAM PAUSED:</strong> Dashboard state is frozen for inspection. Click <strong>Resume Stream</strong> to unfreeze live updates.</span>
          </span>
          <button
            onClick={() => setIsPaused(false)}
            style={{
              background: 'var(--accent-amber)',
              color: '#121212',
              border: 'none',
              padding: '4px 10px',
              borderRadius: '4px',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Icons.Play /> Resume Stream
          </button>
        </div>
      )}

      <main className="dashboard-body">
        {/* STATS ROW */}
        <div className="stats-row">
          <div className="stat-card amber">
            <div className="stat-label">Network Load</div>
            <div className="stat-value amber">
              {Math.round(totalNetworkLoad).toLocaleString()} <span style={{fontSize:'0.9rem', fontWeight:500}}>kW</span>
            </div>
            <div className="stat-delta">Capacity utilization: {capacityPct.toFixed(1)}%</div>
          </div>
          <div className="stat-card teal">
            <div className="stat-label">Avg Grid Voltage</div>
            <div className="stat-value teal">
              {avgVoltage.toFixed(1)} <span style={{fontSize:'0.9rem', fontWeight:500}}>V</span>
            </div>
            <div className="stat-delta">Nominal: 400V DC fast-charge bus</div>
          </div>
          <div className="stat-card rose">
            <div className="stat-label">Active Anomalies</div>
            <div className="stat-value rose">{totalAnomalies}</div>
            <div className="stat-delta">
              {totalAnomalies > 0 ? 'Voltage dropouts detected — investigate' : 'All nodes within safe thresholds'}
            </div>
          </div>
          <div className="stat-card lavender">
            <div className="stat-label">Stations Charging</div>
            <div className="stat-value lavender">
              {activeStations}<span style={{fontSize:'0.9rem', fontWeight:500, color:'var(--text-tertiary)'}}>/{stations.length}</span>
            </div>
            <div className="stat-delta">
              {metrics.length} substations · {stations.length} chargers deployed
            </div>
          </div>
        </div>

        {/* PANELS ROW 1 */}
        <div className="panels-grid">
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icons.BarChart /> Substation Load Distribution
              </div>
              <div className="panel-badge amber">Real-time</div>
            </div>
            <div className="panel-body">
              <div className="chart-container">
                {metrics.length > 0 ? <Bar data={barData} options={barOptions} /> : (
                  <div className="empty-state">Waiting for telemetry stream...</div>
                )}
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <div className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icons.Map />
                <span>Spatial Demand & Hotspots</span>
                <div className="view-mode-toggle" style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.05)', padding: '2px', borderRadius: '6px', marginLeft: '8px' }}>
                  <button
                    onClick={() => setMapViewMode('map')}
                    style={{
                      border: 'none', background: mapViewMode === 'map' ? 'var(--accent-amber)' : 'transparent',
                      color: mapViewMode === 'map' ? '#121212' : 'var(--text-tertiary)',
                      fontSize: '0.7rem', fontWeight: 600, padding: '3px 8px', borderRadius: '4px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '4px'
                    }}
                  >
                    <Icons.Map /> Map
                  </button>
                  <button
                    onClick={() => setMapViewMode('scatter')}
                    style={{
                      border: 'none', background: mapViewMode === 'scatter' ? 'var(--accent-amber)' : 'transparent',
                      color: mapViewMode === 'scatter' ? '#121212' : 'var(--text-tertiary)',
                      fontSize: '0.7rem', fontWeight: 600, padding: '3px 8px', borderRadius: '4px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '4px'
                    }}
                  >
                    <Icons.Grid /> Grid
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {mapViewMode === 'map' && (
                  <button
                    onClick={() => setTileProvider(prev => prev === 'esri' ? 'osm' : 'esri')}
                    style={{
                      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                      color: 'var(--text-secondary)', fontSize: '0.68rem', padding: '3px 8px', borderRadius: '6px', cursor: 'pointer',
                    }}
                  >
                    {tileProvider === 'esri' ? 'Dark Canvas' : 'Street Map'}
                  </button>
                )}
                <div className="panel-badge teal">{clustersTrained ? 'K-Means Hubs Active' : 'Station Telemetry'}</div>
              </div>
            </div>

            <div className="panel-body">
              {mapViewMode === 'scatter' ? (
                /* Numerical Axes View Mode */
                <div className="chart-container" style={{ height: '380px', padding: '10px' }}>
                  <Scatter data={scatterData} options={scatterOptions} />
                </div>
              ) : (
                /* GIS Map View Mode */
                <div className="map-wrapper">
                  {/* Floating Map Controls */}
                  <div className="map-floating-controls">
                    <button className={`map-filter-btn ${mapFilter === 'all' ? 'active' : ''}`} onClick={() => setMapFilter('all')}>
                      All ({stations.length})
                    </button>
                    <button className={`map-filter-btn ${mapFilter === 'charging' ? 'active' : ''}`} onClick={() => setMapFilter('charging')}>
                      Active ({stations.filter(s => s.is_charging).length})
                    </button>
                    <button className={`map-filter-btn ${mapFilter === 'anomalies' ? 'active' : ''}`} onClick={() => setMapFilter('anomalies')}>
                      Anomalies ({stations.filter(s => s.has_anomaly).length})
                    </button>
                    {clustersTrained && (
                      <button className={`map-filter-btn ${mapFilter === 'hubs' ? 'active' : ''}`} onClick={() => setMapFilter('hubs')}>
                        ML Hubs ({clusters.data.length})
                      </button>
                    )}
                  </div>

                  {/* Floating Map Legend */}
                  <div className="map-floating-legend">
                    <div className="legend-item"><span className="legend-dot idle"></span> Idle (0 kW)</div>
                    <div className="legend-item"><span className="legend-dot charging"></span> Charging</div>
                    <div className="legend-item"><span className="legend-dot anomaly"></span> Anomaly</div>
                    {clustersTrained && <div className="legend-item"><span className="legend-dot cluster"></span> K-Means Hub</div>}
                  </div>

                  <MapContainer center={[37.444, -122.160]} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                    <MapBoundsUpdater stations={stations} />
                    {tileProvider === 'esri' ? (
                      <TileLayer
                        url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
                        attribution="&copy; Esri World Dark Gray Canvas"
                      />
                    ) : (
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution="&copy; OpenStreetMap contributors"
                      />
                    )}

                    {/* 1. Heat Density Aura Circles */}
                    {mapFilter !== 'hubs' && stations.filter(s => s.is_charging || s.has_anomaly).map(s => (
                      <Circle
                        key={`heat-aura-${s.station_id}`}
                        center={[s.latitude, s.longitude]}
                        radius={s.has_anomaly ? 500 : s.estimated_load_kw * 6}
                        pathOptions={{
                          color: 'transparent',
                          fillColor: s.has_anomaly ? '#e05264' : '#e6a817',
                          fillOpacity: s.has_anomaly ? 0.22 : 0.14,
                          stroke: false,
                        }}
                      />
                    ))}

                    {/* 2. K-Means Cluster Zone Overlays */}
                    {clustersTrained && clusters.data && (mapFilter === 'all' || mapFilter === 'hubs') && clusters.data.map((c, idx) => (
                      <Circle
                        key={`cluster-${idx}`}
                        center={[c.latitude, c.longitude]}
                        radius={1100}
                        pathOptions={{
                          color: CLUSTER_BORDERS[idx % CLUSTER_BORDERS.length],
                          fillColor: CLUSTER_COLORS[idx % CLUSTER_COLORS.length],
                          fillOpacity: 0.18,
                          weight: 1.5,
                          dashArray: '6 4',
                        }}
                      >
                        <Popup>
                          <div className="popup-container">
                            <div className="popup-title">★ K-Means Optimal Hub {c.hub_id || idx + 1}</div>
                            <div className="popup-row"><span>Latitude:</span><span className="popup-value">{(c.latitude ?? 0).toFixed(4)}°N</span></div>
                            <div className="popup-row"><span>Longitude:</span><span className="popup-value">{(c.longitude ?? 0).toFixed(4)}°W</span></div>
                            <div className="popup-row"><span>Target:</span><span className="popup-value" style={{color:'var(--accent-teal)'}}>Optimal Expansion Hub</span></div>
                          </div>
                        </Popup>
                      </Circle>
                    ))}

                    {/* 3. Individual Station Markers */}
                    {mapFilter !== 'hubs' && stations
                      .filter(s => {
                        if (mapFilter === 'charging') return s.is_charging;
                        if (mapFilter === 'anomalies') return s.has_anomaly;
                        return true;
                      })
                      .map((s) => (
                        <CircleMarker
                          key={s.station_id}
                          center={[s.latitude, s.longitude]}
                          radius={s.has_anomaly ? 7 : s.is_charging ? 5.5 : 4}
                          pathOptions={{
                            color: stationColor(s),
                            fillColor: stationColor(s),
                            fillOpacity: s.is_charging ? 0.9 : 0.5,
                            weight: s.has_anomaly ? 2.5 : 1,
                          }}
                        >
                          <Popup>
                            <div className="popup-container">
                              <div className="popup-title">
                                <span>{s.station_id}</span>
                                <span style={{
                                  fontSize: '0.65rem',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  background: s.has_anomaly ? 'rgba(224,82,100,0.2)' : s.is_charging ? 'rgba(230,168,23,0.2)' : 'rgba(45,212,168,0.2)',
                                  color: stationColor(s),
                                }}>
                                  {s.has_anomaly ? 'ANOMALY' : s.is_charging ? 'CHARGING' : 'IDLE'}
                                </span>
                              </div>
                              <div className="popup-row"><span>Substation:</span><span className="popup-value">{SUBSTATION_NAMES[s.substation_id] || s.substation_id}</span></div>
                              <div className="popup-row"><span>Coordinates:</span><span className="popup-value">{(s.latitude ?? 0).toFixed(4)}°N, {(s.longitude ?? 0).toFixed(4)}°W</span></div>
                              <div className="popup-row"><span>Estimated Load:</span><span className="popup-value">{s.estimated_load_kw} kW</span></div>
                              {s.historical_sessions ? (
                                <div className="popup-row"><span>Big Data Sessions:</span><span className="popup-value" style={{color:'var(--accent-teal)'}}>{s.historical_sessions.toLocaleString()}</span></div>
                              ) : null}
                              {s.total_kwh_delivered ? (
                                <div className="popup-row"><span>Total Delivered:</span><span className="popup-value">{Math.round(s.total_kwh_delivered).toLocaleString()} kWh</span></div>
                              ) : null}
                            </div>
                          </Popup>
                        </CircleMarker>
                      ))}

                    {/* 4. Cluster Centroid Markers */}
                    {clustersTrained && clusters.data && (mapFilter === 'all' || mapFilter === 'hubs') && clusters.data.map((c, idx) => (
                      <CircleMarker
                        key={`centroid-${idx}`}
                        center={[c.latitude, c.longitude]}
                        radius={9}
                        pathOptions={{
                          color: CLUSTER_BORDERS[idx % CLUSTER_BORDERS.length],
                          fillColor: '#ffffff',
                          fillOpacity: 1.0,
                          weight: 3,
                        }}
                      >
                        <Popup>
                          <div className="popup-container">
                            <div className="popup-title">★ K-Means Hub Centroid {c.hub_id || idx + 1}</div>
                            <div className="popup-row"><span>Target:</span><span className="popup-value">Grid Expansion Hub</span></div>
                            <div className="popup-row"><span>Coordinates:</span><span className="popup-value">{(c.latitude ?? 0).toFixed(4)}°N, {(c.longitude ?? 0).toFixed(4)}°W</span></div>
                          </div>
                        </Popup>
                      </CircleMarker>
                    ))}
                  </MapContainer>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* LOAD TREND */}
        <div className="panels-grid">
          <div className="panel full-width">
            <div className="panel-header">
              <div className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icons.LineChart /> Network Load Trend
              </div>
              <div className="panel-badge amber">Rolling 25 Windows</div>
            </div>
            <div className="panel-body">
              <div className="chart-container" style={{ height: '240px' }}>
                {loadHistory.length > 1 ? <Line data={lineData} options={lineOptions} /> : (
                  <div className="empty-state">Accumulating time-series data...</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* TABLE + ALERTS + SYSTEM */}
        <div className="panels-grid">
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icons.Activity /> Substation Performance
              </div>
              <div className="panel-badge teal">Palo Alto Grid</div>
            </div>
            <div className="panel-body" style={{padding: 0}}>
              {metrics.length > 0 ? (
                <table className="sub-table">
                  <thead>
                    <tr>
                      <th>Substation</th>
                      <th>Active Load</th>
                      <th>Bus Voltage</th>
                      <th>Health</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.map(m => {
                      const level = getLoadLevel(m.total_load_kw || 0);
                      const stationCap = MAX_CAPACITY_KW / metrics.length;
                      const pct = Math.min(((m.total_load_kw || 0) / stationCap) * 100, 100);
                      const subLabel = SUBSTATION_NAMES[m.substation_id] || m.substation_id;
                      return (
                        <tr key={m.substation_id}>
                          <td className="sub-id-cell">
                            <div><strong>{m.substation_id}</strong></div>
                            <div style={{fontSize:'0.72rem', color:'var(--text-tertiary)'}}>{subLabel}</div>
                          </td>
                          <td>
                            <div className="load-bar-wrapper">
                              <div className="load-bar-track">
                                <div className={`load-bar-fill ${level}`} style={{width: `${pct}%`}}></div>
                              </div>
                              <span className="load-bar-value">{Math.round(m.total_load_kw || 0)} kW</span>
                            </div>
                          </td>
                          <td style={{fontFamily:'JetBrains Mono', fontSize:'0.82rem'}}>
                            {m.avg_voltage_v?.toFixed(1)}V
                          </td>
                          <td>
                            <span className={`status-indicator ${m.has_anomalies ? 'anomaly' : 'normal'}`}>
                              {m.has_anomalies ? 'Anomaly' : 'Normal'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">No substations reporting yet</div>
              )}
            </div>
          </div>

          <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
            {/* Alerts */}
            <div className="panel" style={{flex: 1}}>
              <div className="panel-header">
                <div className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Icons.AlertTriangle /> Grid Alert Feed
                </div>
              </div>
              <div className="panel-body">
                <div className="alerts-list">
                  {totalAnomalies > 0 ? (
                    metrics.filter(m => m.has_anomalies > 0).map(m => (
                      <div className="alert-item" key={`alert-${m.substation_id}`}>
                        <div className="alert-icon critical">
                          <Icons.AlertTriangle />
                        </div>
                        <div className="alert-content">
                          <div className="alert-title critical">Voltage Dropout — {m.substation_id}</div>
                          <div className="alert-desc">Transient voltage loss detected. Investigating charger stability at {SUBSTATION_NAMES[m.substation_id] || m.substation_id}.</div>
                        </div>
                        <div className="alert-time">{currentTime.toLocaleTimeString('en-US', { hour12: false })}</div>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="alert-item">
                        <div className="alert-icon info">
                          <Icons.CheckCircle />
                        </div>
                        <div className="alert-content">
                          <div className="alert-title info">All Systems Nominal</div>
                          <div className="alert-desc">No voltage anomalies or dropouts detected across 4 Palo Alto grid substations.</div>
                        </div>
                        <div className="alert-time">{currentTime.toLocaleTimeString('en-US', { hour12: false })}</div>
                      </div>
                      <div className="alert-item">
                        <div className="alert-icon warning">
                          <Icons.BarChart />
                        </div>
                        <div className="alert-content">
                          <div className="alert-title warning">Tumbling Window Aggregations Active</div>
                          <div className="alert-desc">5-second tumbling window calculations streaming to SQLite store.</div>
                        </div>
                      </div>
                    </>
                  )}
                  {clustersTrained && (
                    <div className="alert-item">
                      <div className="alert-icon info">
                        <Icons.Layers />
                      </div>
                      <div className="alert-content">
                        <div className="alert-title info">PySpark K-Means Hotspots Active</div>
                        <div className="alert-desc">{clusters.data.length} optimal hub zones trained on 259k real charging records.</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* System Status */}
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Icons.Cpu /> System Architecture
                </div>
              </div>
              <div className="panel-body">
                <div className="sys-status-grid">
                  {sysItems.map(item => {
                    const live = systemStatus && systemStatus[item.key];
                    const isActive = live ? live.active : false;
                    const detail = live ? live.detail : item.fallbackDetail;
                    return (
                      <div className="sys-item" key={item.key}>
                        <div className={`sys-icon ${item.key === 'ml_kmeans' ? 'ml' : item.key}`}>
                          {item.icon}
                        </div>
                        <div className="sys-info">
                          <div className="sys-name">{item.name}</div>
                          <div className="sys-state">{detail}</div>
                        </div>
                        <div className={`sys-dot ${isActive ? 'active' : 'idle'}`}></div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
