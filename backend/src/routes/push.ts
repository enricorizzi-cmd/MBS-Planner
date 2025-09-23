import { Router } from 'express';
import { z } from 'zod';
import webpush from 'web-push';
import { supabase } from '../index';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { CustomError } from '../middleware/errorHandler';
import { config } from '../config';

const router = Router();

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

// Configure web-push
webpush.setVapidDetails(
  config.vapid.subject,
  config.vapid.publicKey,
  config.vapid.privateKey
);

// Subscribe to push notifications
router.post('/subscribe', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const subscription = subscriptionSchema.parse(req.body);

    // Store subscription in database
    const { data, error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: req.user!.id,
        endpoint: subscription.endpoint,
        p256dh_key: subscription.keys.p256dh,
        auth_key: subscription.keys.auth,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      throw new CustomError('Errore nella registrazione della sottoscrizione', 500);
    }

    res.json({ message: 'Sottoscrizione registrata con successo' });
  } catch (error) {
    next(error);
  }
});

// Unsubscribe from push notifications
router.post('/unsubscribe', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { endpoint } = req.body;

    if (!endpoint) {
      throw new CustomError('Endpoint richiesto', 400);
    }

    // Remove subscription from database
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', req.user!.id)
      .eq('endpoint', endpoint);

    if (error) {
      throw new CustomError('Errore nella rimozione della sottoscrizione', 500);
    }

    res.json({ message: 'Sottoscrizione rimossa con successo' });
  } catch (error) {
    next(error);
  }
});

// Send test notification
router.post('/test', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    // Get user's subscriptions
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', req.user!.id);

    if (error) {
      throw new CustomError('Errore nel recupero delle sottoscrizioni', 500);
    }

    if (!subscriptions || subscriptions.length === 0) {
      throw new CustomError('Nessuna sottoscrizione trovata', 404);
    }

    // Send notification to all subscriptions
    const payload = JSON.stringify({
      title: 'Test Notifica',
      body: 'Questa è una notifica di test da MBS Planner',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: {
        url: '/dashboard',
        timestamp: Date.now(),
      },
    });

    const promises = subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh_key,
              auth: subscription.auth_key,
            },
          },
          payload
        );
      } catch (error) {
        console.error('Error sending notification:', error);
        // Remove invalid subscription
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('id', subscription.id);
      }
    });

    await Promise.all(promises);

    res.json({ message: 'Notifica di test inviata' });
  } catch (error) {
    next(error);
  }
});

// Get VAPID public key
router.get('/vapid-key', (req, res) => {
  res.json({ publicKey: config.vapid.publicKey });
});

export { router as pushRoutes };

