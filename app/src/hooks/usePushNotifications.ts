import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface PushNotificationState {
  isSupported: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
  error: string | null;
}

export function usePushNotifications() {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isSubscribed: false,
    isLoading: false,
    error: null,
  });

  // Check if push notifications are supported
  useEffect(() => {
    const checkSupport = () => {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        setState(prev => ({ ...prev, isSupported: true }));
        checkSubscription();
      } else {
        setState(prev => ({ ...prev, isSupported: false }));
      }
    };

    checkSupport();
  }, []);

  const checkSubscription = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setState(prev => ({ ...prev, isSubscribed: !!subscription }));
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  }, []);

  const subscribe = useCallback(async () => {
    if (!state.isSupported) {
      setState(prev => ({ ...prev, error: 'Push notifications non supportate' }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Permesso notifiche negato');
      }

      // Get VAPID public key
      const response = await fetch('/api/push/vapid-key');
      const { publicKey } = await response.json();

      // Subscribe to push notifications
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey).buffer,
      });

      // Send subscription to server
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          endpoint: subscription.endpoint,
          p256dh_key: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
          auth_key: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!))),
        });

      if (error) {
        throw new Error('Errore nella registrazione della sottoscrizione');
      }

      setState(prev => ({ ...prev, isSubscribed: true, isLoading: false }));
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        error: error.message || 'Errore nella sottoscrizione',
        isLoading: false 
      }));
    }
  }, [state.isSupported]);

  const unsubscribe = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();

        // Remove from server
        const { error } = await supabase
          .from('push_subscriptions')
          .delete()
          .eq('endpoint', subscription.endpoint);

        if (error) {
          console.error('Error removing subscription from server:', error);
        }
      }

      setState(prev => ({ ...prev, isSubscribed: false, isLoading: false }));
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        error: error.message || 'Errore nella disiscrizione',
        isLoading: false 
      }));
    }
  }, []);

  const sendTestNotification = useCallback(async () => {
    try {
      const response = await fetch('/api/push/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Errore nell\'invio della notifica di test');
      }

      return true;
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        error: error.message || 'Errore nell\'invio della notifica di test'
      }));
      return false;
    }
  }, []);

  return {
    ...state,
    subscribe,
    unsubscribe,
    sendTestNotification,
  };
}

// Utility function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

