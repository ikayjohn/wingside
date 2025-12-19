"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export default function AuthDebugPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('Checking auth status...');
        const { data: { user }, error } = await supabase.auth.getUser();
        
        console.log('Auth check result:', { user, error });
        
        if (error) {
          console.error('Auth error:', error);
          setError(error.message);
        } else if (user) {
          setUser(user);
        }
      } catch (err) {
        console.error('Auth check error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const testProfileAPI = async () => {
    try {
      console.log('Testing profile API...');
      const response = await fetch('/api/user/profile');
      console.log('Profile API response status:', response.status);
      
      const data = await response.text();
      console.log('Profile API response data:', data);
      
      if (!response.ok) {
        setError(`Profile API failed: ${response.status} - ${data}`);
      }
    } catch (err) {
      console.error('Profile API test error:', err);
      setError(err instanceof Error ? err.message : 'Profile API test failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">Authentication Debug</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Auth Status */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Authentication Status</h2>
            {loading ? (
              <p className="text-gray-600">Checking...</p>
            ) : user ? (
              <div>
                <p className="text-green-600 font-medium">✓ User is authenticated</p>
                <p className="text-sm text-gray-600 mt-2">
                  ID: {user.id}<br />
                  Email: {user.email}<br />
                  Phone: {user.phone || 'N/A'}<br />
                  Created: {user.created_at ? new Date(user.created_at).toLocaleString() : 'N/A'}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-red-600 font-medium">✗ No authenticated user</p>
                {error && <p className="text-sm text-red-500 mt-2">Error: {error}</p>}
              </div>
            )}
          </div>

          {/* API Test */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Profile API Test</h2>
            <button
              onClick={testProfileAPI}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Test Profile API
            </button>
            {error && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 rounded text-sm">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex gap-4">
          <a href="/my-account" className="text-blue-600 hover:underline">
            ← Back to My Account
          </a>
          <a href="/my-account/dashboard" className="text-blue-600 hover:underline">
            Try Dashboard →
          </a>
        </div>
      </div>
    </div>
  );
}