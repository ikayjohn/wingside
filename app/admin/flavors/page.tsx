"use client";

import { useEffect, useState } from 'react';

interface Flavor {
  id: string;
  name: string;
  category: string;
  description: string | null;
  image_url: string | null;
  spice_level: number;
  is_active: boolean;
  show_on_homepage: boolean;
  available_for_products: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = ['HOT', 'BBQ', 'DRY RUB', 'BOLD & FUN', 'SWEET', 'BOOZY'];
const SPICE_LEVELS = [0, 1, 2, 3, 4, 5];

export default function AdminFlavorsPage() {
  const [flavors, setFlavors] = useState<Flavor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingFlavor, setEditingFlavor] = useState<Flavor | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'HOT',
    description: '',
    image_url: '',
    spice_level: 0,
    is_active: true,
    show_on_homepage: true,
    available_for_products: true,
    display_order: 0,
  });
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    fetchFlavors();
  }, [filter, categoryFilter]);

  async function fetchFlavors() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter === 'active') params.set('active', 'true');
      if (categoryFilter !== 'all') params.set('category', categoryFilter);

      // Add cache-busting headers
      const response = await fetch(`/api/admin/flavors?${params}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
        cache: 'no-store',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch flavors');
      }

      setFlavors(data.flavors || []);
    } catch (error: any) {
      console.error('Error fetching flavors:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleEdit = (flavor: Flavor) => {
    setEditingFlavor(flavor);
    setFormData({
      name: flavor.name,
      category: flavor.category,
      description: flavor.description || '',
      image_url: flavor.image_url || '',
      spice_level: flavor.spice_level,
      is_active: flavor.is_active,
      show_on_homepage: flavor.show_on_homepage,
      available_for_products: flavor.available_for_products,
      display_order: flavor.display_order,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this flavor?')) return;

    try {
      const response = await fetch(`/api/admin/flavors/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete flavor');
      }

      alert('Flavor deleted successfully');
      fetchFlavors();
    } catch (error: any) {
      alert(error.message || 'Failed to delete flavor');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const url = editingFlavor ? `/api/admin/flavors/${editingFlavor.id}` : '/api/admin/flavors';
    const method = editingFlavor ? 'PATCH' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save flavor');
      }

      alert(editingFlavor ? 'Flavor updated successfully' : 'Flavor created successfully');
      setShowForm(false);
      setEditingFlavor(null);
      resetForm();
      fetchFlavors();
    } catch (error: any) {
      alert(error.message || 'Failed to save flavor');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'HOT',
      description: '',
      image_url: '',
      spice_level: 0,
      is_active: true,
      show_on_homepage: true,
      available_for_products: true,
      display_order: 0,
    });
  };

  const getSpiceColor = (level: number) => {
    const colors = [
      'bg-gray-100 text-gray-700',
      'bg-yellow-100 text-yellow-700',
      'bg-orange-100 text-orange-700',
      'bg-orange-200 text-orange-800',
      'bg-red-200 text-red-800',
      'bg-red-600 text-white'
    ];
    return colors[Math.min(level, 5)];
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'HOT': 'bg-red-100 text-red-800',
      'BBQ': 'bg-amber-100 text-amber-800',
      'DRY RUB': 'bg-yellow-100 text-yellow-800',
      'BOLD & FUN': 'bg-purple-100 text-purple-800',
      'SWEET': 'bg-pink-100 text-pink-800',
      'BOOZY': 'bg-blue-100 text-blue-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading flavors...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Flavor Management</h1>
          <p className="text-gray-600 mt-1">Manage all wing flavors from one place</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingFlavor(null);
            setShowForm(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add New Flavor
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 mb-6 flex gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({flavors.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'active' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Active ({flavors.filter(f => f.is_active).length})
          </button>
          <button
            onClick={() => setFilter('inactive')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'inactive' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Inactive ({flavors.filter(f => !f.is_active).length})
          </button>
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingFlavor ? 'Edit Flavor' : 'Add New Flavor'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Flavor Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Wingferno"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description of the flavor"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL
                </label>
                <input
                  type="text"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="/flavors/wingferno.jpg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Spice Level (0-5)
                </label>
                <div className="flex gap-2">
                  {SPICE_LEVELS.map(level => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setFormData({ ...formData, spice_level: level })}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                        formData.spice_level === level
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Lower numbers appear first"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <label htmlFor="is_active" className="text-sm text-gray-700">
                    Active (master toggle - flavor exists in system)
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="show_on_homepage"
                    checked={formData.show_on_homepage}
                    onChange={(e) => setFormData({ ...formData, show_on_homepage: e.target.checked })}
                    className="w-4 h-4 text-green-600"
                  />
                  <label htmlFor="show_on_homepage" className="text-sm text-gray-700">
                    Show on Homepage (display in flavor catalog)
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="available_for_products"
                    checked={formData.available_for_products}
                    onChange={(e) => setFormData({ ...formData, available_for_products: e.target.checked })}
                    className="w-4 h-4 text-purple-600"
                  />
                  <label htmlFor="available_for_products" className="text-sm text-gray-700">
                    Available for Products (can be selected when ordering)
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingFlavor ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingFlavor(null);
                    resetForm();
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Flavors Grid */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Flavor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Spice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Homepage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Products
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Order
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {flavors.map((flavor) => (
                <tr key={flavor.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {flavor.image_url && (
                        <img
                          src={flavor.image_url}
                          alt={flavor.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">{flavor.name}</div>
                        {flavor.description && (
                          <div className="text-xs text-gray-500 max-w-xs truncate">
                            {flavor.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(flavor.category)}`}>
                      {flavor.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span
                          key={i}
                          className={`w-2 h-2 rounded-full ${
                            i < flavor.spice_level ? 'bg-red-500' : 'bg-gray-200'
                          }`}
                        />
                      ))}
                      <span className="text-xs text-gray-500 ml-2">{flavor.spice_level}/5</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      flavor.show_on_homepage
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {flavor.show_on_homepage ? 'Visible' : 'Hidden'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      flavor.available_for_products
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {flavor.available_for_products ? 'Available' : 'Unavailable'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {flavor.display_order}
                  </td>
                  <td className="px-6 py-4 text-right text-sm">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(flavor)}
                        className="text-blue-600 hover:text-blue-900 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(flavor.id)}
                        className="text-red-600 hover:text-red-900 font-medium"
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

        {flavors.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No flavors found
          </div>
        )}
      </div>
    </div>
  );
}
