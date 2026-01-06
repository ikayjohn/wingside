"use client"

import { useEffect, useState } from 'react'

interface MaintenanceSettings {
  is_enabled: boolean
  title: string
  message: string
  estimated_completion: string | null
  access_codes: string[]
}

export default function MaintenanceModeAdminPage() {
  const [settings, setSettings] = useState<MaintenanceSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Form state
  const [isEnabled, setIsEnabled] = useState(false)
  const [title, setTitle] = useState('')
  const [messageText, setMessageText] = useState('')
  const [estimatedCompletion, setEstimatedCompletion] = useState('')
  const [codeInput, setCodeInput] = useState('')

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    try {
      setLoading(true)

      // First try the debug endpoint
      console.log('[Maintenance Admin] Testing debug endpoint first...')
      try {
        const debugResponse = await fetch('/api/debug-maintenance')
        const debugText = await debugResponse.text()
        console.log('[Maintenance Admin] Debug response status:', debugResponse.status)
        console.log('[Maintenance Admin] Debug response:', debugText.substring(0, 500))
      } catch (debugError) {
        console.error('[Maintenance Admin] Debug endpoint failed:', debugError)
      }

      console.log('[Maintenance Admin] Fetching from /api/admin/maintenance...')
      const response = await fetch('/api/admin/maintenance')

      console.log('[Maintenance Admin] Response status:', response.status)
      console.log('[Maintenance Admin] Response headers:', response.headers.get('content-type'))

      // Get raw text first to debug
      const rawText = await response.text()
      console.log('[Maintenance Admin] Raw response length:', rawText.length)
      console.log('[Maintenance Admin] Raw response (first 500 chars):', rawText.substring(0, 500))

      // Check if response is empty
      if (!rawText || rawText.length === 0) {
        throw new Error('Empty response from server')
      }

      // Check if it's HTML (error page)
      if (rawText.trim().startsWith('<')) {
        throw new Error('Server returned HTML instead of JSON. This usually means the API route crashed or returned an error page.')
      }

      // Check content type before parsing JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Invalid response content type: ${contentType}. Expected JSON. Response starts with: ${rawText.substring(0, 50)}`)
      }

      let data
      try {
        data = JSON.parse(rawText)
        console.log('[Maintenance Admin] Successfully parsed JSON:', data)
      } catch (parseError) {
        console.error('[Maintenance Admin] JSON parse error:', parseError)
        throw new Error(`Failed to parse response as JSON. Error: ${parseError.message}. Raw response (first 200 chars): ${rawText.substring(0, 200)}`)
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch settings')
      }

      if (data.settings) {
        setSettings(data.settings)
        setIsEnabled(data.settings.is_enabled)
        setTitle(data.settings.title || '')
        setMessageText(data.settings.message || '')
        setEstimatedCompletion(
          data.settings.estimated_completion
            ? new Date(data.settings.estimated_completion).toISOString().slice(0, 16)
            : ''
        )
      }
    } catch (error: any) {
      console.error('[Maintenance Admin] Fetch error:', error)
      showMessage('error', error.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isEnabled,
          title,
          message: messageText,
          estimatedCompletion: estimatedCompletion || null,
          accessCodes: settings?.access_codes || []
        })
      })

      // Check content type before parsing JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response from server. Please try again.')
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update settings')
      }

      // Update local state
      setSettings({
        is_enabled: isEnabled,
        title,
        message: messageText,
        estimated_completion: estimatedCompletion || null,
        access_codes: settings?.access_codes || []
      })

      showMessage('success', data.message || 'Maintenance settings updated successfully')
    } catch (error: any) {
      showMessage('error', error.message)
    } finally {
      setSaving(false)
    }
  }

  async function addCode() {
    const code = codeInput.trim().toUpperCase()

    if (!code) {
      return
    }

    // Minimum length validation
    if (code.length < 4) {
      showMessage('error', 'Access code must be at least 4 characters')
      return
    }

    if (settings?.access_codes?.includes(code)) {
      showMessage('error', 'This access code already exists')
      setCodeInput('')
      return
    }

    const updatedCodes = [...(settings?.access_codes || []), code]
    setSettings({ ...settings!, access_codes: updatedCodes })
    setCodeInput('')
    showMessage('success', `${code} added to access codes. Click Save to apply changes.`)
  }

  function removeCode(codeToRemove: string) {
    if (!settings) return

    const updatedCodes = settings.access_codes.filter(code => code !== codeToRemove)
    setSettings({ ...settings, access_codes: updatedCodes })
    showMessage('success', `${codeToRemove} removed from access codes. Click Save to apply changes.`)
  }

  function showMessage(type: 'success' | 'error', text: string) {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#552627] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading maintenance settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Maintenance Mode</h1>
        <p className="text-gray-600">
          Enable maintenance mode to temporarily hide the site from users while you perform updates.
          Whitelisted email addresses will still be able to access the site.
        </p>
      </div>

      {/* Message Banner */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-800'
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <p className="font-medium">{message.text}</p>
        </div>
      )}

      {/* Current Status Indicator */}
      <div className={`mb-6 p-6 rounded-lg border-2 ${
        isEnabled
          ? 'bg-yellow-50 border-yellow-400'
          : 'bg-green-50 border-green-400'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {isEnabled ? (
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <div>
              <h2 className={`text-lg font-semibold ${isEnabled ? 'text-yellow-800' : 'text-green-800'}`}>
                {isEnabled ? 'Maintenance Mode is ACTIVE' : 'Site is Live'}
              </h2>
              <p className={`text-sm ${isEnabled ? 'text-yellow-700' : 'text-green-700'}`}>
                {isEnabled
                  ? 'Users will see the maintenance page instead of the site'
                  : 'All users can access the site normally'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Maintenance Settings</h3>

        {/* Enable/Disable Toggle */}
        <div className="mb-6">
          <label className="flex items-center space-x-3 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(e) => setIsEnabled(e.target.checked)}
                className="sr-only"
              />
              <div className={`w-11 h-6 rounded-full transition-colors ${
                isEnabled ? 'bg-[#F7C400]' : 'bg-gray-300'
              }`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ${
                  isEnabled ? 'translate-x-6' : 'translate-x-1'
                } mt-1`} />
              </div>
            </div>
            <span className="text-gray-700 font-medium">Enable Maintenance Mode</span>
          </label>
        </div>

        {/* Title */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Page Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Site Maintenance"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F7C400] focus:border-transparent"
          />
        </div>

        {/* Message */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Maintenance Message
          </label>
          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="We are currently performing scheduled maintenance. We will be back shortly."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F7C400] focus:border-transparent"
          />
        </div>

        {/* Estimated Completion */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estimated Completion Time (Optional)
          </label>
          <input
            type="datetime-local"
            value={estimatedCompletion}
            onChange={(e) => setEstimatedCompletion(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F7C400] focus:border-transparent"
          />
          <p className="mt-1 text-xs text-gray-500">
            Displayed to users to set expectations for when the site will be back
          </p>
        </div>

        {/* Access Codes */}
        <div className="mb-6 border-t border-gray-200 pt-6">
          <h4 className="text-md font-semibold text-gray-900 mb-3">
            Access Codes
          </h4>
          <p className="text-sm text-gray-600 mb-4">
            Users can enter these access codes on the maintenance page to bypass maintenance mode.
            Codes are case-insensitive and will be converted to uppercase.
          </p>

          {/* Add Code Input */}
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCode())}
              placeholder="Enter access code (e.g., WINGSIDE2025)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F7C400] focus:border-transparent font-mono uppercase"
            />
            <button
              type="button"
              onClick={addCode}
              className="px-4 py-2 bg-[#F7C400] text-gray-900 font-semibold rounded-lg hover:bg-[#F5B800] transition-colors"
            >
              Add Code
            </button>
          </div>

          {/* Code List */}
          {settings?.access_codes && settings.access_codes.length > 0 ? (
            <div className="space-y-2">
              {settings.access_codes.map((code) => (
                <div
                  key={code}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <span className="text-gray-700 font-mono font-semibold">{code}</span>
                  <button
                    type="button"
                    onClick={() => removeCode(code)}
                    className="text-red-600 hover:text-red-800 font-medium text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">No access codes yet</p>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Click Save to apply all changes
          </p>
          <button
            type="submit"
            disabled={saving}
            className={`px-6 py-2 rounded-lg font-semibold text-white transition-colors ${
              saving
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-[#552627] hover:bg-[#552627]/90'
            }`}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>

      {/* Preview Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="text-md font-semibold text-blue-900 mb-2">
          💡 Preview Your Maintenance Page
        </h4>
        <p className="text-sm text-blue-800 mb-3">
          To see how your maintenance page looks, enable maintenance mode and then open an
          incognito/private browser window (to bypass your admin session).
        </p>
        <a
          href="/maintenance"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-2 text-[#552627] hover:underline font-medium"
        >
          <span>View Maintenance Page</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
  )
}
