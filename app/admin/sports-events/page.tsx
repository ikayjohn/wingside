'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface SportsEvent {
  id?: string;
  title: string;
  description: string;
  date: string;
  image_url: string;
  is_active: boolean;
  created_at?: string;
}

export default function SportsEventsPage() {
  const [events, setEvents] = useState<SportsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<SportsEvent | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const supabase = createClient();

  const [formData, setFormData] = useState<SportsEvent>({
    title: '',
    description: '',
    date: '',
    image_url: '',
    is_active: true,
  });

  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sports_events')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error: any) {
      console.error('Error loading events:', error);
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvent = () => {
    setEditingEvent(null);
    setFormData({
      title: '',
      description: '',
      date: '',
      image_url: '',
      is_active: true,
    });
    setImagePreview('');
    setShowModal(true);
  };

  const handleEditEvent = (event: SportsEvent) => {
    setEditingEvent(event);
    setFormData(event);
    setImagePreview(event.image_url);
    setShowModal(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/sports-events/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setFormData((prev) => ({ ...prev, image_url: data.url }));
        setImagePreview(data.url);
        setMessage({ type: 'success', text: 'Image uploaded successfully!' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      setMessage({ type: 'error', text: error.message });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const { error } = await supabase
        .from('sports_events')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Event deleted successfully!' });
      await loadEvents();
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('Error deleting event:', error);
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate image is provided
    if (!formData.image_url) {
      setMessage({ type: 'error', text: 'Please upload an image or provide an image URL' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      if (editingEvent?.id) {
        // Update existing event
        const { error } = await supabase
          .from('sports_events')
          .update({
            title: formData.title,
            description: formData.description,
            date: formData.date,
            image_url: formData.image_url,
            is_active: formData.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingEvent.id);

        if (error) throw error;
        setMessage({ type: 'success', text: 'Event updated successfully!' });
      } else {
        // Create new event
        const { error } = await supabase
          .from('sports_events')
          .insert({
            title: formData.title,
            description: formData.description,
            date: formData.date,
            image_url: formData.image_url,
            is_active: formData.is_active,
          });

        if (error) throw error;
        setMessage({ type: 'success', text: 'Event created successfully!' });
      }

      setShowModal(false);
      await loadEvents();
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('Error saving event:', error);
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#552627]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sports Events</h1>
          <p className="mt-2 text-gray-600">
            Manage sports events shown on the /sports page
          </p>
        </div>
        {message && (
          <div
            className={`px-4 py-2 rounded-lg ${
              message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}
          >
            {message.text}
          </div>
        )}
      </div>

      {/* Add Event Button */}
      <div className="flex justify-end">
        <button
          onClick={handleAddEvent}
          className="px-6 py-3 bg-[#F7C400] hover:bg-[#FFC107] text-[#552627] font-semibold rounded-lg transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Sports Event
        </button>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <div key={event.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            {event.image_url && (
              <div className="aspect-video bg-gray-200 relative">
                <img
                  src={event.image_url}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-bold text-[#552627]">{event.title}</h3>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    event.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {event.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{event.description}</p>
              <p className="text-xs text-[#552627] font-semibold mb-4">
                📅 {new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditEvent(event)}
                  className="flex-1 px-3 py-2 bg-[#F7C400] hover:bg-[#FFC107] text-[#552627] font-semibold rounded-lg transition-colors text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteEvent(event.id!)}
                  className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {events.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Sports Events Yet</h3>
          <p className="text-gray-600 mb-4">Create your first sports event to get started</p>
          <button
            onClick={handleAddEvent}
            className="px-6 py-2 bg-[#F7C400] hover:bg-[#FFC107] text-[#552627] font-semibold rounded-lg transition-colors"
          >
            Add Sports Event
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingEvent ? 'Edit Sports Event' : 'Add Sports Event'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F7C400] focus:border-transparent"
                  placeholder="e.g., Champions League Final"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F7C400] focus:border-transparent"
                  placeholder="Describe the event..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F7C400] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Image *
                </label>
                <div className="space-y-3">
                  {/* File Upload */}
                  <div className="flex items-center gap-3">
                    <label className="flex-1">
                      <div className="flex items-center justify-center px-6 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#F7C400] hover:bg-yellow-50 transition-colors">
                        <div className="text-center">
                          {uploading ? (
                            <div className="flex items-center gap-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#552627]"></div>
                              <span className="text-sm text-gray-600">Uploading...</span>
                            </div>
                          ) : (
                            <>
                              <svg className="mx-auto h-8 w-8 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                              <div className="mt-1 text-sm text-gray-600">
                                <span className="text-[#552627] font-medium">Click to upload</span> or drag and drop
                              </div>
                              <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                            </>
                          )}
                        </div>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploading}
                      />
                    </label>
                  </div>

                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, image_url: '' });
                          setImagePreview('');
                        }}
                        className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}

                  {/* Manual URL Input */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Or enter image URL:</label>
                    <input
                      type="url"
                      value={formData.image_url}
                      onChange={(e) => {
                        setFormData({ ...formData, image_url: e.target.value });
                        setImagePreview(e.target.value);
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F7C400] focus:border-transparent"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>

                  {/* Validation Message */}
                  {!formData.image_url && (
                    <p className="text-xs text-red-600">Please upload an image or provide an image URL</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-[#F7C400] border-gray-300 rounded focus:ring-[#F7C400]"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                  Active (show on website)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-[#F7C400] hover:bg-[#FFC107] text-[#552627] font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : editingEvent ? 'Update Event' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
