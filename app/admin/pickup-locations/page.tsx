"use client";

import { useEffect, useState } from 'react';

interface PickupLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  phone?: string;
  opening_hours?: string;
  estimated_time: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

interface LocationFormData {
  name: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  opening_hours: string;
  estimated_time: string;
  is_active: boolean;
  display_order: number;
}

const defaultFormData: LocationFormData = {
  name: '',
  address: '',
  city: 'Port Harcourt',
  state: 'Rivers',
  phone: '',
  opening_hours: '',
  estimated_time: '15-20 mins',
  is_active: true,
  display_order: 0,
};

export default function AdminPickupLocationsPage() {
  const [locations, setLocations] = useState<PickupLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<PickupLocation | null>(null);
  const [formData, setFormData] = useState<LocationFormData>(defaultFormData);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchLocations();
  }, []);

  async function fetchLocations() {
    try {
      setLoading(true);
      setError('');

      const res = await fetch('/api/pickup-locations');
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || 'Failed to load pickup locations');
        return;
      }

      setLocations(json.pickupLocations || []);
    } catch (err) {
      console.error('Error fetching locations:', err);
      setError('Failed to load pickup locations');
    } finally {
      setLoading(false);
    }
  }

  function openAddModal() {
    setEditingLocation(null);
    setFormData(defaultFormData);
    setFormError('');
    setShowModal(true);
  }

  function openEditModal(location: PickupLocation) {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      address: location.address,
      city: location.city,
      state: location.state,
      phone: location.phone || '',
      opening_hours: location.opening_hours || '',
      estimated_time: location.estimated_time,
      is_active: location.is_active,
      display_order: location.display_order,
    });
    setFormError('');
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingLocation(null);
    setFormData(defaultFormData);
    setFormError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Please enter a location name');
      return;
    }

    if (!formData.address.trim()) {
      setFormError('Please enter an address');
      return;
    }

    setSaving(true);

    try {
      const url = editingLocation
        ? `/api/pickup-locations/${editingLocation.id}`
        : '/api/pickup-locations';

      const method = editingLocation ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const json = await res.json();

      if (!res.ok) {
        setFormError(json.error || 'Failed to save pickup location');
        return;
      }

      closeModal();
      fetchLocations();
    } catch (err) {
      console.error('Error saving location:', err);
      setFormError('Failed to save pickup location');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(location: PickupLocation) {
    if (!confirm(`Are you sure you want to delete "${location.name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/pickup-locations/${location.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const json = await res.json();
        alert(json.error || 'Failed to delete location');
        return;
      }

      fetchLocations();
    } catch (err) {
      console.error('Error deleting location:', err);
      alert('Failed to delete location');
    }
  }

  async function toggleActive(location: PickupLocation) {
    try {
      const res = await fetch(`/api/pickup-locations/${location.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...location,
          is_active: !location.is_active,
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        alert(json.error || 'Failed to update location');
        return;
      }

      fetchLocations();
    } catch (err) {
      console.error('Error toggling location:', err);
      alert('Failed to update location');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading pickup locations...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-[#552627]">Stores List</h1>
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-[#F7C400] text-black font-semibold rounded-lg hover:bg-[#e5b800] transition-colors"
        >
          + Add Location
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 mb-6 text-sm">
          {error}
        </div>
      )}

      {locations.length === 0 ? (
        <div className="bg-white rounded-lg p-8 text-center shadow-sm border border-gray-200">
          <p className="text-gray-600 mb-4">No pickup locations yet</p>
          <button
            onClick={openAddModal}
            className="text-[#F7C400] hover:text-[#e5b800] font-medium"
          >
            Add your first location
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Est. Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {locations.map((location) => (
                <tr key={location.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{location.name}</div>
                      {location.phone && (
                        <div className="text-xs text-gray-500">{location.phone}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{location.address}</div>
                    <div className="text-xs text-gray-500">
                      {location.city}, {location.state}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {location.estimated_time}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleActive(location)}
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        location.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {location.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-3">
                      <button
                        onClick={() => openEditModal(location)}
                        className="text-[#F7C400] hover:text-[#e5b800] font-medium text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(location)}
                        className="text-red-600 hover:text-red-800 font-medium text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold text-[#552627]">
                  {editingLocation ? 'Edit Pickup Location' : 'Add Pickup Location'}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {formError && (
                  <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm">
                    {formError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Wingside, Autograph Mall"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7C400]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address *
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="e.g., Autograph Mall, Peter Odili Road"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7C400]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7C400]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7C400]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone (optional)
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+234 XXX XXX XXXX"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7C400]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estimated Time
                    </label>
                    <input
                      type="text"
                      value={formData.estimated_time}
                      onChange={(e) => setFormData({ ...formData, estimated_time: e.target.value })}
                      placeholder="e.g., 15-20 mins"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7C400]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Opening Hours (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.opening_hours}
                    onChange={(e) => setFormData({ ...formData, opening_hours: e.target.value })}
                    placeholder="e.g., 10am - 10pm daily"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7C400]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Display Order
                    </label>
                    <input
                      type="number"
                      value={formData.display_order}
                      onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7C400]"
                    />
                  </div>
                  <div className="flex items-center pt-6">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4 text-[#F7C400] border-gray-300 rounded focus:ring-[#F7C400]"
                    />
                    <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                      Active (visible to customers)
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-4 py-2 bg-[#F7C400] text-black font-semibold rounded-lg hover:bg-[#e5b800] transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : editingLocation ? 'Update Location' : 'Add Location'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
