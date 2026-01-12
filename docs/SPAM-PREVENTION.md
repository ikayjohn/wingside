# Spam Prevention Guide

This guide shows you how to implement multiple layers of spam prevention for your Wingside application.

## Overview

We've implemented a multi-layered approach to prevent spam signups and logins:

1. **Rate Limiting** - Limit requests from same IP/user
2. **Honeypots** - Hidden fields that bots fill but humans don't
3. **CAPTCHA** - Cloudflare Turnstile (free & privacy-friendly)
4. **Email Verification** - Require email confirmation
5. **Input Validation** - Zod schema validation
6. **Security Checks** - SQL injection, XSS prevention

## Quick Setup

### 1. Environment Variables

Add these to your `.env.local` file:

```bash
# Cloudflare Turnstile (get free at https://dash.cloudflare.com/?to=/:account/turnstile)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_site_key_here
TURNSTILE_SECRET_KEY=your_secret_key_here
```

### 2. Using in Signup Forms

Here's a complete example of a protected signup form:

```tsx
'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { HoneypotField } from '@/components/HoneypotField';
import { Turnstile } from '@/components/Turnstile';

export default function SignupForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Check CAPTCHA
      if (!captchaToken) {
        throw new Error('Please complete the CAPTCHA verification');
      }

      // Verify CAPTCHA server-side
      const verifyResponse = await fetch('/api/captcha/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: captchaToken }),
      });

      const verifyResult = await verifyResponse.json();
      if (!verifyResult.success) {
        throw new Error('CAPTCHA verification failed. Please try again.');
      }

      // Submit signup
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signupError) throw signupError;

      // Success message
      alert('Check your email to confirm your account!');

    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Honeypot field - invisible to humans but bots will fill it */}
      <HoneypotField />

      <div>
        <label htmlFor="name">Full Name</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-4 py-2 border rounded"
        />
      </div>

      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-2 border rounded"
        />
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          className="w-full px-4 py-2 border rounded"
        />
      </div>

      {/* Cloudflare Turnstile CAPTCHA */}
      <div className="my-4">
        <Turnstile
          siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
          onSuccess={setCaptchaToken}
          onError={() => {
            setError('CAPTCHA verification failed. Please try again.');
            setCaptchaToken(null);
          }}
          theme="auto"
        />
      </div>

      {error && (
        <div className="text-red-600 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !captchaToken}
        className="w-full bg-[#F7C400] text-black font-semibold py-3 rounded disabled:opacity-50"
      >
        {loading ? 'Creating account...' : 'Sign Up'}
      </button>
    </form>
  );
}
```

### 3. Using in API Routes

Protect your API routes with rate limiting and honeypot validation:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { middleware } from '@/lib/api-middleware';
import { validateRequestHoneypot } from '@/lib/honeypot';
import { z } from 'zod';

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
});

async function signupHandler({ request }: { request: NextRequest }) {
  try {
    const body = await request.json();

    // Validate honeypot
    const honeypotCheck = validateRequestHoneypot(body);
    if (!honeypotCheck.valid) {
      console.error('Bot detected:', honeypotCheck.error);
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      );
    }

    // Validate input
    const validationResult = signupSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { email, password, name } = validationResult.data;

    // Check CAPTCHA
    if (!body.captchaToken) {
      return NextResponse.json(
        { error: 'CAPTCHA required' },
        { status: 400 }
      );
    }

    const verifyResponse = await fetch(
      new URL('/api/captcha/verify', request.url),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: body.captchaToken }),
      }
    );

    const verifyResult = await verifyResponse.json();
    if (!verifyResult.success) {
      return NextResponse.json(
        { error: 'CAPTCHA verification failed' },
        { status: 400 }
      );
    }

    // Create user
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email: email.toLowerCase(),
      password,
      options: {
        data: { name },
      },
    });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Check your email to confirm your account',
    });

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}

// Apply rate limiting (5 attempts per 15 minutes)
export const POST = middleware.withAuthRateLimit(signupHandler);
```

## Advanced Configuration

### Custom Rate Limiting

Adjust rate limits based on your needs:

```typescript
import { checkRateLimit } from '@/lib/rate-limit';

// Custom rate limit for sensitive operations
const result = checkRateLimit(identifier, {
  limit: 3,           // 3 attempts
  window: 3600000,    // per hour
  blockDuration: 86400000, // block for 24 hours
});
```

### Email Verification

Ensure Supabase email verification is enabled:

```typescript
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: `${origin}/auth/callback`,
    // This requires email confirmation before account activation
  },
});
```

### IP Blacklisting

Create a blacklist of known malicious IPs:

```typescript
// lib/ip-blacklist.ts
const BLACKLISTED_IPS = new Set([
  '192.168.1.100',
  // Add more IPs as needed
]);

export function isIPBlacklisted(ip: string): boolean {
  return BLACKLISTED_IPS.has(ip);
}

// Use in your API routes
const ip = request.headers.get('x-forwarded-for');
if (ip && isIPBlacklisted(ip)) {
  return NextResponse.json(
    { error: 'Access denied' },
    { status: 403 }
  );
}
```

### Suspicious Activity Detection

Monitor for patterns that indicate automated abuse:

```typescript
function detectSuspiciousActivity(email: string, ip: string): boolean {
  // Multiple signup attempts with different emails from same IP
  const recentAttempts = getRecentSignupAttempts(ip);
  if (recentAttempts.length > 3) {
    logSuspiciousActivity('multiple_signups', { ip, emails: recentAttempts });
    return true;
  }

  // Email with suspicious patterns
  const suspiciousPatterns = [
    /tempmail\.com$/,
    /throwaway\./,
    /@10minutemail/,
  ];

  if (suspiciousPatterns.some(pattern => pattern.test(email))) {
    logSuspiciousActivity('suspicious_email', { ip, email });
    return true;
  }

  return false;
}
```

## Monitoring & Logging

Set up logging to track spam attempts:

```typescript
// lib/spam-logger.ts
export function logSpamAttempt(type: string, details: any) {
  console.error('[SPAM ATTEMPT]', {
    type,
    timestamp: new Date().toISOString(),
    ...details,
  });

  // In production, send to monitoring service
  // await sendToSentry({ type, details });
  // await sendToDatadog({ type, details });
}
```

## Best Practices

1. **Layer Multiple Defenses**: Don't rely on a single method
2. **Monitor False Positives**: Watch for legitimate users getting blocked
3. **Adjust Limits**: Tune rate limits based on your traffic
4. **Keep CAPTCHAs Optional First**: Only enforce after suspicious activity
5. **Log Everything**: You can't improve what you don't measure
6. **Regular Updates**: Keep security libraries updated
7. **Gradual Escalation**: Start lenient, get stricter with repeated offenses

## Testing

Test your spam prevention:

```bash
# Test rate limiting
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/auth/signup \
    -H "Content-Type: application/json" \
    -d '{"email":"test'$i'@example.com","password":"test123"}'
done

# Test honeypot (should fail)
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","website":"bot"}'

# Test CAPTCHA bypass (should fail)
curl -X POST http://localhost:3000/api/captcha/verify \
  -H "Content-Type: application/json" \
  -d '{"token":"invalid"}'
```

## Production Checklist

- [ ] Enable email verification in Supabase
- [ ] Configure Cloudflare Turnstile
- [ ] Set up rate limiting
- [ ] Add honeypot fields to all forms
- [ ] Implement IP blocking
- [ ] Set up monitoring/alerting
- [ ] Create admin dashboard for reviewing flagged accounts
- [ ] Document your spam prevention strategy
- [ ] Test with real users to minimize false positives
