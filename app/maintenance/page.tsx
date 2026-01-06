"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface MaintenanceSettings {
  is_enabled: boolean
  title: string
  message: string
  estimated_completion: string | null
  access_codes: string[]
}

export default function MaintenancePage() {
  const [accessCode, setAccessCode] = useState('')
  const [codeError, setCodeError] = useState('')
  const [codeSuccess, setCodeSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [settings, setSettings] = useState<MaintenanceSettings | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<string>('')

  const router = useRouter()

  useEffect(() => {
    async function fetchSettings() {
      try {
        console.log('[Maintenance Page] Fetching settings...')
        const response = await fetch('/api/maintenance-settings')
        console.log('[Maintenance Page] Response status:', response.status)

        if (response.ok) {
          const data = await response.json()
          console.log('[Maintenance Page] Settings loaded:', data)
          setSettings(data.settings)

          // Update document title
          if (data.settings?.title) {
            document.title = data.settings.title
          }
        } else {
          console.error('[Maintenance Page] Failed to load settings:', response.status)
        }
      } catch (error) {
        console.error('[Maintenance Page] Error fetching settings:', error)
      }
    }
    fetchSettings()
  }, [])

  // Countdown timer effect
  useEffect(() => {
    if (!settings?.estimated_completion) return

    const updateCountdown = () => {
      const now = new Date().getTime()
      const completion = new Date(settings.estimated_completion).getTime()
      const distance = completion - now

      if (distance < 0) {
        setTimeRemaining('Coming soon!')
        return
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24))
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((distance % (1000 * 60)) / 1000)

      let timeString = ''
      if (days > 0) {
        timeString += `${days}d `
      }
      timeString += `${hours}h ${minutes}m ${seconds}s`

      setTimeRemaining(timeString)
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [settings?.estimated_completion])

  async function handleSubmitCode(e: React.FormEvent) {
    e.preventDefault()
    setCodeError('')
    setCodeSuccess(false)
    setIsLoading(true)

    const trimmedCode = accessCode.trim()

    if (!trimmedCode) {
      setCodeError('Please enter an access code')
      setIsLoading(false)
      return
    }

    try {
      console.log('[Maintenance Page] Validating code:', trimmedCode.toUpperCase())

      // Validate the code against the database
      const response = await fetch('/api/validate-access-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trimmedCode.toUpperCase() })
      })

      console.log('[Maintenance Page] Response status:', response.status)
      console.log('[Maintenance Page] Content-Type:', response.headers.get('content-type'))

      const rawText = await response.text()
      console.log('[Maintenance Page] Raw response length:', rawText.length)
      console.log('[Maintenance Page] Raw response (first 500 chars):', rawText.substring(0, 500))

      // Check if response is empty
      if (!rawText || rawText.trim().length === 0) {
        console.error('[Maintenance Page] Empty response from API')
        setCodeError('Server returned empty response. Please try again.')
        setIsLoading(false)
        return
      }

      // Check if it's HTML (error page)
      if (rawText.trim().startsWith('<')) {
        console.error('[Maintenance Page] API returned HTML instead of JSON')
        console.error('[Maintenance Page] This usually means the API route crashed')
        setCodeError('Server error. Please check server console.')
        setIsLoading(false)
        return
      }

      let data
      try {
        data = JSON.parse(rawText)
      } catch (parseError) {
        console.error('[Maintenance Page] Failed to parse response:', parseError)
        console.error('[Maintenance Page] First 100 chars:', rawText.substring(0, 100))
        setCodeError('Invalid server response. Please try again.')
        setIsLoading(false)
        return
      }

      console.log('[Maintenance Page] Parsed data:', data)

      if (!response.ok) {
        setCodeError(data.error || 'Validation failed')
        setIsLoading(false)
        return
      }

      if (!data.valid) {
        setCodeError('Invalid access code')
        setIsLoading(false)
        return
      }

      // Code is valid, set cookie for 7 days
      const upperCode = trimmedCode.toUpperCase()
      document.cookie = `maintenance_access_code=${upperCode}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`
      console.log('[Maintenance Page] Cookie set for code:', upperCode)

      setCodeSuccess(true)

      // Redirect after short delay
      setTimeout(() => {
        const urlParams = new URLSearchParams(window.location.search)
        const returnUrl = urlParams.get('returnUrl')
        const destination = returnUrl || '/'
        console.log('[Maintenance Page] Redirecting to:', destination)
        window.location.href = destination
      }, 500)
    } catch (error) {
      console.error('[Maintenance Page] Validation error:', error)
      setCodeError('Failed to validate code. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Full-screen white overlay to cover header, sidebar, and footer */}
      <div className="fixed inset-0 bg-white z-[9999] overflow-y-auto">
        <div className="min-h-screen flex items-center justify-center bg-white p-8">
          {/* Container */}
          <div className="w-[80%] max-w-6xl mx-auto flex flex-col">
            {/* Logo - Centered at top */}
            <div className="flex justify-center mb-8">
              <img
                src="/logo.png"
                alt="Wingside Logo"
                className="h-24 w-auto"
              />
            </div>

            {/* Two-column section for content */}
            <div className="flex flex-col md:flex-row gap-8 md:gap-0 relative flex-1">
              {/* Vertical line divider */}
              <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gray-300"></div>

              {/* Left side - Maintenance Card */}
              <div className="flex-1 md:pr-8">
                <div className="bg-white rounded-2xl overflow-hidden h-full flex flex-col">
                {/* Header with White Background */}
                <div className="bg-white p-6 text-center border-b border-gray-200">
                  {/* Hourglass Icon */}
                  <div className="mb-3">
                    <svg
                      className="w-16 h-16 mx-auto text-[#F7C400]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M5 2h14v4l-5 5 5 5v4H5v-4l5-5-5-5V2z" />
                      <path d="M6 12h12" className="opacity-50" />
                      <path d="M8 6h8" className="opacity-50">
                        <animate
                          attributeName="y1"
                          values="6;16;6"
                          dur="2s"
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="y2"
                          values="6;16;6"
                          dur="2s"
                          repeatCount="indefinite"
                        />
                      </path>
                      <circle cx="12" cy="12" r="1.5" fill="currentColor">
                        <animate
                          attributeName="cy"
                          values="7;12;17;12"
                          dur="2s"
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="opacity"
                          values="1;0.5;0;0.5;1"
                          dur="2s"
                          repeatCount="indefinite"
                        />
                      </circle>
                    </svg>
                  </div>

                  <h1 className="text-5xl font-bold text-[#552627]">
                    {settings?.title || 'New Website in Progress'}
                  </h1>
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* Message */}
                  <div className="text-center mb-6">
                    <p className="text-base text-gray-700 leading-relaxed">
                      {settings?.message || 'We are currently performing scheduled maintenance. We will be back shortly.'}
                    </p>
                  </div>

                  {/* Access Code Form */}
                  <div className="mt-6">
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <svg className="w-5 h-5 text-[#552627]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <h3 className="text-base font-semibold text-[#552627]">
                        Authorized Access
                      </h3>
                    </div>

                    <form onSubmit={handleSubmitCode} className="space-y-3">
                      <input
                        type="text"
                        value={accessCode}
                        onChange={(e) => setAccessCode(e.target.value)}
                        placeholder="Enter access code"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F7C400] focus:border-transparent text-sm uppercase tracking-wider"
                        autoFocus
                      />

                      {codeError && (
                        <p className="text-red-600 text-xs">{codeError}</p>
                      )}

                      {codeSuccess && (
                        <p className="text-green-600 text-xs">
                          ✓ Access code accepted! Redirecting...
                        </p>
                      )}

                      <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full px-4 py-2.5 text-white font-medium rounded-lg transition-colors text-sm ${
                          isLoading
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-[#552627] hover:bg-[#552627]/90'
                        }`}
                      >
                        {isLoading ? 'Validating...' : 'Submit Access Code'}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
              </div>

            {/* Right side - Info Cards */}
            <div className="flex-1 md:pl-8 flex flex-col">
              {/* Countdown Timer */}
              {timeRemaining && (
                <div className="p-6 text-center flex-shrink-0 border-b border-gray-300">
                  <p className="text-sm font-bold text-[#552627] mb-2">We'll be back in</p>
                  <p className="text-4xl font-bold text-[#F7C400]">{timeRemaining}</p>
                </div>
              )}

              {/* What We're Working On */}
              <div className="p-5 flex-1 border-b border-gray-300">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-[#F7C400]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <h2 className="text-2xl font-bold text-[#552627]">
                    What's Coming
                  </h2>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <svg className="w-4 h-4 text-[#F7C400] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">20 Signature Wing Flavors</span>
                  </div>

                  <div className="flex items-center space-x-2 text-sm">
                    <svg className="w-4 h-4 text-[#F7C400] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Easy Online Ordering</span>
                  </div>

                  <div className="flex items-center space-x-2 text-sm">
                    <svg className="w-4 h-4 text-[#F7C400] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Quick Delivery Service</span>
                  </div>

                  <div className="flex items-center space-x-2 text-sm">
                    <svg className="w-4 h-4 text-[#F7C400] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">User Wallets & Physical Cards</span>
                  </div>

                  <div className="flex items-center space-x-2 text-sm">
                    <svg className="w-4 h-4 text-[#F7C400] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Wingclub Loyalty & Rewards</span>
                  </div>

                  <div className="flex items-center space-x-2 text-sm">
                    <svg className="w-4 h-4 text-[#F7C400] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Referral Bonuses & Promo Codes</span>
                  </div>

                  <div className="flex items-center space-x-2 text-sm">
                    <svg className="w-4 h-4 text-[#F7C400] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Hotspots Network</span>
                  </div>

                  <div className="flex items-center space-x-2 text-sm">
                    <svg className="w-4 h-4 text-[#F7C400] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Live Order Notifications</span>
                  </div>

                  <div className="flex items-center space-x-2 text-sm">
                    <svg className="w-4 h-4 text-[#F7C400] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Multiple Payment Options</span>
                  </div>

                  <div className="flex items-center space-x-2 text-sm">
                    <svg className="w-4 h-4 text-[#F7C400] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Personalized User Accounts</span>
                  </div>
                </div>
              </div>

              {/* Stay Connected */}
              <div className="p-5 flex-shrink-0">
                <h2 className="text-lg font-bold text-[#552627] mb-3 text-center">
                  Stay Connected
                </h2>
                <div className="flex gap-6 justify-center">
                  <a href="https://instagram.com/mywingside" target="_blank" rel="noopener noreferrer" className="text-black hover:text-gray-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                    </svg>
                  </a>

                  <a href="https://x.com/mywingside" target="_blank" rel="noopener noreferrer" className="text-black hover:text-gray-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </a>

                  <a href="https://facebook.com/mywingside" target="_blank" rel="noopener noreferrer" className="text-black hover:text-gray-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/>
                    </svg>
                  </a>

                  <a href="https://www.linkedin.com/company/wingside" target="_blank" rel="noopener noreferrer" className="text-black hover:text-gray-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </a>

                  <a href="https://www.youtube.com/@mywingside" target="_blank" rel="noopener noreferrer" className="text-black hover:text-gray-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
            {/* End divider section */}

          </div>

          {/* Footer */}
          <div className="text-center text-gray-600 text-xs mt-8">
            <p>© {new Date().getFullYear()} Wingside. All rights reserved.</p>
          </div>
        </div>
      </div>
      </div>
    </>
  )
}
