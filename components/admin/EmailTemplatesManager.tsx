'use client';

import { useEffect, useState, useMemo } from 'react';
import DOMPurify from 'dompurify';

interface EmailTemplate {
  id: string;
  template_key: string;
  name: string;
  subject: string;
  html_content: string;
  text_content?: string;
  variables: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function EmailTemplatesManager() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editingSubject, setEditingSubject] = useState('');
  const [editingHtml, setEditingHtml] = useState('');
  const [editingActive, setEditingActive] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  // Sanitize HTML content to prevent XSS attacks
  const sanitizedHtml = useMemo(() => {
    return DOMPurify.sanitize(editingHtml, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'div', 'span', 'table', 'tr', 'td', 'th', 'thead', 'tbody'],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'style', 'target', 'rel', 'width', 'height'],
    });
  }, [editingHtml]);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/notifications/templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      setMessage({ type: 'error', text: 'Failed to load templates' });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setEditingSubject(template.subject);
    setEditingHtml(template.html_content);
    setEditingActive(template.is_active);
    setShowPreview(false);
  };

  const handleSaveTemplate = async () => {
    if (!selectedTemplate) return;

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/notifications/templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedTemplate.id,
          subject: editingSubject,
          html_content: editingHtml,
          text_content: selectedTemplate.text_content,
          is_active: editingActive,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: data.message });
        await loadTemplates();
        // Update selected template with new data
        if (data.template) {
          setSelectedTemplate(data.template);
        }
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save template' });
      }
    } catch (error) {
      console.error('Error saving template:', error);
      setMessage({ type: 'error', text: 'Failed to save template' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const getAvailableVariables = () => {
    if (!selectedTemplate) return [];
    return Object.keys(selectedTemplate.variables || {});
  };

  const insertVariable = (variable: string) => {
    setEditingHtml((prev) => prev + `{{${variable}}}`);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Email Templates</h2>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template List */}
        <div className="lg:col-span-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Template</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleSelectTemplate(template)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  selectedTemplate?.id === template.id
                    ? 'border-yellow-500 bg-yellow-50'
                    : 'border-gray-200 hover:border-yellow-300 hover:bg-yellow-50'
                } ${!template.is_active ? 'opacity-60' : ''}`}
              >
                <div className="font-medium text-gray-900">{template.name}</div>
                <div className="text-sm text-gray-500 mt-1">{template.template_key}</div>
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      template.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {template.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Template Editor */}
        <div className="lg:col-span-2">
          {!selectedTemplate ? (
            <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-center text-gray-500">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p className="mt-2">Select a template to edit</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedTemplate.name}</h3>
                  <p className="text-sm text-gray-500">{selectedTemplate.template_key}</p>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={editingActive}
                      onChange={(e) => setEditingActive(e.target.checked)}
                      className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                    />
                    Active
                  </label>
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    {showPreview ? 'Edit' : 'Preview'}
                  </button>
                  <button
                    onClick={handleSaveTemplate}
                    disabled={saving}
                    className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>

              {showPreview ? (
                <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                  <div className="mb-4 pb-4 border-b border-gray-200">
                    <p className="text-sm text-gray-500">Subject Preview:</p>
                    <p className="font-semibold text-gray-900">{editingSubject}</p>
                  </div>
                  <div className="prose max-w-none">
                    <p className="text-sm text-gray-500 mb-2">HTML Preview:</p>
                    <div
                      className="bg-white rounded-lg p-4"
                      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Subject
                    </label>
                    <input
                      type="text"
                      value={editingSubject}
                      onChange={(e) => setEditingSubject(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      placeholder="Enter email subject..."
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        HTML Content
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Available variables:</span>
                        {getAvailableVariables().map((variable) => (
                          <button
                            key={variable}
                            onClick={() => insertVariable(variable)}
                            className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 transition-colors"
                            title={`Insert {{${variable}}}`}
                          >
                            {`{{${variable}}}`}
                          </button>
                        ))}
                      </div>
                    </div>
                    <textarea
                      value={editingHtml}
                      onChange={(e) => setEditingHtml(e.target.value)}
                      rows={20}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent font-mono text-sm"
                      placeholder="Enter HTML content..."
                    />
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-blue-900 mb-2">Tips:</p>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Use {'{{variable_name}}'} syntax for dynamic content</li>
                      <li>• Click variable buttons to insert them into your template</li>
                      <li>• Use valid HTML for best results</li>
                      <li>• Preview your changes before saving</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
