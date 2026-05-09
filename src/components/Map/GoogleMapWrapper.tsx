"use client";

import { GoogleMap, useJsApiLoader, OverlayView } from '@react-google-maps/api';
import { useStore } from '@/store/useStore';
import { useCallback, useState, useEffect } from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';

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

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback((map: google.maps.Map) => {
    setMap(null);
  }, []);

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
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10"
            >
              {/* Heat Pulse Marker */}
              <motion.div
                animate={{
                  boxShadow: ["0 0 0 0px rgba(79,70,229,0.7)", "0 0 0 30px rgba(79,70,229,0)"]
                }}
                transition={{
                  duration: Math.max(0.5, 2.5 - (j.density * 2)), // Higher density = faster pulse
                  repeat: Infinity,
                  ease: "easeOut"
                }}
                className={clsx(
                  "w-4 h-4 rounded-full bg-[var(--color-accent-indigo)]",
                  activeJunctionId === j.id && "ring-4 ring-white"
                )}
              />
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
          // Simplistic projection simulation since OverlayView is coupled to GoogleMap children.
          // To overlay properly without duplicate maps, we render absolute divs. This is complex without map projection logic.
          // For the blueprint, we visually simulate the AI wipe layer with the background tint and a static label.
          return null;
        })}
      </div>
    </div>
  );
}
