"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Address {
  id: string;
  label: string;
  street_address: string;
  city: string;
  state?: string;
  postal_code?: string;
  country: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export default function MyAddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    label: '',
    street_address: '',
    city: '',
    state: '',
    postal_code: '',
    is_default: false,
  });

  // Fetch addresses
  const fetchAddresses = async () => {
    try {
      const response = await fetch('/api/user/addresses');
      if (!response.ok) {
        throw new Error('Failed to fetch addresses');
      }
      const data = await response.json();
      setAddresses(data.addresses || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingAddress 
        ? `/api/user/addresses/${editingAddress.id}`
        : '/api/user/addresses';
      
      const response = await fetch(url, {
        method: editingAddress ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save address');
      }

      // Reset form and close modal
      setFormData({
        label: '',
        street_address: '',
        city: '',
        state: '',
        postal_code: '',
        is_default: false,
      });
      setShowAddModal(false);
      setShowEditModal(false);
      setEditingAddress(null);

      // Refresh addresses
      await fetchAddresses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) {
      return;
    }

    try {
      const response = await fetch(`/api/user/addresses/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete address');
      }

      // Refresh addresses
      await fetchAddresses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  // Handle set as default
  const handleSetDefault = async (id: string) => {
    try {
      const response = await fetch(`/api/user/addresses/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_default: true }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to set default address');
      }

      // Refresh addresses
      await fetchAddresses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  // Open edit modal
  const openEditModal = (address: Address) => {
    setEditingAddress(address);
    setFormData({
      label: address.label,
      street_address: address.street_address,
      city: address.city,
      state: address.state || '',
      postal_code: address.postal_code || '',
      is_default: address.is_default,
    });
    setShowEditModal(true);
  };

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
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add New Address
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading addresses...</p>
          </div>
        )}

        {/* Addresses Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {addresses.map((address) => (
              <div key={address.id} className="bg-white rounded-xl p-6 shadow-sm relative">
                {address.is_default && (
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
                    <p className="text-sm text-gray-600 mb-1">{address.street_address}</p>
                    <p className="text-sm text-gray-600 mb-1">
                      {address.city}, {address.state} {address.postal_code}
                    </p>
                    <p className="text-sm text-gray-600">{address.country}</p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <button 
                    onClick={() => openEditModal(address)}
                    className="flex-1 text-sm font-medium text-blue-600 hover:text-blue-700 py-2"
                  >
                    Edit
                  </button>
                  {!address.is_default && (
                    <>
                      <button 
                        onClick={() => handleSetDefault(address.id)}
                        className="flex-1 text-sm font-medium text-gray-600 hover:text-gray-700 py-2"
                      >
                        Set as Default
                      </button>
                      <button 
                        onClick={() => handleDelete(address.id)}
                        className="flex-1 text-sm font-medium text-red-600 hover:text-red-700 py-2"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && addresses.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No addresses yet</h3>
            <p className="text-gray-600 mb-6">Add your first delivery address to get started</p>
            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Add Your First Address
            </button>
          </div>
        )}

        {/* Add/Edit Address Modal */}
        {(showAddModal || showEditModal) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">
                    {editingAddress ? 'Edit Address' : 'Add New Address'}
                  </h2>
                  <button 
                    onClick={() => {
                      setShowAddModal(false);
                      setShowEditModal(false);
                      setEditingAddress(null);
                      setFormData({
                        label: '',
                        street_address: '',
                        city: '',
                        state: '',
                        postal_code: '',
                        is_default: false,
                      });
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address Label *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.label}
                        onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Home, Office, etc."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Street Address *
                      </label>
                      <textarea
                        required
                        value={formData.street_address}
                        onChange={(e) => setFormData({ ...formData, street_address: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={2}
                        placeholder="Enter your street address"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Lagos"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State
                      </label>
                      <input
                        type="text"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Lagos State"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Postal Code
                      </label>
                      <input
                        type="text"
                        value={formData.postal_code}
                        onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="100001"
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="is_default"
                        checked={formData.is_default}
                        onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="is_default" className="ml-2 text-sm text-gray-700">
                        Set as default address
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddModal(false);
                        setShowEditModal(false);
                        setEditingAddress(null);
                        setFormData({
                          label: '',
                          street_address: '',
                          city: '',
                          state: '',
                          postal_code: '',
                          is_default: false,
                        });
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      {editingAddress ? 'Update Address' : 'Add Address'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
