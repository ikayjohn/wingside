"use client";

import { useEffect, useState } from 'react';

interface JobApplication {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  experience: string | null;
  cover_letter: string | null;
  resume_url: string | null;
  resume_file_name: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  position_title?: string;
  position_location?: string;
}

export default function AdminJobApplicationsPage() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed' | 'shortlisted' | 'rejected' | 'hired'>('all');
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchApplications();
  }, [filter]);

  async function fetchApplications() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('status', filter);

      const response = await fetch(`/api/admin/job-applications?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch applications');
      }

      setApplications(data.applications || []);
    } catch (error: any) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleStatusChange = async (applicationId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/job-applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update status');
      }

      fetchApplications();
    } catch (error: any) {
      alert(error.message || 'Failed to update status');
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedApplication) return;

    try {
      const response = await fetch(`/api/admin/job-applications/${selectedApplication.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_notes: notes }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save notes');
      }

      setShowNotesModal(false);
      fetchApplications();
    } catch (error: any) {
      alert(error.message || 'Failed to save notes');
    }
  };

  const handleDelete = async (applicationId: string) => {
    if (!confirm('Are you sure you want to delete this application?')) return;

    try {
      const response = await fetch(`/api/admin/job-applications/${applicationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete application');
      }

      alert('Application deleted successfully');
      fetchApplications();
    } catch (error: any) {
      alert(error.message || 'Failed to delete application');
    }
  };

  const openNotesModal = (application: JobApplication) => {
    setSelectedApplication(application);
    setNotes(application.admin_notes || '');
    setShowNotesModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      case 'shortlisted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'hired': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Job Applications</h1>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {['all', 'pending', 'reviewed', 'shortlisted', 'rejected', 'hired'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status as any)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === status
                ? 'bg-yellow-400 text-gray-900'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="text-gray-500">Loading applications...</div>
        </div>
      ) : applications.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">No applications found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((application) => (
            <div key={application.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {application.full_name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {application.position_title} • {application.position_location}
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {application.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {application.phone}
                    </span>
                    <span className="text-gray-400">
                      Applied: {new Date(application.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(application.status)}`}>
                  {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                </span>
              </div>

              {application.experience && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700 mb-1">Experience:</p>
                  <p className="text-sm text-gray-600">{application.experience}</p>
                </div>
              )}

              {application.cover_letter && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700 mb-1">Cover Letter:</p>
                  <p className="text-sm text-gray-600 line-clamp-3">{application.cover_letter}</p>
                </div>
              )}

              {application.resume_url && (
                <div className="mb-3">
                  <a
                    href={application.resume_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    View Resume: {application.resume_file_name}
                  </a>
                </div>
              )}

              {application.admin_notes && (
                <div className="mb-3 p-3 bg-yellow-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-1">Admin Notes:</p>
                  <p className="text-sm text-gray-600">{application.admin_notes}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-3 border-t">
                <select
                  value={application.status}
                  onChange={(e) => handleStatusChange(application.id, e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                >
                  <option value="pending">Pending</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="rejected">Rejected</option>
                  <option value="hired">Hired</option>
                </select>

                <button
                  onClick={() => openNotesModal(application)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Add Notes
                </button>

                <button
                  onClick={() => handleDelete(application.id)}
                  className="px-3 py-1.5 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Notes Modal */}
      {showNotesModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Admin Notes</h3>
            <p className="text-sm text-gray-600 mb-4">
              {selectedApplication.full_name} - {selectedApplication.position_title}
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              rows={4}
              placeholder="Add notes about this candidate..."
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowNotesModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNotes}
                className="px-4 py-2 bg-yellow-400 text-gray-900 font-semibold rounded-lg hover:bg-yellow-500"
              >
                Save Notes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
