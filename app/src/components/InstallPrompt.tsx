import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        return;
      }
      
      // Check for iOS standalone mode
      if ((window.navigator as any).standalone === true) {
        setIsInstalled(true);
        return;
      }
    };

    checkInstalled();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Check if user has previously dismissed
      const dismissed = localStorage.getItem('install-prompt-dismissed');
      if (dismissed !== 'true') {
        setIsVisible(true);
      }
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      setDeferredPrompt(null);
      setIsVisible(false);
    } catch (error) {
      console.error('Error during install:', error);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem('install-prompt-dismissed', 'true');
  };

  // Don't show if already installed or dismissed
  if (isInstalled || isDismissed || !deferredPrompt) {
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
          className="fixed bottom-4 left-4 z-50 max-w-sm"
        >
          <Card className="card-gaming border-neon-secondary/20 shadow-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Download className="h-5 w-5 text-neon-secondary" />
                  <CardTitle className="text-lg">Installa App</CardTitle>
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
                Installa MBS Planner per un accesso più veloce e funzionalità offline
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Button
                  onClick={handleInstall}
                  className="w-full btn-neon-secondary"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Installa App
                </Button>

                <Button
                  variant="outline"
                  onClick={handleDismiss}
                  className="w-full"
                >
                  Non ora
                </Button>
              </div>

              {/* Benefits */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Monitor className="h-4 w-4" />
                  <span>Accesso rapido dal desktop</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Smartphone className="h-4 w-4" />
                  <span>Funzionalità offline</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

