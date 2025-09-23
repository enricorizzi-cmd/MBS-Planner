import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Plus, ChevronLeft, ChevronRight } from 'lucide-react';

export function CalendarPage() {
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
              Calendario
            </h1>
            <p className="text-muted-foreground mt-2">
              Visualizzazione calendario eventi e programmi
            </p>
          </div>
          <Button className="btn-neon">
            <Plus className="mr-2 h-4 w-4" />
            Nuovo Evento
          </Button>
        </div>
      </motion.div>

      {/* Calendar Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="card-gaming">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-x-2">
                <Calendar className="h-5 w-5 text-neon-primary" />
                Gennaio 2024
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="icon">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <CardDescription>
              Calendario eventi e programmi del mese
            </CardDescription>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Calendar Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="card-gaming">
          <CardContent className="p-6">
            <div className="grid grid-cols-7 gap-2">
              {/* Days of week */}
              {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map((day) => (
                <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
              
              {/* Calendar days */}
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                <motion.div
                  key={day}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: day * 0.01 }}
                  className={`p-2 min-h-[80px] border border-dark-border rounded-lg hover:border-neon-primary/50 hover:bg-neon-primary/5 transition-all duration-200 ${
                    day === 15 ? 'bg-neon-primary/10 border-neon-primary/50' : ''
                  }`}
                >
                  <div className="text-sm font-medium text-foreground mb-1">{day}</div>
                  {day === 15 && (
                    <div className="space-y-1">
                      <div className="text-xs bg-neon-primary/20 text-neon-primary px-1 py-0.5 rounded">
                        Inizio Programma
                      </div>
                      <div className="text-xs bg-neon-secondary/20 text-neon-secondary px-1 py-0.5 rounded">
                        Meeting
                      </div>
                    </div>
                  )}
                  {day === 20 && (
                    <div className="text-xs bg-neon-success/20 text-neon-success px-1 py-0.5 rounded">
                      Scadenza
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Legend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="card-gaming">
          <CardContent className="p-4">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-neon-primary/20 border border-neon-primary/50 rounded"></div>
                <span className="text-sm text-muted-foreground">Inizio Programma</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-neon-secondary/20 border border-neon-secondary/50 rounded"></div>
                <span className="text-sm text-muted-foreground">Meeting</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-neon-success/20 border border-neon-success/50 rounded"></div>
                <span className="text-sm text-muted-foreground">Scadenza</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

