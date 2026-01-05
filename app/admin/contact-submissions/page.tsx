"use client";

import { useEffect, useState } from 'react';

interface ContactSubmission {
  id: string;
  submission_type: string;
  name: string;
  email: string;
  phone: string;
  company: string | null;
  message: string | null;
  form_data: any;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

export default function ContactSubmissionsPage() {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notes, setNotes] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchSubmissions();
  }, [filterType, filterStatus]);

  async function fetchSubmissions() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterType !== 'all') params.set('type', filterType);
      if (filterStatus !== 'all') params.set('status', filterStatus);

      const response = await fetch(`/api/admin/contact-submissions?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch submissions');
      }

      setSubmissions(data.submissions || []);
    } catch (error: any) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleStatusChange = async (submissionId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/contact-submissions/${submissionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update status');
      }

      fetchSubmissions();
    } catch (error: any) {
      alert(error.message || 'Failed to update status');
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedSubmission) return;

    try {
      const response = await fetch(`/api/admin/contact-submissions/${selectedSubmission.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_notes: notes }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save notes');
      }

      setShowNotesModal(false);
      fetchSubmissions();
    } catch (error: any) {
      alert(error.message || 'Failed to save notes');
    }
  };

  const handleDelete = async (submissionId: string) => {
    if (!confirm('Are you sure you want to delete this submission?')) return;

    try {
      const response = await fetch(`/api/admin/contact-submissions/${submissionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete submission');
      }

      alert('Submission deleted successfully');
      fetchSubmissions();
    } catch (error: any) {
      alert(error.message || 'Failed to delete submission');
    }
  };

  const openNotesModal = (submission: ContactSubmission) => {
    setSelectedSubmission(submission);
    setNotes(submission.admin_notes || '');
    setShowNotesModal(true);
  };

  const openDetailModal = (submission: ContactSubmission) => {
    setSelectedSubmission(submission);
    setShowDetailModal(true);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'catering': return 'bg-orange-100 text-orange-800';
      case 'office-lunch': return 'bg-blue-100 text-blue-800';
      case 'meetings': return 'bg-purple-100 text-purple-800';
      case 'wingpost': return 'bg-green-100 text-green-800';
      case 'sports-community': return 'bg-[#F7C400] text-[#552627]';
      case 'newsletter': return 'bg-pink-100 text-pink-800';
      case 'connect': return 'bg-indigo-100 text-indigo-800';
      case 'hotspot': return 'bg-amber-100 text-amber-800';
      case 'general': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'in-progress': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'catering': return 'Catering';
      case 'office-lunch': return 'Office Lunch';
      case 'meetings': return 'Meetings';
      case 'wingpost': return 'Wingpost';
      case 'sports-community': return 'Sports Community';
      case 'newsletter': return 'Newsletter';
      case 'connect': return 'Wingside Connect';
      case 'hotspot': return 'Hotspot Partner';
      case 'general': return 'General';
      default: return type;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Contact Submissions</h1>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="catering">Catering</option>
            <option value="office-lunch">Office Lunch</option>
            <option value="meetings">Meetings</option>
            <option value="wingpost">Wingpost</option>
            <option value="sports-community">Sports Community</option>
            <option value="newsletter">Newsletter</option>
            <option value="connect">Wingside Connect</option>
            <option value="hotspot">Hotspot Partner</option>
            <option value="general">General</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="text-gray-500">Loading submissions...</div>
        </div>
      ) : submissions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">No submissions found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((submission) => (
            <div key={submission.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {submission.name}
                  </h3>
                  <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {submission.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {submission.phone}
                    </span>
                    {submission.company && (
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        {submission.company}
                      </span>
                    )}
                    <span className="text-gray-400">
                      {new Date(submission.created_at).toLocaleDateString()} at {new Date(submission.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getTypeColor(submission.submission_type)}`}>
                    {getTypeLabel(submission.submission_type)}
                  </span>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(submission.status)}`}>
                    {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                  </span>
                </div>
              </div>

              {submission.message && (
                <div className="mb-3">
                  <p className="text-sm text-gray-600 line-clamp-2">{submission.message}</p>
                </div>
              )}

              {submission.admin_notes && (
                <div className="mb-3 p-3 bg-yellow-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-1">Admin Notes:</p>
                  <p className="text-sm text-gray-600">{submission.admin_notes}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-3 border-t">
                <button
                  onClick={() => openDetailModal(submission)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  View Details
                </button>

                <select
                  value={submission.status}
                  onChange={(e) => handleStatusChange(submission.id, e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="closed">Closed</option>
                </select>

                <button
                  onClick={() => openNotesModal(submission)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Add Notes
                </button>

                <button
                  onClick={() => handleDelete(submission.id)}
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
      {showNotesModal && selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Admin Notes</h3>
            <p className="text-sm text-gray-600 mb-4">
              {selectedSubmission.name} - {getTypeLabel(selectedSubmission.submission_type)}
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              rows={4}
              placeholder="Add notes about this submission..."
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

      {/* Detail Modal */}
      {showDetailModal && selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold">Submission Details</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex gap-2">
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getTypeColor(selectedSubmission.submission_type)}`}>
                  {getTypeLabel(selectedSubmission.submission_type)}
                </span>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedSubmission.status)}`}>
                  {selectedSubmission.status.charAt(0).toUpperCase() + selectedSubmission.status.slice(1)}
                </span>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700">Name</p>
                <p className="text-gray-900">{selectedSubmission.name}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700">Email</p>
                <p className="text-gray-900">{selectedSubmission.email}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700">Phone</p>
                <p className="text-gray-900">{selectedSubmission.phone}</p>
              </div>

              {selectedSubmission.company && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Company</p>
                  <p className="text-gray-900">{selectedSubmission.company}</p>
                </div>
              )}

              {selectedSubmission.message && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Message</p>
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedSubmission.message}</p>
                </div>
              )}

              {selectedSubmission.form_data && Object.keys(selectedSubmission.form_data).length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Additional Form Data</p>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                      {JSON.stringify(selectedSubmission.form_data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-gray-700">Submitted</p>
                <p className="text-gray-900">
                  {new Date(selectedSubmission.created_at).toLocaleString()}
                </p>
              </div>

              {selectedSubmission.admin_notes && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Admin Notes</p>
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedSubmission.admin_notes}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
