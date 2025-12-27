"use client";

import { useEffect, useState } from 'react';

interface JobPosition {
  id: string;
  title: string;
  location: string;
  overview: string | null;
  responsibilities: string[] | null;
  qualifications: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function AdminJobPositionsPage() {
  const [positions, setPositions] = useState<JobPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPosition, setEditingPosition] = useState<JobPosition | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    overview: '',
    responsibilities: [''],
    qualifications: [''],
    is_active: true,
  });
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    fetchPositions();
  }, [filter]);

  async function fetchPositions() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('admin', 'true');
      if (filter === 'active') params.set('active', 'true');
      if (filter === 'inactive') params.set('active', 'false');

      const response = await fetch(`/api/job-positions?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch positions');
      }

      setPositions(data.positions || []);
    } catch (error: any) {
      console.error('Error fetching positions:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleEdit = (position: JobPosition) => {
    setEditingPosition(position);
    setFormData({
      title: position.title,
      location: position.location,
      overview: position.overview || '',
      responsibilities: position.responsibilities || [''],
      qualifications: position.qualifications || [''],
      is_active: position.is_active,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this position?')) return;

    try {
      const response = await fetch(`/api/job-positions/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete position');
      }

      alert('Position deleted successfully');
      fetchPositions();
    } catch (error: any) {
      alert(error.message || 'Failed to delete position');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Filter out empty strings from arrays
    const cleanedResponsibilities = formData.responsibilities.filter(r => r.trim() !== '');
    const cleanedQualifications = formData.qualifications.filter(q => q.trim() !== '');

    const payload = {
      ...formData,
      responsibilities: cleanedResponsibilities,
      qualifications: cleanedQualifications,
    };

    try {
      const url = editingPosition
        ? `/api/job-positions/${editingPosition.id}`
        : '/api/job-positions';
      const method = editingPosition ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save position');
      }

      alert(editingPosition ? 'Position updated successfully' : 'Position created successfully');
      setShowForm(false);
      setEditingPosition(null);
      resetForm();
      fetchPositions();
    } catch (error: any) {
      alert(error.message || 'Failed to save position');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      location: '',
      overview: '',
      responsibilities: [''],
      qualifications: [''],
      is_active: true,
    });
  };

  const addResponsibility = () => {
    setFormData({
      ...formData,
      responsibilities: [...formData.responsibilities, ''],
    });
  };

  const removeResponsibility = (index: number) => {
    const newResponsibilities = formData.responsibilities.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      responsibilities: newResponsibilities.length > 0 ? newResponsibilities : [''],
    });
  };

  const updateResponsibility = (index: number, value: string) => {
    const newResponsibilities = [...formData.responsibilities];
    newResponsibilities[index] = value;
    setFormData({
      ...formData,
      responsibilities: newResponsibilities,
    });
  };

  const addQualification = () => {
    setFormData({
      ...formData,
      qualifications: [...formData.qualifications, ''],
    });
  };

  const removeQualification = (index: number) => {
    const newQualifications = formData.qualifications.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      qualifications: newQualifications.length > 0 ? newQualifications : [''],
    });
  };

  const updateQualification = (index: number, value: string) => {
    const newQualifications = [...formData.qualifications];
    newQualifications[index] = value;
    setFormData({
      ...formData,
      qualifications: newQualifications,
    });
  };

  if (showForm) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <button
            onClick={() => {
              setShowForm(false);
              setEditingPosition(null);
              resetForm();
            }}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back to Positions
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6">
            {editingPosition ? 'Edit Position' : 'Create New Position'}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Position Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                placeholder="e.g. Human Resources Manager"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location *
              </label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                placeholder="e.g. Port Harcourt"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Overview
              </label>
              <textarea
                value={formData.overview}
                onChange={(e) => setFormData({ ...formData, overview: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                rows={4}
                placeholder="Brief description of the role..."
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Key Responsibilities
                </label>
                <button
                  type="button"
                  onClick={addResponsibility}
                  className="text-sm text-yellow-600 hover:text-yellow-700"
                >
                  + Add Responsibility
                </button>
              </div>
              {formData.responsibilities.map((resp, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={resp}
                    onChange={(e) => updateResponsibility(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    placeholder={`Responsibility ${index + 1}`}
                  />
                  {formData.responsibilities.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeResponsibility(index)}
                      className="px-3 py-2 text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Qualifications
                </label>
                <button
                  type="button"
                  onClick={addQualification}
                  className="text-sm text-yellow-600 hover:text-yellow-700"
                >
                  + Add Qualification
                </button>
              </div>
              {formData.qualifications.map((qual, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={qual}
                    onChange={(e) => updateQualification(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    placeholder={`Qualification ${index + 1}`}
                  />
                  {formData.qualifications.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQualification(index)}
                      className="px-3 py-2 text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 text-yellow-400 border-gray-300 rounded focus:ring-yellow-400"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                Active (visible on careers page)
              </label>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="px-6 py-2 bg-yellow-400 text-gray-900 font-semibold rounded-lg hover:bg-yellow-500"
              >
                {editingPosition ? 'Update Position' : 'Create Position'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingPosition(null);
                  resetForm();
                }}
                className="px-6 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Job Positions</h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-yellow-400 text-gray-900 font-semibold rounded-lg hover:bg-yellow-500"
        >
          + Add Position
        </button>
      </div>

      <div className="mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'all'
                ? 'bg-yellow-400 text-gray-900'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'active'
                ? 'bg-yellow-400 text-gray-900'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter('inactive')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'inactive'
                ? 'bg-yellow-400 text-gray-900'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Inactive
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="text-gray-500">Loading positions...</div>
        </div>
      ) : positions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">No positions found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {positions.map((position) => (
                <tr key={position.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {position.title}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{position.location}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      position.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {position.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(position.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(position)}
                      className="text-yellow-600 hover:text-yellow-900 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(position.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
