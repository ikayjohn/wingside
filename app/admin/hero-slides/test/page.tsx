"use client";

import { useState } from 'react';

export default function TestHeroSlidePage() {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  async function testInsert() {
    setLoading(true);
    setResult('Sending request...');

    try {
      const testData = {
        title: 'Test Slide',
        headline: 'Test [yellow]Headline[/yellow]',
        description: 'Test description',
        image_url: '/test.jpg',
        is_active: true,
        display_order: 99,
      };

      const response = await fetch('/api/hero-slides/test-insert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData),
      });

      const rawText = await response.text();
      setResult(`Status: ${response.status}\n\nRaw Response:\n${rawText}`);

    } catch (error: any) {
      setResult(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function testAuth() {
    setLoading(true);
    setResult('Testing auth...');

    try {
      const response = await fetch('/api/hero-slides/test-auth', {
        method: 'POST',
      });

      const rawText = await response.text();
      setResult(`Status: ${response.status}\n\nRaw Response:\n${rawText}`);

    } catch (error: any) {
      setResult(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function testInsertWithoutAuth() {
    setLoading(true);
    setResult('Testing insert without auth...');

    try {
      const formData = {
        title: 'Test Without Auth',
        headline: 'Test [yellow]Insert[/yellow]',
        description: 'Testing without auth checks',
        image_url: 'https://cxbqochxrhokdscgijxe.supabase.co/storage/v1/object/public/hero-images/hero-1766785713035-87ut5caeske.jpg',
        is_active: true,
        display_order: 100,
      };

      const response = await fetch('/api/hero-slides/insert-without-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const rawText = await response.text();
      setResult(`Status: ${response.status}\n\nRaw Response:\n${rawText}`);

    } catch (error: any) {
      setResult(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Test Hero Slide API</h1>

      <div className="space-y-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <h2 className="font-bold mb-2">Test 1: Direct Insert (No Auth)</h2>
          <p className="text-sm text-gray-600 mb-3">Tests database insert without authentication checks</p>
          <button
            onClick={testInsert}
            disabled={loading}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Insert'}
          </button>
        </div>

        <div className="p-4 bg-green-50 rounded-lg">
          <h2 className="font-bold mb-2">Test 2: Auth Check</h2>
          <p className="text-sm text-gray-600 mb-3">Tests authentication and admin role verification</p>
          <button
            onClick={testAuth}
            disabled={loading}
            className="px-6 py-3 bg-green-500 text-white rounded-lg disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Auth'}
          </button>
        </div>

        <div className="p-4 bg-purple-50 rounded-lg">
          <h2 className="font-bold mb-2">Test 3: Insert With Real Data (No Auth)</h2>
          <p className="text-sm text-gray-600 mb-3">Tests insert with Supabase image URL (bypasses auth)</p>
          <button
            onClick={testInsertWithoutAuth}
            disabled={loading}
            className="px-6 py-3 bg-purple-500 text-white rounded-lg disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Insert (Real Data)'}
          </button>
        </div>
      </div>

      {result && (
        <div className="mt-4 p-4 bg-gray-100 rounded-lg">
          <h2 className="font-bold mb-2">Result:</h2>
          <pre className="whitespace-pre-wrap text-sm">{result}</pre>
        </div>
      )}
    </div>
  );
}
