import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  List, 
  Plus, 
  Search, 
  Calendar,
  Users,
  BookOpen,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useBookings } from '@/hooks/useBookings';

export function ListPage() {
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArea, setSelectedArea] = useState<string>('all');
  
  const {
    sessions,
    bookings
  } = useBookings(selectedSession);

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.student?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.manual?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesArea = selectedArea === 'all' || booking.manual?.area === selectedArea;
    return matchesSearch && matchesArea;
  });

  const stats = {
    total: bookings.length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    pending: bookings.filter(b => b.status === 'pending').length,
    byArea: {
      A: bookings.filter(b => b.manual?.area === 'A').length,
      B: bookings.filter(b => b.manual?.area === 'B').length,
      C: bookings.filter(b => b.manual?.area === 'C').length,
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
              Lista Prenotazioni
            </h1>
            <p className="text-muted-foreground mt-2">
              Gestione prenotazioni studenti per le classi MBS
            </p>
          </div>
          <Button className="btn-neon">
            <Plus className="mr-2 h-4 w-4" />
            Nuova Prenotazione
          </Button>
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
              Scegli la classe mensile per visualizzare le prenotazioni
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
                          <Calendar className="h-3 w-3" />
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
          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="card-gaming">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-neon-primary/20 rounded-lg">
                      <Users className="h-5 w-5 text-neon-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Totali</p>
                      <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-gaming">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-neon-success/20 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-neon-success" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Confermate</p>
                      <p className="text-2xl font-bold text-foreground">{stats.confirmed}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-gaming">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-neon-warning/20 rounded-lg">
                      <Clock className="h-5 w-5 text-neon-warning" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">In Attesa</p>
                      <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-gaming">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-neon-secondary/20 rounded-lg">
                      <BookOpen className="h-5 w-5 text-neon-secondary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Aree</p>
                      <p className="text-2xl font-bold text-foreground">
                        {Object.values(stats.byArea).reduce((a, b) => a + b, 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="card-gaming">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Cerca studenti o manuali..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">Area:</span>
                    <select
                      value={selectedArea}
                      onChange={(e) => setSelectedArea(e.target.value)}
                      className="px-3 py-2 bg-background border border-input rounded-lg text-sm"
                    >
                      <option value="all">Tutte</option>
                      <option value="A">Area A</option>
                      <option value="B">Area B</option>
                      <option value="C">Area C</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Bookings List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="card-gaming">
              <CardHeader>
                <CardTitle className="flex items-center gap-x-2">
                  <List className="h-5 w-5 text-neon-primary" />
                  Elenco Prenotazioni
                </CardTitle>
                <CardDescription>
                  Lista completa delle prenotazioni per la sessione selezionata
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredBookings.map((booking, index) => (
                    <motion.div
                      key={booking.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="p-4 rounded-xl border border-dark-border hover:border-neon-primary/50 hover:bg-neon-primary/5 transition-all duration-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4">
                            <div>
                              <h3 className="font-medium text-foreground">
                                {booking.student?.name}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {booking.company_reference?.name || 'Nessuna azienda'}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge 
                                variant={booking.manual?.area === 'A' ? 'destructive' : 
                                        booking.manual?.area === 'B' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                Area {booking.manual?.area}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {booking.manual?.name}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                            <span>Giorno: {booking.session_day_id}</span>
                            {booking.keep_seat_between_days && (
                              <span className="text-neon-warning">Mantieni posto</span>
                            )}
                            {booking.tags.length > 0 && (
                              <div className="flex space-x-1">
                                {booking.tags.map((tag) => (
                                  <Badge key={tag} variant="secondary" className="text-xs px-1 py-0">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            booking.status === 'confirmed' 
                              ? 'bg-neon-success/20 text-neon-success' 
                              : booking.status === 'pending'
                              ? 'bg-neon-warning/20 text-neon-warning'
                              : 'bg-neon-danger/20 text-neon-danger'
                          }`}>
                            {booking.status}
                          </span>
                          <Button variant="ghost" size="sm">
                            Modifica
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  
                  {filteredBookings.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        Nessuna prenotazione trovata
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </div>
  );
}
