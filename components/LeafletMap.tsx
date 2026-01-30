"use client";

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

interface LeafletMapProps {
  address: string;
  city: string;
  className?: string;
  latitude?: number | null;
  longitude?: number | null;
}

function LeafletMap({ address, city, className = '', latitude, longitude }: LeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || !mapContainerRef.current || mapInstanceRef.current) return;

    const L = require('leaflet');

    const defaultLat = 4.8215029;
    const defaultLon = 6.9979447;

    const map = L.map(mapContainerRef.current, {
      center: [latitude || defaultLat, longitude || defaultLon],
      zoom: 17,
      zoomControl: true,
      zoomControlOptions: {
        position: 'bottomright'
      }
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [isMounted]);

  useEffect(() => {
    if (!isMounted || !mapInstanceRef.current || latitude === null || longitude === null) return;

    const L = require('leaflet');
    const map = mapInstanceRef.current;

    map.setView([latitude, longitude], 17);

    map.eachLayer((layer: any) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    const markerIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [35, 51],
      iconAnchor: [17, 51],
      popupAnchor: [1, -34],
      shadowSize: [51, 51],
    });

    const marker = L.marker([latitude, longitude], { icon: markerIcon }).addTo(map);

    if (address) {
      marker.bindPopup(`<b>Wingside</b><br>${address}<br>${city}`, {
        className: 'custom-popup',
        closeButton: false,
      }).openPopup();
    }
  }, [isMounted, latitude, longitude]);

  useEffect(() => {
    const geocodeAddress = async () => {
      if (!isMounted || !address || !city || (latitude !== null && longitude !== null) || !mapInstanceRef.current) return;

      setLoading(true);

      try {
        const fullAddress = `${address}, ${city}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&limit=1`,
          {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'Wingside-Contact-Page/1.0',
            },
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);

          if (mapInstanceRef.current) {
            const L = require('leaflet');
            const map = mapInstanceRef.current;
            map.setView([lat, lon], 17);

            map.eachLayer((layer: any) => {
              if (layer instanceof L.Marker) {
                map.removeLayer(layer);
              }
            });

            const markerIcon = L.icon({
              iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
              iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
              shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
              iconSize: [35, 51],
              iconAnchor: [17, 51],
              popupAnchor: [1, -34],
              shadowSize: [51, 51],
            });

            const marker = L.marker([lat, lon], { icon: markerIcon }).addTo(map);

            if (address) {
              marker.bindPopup(`<b>Wingside</b><br>${address}<br>${city}`, {
                className: 'custom-popup',
                closeButton: false,
              }).openPopup();
            }
          }
        }
      } catch (err) {
        console.error('Geocoding error:', err);
      } finally {
        setLoading(false);
      }
    };

    geocodeAddress();
  }, [isMounted, address, city, latitude, longitude]);

  if (!isMounted) {
    return (
      <div
        className={`leaflet-map ${className}`}
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#e5e7eb',
        }}
      />
    );
  }

  return (
    <div
      ref={mapContainerRef}
      className={`leaflet-map ${className}`}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        backgroundColor: loading ? '#f3f4f6' : undefined,
      }}
    >
      {loading && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              border: '3px solid #F7C400',
              borderTop: '3px solid transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
        </div>
      )}
    </div>
  );
}

export default dynamic(() => Promise.resolve(LeafletMap), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#e5e7eb',
      }}
    />
  ),
});
