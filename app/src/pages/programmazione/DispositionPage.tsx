import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Settings, 
  Download,
  Users,
  MapPin,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { DispositionGrid } from '@/components/disposition/DispositionGrid';
import { DispositionControls } from '@/components/disposition/DispositionControls';
import { DispositionStats } from '@/components/disposition/DispositionStats';
import { useDisposition } from '@/hooks/useDisposition';

export function DispositionPage() {
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<1 | 2>(1);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const {
    sessions,
    currentLayout,
    seats,
    bookings,
    stats,
    generateDisposition,
    updateSeat,
    addRow,
    changeLayout,
    printDisposition,
    loading
  } = useDisposition(selectedSession, selectedDay);

  const handleGenerateDisposition = async () => {
    if (!selectedSession) return;
    
    setIsGenerating(true);
    try {
      await generateDisposition(selectedSession);
    } catch (error) {
      console.error('Error generating disposition:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    if (!selectedSession) return;
    printDisposition(selectedSession, selectedDay);
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
              Disposizione Classi
            </h1>
            <p className="text-muted-foreground mt-2">
              Gestione disposizioni automatiche delle classi MBS
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={handlePrint} disabled={!selectedSession}>
              <Download className="mr-2 h-4 w-4" />
              Stampa A3
            </Button>
            <Button className="btn-neon" onClick={handleGenerateDisposition} disabled={!selectedSession || isGenerating}>
              <Settings className="mr-2 h-4 w-4" />
              {isGenerating ? 'Generazione...' : 'Genera Disposizione'}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Session Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="card-gaming">
          <CardHeader>
            <CardTitle className="flex items-center gap-x-2">
              <Calendar className="h-5 w-5 text-neon-primary" />
              Selezione Sessione
            </CardTitle>
            <CardDescription>
              Scegli la classe mensile per cui generare la disposizione
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sessions.map((session) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card 
                    className={`cursor-pointer transition-all duration-200 ${
                      selectedSession === session.id 
                        ? 'border-neon-primary bg-neon-primary/10' 
                        : 'border-dark-border hover:border-neon-primary/50'
                    }`}
                    onClick={() => setSelectedSession(session.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-foreground">
                          {session.month}/{session.year}
                        </h3>
                        <div className="flex items-center space-x-1">
                          {session.status === 'active' && <CheckCircle className="h-4 w-4 text-neon-success" />}
                          {session.status === 'draft' && <AlertCircle className="h-4 w-4 text-neon-warning" />}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {session.location}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Users className="h-3 w-3" />
                          <span>{session.estimated_attendance || 0} presenze</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span>{session.days?.length || 0} giorni</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {selectedSession && (
        <>
          {/* Day Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="card-gaming">
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-foreground">Giorno:</span>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant={selectedDay === 1 ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedDay(1)}
                    >
                      D1
                    </Button>
                    <Button
                      variant={selectedDay === 2 ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedDay(2)}
                    >
                      D2
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <DispositionStats stats={stats} />
          </motion.div>

          {/* Controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <DispositionControls
              layout={currentLayout || null}
              onAddRow={addRow}
              onChangeLayout={changeLayout}
              onGenerate={handleGenerateDisposition}
              isGenerating={isGenerating}
            />
          </motion.div>

          {/* Disposition Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <DispositionGrid
              seats={seats}
              bookings={bookings}
              layout={currentLayout || null}
              onSeatUpdate={updateSeat}
              loading={loading}
            />
          </motion.div>
        </>
      )}
    </div>
  );
}