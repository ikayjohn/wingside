'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface WingpostLocation {
  id: number;
  name: string;
  badge: string | null;
  address: string;
  city: string;
  rating: number;
  reviews: number;
  distance: string | null;
  thumbnail: string | null;
  image: string | null;
  phone: string;
  hours: string;
  maps_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface LocationFormData {
  name: string;
  badge: string;
  address: string;
  city: string;
  rating: number;
  reviews: number;
  distance: string;
  thumbnail: string;
  image: string;
  phone: string;
  hours: string;
  maps_url: string;
  is_active: boolean;
}

export default function AdminWingpostLocationsPage() {
  const router = useRouter();
  const [locations, setLocations] = useState<WingpostLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<WingpostLocation | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<LocationFormData>({
    name: '',
    badge: '',
    address: '',
    city: '',
    rating: 4.9,
    reviews: 0,
    distance: '',
    thumbnail: '',
    image: '',
    phone: '',
    hours: '',
    maps_url: '',
    is_active: true,
  });

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/admin/wingpost-locations', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
        cache: 'no-store',
      });

      if (response.status === 401) {
        router.push('/signin');
        return;
      }

      if (response.status === 403) {
        setError('You do not have permission to access this page');
        setLoading(false);
        return;
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch locations');
      }

      const data = await response.json();
      setLocations(data.locations || []);
    } catch (err: any) {
      console.error('Error fetching locations:', err);
      setError(err.message || 'Failed to load locations');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingLocation(null);
    setFormData({
      name: '',
      badge: '',
      address: '',
      city: '',
      rating: 4.9,
      reviews: 0,
      distance: '',
      thumbnail: '',
      image: '',
      phone: '',
      hours: '',
      maps_url: '',
      is_active: true,
    });
    setShowModal(true);
    setSuccessMessage('');
  };

  const openEditModal = (location: WingpostLocation) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      badge: location.badge || '',
      address: location.address,
      city: location.city,
      rating: location.rating,
      reviews: location.reviews,
      distance: location.distance || '',
      thumbnail: location.thumbnail || '',
      image: location.image || '',
      phone: location.phone,
      hours: location.hours,
      maps_url: location.maps_url || '',
      is_active: location.is_active,
    });
    setShowModal(true);
    setSuccessMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const url = editingLocation
        ? `/api/admin/wingpost-locations/${editingLocation.id}`
        : '/api/admin/wingpost-locations';

      const method = editingLocation ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save location');
      }

      const data = await response.json();

      if (editingLocation) {
        setLocations(locations.map(loc =>
          loc.id === editingLocation.id ? data.location : loc
        ));
        setSuccessMessage('Location updated successfully');
      } else {
        setLocations([data.location, ...locations]);
        setSuccessMessage('Location created successfully');
      }

      setTimeout(() => {
        setShowModal(false);
        setSuccessMessage('');
      }, 1500);
    } catch (err: any) {
      console.error('Error saving location:', err);
      setError(err.message || 'Failed to save location');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this location?')) {
      return;
    }

    try {
      setError('');

      const response = await fetch(`/api/admin/wingpost-locations/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete location');
      }

      setLocations(locations.filter(loc => loc.id !== id));
      setSuccessMessage('Location deleted successfully');
      setDeleteConfirm(null);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Error deleting location:', err);
      setError(err.message || 'Failed to delete location');
    }
  };

  const toggleActive = async (location: WingpostLocation) => {
    try {
      setError('');

      const response = await fetch(`/api/admin/wingpost-locations/${location.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !location.is_active }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update location');
      }

      const data = await response.json();
      setLocations(locations.map(loc =>
        loc.id === location.id ? data.location : loc
      ));
      setSuccessMessage(`Location ${location.is_active ? 'disabled' : 'enabled'} successfully`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Error toggling location:', err);
      setError(err.message || 'Failed to update location');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F7C400] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Wingpost Locations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <a href="/admin" className="hover:text-[#F7C400]">Admin</a>
            <span>/</span>
            <span className="text-gray-900">Wingpost Locations</span>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Wingpost Locations</h1>
              <p className="text-gray-600 mt-1">Manage Wingpost kiosk locations</p>
            </div>
            <button
              onClick={openAddModal}
              className="bg-[#F7C400] text-black px-6 py-2 rounded-lg font-semibold hover:bg-[#e5b500] transition-colors"
            >
              Add Location
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {successMessage}
          </div>
        )}

        {/* Locations Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {locations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No locations found. Add your first Wingpost location.
                    </td>
                  </tr>
                ) : (
                  locations.map((location) => (
                    <tr key={location.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {location.thumbnail && (
                            <img
                              src={location.thumbnail}
                              alt={location.name}
                              className="h-12 w-12 rounded-lg object-cover mr-4"
                            />
                          )}
                          <div>
                            <div className="font-medium text-gray-900">{location.name}</div>
                            {location.badge && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 mt-1">
                                {location.badge}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{location.address}</div>
                        <div className="text-sm text-gray-500">{location.city}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{location.phone}</div>
                        <div className="text-sm text-gray-500">{location.hours}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 24 24">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                          </svg>
                          <span className="ml-1 text-sm font-medium">{location.rating}</span>
                          <span className="ml-1 text-sm text-gray-500">({location.reviews})</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleActive(location)}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            location.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {location.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEditModal(location)}
                            className="text-[#F7C400] hover:text-[#e5b500] font-medium text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(location.id)}
                            className="text-red-600 hover:text-red-700 font-medium text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {editingLocation ? 'Edit Location' : 'Add New Location'}
                    </h2>
                    <p className="text-gray-600 mt-1">
                      {editingLocation ? 'Update location details' : 'Add a new Wingpost location'}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Location Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7C400] focus:border-transparent"
                        placeholder="e.g., Microsoft Nigeria"
                      />
                    </div>

                    {/* Badge */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Badge (Optional)
                      </label>
                      <input
                        type="text"
                        value={formData.badge}
                        onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7C400] focus:border-transparent"
                        placeholder="e.g., Popular"
                      />
                    </div>

                    {/* Address */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7C400] focus:border-transparent"
                        placeholder="Street address"
                      />
                    </div>

                    {/* City */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7C400] focus:border-transparent"
                        placeholder="e.g., Victoria Island, Lagos"
                      />
                    </div>

                    {/* Distance */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Distance (Optional)
                      </label>
                      <input
                        type="text"
                        value={formData.distance}
                        onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7C400] focus:border-transparent"
                        placeholder="e.g., 0.5 km"
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7C400] focus:border-transparent"
                        placeholder="08090191999"
                      />
                    </div>

                    {/* Hours */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Operating Hours *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.hours}
                        onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7C400] focus:border-transparent"
                        placeholder="e.g., 8:00 AM - 10:00 PM Daily"
                      />
                    </div>

                    {/* Rating */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rating
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        value={formData.rating}
                        onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7C400] focus:border-transparent"
                      />
                    </div>

                    {/* Reviews */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Number of Reviews
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.reviews}
                        onChange={(e) => setFormData({ ...formData, reviews: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7C400] focus:border-transparent"
                      />
                    </div>

                    {/* Thumbnail */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Thumbnail URL (Optional)
                      </label>
                      <input
                        type="text"
                        value={formData.thumbnail}
                        onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7C400] focus:border-transparent"
                        placeholder="/wingpost-location-1.jpg"
                      />
                    </div>

                    {/* Image */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Image URL (Optional)
                      </label>
                      <input
                        type="text"
                        value={formData.image}
                        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7C400] focus:border-transparent"
                        placeholder="/wingpost-location-1.jpg"
                      />
                    </div>

                    {/* Maps URL */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Google Maps URL (Optional)
                      </label>
                      <input
                        type="text"
                        value={formData.maps_url}
                        onChange={(e) => setFormData({ ...formData, maps_url: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7C400] focus:border-transparent"
                        placeholder="https://www.google.com/maps/..."
                      />
                    </div>

                    {/* Active Status */}
                    <div className="md:col-span-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.is_active}
                          onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                          className="w-4 h-4 text-[#F7C400] border-gray-300 rounded focus:ring-[#F7C400]"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">Active (visible on website)</span>
                      </label>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                      {error}
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-2 bg-[#F7C400] text-black rounded-lg font-medium hover:bg-[#e5b500] disabled:opacity-50"
                    >
                      {submitting ? 'Saving...' : editingLocation ? 'Update Location' : 'Add Location'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Location</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this location? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
