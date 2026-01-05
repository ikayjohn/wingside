'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface PushSubscriptionState {
  isSupported: boolean;
  isPermissionGranted: boolean;
  isSubscribed: boolean;
  subscription: PushSubscription | null;
  error: string | null;
}

export function usePushNotifications() {
  const [state, setState] = useState<PushSubscriptionState>({
    isSupported: false,
    isPermissionGranted: false,
    isSubscribed: false,
    subscription: null,
    error: null,
  });

  useEffect(() => {
    // Check if push notifications are supported
    const isSupported =
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window;

    setState((prev) => ({ ...prev, isSupported }));

    if (!isSupported) {
      setState((prev) => ({
        ...prev,
        error: 'Push notifications are not supported in this browser',
      }));
      return;
    }

    // Check permission status
    checkPermissionStatus();

    // Check if already subscribed
    checkSubscription();

    // Listen for permission changes
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'notifications' }).then((permissionStatus) => {
        permissionStatus.onchange = () => {
          checkPermissionStatus();
        };
      });
    }

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
  }, []);

  const handleServiceWorkerMessage = (event: MessageEvent) => {
    if (event.data && event.data.type === 'COPY_CODE' && event.data.code) {
      copyToClipboard(event.data.code);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could trigger a toast notification here
      alert('Discount code copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const checkPermissionStatus = async () => {
    if ('Notification' in window) {
      const permission = Notification.permission;
      setState((prev) => ({
        ...prev,
        isPermissionGranted: permission === 'granted',
      }));
    }
  };

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      setState((prev) => ({
        ...prev,
        isSubscribed: !!subscription,
        subscription: subscription,
      }));
    } catch (error: any) {
      console.error('Error checking subscription:', error);
      setState((prev) => ({ ...prev, error: error.message }));
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    if (!state.isSupported) {
      return false;
    }

    if (!('Notification' in window)) {
      setState((prev) => ({ ...prev, error: 'Notifications not supported' }));
      return false;
    }

    const permission = await Notification.requestPermission();

    setState((prev) => ({
      ...prev,
      isPermissionGranted: permission === 'granted',
    }));

    return permission === 'granted';
  };

  const subscribe = async (userId?: string): Promise<boolean> => {
    if (!state.isSupported) {
      return false;
    }

    try {
      // Request permission first
      const permissionGranted = await requestPermission();
      if (!permissionGranted) {
        setState((prev) => ({
          ...prev,
          error: 'Permission denied',
        }));
        return false;
      }

      // Get VAPID public key
      const response = await fetch('/api/notifications/push/vapid');
      const vapidData = await response.json();

      if (!vapidData.publicKey) {
        throw new Error('Failed to get VAPID key');
      }

      // Convert base64 to Uint8Array
      const vapidPublicKey = urlBase64ToUint8Array(vapidData.publicKey);

      // Register service worker and subscribe
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey,
      });

      // Send subscription to server
      if (userId) {
        await fetch('/api/notifications/push/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subscription,
            action: 'subscribe',
          }),
        });
      }

      setState((prev) => ({
        ...prev,
        isSubscribed: true,
        subscription: subscription,
        error: null,
      }));

      return true;
    } catch (error: any) {
      console.error('Subscription error:', error);
      setState((prev) => ({
        ...prev,
        error: error.message || 'Failed to subscribe',
      }));
      return false;
    }
  };

  const unsubscribe = async (): Promise<boolean> => {
    if (!state.subscription) {
      return true;
    }

    try {
      // Send unsubscribe request to server
      await fetch('/api/notifications/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: state.subscription,
          action: 'unsubscribe',
        }),
      });

      // Unsubscribe locally
      await state.subscription.unsubscribe();

      setState((prev) => ({
        ...prev,
        isSubscribed: false,
        subscription: null,
      }));

      return true;
    } catch (error: any) {
      console.error('Unsubscribe error:', error);
      setState((prev) => ({
        ...prev,
        error: error.message || 'Failed to unsubscribe',
      }));
      return false;
    }
  };

  const toggleSubscription = async (userId?: string): Promise<boolean> => {
    if (state.isSubscribed) {
      return unsubscribe();
    } else {
      return subscribe(userId);
    }
  };

  return {
    ...state,
    requestPermission,
    subscribe,
    unsubscribe,
    toggleSubscription,
  };
}

// Utility function to convert base64 to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}
