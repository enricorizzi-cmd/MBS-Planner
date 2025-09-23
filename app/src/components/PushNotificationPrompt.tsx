import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff, X, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export function PushNotificationPrompt() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const { isSupported, isSubscribed, isLoading, error, subscribe, unsubscribe } = usePushNotifications();

  useEffect(() => {
    // Show prompt if supported, not subscribed, and not dismissed
    const shouldShow = isSupported && !isSubscribed && !isDismissed;
    setIsVisible(shouldShow);
  }, [isSupported, isSubscribed, isDismissed]);

  const handleSubscribe = async () => {
    await subscribe();
  };


  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    // Store dismissal in localStorage
    localStorage.setItem('push-notification-dismissed', 'true');
  };

  // Check if user has previously dismissed
  useEffect(() => {
    const dismissed = localStorage.getItem('push-notification-dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  if (!isSupported) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ duration: 0.3, type: 'spring' }}
          className="fixed bottom-4 right-4 z-50 max-w-sm"
        >
          <Card className="card-gaming border-neon-primary/20 shadow-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bell className="h-5 w-5 text-neon-primary" />
                  <CardTitle className="text-lg">Notifiche Push</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDismiss}
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>
                Ricevi notifiche per eventi importanti e aggiornamenti
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 bg-neon-danger/10 border border-neon-danger/20 rounded-lg">
                  <p className="text-sm text-neon-danger">{error}</p>
                </div>
              )}

              <div className="space-y-3">
                <Button
                  onClick={handleSubscribe}
                  disabled={isLoading}
                  className="w-full btn-neon"
                >
                  <Bell className="mr-2 h-4 w-4" />
                  {isLoading ? 'Attivazione...' : 'Attiva Notifiche'}
                </Button>

                <Button
                  variant="outline"
                  onClick={handleDismiss}
                  className="w-full"
                >
                  Non ora
                </Button>
              </div>

              {/* iOS specific note */}
              <div className="p-3 bg-neon-warning/10 border border-neon-warning/20 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Smartphone className="h-4 w-4 text-neon-warning mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-muted-foreground">
                    <p className="font-medium text-neon-warning mb-1">Su iOS/iPadOS:</p>
                    <p>
                      Le notifiche push funzionano solo se l'app è stata aggiunta alla schermata Home. 
                      Dopo aver attivato le notifiche, aggiungi l'app alla Home per riceverle.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Component for managing push notifications in settings
export function PushNotificationSettings() {
  const { isSupported, isSubscribed, isLoading, error, subscribe, unsubscribe, sendTestNotification } = usePushNotifications();

  if (!isSupported) {
    return (
      <div className="p-4 bg-muted/50 rounded-lg">
        <p className="text-sm text-muted-foreground">
          Le notifiche push non sono supportate su questo dispositivo.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium">Notifiche Push</h4>
          <p className="text-sm text-muted-foreground">
            {isSubscribed ? 'Attive' : 'Disattivate'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {isSubscribed ? (
            <Button
              variant="outline"
              size="sm"
              onClick={unsubscribe}
              disabled={isLoading}
            >
              <BellOff className="mr-2 h-4 w-4" />
              Disattiva
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={subscribe}
              disabled={isLoading}
              className="btn-neon"
            >
              <Bell className="mr-2 h-4 w-4" />
              Attiva
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-neon-danger/10 border border-neon-danger/20 rounded-lg">
          <p className="text-sm text-neon-danger">{error}</p>
        </div>
      )}

      {isSubscribed && (
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">Test Notifica</h4>
            <p className="text-sm text-muted-foreground">
              Invia una notifica di test
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={sendTestNotification}
          >
            Invia Test
          </Button>
        </div>
      )}
    </div>
  );
}

