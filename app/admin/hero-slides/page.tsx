"use client";

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';

interface Slide {
  id: string;
  title: string;
  headline: string;
  description: string | null;
  image_url: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export default function HeroSlidesPage() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSlide, setEditingSlide] = useState<Slide | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    headline: '',
    description: '',
    image_url: '',
    is_active: true,
    display_order: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSlides();
  }, []);

  async function fetchSlides() {
    try {
      console.log('[Admin Hero Slides] Fetching slides...');
      const response = await fetch('/api/hero-slides');
      console.log('[Admin Hero Slides] Response status:', response.status);

      const data = await response.json();
      console.log('[Admin Hero Slides] Response data:', data);

      if (response.ok) {
        console.log('[Admin Hero Slides] Setting slides:', data.slides);
        setSlides(data.slides);
      } else {
        console.error('[Admin Hero Slides] API error:', data.error);
      }
    } catch (error) {
      console.error('[Admin Hero Slides] Exception:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingSlide
        ? `/api/hero-slides/${editingSlide.id}`
        : '/api/hero-slides';

      const method = editingSlide ? 'PATCH' : 'POST';

      console.log('[Admin Hero Slides] Saving slide...', { method, url, formData });

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      console.log('[Admin Hero Slides] Response status:', response.status);
      console.log('[Admin Hero Slides] Response headers:', response.headers.get('content-type'));

      // Get raw text first to debug
      const rawText = await response.text();
      console.log('[Admin Hero Slides] Raw response:', rawText.substring(0, 500));

      let data;
      try {
        data = JSON.parse(rawText);
      } catch (parseError) {
        console.error('[Admin Hero Slides] JSON parse error:', parseError);
        alert(`Server returned non-JSON response. Status: ${response.status}. Check console for details.`);
        return;
      }

      console.log('[Admin Hero Slides] Parsed data:', data);

      if (response.ok) {
        console.log('[Admin Hero Slides] Slide saved successfully');
        await fetchSlides();
        setShowModal(false);
        setEditingSlide(null);
        resetForm();
      } else {
        console.error('[Admin Hero Slides] Save failed:', data);
        alert(`Failed to save slide: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('[Admin Hero Slides] Exception:', error);
      alert(`Failed to save slide: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this slide?')) return;

    try {
      const response = await fetch(`/api/hero-slides/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchSlides();
      } else {
        alert('Failed to delete slide');
      }
    } catch (error) {
      console.error('Error deleting slide:', error);
      alert('Failed to delete slide');
    }
  }

  function handleEdit(slide: Slide) {
    setEditingSlide(slide);
    setFormData({
      title: slide.title,
      headline: slide.headline,
      description: slide.description || '',
      image_url: slide.image_url,
      is_active: slide.is_active,
      display_order: slide.display_order,
    });
    setShowModal(true);
  }

  function resetForm() {
    setFormData({
      title: '',
      headline: '',
      description: '',
      image_url: '',
      is_active: true,
      display_order: slides.length,
    });
  }

  function openAddModal() {
    setEditingSlide(null);
    resetForm();
    setShowModal(true);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'hero-images');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setFormData(prev => ({ ...prev, image_url: data.url }));
      } else {
        alert(data.error || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#552627]"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hero Slides</h1>
          <p className="text-gray-600 mt-1">Manage homepage hero slideshow slides</p>
        </div>
        <button
          onClick={openAddModal}
          className="px-6 py-3 bg-[#F7C400] hover:bg-[#e5a800] text-gray-900 font-semibold rounded-lg transition-colors"
        >
          Add New Slide
        </button>
      </div>

      <div className="grid gap-6">
        {slides.map((slide) => (
          <div
            key={slide.id}
            className="bg-white border border-gray-200 rounded-lg p-6 flex gap-6"
          >
            {/* Image Preview */}
            <div className="w-48 h-32 relative rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
              <Image
                src={slide.image_url}
                alt={slide.title}
                fill
                className="object-cover"
              />
            </div>

            {/* Slide Details */}
            <div className="flex-1">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{slide.title}</h3>
                  <p className="text-lg text-gray-700 mt-1">{slide.headline}</p>
                  {slide.description && (
                    <p className="text-gray-600 mt-2 text-sm">{slide.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      slide.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {slide.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                    Order: {slide.display_order}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(slide)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(slide.id)}
                  className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}

        {slides.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600">No slides found. Add your first slide to get started.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingSlide ? 'Edit Slide' : 'Add New Slide'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title (internal use)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F7C400] focus:border-transparent"
                    placeholder="e.g., Summer Campaign 2025"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Headline (displayed on slide)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.headline}
                    onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F7C400] focus:border-transparent"
                    placeholder="e.g., Where [yellow]Flavor[/yellow] takes [white]Flight[/white]"
                  />
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-800 font-semibold mb-1">💡 Color Tags:</p>
                    <p className="text-xs text-blue-700">
                      Use <code className="bg-blue-100 px-1 rounded">[yellow]text[/yellow]</code> for yellow text<br />
                      Use <code className="bg-blue-100 px-1 rounded">[white]text[/white]</code> for white text
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Example: Where [yellow]Flavor[/yellow] takes [white]Flight[/white]
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F7C400] focus:border-transparent"
                    rows={3}
                    placeholder="e.g., Your wings, Your way. 20 bold flavors, endless cravings."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slide Image
                  </label>

                  {/* Upload Button */}
                  <div className="mb-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#F7C400] transition-colors flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900 disabled:opacity-50"
                    >
                      {uploading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#F7C400]"></div>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Upload Image
                        </>
                      )}
                    </button>
                    <p className="text-xs text-gray-500 mt-1">
                      JPG, PNG, WEBP, or GIF (max 5MB)
                    </p>
                  </div>

                  {/* Or enter URL manually */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">Or enter image URL</span>
                    </div>
                  </div>

                  <input
                    type="url"
                    required
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="w-full mt-3 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F7C400] focus:border-transparent"
                    placeholder="https://example.com/image.jpg"
                  />

                  {/* Image Preview */}
                  {formData.image_url && (
                    <div className="mt-3 w-full h-48 relative rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                      <Image
                        src={formData.image_url}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Display Order
                    </label>
                    <input
                      type="number"
                      value={formData.display_order}
                      onChange={(e) =>
                        setFormData({ ...formData, display_order: parseInt(e.target.value) })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F7C400] focus:border-transparent"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.is_active.toString()}
                      onChange={(e) =>
                        setFormData({ ...formData, is_active: e.target.value === 'true' })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F7C400] focus:border-transparent"
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-[#F7C400] hover:bg-[#e5a800] text-gray-900 font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingSlide ? 'Update Slide' : 'Add Slide'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
