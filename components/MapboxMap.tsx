"use client";

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface MapboxMapProps {
  address: string;
  city: string;
  className?: string;
  latitude?: number | null;
  longitude?: number | null;
}

function MapboxMap({ address, city, className = '', latitude, longitude }: MapboxMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [token, setToken] = useState('');

  useEffect(() => {
    setIsMounted(true);

    // Check if token is in environment
    if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
      const storedToken = localStorage.getItem('mapbox_token');
      if (storedToken) {
        setToken(storedToken);
      } else {
        setShowTokenInput(true);
      }
    }
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || token;
    if (!mapboxToken || !mapContainerRef.current || mapInstanceRef.current) return;

    mapboxgl.accessToken = mapboxToken;

    const defaultLat = 4.8215029;
    const defaultLon = 6.9979447;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [longitude || defaultLon, latitude || defaultLat],
      zoom: 18,
      antialias: true,
      attributionControl: false,
      customAttribution: '',
    });

    const navControl = new mapboxgl.NavigationControl();
    map.addControl(navControl, 'bottom-right');

    mapInstanceRef.current = map;

    // Function to remove attribution
    const removeAttribution = () => {
      const attribElements = mapContainerRef.current?.querySelectorAll('.mapboxgl-ctrl-attrib, [class*="attribution"]');
      attribElements?.forEach(el => {
        (el as HTMLElement).style.display = 'none';
        (el as HTMLElement).remove();
      });
    };

    // Remove on load
    map.on('load', removeAttribution);
    // Remove after style loads
    map.on('styledata', removeAttribution);
    // Remove periodically
    const attribInterval = setInterval(removeAttribution, 100);

    // Use MutationObserver to remove attribution whenever it appears
    const observer = new MutationObserver(() => {
      removeAttribution();
    });

    if (mapContainerRef.current) {
      observer.observe(mapContainerRef.current, {
        childList: true,
        subtree: true,
      });
    }

    // Cleanup on unmount
    map.on('remove', () => {
      clearInterval(attribInterval);
      observer.disconnect();
    });

    map.on('load', () => {
      // Remove attribution
      const attribElements = document.getElementsByClassName('mapboxgl-ctrl-attrib');
      while (attribElements.length > 0) {
        attribElements[0].remove();
      }

      if (latitude !== null && longitude !== null) {
        new mapboxgl.Marker({ color: '#F7C400', scale: 1.5 })
          .setLngLat([longitude!, latitude!])
          .addTo(map);
      }
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [isMounted, token]);

  useEffect(() => {
    if (!isMounted || !mapInstanceRef.current || latitude === null || longitude === null) return;

    const map = mapInstanceRef.current;

    map.flyTo({
      center: [longitude!, latitude!],
      zoom: 18,
      speed: 1.2,
      curve: 1.42,
    });

    const markers = document.getElementsByClassName('mapboxgl-marker');
    while (markers.length > 0) {
      markers[0].remove();
    }

    new mapboxgl.Marker({ color: '#F7C400', scale: 1.5 })
      .setLngLat([longitude!, latitude!])
      .addTo(map);

    // Ensure attribution is removed after animation
    setTimeout(() => {
      const attribElements = document.querySelectorAll('.mapboxgl-ctrl-attrib, [class*="attribution"]');
      attribElements.forEach(el => {
        (el as HTMLElement).style.display = 'none';
        (el as HTMLElement).remove();
      });
    }, 500);
  }, [isMounted, latitude, longitude]);

  const handleTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (token) {
      localStorage.setItem('mapbox_token', token);
      setShowTokenInput(false);
      window.location.reload();
    }
  };

  if (!isMounted) {
    return (
      <div
        className={`mapbox-map ${className}`}
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#e5e7eb',
        }}
      />
    );
  }

  if (showTokenInput) {
    return (
      <div
        className={`mapbox-map ${className}`}
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          backgroundColor: '#f9fafb',
        }}
      >
        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          maxWidth: '400px',
          width: '100%',
        }}>
          <h3 style={{
            marginBottom: '12px',
            color: '#552627',
            fontSize: '18px',
            fontWeight: 'bold',
          }}>Mapbox Access Token Required</h3>
          <p style={{
            marginBottom: '16px',
            color: '#6b7280',
            fontSize: '14px',
            lineHeight: '1.5',
          }}>
            To display detailed maps with buildings, we use Mapbox. Please enter your free Mapbox access token:
          </p>
          <a
            href="https://account.mapbox.com/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block',
              color: '#F7C400',
              textDecoration: 'underline',
              marginBottom: '16px',
              fontSize: '14px',
            }}
          >
            Get free Mapbox token →
          </a>
          <form onSubmit={handleTokenSubmit}>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="pk.eyJ1Ijo..."
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                marginBottom: '12px',
                fontSize: '14px',
                fontFamily: 'monospace',
              }}
            />
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#F7C400',
                color: 'black',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              Save Token
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mapContainerRef}
      className={`mapbox-map ${className}`}
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

export default MapboxMap;
