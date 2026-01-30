"use client";

import { useEffect, useRef, useState } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { Style, Icon } from 'ol/style';
import { fromLonLat, transform } from 'ol/proj';
import 'ol/ol.css';

interface OpenLayersMapProps {
  address: string;
  city: string;
  className?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export default function OpenLayersMap({ address, city, className = '', latitude, longitude }: OpenLayersMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const markerSourceRef = useRef<VectorSource | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lon: number }>({
    lat: 6.6018, // Default to Lagos, Nigeria
    lon: 3.3515,
  });
  const [loading, setLoading] = useState(false);

  const needsGeocoding = latitude === null || latitude === undefined || longitude === null || longitude === undefined;

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    console.log('Initializing OpenLayers map for:', address, city);

    // Create marker source and layer
    const markerSource = new VectorSource();
    markerSourceRef.current = markerSource;

    const markerLayer = new VectorLayer({
      source: markerSource,
      style: new Style({
        image: new Icon({
          anchor: [0.5, 1],
          anchorXUnits: 'fraction',
          anchorYUnits: 'fraction',
          src: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          scale: 1,
          size: [25, 41],
        }),
      }),
    });

    // Create map
    const map = new Map({
      target: mapContainerRef.current,
      layers: [
        new TileLayer({
          source: new XYZ({
            url: 'https://{a-c}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
            attributions: [
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            ],
          }),
        }),
        markerLayer,
      ],
      view: new View({
        center: fromLonLat([coords.lon, coords.lat]),
        zoom: 18,
      }),
      controls: [], // Remove default controls for cleaner look
    });

    mapInstanceRef.current = map;

    // Set initial marker
    updateMarker(coords.lat, coords.lon, markerSource);

    return () => {
      map.setTarget(undefined);
      mapInstanceRef.current = null;
      markerSourceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const geocodeAddress = async () => {
      if (!address || !city || !needsGeocoding || !mapInstanceRef.current) return;

      setLoading(true);
      console.log('Geocoding address:', `${address}, ${city}`);

      try {
        const fullAddress = `${address}, ${city}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

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
        console.log('Geocoding response:', data);

        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);

          console.log('Geocoded coordinates:', lat, lon);

          // Update state
          setCoords({ lat, lon });

          // Update map view
          if (mapInstanceRef.current) {
            const view = mapInstanceRef.current.getView();
            view.animate({
              center: fromLonLat([lon, lat]),
              zoom: 18,
              duration: 1000,
            });

            // Update marker
            if (markerSourceRef.current) {
              updateMarker(lat, lon, markerSourceRef.current);
            }
          }
        } else {
          console.log('No geocoding results for:', fullAddress);
        }
      } catch (err) {
        console.error('Geocoding error:', err);
      } finally {
        setLoading(false);
      }
    };

    geocodeAddress();
  }, [address, city, needsGeocoding]);

  // Use provided coordinates if available
  useEffect(() => {
    if (!needsGeocoding && latitude !== null && longitude !== null && mapInstanceRef.current) {
      console.log('Using database coordinates:', latitude, longitude);

      setCoords({ lat: latitude, lon: longitude });

      const view = mapInstanceRef.current.getView();
      view.animate({
        center: fromLonLat([longitude, latitude]),
        zoom: 18,
        duration: 1000,
      });

      if (markerSourceRef.current) {
        updateMarker(latitude, longitude, markerSourceRef.current);
      }
    }
  }, [latitude, longitude, needsGeocoding]);

  function updateMarker(lat: number, lon: number, source: VectorSource) {
    source.clear();

    const feature = new Feature({
      geometry: new Point(transform([lon, lat], 'EPSG:4326', 'EPSG:3857')),
    });

    source.addFeature(feature);
  }

  return (
    <div
      ref={mapContainerRef}
      className={`ol-map ${className}`}
      style={{
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
