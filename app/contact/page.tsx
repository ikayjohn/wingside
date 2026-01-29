"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import MapboxMap from '@/components/MapboxMap';

interface Location {
  id: string;
  name: string;
  badge?: string;
  address: string;
  city: string;
  state: string;
  rating: number;
  reviews: number;
  thumbnail: string;
  image: string;
  phone: string;
  email: string;
  hours: string;
  services: string[];
  features: string[];
  mapsUrl: string;
  latitude?: number | null;
  longitude?: number | null;
}

export default function ContactPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch stores from API
  useEffect(() => {
    async function fetchStores() {
      try {
        const response = await fetch('/api/stores', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'x-bypass-cache': 'true',
          }
        });
        const data = await response.json();

        if (data.stores) {
          // Transform API data to match Location interface
          const transformedStores = data.stores.map((store: any) => {
            console.log('Store from API:', store.id, store.name, 'lat:', store.latitude, 'lon:', store.longitude);
            return {
              id: store.id,
              name: store.name,
              badge: store.is_headquarters ? 'Headquarters' : undefined,
              address: store.address,
              city: store.city,
              state: store.state,
              rating: store.rating || 0,
              reviews: store.review_count || 0,
              thumbnail: store.thumbnail_url || '/contact-location-thumb.jpg',
              image: store.image_url || '/contact-location.jpg',
              phone: store.phone || '',
              email: store.email || '',
              hours: store.opening_hours || 'Hours not available',
              services: store.services || [],
              features: store.features || [],
              mapsUrl: store.maps_url || '',
              latitude: store.latitude || null,
              longitude: store.longitude || null,
            };
          });

          setLocations(transformedStores);

          // Auto-select first location
          if (transformedStores.length > 0 && !selectedLocation) {
            setSelectedLocation(transformedStores[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching stores:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStores();
  }, []);

  const filteredLocations = locations.filter(location => {
    const matchesSearch = searchQuery === '' ||
      location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.city.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesState = selectedState === '' || location.state === selectedState;

    return matchesSearch && matchesState;
  });

  const states = Array.from(new Set(locations.map(loc => loc.state)));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-[1400px] mx-auto px-4 py-8 md:px-8 lg:px-16">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-black mb-3">Contact us</h1>
            <p className="text-gray-600 text-lg">Loading locations...</p>
          </div>
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#F7C400]"></div>
          </div>
        </div>
      </div>
    );
  }

  const locationCount = locations.length;
  const uniqueStates = Array.from(new Set(locations.map(loc => loc.state)));
  const stateText = uniqueStates.length === 1
    ? uniqueStates[0]
    : `${uniqueStates.length} states`;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1400px] mx-auto px-4 py-8 md:px-8 lg:px-16">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-black mb-3">Contact us</h1>
          <p className="text-gray-600 text-lg">
            We are available in {locationCount} {locationCount === 1 ? 'location' : 'locations'} in {stateText}
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search by city, address or location name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-6 py-4 rounded-full border border-gray-300 focus:outline-none focus:border-[#F7C400] text-gray-700"
            />
            <svg
              className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
          </div>

          {/* State Dropdown */}
          <div className="relative">
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full px-6 py-4 rounded-full border border-gray-300 focus:outline-none focus:border-[#F7C400] text-gray-700 appearance-none bg-white"
            >
              <option value="">Choose state</option>
              {states.map((state) => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
            <svg
              className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Locations List */}
          <div className="space-y-4">
            {filteredLocations.map((location) => (
              <div
                key={location.id}
                onClick={() => setSelectedLocation(location)}
                className={`bg-white rounded-2xl p-6 cursor-pointer transition-all ${
                  selectedLocation?.id === location.id
                    ? 'border-2 border-[#F7C400] shadow-md'
                    : 'border border-gray-200 hover:border-[#F7C400] hover:shadow-sm'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg text-black">{location.name}</h3>
                      {location.badge && (
                        <span className="px-2 py-0.5 bg-[#8B4513] text-white text-xs rounded">
                          {location.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{location.address}</p>
                    <p className="text-sm text-gray-600 mb-3">{location.city}</p>
                  </div>
                  <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                    <MapboxMap
                      address={location.address}
                      city={location.city}
                      className="w-full h-full"
                      latitude={location.latitude}
                      longitude={location.longitude}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Location Details Panel */}
          {selectedLocation && (
            <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 sticky top-8 h-fit">
              {/* Location Map */}
              <div className="relative h-[350px] bg-gray-100">
                <MapboxMap
                  address={selectedLocation.address}
                  city={selectedLocation.city}
                  className="w-full h-full"
                  latitude={selectedLocation.latitude}
                  longitude={selectedLocation.longitude}
                />
                {selectedLocation.badge && (
                  <span className="absolute top-4 right-4 px-3 py-1 bg-[#F7C400] text-black text-sm font-semibold rounded shadow-lg">
                    {selectedLocation.badge}
                  </span>
                )}
              </div>

               {/* Details Content */}
               <div className="p-6">
                 {/* Title */}
                 <h2 className="text-2xl font-bold text-black mb-4">{selectedLocation.name}</h2>

                {/* Address */}
                <div className="flex items-start gap-3 mb-3">
                  <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <div>
                    <p className="text-gray-700">{selectedLocation.address}</p>
                    <p className="text-gray-700">{selectedLocation.city}</p>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-center gap-3 mb-3">
                  <svg className="w-5 h-5 text-gray-400 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                  <p className="text-gray-700">{selectedLocation.phone}</p>
                </div>

                {/* Email */}
                <div className="flex items-center gap-3 mb-6">
                  <svg className="w-5 h-5 text-gray-400 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                  <p className="text-gray-700">{selectedLocation.email}</p>
                </div>

                {/* Hours */}
                <div className="mb-6">
                  <h3 className="font-semibold text-black mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    Hours
                  </h3>
                  <p className="text-gray-900 font-medium">{selectedLocation.hours}</p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <a
                    href={selectedLocation.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-[#F7C400] text-black font-semibold py-4 rounded-full hover:bg-[#e5b500] transition-colors flex items-center justify-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 11l19-9-9 19-2-8-8-2z"></path>
                    </svg>
                    Get Directions
                  </a>
                  <a
                    href={`tel:${selectedLocation.phone}`}
                    className="w-full border-2 border-gray-300 text-gray-700 font-semibold py-4 rounded-full hover:border-[#F7C400] hover:text-black transition-colors flex items-center justify-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                    Call Location
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
