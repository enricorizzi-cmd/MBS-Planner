import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, UserCheck } from 'lucide-react';

export function SupervisorsPage() {
  const [isNewSupervisorModalOpen, setIsNewSupervisorModalOpen] = useState(false);
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
              Supervisori
            </h1>
            <p className="text-muted-foreground mt-2">
              Gestione anagrafica supervisori aziendali
            </p>
          </div>
          <Button 
            className="btn-neon"
            onClick={() => setIsNewSupervisorModalOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuovo Supervisore
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
                  placeholder="Cerca supervisori..."
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

      {/* Supervisors List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="card-gaming">
          <CardHeader>
            <CardTitle className="flex items-center gap-x-2">
              <UserCheck className="h-5 w-5 text-neon-primary" />
              Elenco Supervisori
            </CardTitle>
            <CardDescription>
              Lista completa dei supervisori aziendali
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { 
                  name: 'Marco Rossi', 
                  email: 'marco.rossi@techcorp.it', 
                  phone: '+39 02 123 4567', 
                  company: 'TechCorp S.r.l.',
                  students: 5 
                },
                { 
                  name: 'Sara Bianchi', 
                  email: 'sara.bianchi@innovatelab.it', 
                  phone: '+39 011 123 4567', 
                  company: 'InnovateLab',
                  students: 3 
                },
                { 
                  name: 'Giuseppe Verdi', 
                  email: 'giuseppe.verdi@futuretech.it', 
                  phone: '+39 055 123 4567', 
                  company: 'FutureTech',
                  students: 4 
                },
              ].map((supervisor, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 rounded-xl border border-dark-border hover:border-neon-primary/50 hover:bg-neon-primary/5 transition-all duration-200"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-neon-warning/20 rounded-full flex items-center justify-center">
                      <UserCheck className="h-5 w-5 text-neon-warning" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">{supervisor.name}</h3>
                      <p className="text-sm text-muted-foreground">{supervisor.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {supervisor.phone} • {supervisor.company}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">{supervisor.students}</p>
                      <p className="text-xs text-muted-foreground">studenti</p>
                    </div>
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

      {/* New Supervisor Modal */}
      {isNewSupervisorModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-background border border-border rounded-xl p-6 w-full max-w-md"
          >
            <h2 className="text-xl font-bold text-foreground mb-4">Nuovo Supervisore</h2>
            <p className="text-muted-foreground mb-4">
              Funzionalità in sviluppo. Il form per creare un nuovo supervisore sarà disponibile presto.
            </p>
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setIsNewSupervisorModalOpen(false)}
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

