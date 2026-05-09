"use client";

import { GoogleMap, useJsApiLoader, OverlayView } from '@react-google-maps/api';
import { useStore } from '@/store/useStore';
import { useCallback, useState, useEffect } from 'react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';

const containerStyle = {
  width: '100%',
  height: '100%',
};

// Manhattan coordinate center
const center = {
  lat: 40.7128,
  lng: -74.0060,
};

// Silver Protocol map style (SpaceX White aesthetic)
const silverMapStyle = [
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

const darkMapStyle = [
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
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#3d3d3d" }] }
];

interface Props {
  sliderPercentage: number;
}

export function GoogleMapWrapper({ sliderPercentage }: Props) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "YOUR_API_KEY_HERE",
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [mapCenter, setMapCenter] = useState(center);
  const [hoveredJunctionId, setHoveredJunctionId] = useState<string | null>(null);
  const { theme } = useTheme();
  const { junctions, setActiveJunctionId, activeJunctionId, relocateJunctions } = useStore();

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setMapCenter({ lat: latitude, lng: longitude });
          relocateJunctions(latitude, longitude);
        },
        (error) => {
          console.warn("Geolocation permission denied or failed. Using default center.", error);
        }
      );
    }
  }, [relocateJunctions]);

  const onLoad = useCallback((m: google.maps.Map) => {
    setMap(m);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Reactively update map style when theme changes
  useEffect(() => {
    if (!map) return;
    map.setOptions({ styles: theme === 'dark' ? darkMapStyle : silverMapStyle });
  }, [theme, map]);

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
    <div className="relative w-full h-full">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={mapCenter}
        zoom={13}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{ styles: theme === 'dark' ? darkMapStyle : [] }}
      >
        {/* LIVE LAYER */}
        {junctions.map((j) => (
          <OverlayView
            key={`live-${j.id}`}
            position={{ lat: j.lat, lng: j.lng }}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
          >
            <div 
              onClick={() => {
                setActiveJunctionId(j.id);
                if (map) {
                  map.panTo({ lat: j.lat, lng: j.lng });
                  map.setZoom(16);
                }
              }}
              onMouseEnter={() => setHoveredJunctionId(j.id)}
              onMouseLeave={() => setHoveredJunctionId(null)}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 w-12 h-12 flex items-center justify-center"
            >
              {/* Heat Pulse Marker */}
              <motion.div
                animate={{
                  boxShadow: [
                    `0 0 0 0px ${j.status === 'emergency' ? 'rgba(239,68,68,0.9)' : j.status === 'warning' ? 'rgba(249,115,22,0.7)' : 'rgba(79,70,229,0.7)'}`, 
                    `0 0 0 ${j.status === 'emergency' ? '50px' : '30px'} rgba(79,70,229,0)`
                  ]
                }}
                transition={{
                  duration: Math.max(0.5, 2.5 - (j.density * 2)),
                  repeat: Infinity,
                  ease: "easeOut"
                }}
                className={clsx(
                  "w-5 h-5 rounded-full shadow-lg",
                  j.status === 'emergency' ? 'bg-red-500 shadow-red-500' : j.status === 'warning' ? 'bg-orange-500 shadow-orange-500' : 'bg-[var(--color-accent-indigo)] shadow-[var(--color-accent-indigo)]',
                  activeJunctionId === j.id && "ring-4 ring-[var(--color-canvas)]"
                )}
              />

              {/* Hover Tooltip */}
              <AnimatePresence>
                {hoveredJunctionId === j.id && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute top-12 whitespace-nowrap bg-[var(--color-surface-a)] backdrop-blur-md shadow-[var(--shadow-weightless)] border border-[var(--color-border-subtle)] rounded-lg p-3 z-50 pointer-events-none"
                  >
                    <div className="font-mono text-xs font-bold mb-2 flex items-center gap-2 text-[var(--color-text-main)]">
                       <span className={clsx("w-2 h-2 rounded-full", j.status === 'emergency' ? 'bg-red-500' : j.status === 'warning' ? 'bg-orange-500' : 'bg-green-500')} />
                       NODE: {j.id}
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">
                      <span>Status</span>
                      <span className={clsx("font-bold text-right", j.status === 'emergency' ? 'text-red-500' : j.status === 'warning' ? 'text-orange-500' : 'text-green-500')}>
                        {j.status.toUpperCase()}
                      </span>
                      <span>Load Level</span>
                      <span className="font-bold text-right text-[var(--color-text-main)]">{Math.round(j.density * 100)}%</span>
                      <span>Last Updated</span>
                      <span className="font-bold text-right text-[var(--color-text-main)]">UTC {new Date().toISOString().substr(11, 8)}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </OverlayView>
        ))}
      </GoogleMap>

      {/* AI PREDICTED LAYER OVERLAY (Using clip path to simulate wipe) */}
      <div 
        className="absolute inset-0 pointer-events-none z-10 bg-[rgba(245,245,247,0.4)]"
        style={{ clipPath: `polygon(${sliderPercentage}% 0, 100% 0, 100% 100%, ${sliderPercentage}% 100%)` }}
      >
        <div className="absolute top-6 right-6 bg-white shadow-[var(--shadow-weightless)] px-4 py-2 rounded text-xs font-bold text-[var(--color-accent-indigo)] border border-[var(--color-border-subtle)] flex items-center gap-2">
           <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
           AI PREDICTED (5M AHEAD)
        </div>
        
        {/* Render predicted paths/nodes here in a real app. We simulate by overlaying glowing borders */}
        {isLoaded && map && junctions.map((j) => {
          return null;
        })}
      </div>
    </div>
  );
}
