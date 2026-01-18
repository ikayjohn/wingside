"use client";

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  source: string;
  status: string;
  score: number;
  budget?: string;
  timeline?: string;
  interest_level?: string;
  estimated_value?: number;
  notes?: string;
  tags?: string[];
  last_contacted_at?: string;
  follow_up_date?: string;
  converted_to_customer_id?: string;
  created_at: string;
  updated_at: string;
  creator?: {
    id: string;
    full_name?: string;
    email?: string;
  };
}

interface LeadDetails extends Lead {
  activities: Array<{
    id: string;
    activity_type: string;
    subject: string;
    description?: string;
    created_at: string;
    creator?: {
      id: string;
      full_name?: string;
    };
  }>;
}

const STATUS_COLORS = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-yellow-100 text-yellow-800',
  qualified: 'bg-green-100 text-green-800',
  proposed: 'bg-purple-100 text-purple-800',
  negotiation: 'bg-orange-100 text-orange-800',
  converted: 'bg-emerald-100 text-emerald-800',
  lost: 'bg-red-100 text-red-800'
};

const SOURCE_COLORS = {
  website: 'bg-blue-100 text-blue-800',
  referral: 'bg-green-100 text-green-800',
  social: 'bg-pink-100 text-pink-800',
  event: 'bg-purple-100 text-purple-800',
  partner: 'bg-orange-100 text-orange-800',
  other: 'bg-gray-100 text-gray-800'
};

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);

  // Modal states
  const [selectedLead, setSelectedLead] = useState<LeadDetails | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showNewLeadModal, setShowNewLeadModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);

  // Customer search for conversion
  const [customerSearch, setCustomerSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  // Form states
  const [newLeadForm, setNewLeadForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    source: 'website',
    budget: '',
    timeline: '',
    interest_level: '',
    estimated_value: '',
    notes: '',
    tags: ''
  });

  const [editLeadForm, setEditLeadForm] = useState<Partial<Lead>>({});
  const [activityForm, setActivityForm] = useState({
    activity_type: 'call',
    subject: '',
    description: ''
  });

  // Fetch leads
  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        sortBy,
        order: sortOrder
      });

      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (sourceFilter) params.append('source', sourceFilter);

      const response = await fetch(`/api/leads?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setLeads(data.leads);
        setTotalLeads(data.pagination.total);
      } else {
        console.error('Failed to fetch leads:', data.error);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  }, [page, sortBy, sortOrder, search, statusFilter, sourceFilter]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Debounced customer search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (customerSearch.length >= 2) {
        searchCustomers(customerSearch);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [customerSearch]);

  // Fetch lead details
  const fetchLeadDetails = async (leadId: string) => {
    try {
      const response = await fetch(`/api/leads/${leadId}`);
      const data = await response.json();

      if (response.ok) {
        setSelectedLead(data);
        setEditLeadForm({
          ...data.lead,
          tags: data.lead.tags?.join(', ') || ''
        });
        setShowModal(true);
      }
    } catch (error) {
      console.error('Error fetching lead details:', error);
    }
  };

  // Create new lead
  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...newLeadForm,
        estimated_value: newLeadForm.estimated_value ? parseFloat(newLeadForm.estimated_value) : null,
        tags: newLeadForm.tags ? newLeadForm.tags.split(',').map(t => t.trim()) : []
      };

      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setShowNewLeadModal(false);
        setNewLeadForm({
          name: '',
          email: '',
          phone: '',
          company: '',
          source: 'website',
          budget: '',
          timeline: '',
          interest_level: '',
          estimated_value: '',
          notes: '',
          tags: ''
        });
        fetchLeads();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to create lead');
      }
    } catch (error) {
      console.error('Error creating lead:', error);
      alert('Failed to create lead');
    }
  };

  // Update lead
  const handleUpdateLead = async () => {
    if (!selectedLead) return;

    try {
      // Convert tags from string (form input) to string array (API)
      const tagsPayload = (() => {
        if (!editLeadForm.tags) return undefined;
        if (typeof editLeadForm.tags === 'string') {
          return editLeadForm.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
        }
        return editLeadForm.tags;
      })();

      const { tags, ...restEditForm } = editLeadForm;

      const payload = {
        ...restEditForm,
        estimated_value: editLeadForm.estimated_value || undefined,
        tags: tagsPayload
      };

      const response = await fetch(`/api/leads/${selectedLead.lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setShowModal(false);
        fetchLeads();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update lead');
      }
    } catch (error) {
      console.error('Error updating lead:', error);
      alert('Failed to update lead');
    }
  };

  // Delete lead
  const handleDeleteLead = async (leadId: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;

    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchLeads();
        setShowModal(false);
      } else {
        alert('Failed to delete lead');
      }
    } catch (error) {
      console.error('Error deleting lead:', error);
      alert('Failed to delete lead');
    }
  };

  // Add activity
  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;

    try {
      const response = await fetch(`/api/leads/${selectedLead.lead.id}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activityForm)
      });

      if (response.ok) {
        setActivityForm({ activity_type: 'call', subject: '', description: '' });
        setShowActivityModal(false);
        fetchLeadDetails(selectedLead.lead.id);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to add activity');
      }
    } catch (error) {
      console.error('Error adding activity:', error);
      alert('Failed to add activity');
    }
  };

  // Update score
  const updateScore = async (leadId: string, newScore: number) => {
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score: newScore,
          score_updated_at: new Date().toISOString()
        })
      });

      if (response.ok) {
        fetchLeads();
      }
    } catch (error) {
      console.error('Error updating score:', error);
    }
  };

  // Search customers for conversion
  const searchCustomers = async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(`/api/customers?search=${query}&limit=10`);
      const data = await response.json();

      if (response.ok && data.customers) {
        setSearchResults(data.customers);
      }
    } catch (error) {
      console.error('Error searching customers:', error);
    }
  };

  // Convert lead to customer
  const handleConvertLead = async () => {
    if (!selectedLead || !selectedCustomer) {
      alert('Please select a customer to convert to');
      return;
    }

    try {
      const response = await fetch(`/api/leads/${selectedLead.lead.id}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_id: selectedCustomer.id })
      });

      if (response.ok) {
        setShowConvertModal(false);
        setShowModal(false);
        setSelectedCustomer(null);
        setCustomerSearch('');
        setSearchResults([]);
        fetchLeads();
        alert('Lead successfully converted to customer!');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to convert lead');
      }
    } catch (error) {
      console.error('Error converting lead:', error);
      alert('Failed to convert lead');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Lead Management</h1>
        <button
          onClick={() => setShowNewLeadModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add New Lead
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Name, email, phone..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">All Statuses</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="proposed">Proposed</option>
              <option value="negotiation">Negotiation</option>
              <option value="converted">Converted</option>
              <option value="lost">Lost</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
            <select
              value={sourceFilter}
              onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">All Sources</option>
              <option value="website">Website</option>
              <option value="referral">Referral</option>
              <option value="social">Social</option>
              <option value="event">Event</option>
              <option value="partner">Partner</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order as 'asc' | 'desc');
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="created_at-desc">Newest First</option>
              <option value="created_at-asc">Oldest First</option>
              <option value="score-desc">Highest Score</option>
              <option value="score-asc">Lowest Score</option>
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
            </select>
          </div>
          <div className="flex items-end">
            <div className="text-sm text-gray-600">
              Total: {totalLeads} leads
            </div>
          </div>
        </div>
      </div>

      {/* Leads Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">No leads found. Create your first lead to get started!</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => fetchLeadDetails(lead.id)}>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                      {lead.company && <div className="text-sm text-gray-500">{lead.company}</div>}
                      {lead.tags && lead.tags.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {lead.tags.slice(0, 2).map((tag, idx) => (
                            <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              {tag}
                            </span>
                          ))}
                          {lead.tags.length > 2 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              +{lead.tags.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{lead.email || '-'}</div>
                    <div className="text-sm text-gray-500">{lead.phone || '-'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[lead.status as keyof typeof STATUS_COLORS]}`}>
                      {lead.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${SOURCE_COLORS[lead.source as keyof typeof SOURCE_COLORS]}`}>
                      {lead.source}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">{lead.score}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const change = confirm('Increase or decrease score? (+/-)') === '+' ? 10 : -10;
                          updateScore(lead.id, Math.max(0, lead.score + change));
                        }}
                        className="text-blue-600 hover:text-blue-800 text-xs"
                      >
                        ±
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {lead.estimated_value ? `₦${lead.estimated_value.toLocaleString()}` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(lead.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        fetchLeadDetails(lead.id);
                      }}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Lead Detail Modal */}
      {showModal && selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto my-8">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Lead Details</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Lead Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={editLeadForm.name || ''}
                    onChange={(e) => setEditLeadForm({ ...editLeadForm, name: e.target.value })}
                    className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Company</label>
                  <input
                    type="text"
                    value={editLeadForm.company || ''}
                    onChange={(e) => setEditLeadForm({ ...editLeadForm, company: e.target.value })}
                    className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={editLeadForm.email || ''}
                    onChange={(e) => setEditLeadForm({ ...editLeadForm, email: e.target.value })}
                    className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="text"
                    value={editLeadForm.phone || ''}
                    onChange={(e) => setEditLeadForm({ ...editLeadForm, phone: e.target.value })}
                    className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
              </div>

              {/* Classification */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={editLeadForm.status || ''}
                    onChange={(e) => setEditLeadForm({ ...editLeadForm, status: e.target.value })}
                    className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="proposed">Proposed</option>
                    <option value="negotiation">Negotiation</option>
                    <option value="converted">Converted</option>
                    <option value="lost">Lost</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Budget</label>
                  <select
                    value={editLeadForm.budget || ''}
                    onChange={(e) => setEditLeadForm({ ...editLeadForm, budget: e.target.value })}
                    className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
                  >
                    <option value="">Not specified</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Timeline</label>
                  <select
                    value={editLeadForm.timeline || ''}
                    onChange={(e) => setEditLeadForm({ ...editLeadForm, timeline: e.target.value })}
                    className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
                  >
                    <option value="">Not sure</option>
                    <option value="immediate">Immediate</option>
                    <option value="1-3_months">1-3 months</option>
                    <option value="3-6_months">3-6 months</option>
                    <option value="6-12_months">6-12 months</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Interest Level</label>
                  <select
                    value={editLeadForm.interest_level || ''}
                    onChange={(e) => setEditLeadForm({ ...editLeadForm, interest_level: e.target.value })}
                    className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
                  >
                    <option value="">Not specified</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estimated Value (₦)</label>
                  <input
                    type="number"
                    value={editLeadForm.estimated_value || ''}
                    onChange={(e) => setEditLeadForm({ ...editLeadForm, estimated_value: parseFloat(e.target.value) || 0 })}
                    className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Follow-up Date</label>
                  <input
                    type="date"
                    value={editLeadForm.follow_up_date?.split('T')[0] || ''}
                    onChange={(e) => setEditLeadForm({ ...editLeadForm, follow_up_date: e.target.value })}
                    className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={editLeadForm.tags as string || ''}
                  onChange={(e) => setEditLeadForm({ ...editLeadForm, tags: e.target.value })}
                  placeholder="vip, corporate, event-lead"
                  className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  value={editLeadForm.notes || ''}
                  onChange={(e) => setEditLeadForm({ ...editLeadForm, notes: e.target.value })}
                  rows={3}
                  className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>

              {/* Activities */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold">Activity History</h3>
                  <button
                    onClick={() => setShowActivityModal(true)}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                  >
                    Add Activity
                  </button>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {selectedLead.activities && selectedLead.activities.length > 0 ? (
                    selectedLead.activities.map((activity) => (
                      <div key={activity.id} className="border border-gray-200 rounded p-3">
                        <div className="flex justify-between">
                          <span className="font-medium capitalize">{activity.activity_type.replace('_', ' ')}</span>
                          <span className="text-sm text-gray-500">
                            {new Date(activity.created_at).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-sm font-medium text-gray-800 mt-1">{activity.subject}</div>
                        {activity.description && (
                          <div className="text-sm text-gray-600 mt-1">{activity.description}</div>
                        )}
                        {activity.creator && (
                          <div className="text-xs text-gray-500 mt-1">by {activity.creator.full_name || activity.creator.email}</div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500 text-center py-4">No activities yet</div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between pt-4 border-t">
                <div className="space-x-2">
                  {!selectedLead.lead.converted_to_customer_id && (
                    <button
                      onClick={() => {
                        setShowConvertModal(true);
                        setShowModal(false);
                      }}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    >
                      Convert to Customer
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteLead(selectedLead.lead.id)}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                  >
                    Delete Lead
                  </button>
                </div>
                <div className="space-x-2">
                  <button
                    onClick={() => setShowModal(false)}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateLead}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activity Modal */}
      {showActivityModal && selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Add Activity</h3>
            <form onSubmit={handleAddActivity} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Activity Type</label>
                <select
                  value={activityForm.activity_type}
                  onChange={(e) => setActivityForm({ ...activityForm, activity_type: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                >
                  <option value="call">Call</option>
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="meeting">Meeting</option>
                  <option value="note">Note</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={activityForm.subject}
                  onChange={(e) => setActivityForm({ ...activityForm, subject: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={activityForm.description}
                  onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowActivityModal(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Add Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Lead Modal */}
      {showNewLeadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto my-8">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Create New Lead</h2>
              <button
                onClick={() => setShowNewLeadModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name *</label>
                  <input
                    type="text"
                    value={newLeadForm.name}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, name: e.target.value })}
                    className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Company</label>
                  <input
                    type="text"
                    value={newLeadForm.company}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, company: e.target.value })}
                    className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={newLeadForm.email}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, email: e.target.value })}
                    className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="text"
                    value={newLeadForm.phone}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, phone: e.target.value })}
                    className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Source *</label>
                  <select
                    value={newLeadForm.source}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, source: e.target.value })}
                    className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
                    required
                  >
                    <option value="website">Website</option>
                    <option value="referral">Referral</option>
                    <option value="social">Social Media</option>
                    <option value="event">Event</option>
                    <option value="partner">Partner</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estimated Value (₦)</label>
                  <input
                    type="number"
                    value={newLeadForm.estimated_value}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, estimated_value: e.target.value })}
                    className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Budget</label>
                  <select
                    value={newLeadForm.budget}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, budget: e.target.value })}
                    className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
                  >
                    <option value="">Not specified</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Timeline</label>
                  <select
                    value={newLeadForm.timeline}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, timeline: e.target.value })}
                    className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
                  >
                    <option value="">Not sure</option>
                    <option value="immediate">Immediate</option>
                    <option value="1-3_months">1-3 months</option>
                    <option value="3-6_months">3-6 months</option>
                    <option value="6-12_months">6-12 months</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Interest Level</label>
                  <select
                    value={newLeadForm.interest_level}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, interest_level: e.target.value })}
                    className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
                  >
                    <option value="">Not specified</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={newLeadForm.tags}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, tags: e.target.value })}
                  placeholder="vip, corporate, event-lead"
                  className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  value={newLeadForm.notes}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, notes: e.target.value })}
                  rows={3}
                  className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="Any additional information about this lead..."
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowNewLeadModal(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Create Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Convert Lead Modal */}
      {showConvertModal && selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto my-8">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Convert Lead to Customer</h2>
              <button
                onClick={() => {
                  setShowConvertModal(false);
                  setSelectedCustomer(null);
                  setCustomerSearch('');
                  setSearchResults([]);
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Lead Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Lead Information</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <span className="ml-2 font-medium">{selectedLead.lead.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <span className="ml-2 font-medium">{selectedLead.lead.email || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Phone:</span>
                    <span className="ml-2 font-medium">{selectedLead.lead.phone || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Score:</span>
                    <span className="ml-2 font-medium">{selectedLead.lead.score}</span>
                  </div>
                </div>
              </div>

              {/* Customer Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search for Existing Customer
                </label>
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Search by name or email..."
                />
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                  {searchResults.map((customer) => (
                    <div
                      key={customer.id}
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setSearchResults([]);
                        setCustomerSearch('');
                      }}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-200 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">{customer.full_name || 'No name'}</div>
                      <div className="text-sm text-gray-600">{customer.email}</div>
                      <div className="text-xs text-gray-500">
                        {customer.total_orders || 0} orders • ₦{(customer.total_spent || 0).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Selected Customer */}
              {selectedCustomer && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">{selectedCustomer.full_name || 'No name'}</h4>
                      <p className="text-sm text-gray-600">{selectedCustomer.email}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {selectedCustomer.total_orders || 0} orders • ₦{(selectedCustomer.total_spent || 0).toLocaleString()} total spent
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedCustomer(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* Info Message */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Converting this lead will link it to the selected customer account.
                  The lead status will be automatically changed to "Converted" and the conversion will be logged in the activity history.
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowConvertModal(false);
                    setSelectedCustomer(null);
                    setCustomerSearch('');
                    setSearchResults([]);
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConvertLead}
                  disabled={!selectedCustomer}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Convert Lead
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
