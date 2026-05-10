"use client";

import { GoogleMap, useJsApiLoader, OverlayView, Polyline } from '@react-google-maps/api';
import { useStore } from '@/store/useStore';
import { useCallback, useState, useEffect, useRef } from 'react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { X } from 'lucide-react';

const containerStyle = { width: '100%', height: '100%' };

const center = { lat: 40.7128, lng: -74.0060 };

const silverMapStyle: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#d59563" }, { visibility: "off" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#f5f1e6" }, { visibility: "off" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#e5e7eb" }] },
  { featureType: "administrative.land_parcel", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#f5f5f7" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#f5f5f7" }] },
  { featureType: "poi", elementType: "labels.text", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#e5e7eb" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#e5e7eb" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#e5e7eb" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#e5e7eb" }] },
  { featureType: "road.local", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "transit.line", elementType: "geometry", stylers: [{ color: "#e5e7eb" }] },
  { featureType: "transit.station", elementType: "geometry", stylers: [{ color: "#eeeeee" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#f5f5f7" }] },
  { featureType: "water", elementType: "labels.text", stylers: [{ visibility: "off" }] },
];

const darkMapStyle: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#212121" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#757575" }, { visibility: "off" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }, { visibility: "off" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#757575" }] },
  { featureType: "administrative.country", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
  { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#bdbdbd" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#181818" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { featureType: "poi.park", elementType: "labels.text.stroke", stylers: [{ color: "#1b1b1b" }] },
  { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#2c2c2c" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#8a8a8a" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#373737" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#3c3c3c" }] },
  { featureType: "road.highway.controlled_access", elementType: "geometry", stylers: [{ color: "#4e4e4e" }] },
  { featureType: "road.local", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { featureType: "transit", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#000000" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#3d3d3d" }] },
];

// ── Polyline pulse animation hook ──────────────────────────────────────────
function usePulsingOpacity(speed = 1200): number {
  const [opacity, setOpacity] = useState(1);
  useEffect(() => {
    let rising = false;
    const interval = setInterval(() => {
      setOpacity(prev => {
        if (prev <= 0.25) { rising = true; }
        if (prev >= 1) { rising = false; }
        return rising ? prev + 0.06 : prev - 0.06;
      });
    }, speed / 20);
    return () => clearInterval(interval);
  }, [speed]);
  return opacity;
}

// ── Node status helpers ────────────────────────────────────────────────────
const STATUS_COLORS = {
  emergency: { bg: 'bg-red-500', text: 'text-red-500', badge: 'bg-red-500/20 text-red-400 border border-red-500/40', hex: '#ef4444' },
  warning:   { bg: 'bg-orange-500', text: 'text-orange-500', badge: 'bg-orange-500/20 text-orange-400 border border-orange-500/40', hex: '#f97316' },
  optimal:   { bg: 'bg-[var(--color-accent-indigo)]', text: 'text-green-500', badge: 'bg-green-500/20 text-green-400 border border-green-500/40', hex: '#4F46E5' },
};

// Simulated latency lookup (ms)
const LATENCY_MAP: Record<string, number> = { J1: 48, J2: 220, J3: 95, J4: 31 };
const RISK_MAP: Record<string, number>    = { J1: 18, J2: 67, J3: 92, J4: 4 };
const LAST_EVENT_MAP: Record<string, string> = {
  J1: 'Density shift 0.30→0.35',
  J2: 'Latency spike 220ms',
  J3: 'Node OFFLINE — overflow',
  J4: 'Signal cycle nominal',
};

interface Props {
  timelineHour: number;
}

export function GoogleMapWrapper({ timelineHour }: Props) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "YOUR_API_KEY_HERE",
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [mapCenter, setMapCenter] = useState(center);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite'>('roadmap');
  const [clickedJunctionId, setClickedJunctionId] = useState<string | null>(null);
  const routeOpacity = usePulsingOpacity(1400);
  const { theme } = useTheme();
  const { junctions, setActiveJunctionId, activeJunctionId, relocateJunctions } = useStore();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        ({ coords: { latitude, longitude } }) => {
          setMapCenter({ lat: latitude, lng: longitude });
          relocateJunctions(latitude, longitude);
        },
        (err) => console.warn("Geolocation failed:", err)
      );
    }
  }, [relocateJunctions]);

  const onLoad = useCallback((m: google.maps.Map) => { setMap(m); }, []);
  const onUnmount = useCallback(() => { setMap(null); }, []);

  useEffect(() => {
    if (!map) return;
    map.setOptions({
      styles: mapType === 'satellite' ? [] : (theme === 'dark' ? darkMapStyle : silverMapStyle),
    });
    map.setMapTypeId(mapType);
  }, [theme, map, mapType]);

  // ── Emergency route definitions (relative to mapCenter) ───────────────
  const AMB_ROUTE: google.maps.LatLngLiteral[] = [
    { lat: mapCenter.lat,         lng: mapCenter.lng },
    { lat: mapCenter.lat + 0.003, lng: mapCenter.lng + 0.004 },
    { lat: mapCenter.lat + 0.006, lng: mapCenter.lng + 0.006 },
    { lat: mapCenter.lat + 0.009, lng: mapCenter.lng + 0.008 }, // General Hospital
  ];

  const FIRE_ROUTE: google.maps.LatLngLiteral[] = [
    { lat: mapCenter.lat,          lng: mapCenter.lng },
    { lat: mapCenter.lat - 0.003,  lng: mapCenter.lng - 0.003 },
    { lat: mapCenter.lat - 0.007,  lng: mapCenter.lng - 0.009 },
    { lat: mapCenter.lat - 0.010,  lng: mapCenter.lng - 0.013 }, // Sector 4
  ];

  if (!isLoaded) return (
    <div className="w-full h-full bg-[var(--color-canvas)] flex flex-col items-center justify-center">
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
        className="w-12 h-12 rounded-full border-4 border-[var(--color-accent-indigo)] border-t-transparent animate-spin mb-4"
      />
      <motion.div
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
        className="text-xs font-bold tracking-[0.2em] uppercase text-[var(--color-accent-indigo)]"
      >
        Initializing Telemetry Link...
      </motion.div>
    </div>
  );

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={mapCenter}
        zoom={13}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={() => setClickedJunctionId(null)}
        options={{
          styles: mapType === 'satellite' ? [] : (theme === 'dark' ? darkMapStyle : silverMapStyle),
          mapTypeControl: false,
          fullscreenControl: false,
          streetViewControl: false,
          zoomControl: true,
          mapTypeId: mapType,
        }}
      >
        {/* ── Emergency route polylines ─────────────────────────────── */}
        <Polyline
          path={AMB_ROUTE}
          options={{
            strokeColor: '#3b82f6',
            strokeOpacity: routeOpacity,
            strokeWeight: 5,
            zIndex: 5,
            icons: [{
              icon: { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 3.5, strokeColor: '#3b82f6' },
              offset: '100%',
              repeat: '80px',
            }],
          }}
        />
        <Polyline
          path={FIRE_ROUTE}
          options={{
            strokeColor: '#ef4444',
            strokeOpacity: routeOpacity,
            strokeWeight: 5,
            zIndex: 5,
            icons: [{
              icon: { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 3.5, strokeColor: '#ef4444' },
              offset: '100%',
              repeat: '80px',
            }],
          }}
        />

        {junctions.map(j => {
          if (j.rerouteSuggestion) {
            const target = junctions.find(tj => tj.id === j.rerouteSuggestion?.toNodeId);
            if (target) {
              return (
                <Polyline
                  key={`reroute-${j.id}`}
                  path={[{ lat: j.lat, lng: j.lng }, { lat: target.lat, lng: target.lng }]}
                  options={{
                    strokeColor: '#3b82f6',
                    strokeOpacity: 0.6,
                    strokeWeight: 3,
                    zIndex: 4,
                    geodesic: true,
                    icons: [{
                      icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 2 },
                      offset: '0',
                      repeat: '10px'
                    }]
                  }}
                />
              );
            }
          }
          return null;
        })}

        {/* ── Sensor node overlays ──────────────────────────────────── */}
        {junctions.map((j) => {
          // Determine active load based on timeline
          const isHistorical = timelineHour < 24;
          const historyIndex = Math.floor(timelineHour / 2);
          const historyLoad = j.loadHistory && j.loadHistory.length > 0 ? j.loadHistory[Math.min(historyIndex, j.loadHistory.length - 1)] : 0;
          
          const load = isHistorical ? historyLoad : (j.load ?? Math.round(j.density * 100));
          
          // Calculate historical status
          let currentStatus = j.status;
          if (isHistorical) {
            if (load > 85) currentStatus = 'emergency';
            else if (load > 60) currentStatus = 'warning';
            else currentStatus = 'optimal';
          }
          
          const colors = STATUS_COLORS[currentStatus] ?? STATUS_COLORS.optimal;
          const isClicked = clickedJunctionId === j.id;
          const latency = j.latency ? parseInt(j.latency) : (LATENCY_MAP[j.id] ?? 55);
          const risk = j.predictedRisk ? parseInt(j.predictedRisk) : (RISK_MAP[j.id] ?? 20);
          const lastEvent = isHistorical ? `Historical record (Hour ${timelineHour})` : (j.lastEvent ?? LAST_EVENT_MAP[j.id] ?? 'Nominal');

          // Anomaly detected if node isn't optimal
          const isAnomaly = currentStatus === 'warning' || currentStatus === 'emergency';

          return (
            <OverlayView
              key={`node-${j.id}`}
              position={{ lat: j.lat, lng: j.lng }}
              mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
            >
              <div className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 w-12 h-12 flex items-center justify-center">
                {/* Pulse rings */}
                <motion.div
                  animate={{
                    boxShadow: [
                      `0 0 0 0px ${isAnomaly ? '#eab308CC' : colors.hex + 'CC'}`,
                      `0 0 0 ${currentStatus === 'emergency' ? '48px' : '28px'} ${isAnomaly ? '#eab30800' : colors.hex + '00'}`,
                    ],
                  }}
                  transition={{
                    duration: isAnomaly ? 0.8 : Math.max(0.5, 2.5 - j.density * 2),
                    repeat: Infinity,
                    ease: 'easeOut',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setClickedJunctionId(prev => prev === j.id ? null : j.id);
                    setActiveJunctionId(j.id);
                    if (map) { map.panTo({ lat: j.lat, lng: j.lng }); map.setZoom(16); }
                  }}
                  className={clsx(
                    'w-5 h-5 rounded-full shadow-lg transition-transform hover:scale-125',
                    colors.bg,
                    activeJunctionId === j.id && 'ring-4 ring-white/60',
                  )}
                />

                {/* ── Rich click tooltip ─────────────────────────────── */}
                <AnimatePresence>
                  {isClicked && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95, transition: { duration: 0.15 } }}
                      onClick={(e) => e.stopPropagation()}
                      className={clsx(
                        // Position above node; clamp with max-w
                        'absolute bottom-8 left-1/2 -translate-x-1/2 w-64',
                        'bg-[var(--color-surface-a)] backdrop-blur-md',
                        'border border-[var(--color-border-subtle)]',
                        'rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.25)] z-[60]',
                        'overflow-hidden',
                      )}
                    >
                      {/* Header */}
                      <div className={clsx(
                        'flex items-center justify-between px-4 py-3',
                        'border-b border-[var(--color-border-subtle)]',
                      )}>
                        <div className="flex items-center gap-2">
                          <span className={clsx('w-2 h-2 rounded-full', colors.bg, currentStatus === 'emergency' && 'animate-pulse')} />
                          <span className="font-mono text-sm font-bold text-[var(--color-text-main)]">
                            NODE {j.id}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={clsx('text-[10px] font-bold px-2 py-0.5 rounded-full', colors.badge)}>
                            {currentStatus.toUpperCase()}
                          </span>
                          <button
                            onClick={(e) => { e.stopPropagation(); setClickedJunctionId(null); }}
                            className="text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Body */}
                      <div className="px-4 py-3 flex flex-col gap-3">
                        <div className="text-xs font-semibold text-[var(--color-text-muted)]">{j.name}</div>

                        {/* Load bar */}
                        <div>
                          <div className="flex justify-between text-[10px] font-bold text-[var(--color-text-muted)] mb-1 uppercase tracking-wider">
                            <span>Load</span>
                            <span className={clsx(
                              load > 80 ? 'text-red-500' : load > 50 ? 'text-orange-500' : 'text-green-500'
                            )}>{load}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-[var(--color-border-subtle)] overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${load}%` }}
                              transition={{ duration: 0.6, ease: 'easeOut' }}
                              className={clsx(
                                'h-full rounded-full',
                                load > 80 ? 'bg-red-500' : load > 50 ? 'bg-orange-500' : 'bg-green-500'
                              )}
                            />
                          </div>
                        </div>

                        {/* Stats grid */}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px]">
                          <div>
                            <div className="text-[var(--color-text-muted)] uppercase tracking-wider font-bold">Latency</div>
                            <div className={clsx('font-bold mt-0.5', latency > 150 ? 'text-red-500' : latency > 80 ? 'text-orange-500' : 'text-green-500')}>
                              {latency} ms
                            </div>
                          </div>
                          <div>
                            <div className="text-[var(--color-text-muted)] uppercase tracking-wider font-bold">Pred. Risk</div>
                            <div className={clsx('font-bold mt-0.5', risk > 60 ? 'text-red-500' : risk > 30 ? 'text-orange-500' : 'text-green-500')}>
                              {risk}%
                            </div>
                          </div>
                          <div className="col-span-2">
                            <div className="text-[var(--color-text-muted)] uppercase tracking-wider font-bold">Last Event</div>
                            <div className="font-medium text-[var(--color-text-main)] mt-0.5 leading-snug">{lastEvent}</div>
                          </div>
                          <div>
                            <div className="text-[var(--color-text-muted)] uppercase tracking-wider font-bold">Throughput</div>
                            <div className="font-bold text-[var(--color-text-main)] mt-0.5">{j.throughput} v/h</div>
                          </div>
                          <div>
                            <div className="text-[var(--color-text-muted)] uppercase tracking-wider font-bold">Wait</div>
                            <div className="font-bold text-[var(--color-text-main)] mt-0.5">{j.waitTime}s</div>
                          </div>
                        </div>
                      </div>

                      {/* Footer timestamp */}
                      <div className="px-4 py-2 border-t border-[var(--color-border-subtle)] bg-[var(--color-canvas)]">
                        <span className="text-[9px] font-mono text-[var(--color-text-muted)]">
                          UTC {new Date().toISOString().substring(11, 19)}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </OverlayView>
          );
        })}
      </GoogleMap>

      {/* ── Route legend badges ─────────────────────────────────────── */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-1.5 pointer-events-none">
        <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
          <span className="w-3 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-[10px] font-bold text-blue-400 tracking-wider">AMB-774 ACTIVE</span>
        </div>
        <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
          <span className="w-3 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[10px] font-bold text-red-400 tracking-wider">FIRE-22 ROUTING</span>
        </div>
      </div>



      {/* ── Map / Satellite toggle ─────────────────────────────────── */}
      <div className="absolute bottom-6 left-4 z-20 flex rounded-lg overflow-hidden shadow-lg border border-white/20 backdrop-blur-sm">
        <button
          onClick={() => setMapType('roadmap')}
          className={`px-4 py-2 text-xs font-bold tracking-wider transition-all ${
            mapType === 'roadmap' ? 'bg-[var(--color-accent-indigo)] text-white' : 'bg-black/60 text-gray-300 hover:bg-black/80'
          }`}
        >
          MAP
        </button>
        <button
          onClick={() => setMapType('satellite')}
          className={`px-4 py-2 text-xs font-bold tracking-wider transition-all ${
            mapType === 'satellite' ? 'bg-[var(--color-accent-indigo)] text-white' : 'bg-black/60 text-gray-300 hover:bg-black/80'
          }`}
        >
          SATELLITE
        </button>
      </div>
    </div>
  );
}
