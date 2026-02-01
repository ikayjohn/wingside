"use client";

import { useEffect, useState } from 'react';

interface BlogPost {
  id?: string;
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  featured_image_url?: string;
  author_name?: string;
  category?: string;
  tags?: string[];
  is_published?: boolean;
  is_featured?: boolean;
  published_at?: string;
  view_count?: number;
  created_at?: string;
  updated_at?: string;
  meta_title?: string;
  meta_description?: string;
}

export default function BlogPostsPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featured_image_url: '',
    author_name: 'Wingside Team',
    category: '',
    tags: '',
    is_published: false,
    is_featured: false,
    meta_title: '',
    meta_description: ''
  });

  const categories = ['Wingside Stories', 'Recipes', 'Events', 'Community', 'Behind the Scenes'];

  useEffect(() => {
    fetchPosts();
  }, []);

  // Auto-generate slug from title
  useEffect(() => {
    if (formData.title && !slugManuallyEdited && !editingPost) {
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .trim()
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-'); // Replace multiple hyphens with single

      setFormData(prev => ({ ...prev, slug }));
    }
  }, [formData.title, slugManuallyEdited, editingPost]);

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/admin/blog/posts');
      const data = await response.json();
      setPosts(data.posts || []);
    } catch (error) {
      console.error('Error fetching blog posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('Form data:', formData);
    console.log('Title length:', formData.title?.length, 'Content length:', formData.content?.length);
    console.log('editingPost:', editingPost);
    console.log('editingPost.id:', editingPost?.id);

    // Validate required fields
    if (!formData.title || !formData.title.trim()) {
      alert('Title is required');
      return;
    }

    if (!formData.content || !formData.content.trim()) {
      alert('Content is required');
      return;
    }

    // Check if editing and ID exists
    if (editingPost && !editingPost.id) {
      alert('Error: Post ID is missing. Cannot update post.');
      console.error('Editing post but ID is missing:', editingPost);
      return;
    }

    const url = editingPost
      ? `/api/admin/blog/posts/${editingPost.id}`.replace(/\/$/, '')
      : '/api/admin/blog/posts'.replace(/\/$/, '');

    const method = editingPost ? 'PATCH' : 'POST';

    const payload = {
      ...formData,
      tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : []
    };

    console.log('Submitting blog post:', { method, url, payload });

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      console.log('API Response:', { status: response.status, data });

      if (response.ok) {
        alert(editingPost ? 'Blog post updated successfully!' : 'Blog post created successfully!');
        setShowModal(false);
        setEditingPost(null);
        resetForm();
        fetchPosts();
      } else {
        console.error('API Error:', data);
        const errorMsg = data.error || 'Failed to save blog post';
        const errorDetails = data.details ? `\n\nDetails: ${JSON.stringify(data.details, null, 2)}` : '';
        alert(errorMsg + errorDetails);
      }
    } catch (error) {
      console.error('Error saving blog post:', error);
      alert('Failed to save blog post');
    }
  };

  const handleEdit = (post: BlogPost) => {
    console.log('Editing post:', post);
    console.log('Post ID:', post.id);
    setEditingPost(post);
    setSlugManuallyEdited(true); // Don't auto-update slug when editing
    setFormData({
      title: post.title || '',
      slug: post.slug || '',
      excerpt: post.excerpt || '',
      content: post.content || '',
      featured_image_url: post.featured_image_url || '',
      author_name: post.author_name || 'Wingside Team',
      category: post.category || '',
      tags: Array.isArray(post.tags) ? post.tags.join(', ') : '',
      is_published: post.is_published ?? false,
      is_featured: post.is_featured ?? false,
      meta_title: post.meta_title || '',
      meta_description: post.meta_description || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this blog post?')) return;

    try {
      const response = await fetch(`/api/admin/blog/posts/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('Blog post deleted successfully!');
        fetchPosts();
      } else {
        alert('Failed to delete blog post');
      }
    } catch (error) {
      console.error('Error deleting blog post:', error);
      alert('Failed to delete blog post');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      featured_image_url: '',
      author_name: 'Wingside Team',
      category: '',
      tags: '',
      is_published: false,
      is_featured: false,
      meta_title: '',
      meta_description: ''
    });
    setSlugManuallyEdited(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      console.log('Uploading image file:', file.name, file.size);

      const response = await fetch('/api/admin/blog/upload-image', {
        method: 'POST',
        body: uploadFormData,
      });

      const data = await response.json();

      console.log('Upload response:', data);

      if (response.ok) {
        // Add cache-busting parameter to force image reload
        const imageUrl = data.url;

        // Update state with the new image URL
        setFormData(prevFormData => ({
          ...prevFormData,
          featured_image_url: imageUrl
        }));

        console.log('Image URL set to:', imageUrl);
        alert('Image uploaded successfully!');
      } else {
        console.error('Upload failed:', data);
        alert(data.error || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const openModal = () => {
    resetForm();
    setEditingPost(null);
    setSlugManuallyEdited(false);
    setShowModal(true);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDateForDisplay = (post: BlogPost) => {
    return formatDate(post.created_at);
  };

  const getDateLabel = (post: BlogPost) => {
    return 'Created';
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#552627' }}>
          Blog Posts
        </h1>
        <button
          onClick={openModal}
          className="px-4 py-2 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
        >
          + New Post
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <p className="text-gray-600 mb-4">No blog posts yet</p>
          <button
            onClick={openModal}
            className="px-4 py-2 bg-black text-white rounded-lg font-semibold hover:bg-gray-800"
          >
            Create First Post
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Title</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Views</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date/Time</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{post.title}</div>
                    <div className="text-xs text-gray-500">{post.slug}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                      {post.category || 'Uncategorized'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {post.is_published && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Published</span>
                      )}
                      {post.is_featured && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">Featured</span>
                      )}
                      {!post.is_published && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">Draft</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{post.view_count || 0}</td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-gray-500">{getDateLabel(post)}</div>
                    <div className="text-gray-900">{getDateForDisplay(post)}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(post)}
                        className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => post.id && handleDelete(post.id)}
                        className="px-3 py-1 text-red-600 hover:bg-red-50 rounded text-sm font-medium"
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <h2 className="text-xl font-bold" style={{ color: '#552627' }}>
                {editingPost ? 'Edit Blog Post' : 'New Blog Post'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={formData.title ?? ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                  <input
                    type="text"
                    value={formData.slug ?? ''}
                    onChange={(e) => {
                      setFormData({ ...formData, slug: e.target.value });
                      setSlugManuallyEdited(true);
                    }}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="Auto-generated from title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={formData.category ?? ''}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt</label>
                <textarea
                  value={formData.excerpt ?? ''}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  rows={2}
                  placeholder="Short summary for blog listing"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
                <textarea
                  value={formData.content ?? ''}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent font-mono text-sm"
                  rows={10}
                  placeholder="HTML content supported"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">You can use HTML tags for formatting</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Featured Image</label>
                <div className="space-y-2">
                  {formData.featured_image_url && (
                    <div className="relative">
                      <img
                        key={formData.featured_image_url}
                        src={formData.featured_image_url}
                        alt="Featured image preview"
                        className="w-full h-48 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, featured_image_url: '' })}
                        className="absolute top-2 right-2 px-3 py-1 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="flex-1 px-3 py-2 border rounded-lg text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gray-50"
                    />
                    {uploadingImage && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                        Uploading...
                      </div>
                    )}
                  </div>
                  <input
                    type="text"
                    value={formData.featured_image_url ?? ''}
                    onChange={(e) => setFormData({ ...formData, featured_image_url: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                    placeholder="Or paste image URL"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Author Name</label>
                <input
                  type="text"
                  value={formData.author_name ?? ''}
                  onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={formData.tags ?? ''}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="wings, recipe, community"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meta Title</label>
                  <input
                    type="text"
                    value={formData.meta_title ?? ''}
                    onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="SEO title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
                  <input
                    type="text"
                    value={formData.meta_description ?? ''}
                    onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="SEO description"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_published ?? false}
                    onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                    className="w-4 h-4 text-yellow-500 focus:ring-yellow-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Published</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_featured ?? false}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    className="w-4 h-4 text-yellow-500 focus:ring-yellow-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Featured</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="submit"
                  className="px-6 py-2 bg-black text-white rounded-lg font-semibold hover:bg-gray-800"
                >
                  {editingPost ? 'Update Post' : 'Create Post'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingPost(null);
                    resetForm();
                  }}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300"
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
