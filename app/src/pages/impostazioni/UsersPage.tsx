import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Users, Shield, UserCheck, Crown } from 'lucide-react';

export function UsersPage() {
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-4 w-4 text-neon-primary" />;
      case 'project_manager':
        return <Shield className="h-4 w-4 text-neon-secondary" />;
      case 'amministrazione':
        return <UserCheck className="h-4 w-4 text-neon-success" />;
      case 'titolare':
        return <UserCheck className="h-4 w-4 text-neon-warning" />;
      default:
        return <Users className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'project_manager':
        return 'Project Manager';
      case 'amministrazione':
        return 'Amministrazione';
      case 'titolare':
        return 'Titolare';
      default:
        return role;
    }
  };

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
              Utenti
            </h1>
            <p className="text-muted-foreground mt-2">
              Gestione utenti e permessi
            </p>
          </div>
          <Button 
            className="btn-neon"
            onClick={() => setIsNewUserModalOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuovo Utente
          </Button>
        </div>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="card-gaming">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca utenti..."
                  className="pl-10"
                />
              </div>
              <Button variant="outline">
                Filtri
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Users List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="card-gaming">
          <CardHeader>
            <CardTitle className="flex items-center gap-x-2">
              <Users className="h-5 w-5 text-neon-primary" />
              Elenco Utenti
            </CardTitle>
            <CardDescription>
              Lista completa degli utenti del sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { 
                  name: 'Admin System', 
                  email: 'admin@mbsplanner.com', 
                  role: 'admin',
                  partner: 'Tutti i Partner',
                  lastLogin: '2 ore fa'
                },
                { 
                  name: 'Mario Rossi', 
                  email: 'mario.rossi@techcorp.it', 
                  role: 'project_manager',
                  partner: 'TechCorp S.r.l.',
                  lastLogin: '1 giorno fa'
                },
                { 
                  name: 'Giulia Bianchi', 
                  email: 'giulia.bianchi@innovatelab.it', 
                  role: 'amministrazione',
                  partner: 'InnovateLab',
                  lastLogin: '3 giorni fa'
                },
                { 
                  name: 'Luca Verdi', 
                  email: 'luca.verdi@futuretech.it', 
                  role: 'titolare',
                  partner: 'FutureTech',
                  lastLogin: '1 settimana fa'
                },
              ].map((user, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 rounded-xl border border-dark-border hover:border-neon-primary/50 hover:bg-neon-primary/5 transition-all duration-200"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-neon-primary/20 rounded-full flex items-center justify-center">
                      {getRoleIcon(user.role)}
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">{user.name}</h3>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.partner} • Ultimo accesso: {user.lastLogin}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="px-2 py-1 text-xs bg-neon-primary/20 text-neon-primary rounded-full">
                      {getRoleLabel(user.role)}
                    </span>
                    <Button variant="ghost" size="sm">
                      Modifica
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* New User Modal */}
      {isNewUserModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-background border border-border rounded-xl p-6 w-full max-w-md"
          >
            <h2 className="text-xl font-bold text-foreground mb-4">Nuovo Utente</h2>
            <p className="text-muted-foreground mb-4">
              Funzionalità in sviluppo. Il form per creare un nuovo utente sarà disponibile presto.
            </p>
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setIsNewUserModalOpen(false)}
              >
                Chiudi
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

