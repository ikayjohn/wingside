"use client";

import React, { useState } from 'react';
import Link from 'next/link';

export default function MyAddressesPage() {
  const [addresses] = useState([
    {
      id: 1,
      label: 'Home',
      name: 'Fortune Wingside',
      address: '123 Wing Street, Lekki Phase 1',
      city: 'Lagos',
      phone: '+234 801 234 5678',
      isDefault: true,
    },
    {
      id: 2,
      label: 'Office',
      name: 'Fortune Wingside',
      address: '45 Corporate Drive, Victoria Island',
      city: 'Lagos',
      phone: '+234 801 234 5678',
      isDefault: false,
    },
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1200px] mx-auto px-4 py-8 md:px-6 lg:px-8">

        {/* Back to Dashboard */}
        <Link href="/my-account/dashboard" className="wallet-history-back">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="wallet-history-header">
          <h1 className="wallet-history-title">My Addresses</h1>
          <p className="wallet-history-subtitle">Manage your delivery addresses</p>
        </div>

        {/* Add Address Button */}
        <div className="mb-6">
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add New Address
          </button>
        </div>

        {/* Addresses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {addresses.map((address) => (
            <div key={address.id} className="bg-white rounded-xl p-6 shadow-sm relative">
              {address.isDefault && (
                <div className="absolute top-4 right-4">
                  <span className="bg-blue-100 text-blue-700 text-xs font-medium px-3 py-1 rounded-full">
                    Default
                  </span>
                </div>
              )}

              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{address.label}</h3>
                  <p className="text-sm text-gray-600 mb-1">{address.name}</p>
                  <p className="text-sm text-gray-600 mb-1">{address.address}</p>
                  <p className="text-sm text-gray-600 mb-1">{address.city}</p>
                  <p className="text-sm text-gray-600">{address.phone}</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button className="flex-1 text-sm font-medium text-blue-600 hover:text-blue-700 py-2">
                  Edit
                </button>
                {!address.isDefault && (
                  <>
                    <button className="flex-1 text-sm font-medium text-gray-600 hover:text-gray-700 py-2">
                      Set as Default
                    </button>
                    <button className="flex-1 text-sm font-medium text-red-600 hover:text-red-700 py-2">
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
