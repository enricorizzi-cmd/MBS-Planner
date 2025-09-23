import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Save, Bell, Shield, Database } from 'lucide-react';

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-neon-primary">
              Impostazioni
            </h1>
            <p className="text-muted-foreground mt-2">
              Configurazione sistema e preferenze
            </p>
          </div>
        </div>
      </motion.div>

      {/* General Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="card-gaming">
          <CardHeader>
            <CardTitle className="flex items-center gap-x-2">
              <Settings className="h-5 w-5 text-neon-primary" />
              Impostazioni Generali
            </CardTitle>
            <CardDescription>
              Configurazione generale del sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="app-name">Nome Applicazione</Label>
                <Input id="app-name" defaultValue="MBS Planner" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="app-version">Versione</Label>
                <Input id="app-version" defaultValue="1.0.0" disabled />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="app-description">Descrizione</Label>
              <Input id="app-description" defaultValue="Web App PWA per gestione studenti e programmazione" />
            </div>
            <Button className="btn-neon">
              <Save className="mr-2 h-4 w-4" />
              Salva Impostazioni
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Notification Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="card-gaming">
          <CardHeader>
            <CardTitle className="flex items-center gap-x-2">
              <Bell className="h-5 w-5 text-neon-primary" />
              Notifiche
            </CardTitle>
            <CardDescription>
              Configurazione notifiche push e email
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Notifiche Push</h4>
                  <p className="text-sm text-muted-foreground">
                    Ricevi notifiche push per eventi importanti
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Abilita
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Notifiche Email</h4>
                  <p className="text-sm text-muted-foreground">
                    Ricevi notifiche via email
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Configura
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Security Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="card-gaming">
          <CardHeader>
            <CardTitle className="flex items-center gap-x-2">
              <Shield className="h-5 w-5 text-neon-primary" />
              Sicurezza
            </CardTitle>
            <CardDescription>
              Configurazione sicurezza e accessi
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Autenticazione a Due Fattori</h4>
                  <p className="text-sm text-muted-foreground">
                    Aggiungi un livello extra di sicurezza
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Configura
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Sessione Timeout</h4>
                  <p className="text-sm text-muted-foreground">
                    Durata sessione utente (minuti)
                  </p>
                </div>
                <Input type="number" defaultValue="60" className="w-20" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Database Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="card-gaming">
          <CardHeader>
            <CardTitle className="flex items-center gap-x-2">
              <Database className="h-5 w-5 text-neon-primary" />
              Database
            </CardTitle>
            <CardDescription>
              Informazioni e manutenzione database
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Ultimo Backup</Label>
                <Input defaultValue="2024-01-15 14:30:00" disabled />
              </div>
              <div className="space-y-2">
                <Label>Prossimo Backup</Label>
                <Input defaultValue="2024-01-16 14:30:00" disabled />
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline">
                Backup Manuale
              </Button>
              <Button variant="outline">
                Test Connessione
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

