import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Building2,
  BookOpen
} from 'lucide-react';
import { DispositionStats as Stats } from '@/hooks/useDisposition';

interface DispositionStatsProps {
  stats: Stats;
}

export function DispositionStats({ stats }: DispositionStatsProps) {
  const totalCapacity = stats.totalSeats;
  const occupancyRate = totalCapacity > 0 ? (stats.occupiedSeats / totalCapacity) * 100 : 0;
  const reservationRate = totalCapacity > 0 ? (stats.reservedSeats / totalCapacity) * 100 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Seats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="card-gaming">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-neon-primary/20 rounded-lg">
                <MapPin className="h-5 w-5 text-neon-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Posti Totali</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalSeats}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Occupied Seats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="card-gaming">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-neon-success/20 rounded-lg">
                <CheckCircle className="h-5 w-5 text-neon-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Occupati</p>
                <p className="text-2xl font-bold text-foreground">{stats.occupiedSeats}</p>
                <p className="text-xs text-muted-foreground">
                  {occupancyRate.toFixed(1)}% occupazione
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Reserved Seats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="card-gaming">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-neon-warning/20 rounded-lg">
                <Clock className="h-5 w-5 text-neon-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Riservati</p>
                <p className="text-2xl font-bold text-foreground">{stats.reservedSeats}</p>
                <p className="text-xs text-muted-foreground">
                  {reservationRate.toFixed(1)}% riserve
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Empty Seats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="card-gaming">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-muted/20 rounded-lg">
                <AlertCircle className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Liberi</p>
                <p className="text-2xl font-bold text-foreground">{stats.emptySeats}</p>
                <p className="text-xs text-muted-foreground">
                  {((stats.emptySeats / totalCapacity) * 100).toFixed(1)}% disponibili
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Area Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="md:col-span-2"
      >
        <Card className="card-gaming">
          <CardHeader>
            <CardTitle className="text-lg">Distribuzione per Area</CardTitle>
            <CardDescription>
              Occupazione per area tematica
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(stats.areaStats).map(([area, areaStats]) => (
                <div key={area} className="text-center">
                  <div className={`w-12 h-12 mx-auto mb-2 rounded-lg flex items-center justify-center ${
                    area === 'A' ? 'bg-neon-danger/20' :
                    area === 'B' ? 'bg-neon-primary/20' :
                    'bg-neon-secondary/20'
                  }`}>
                    <span className="text-lg font-bold text-foreground">{area}</span>
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {areaStats.occupied}/{areaStats.total}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {areaStats.reserved} riserve
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Company Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="md:col-span-2"
      >
        <Card className="card-gaming">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-x-2">
              <Building2 className="h-5 w-5 text-neon-primary" />
              Distribuzione per Azienda
            </CardTitle>
            <CardDescription>
              Presenze per azienda partner
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(stats.companyStats)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([company, count]) => (
                  <div key={company} className="flex items-center justify-between">
                    <span className="text-sm text-foreground truncate">{company}</span>
                    <Badge variant="secondary" className="text-xs">
                      {count} studenti
                    </Badge>
                  </div>
                ))}
              {Object.keys(stats.companyStats).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nessuna azienda presente
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Manual Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="md:col-span-2"
      >
        <Card className="card-gaming">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-x-2">
              <BookOpen className="h-5 w-5 text-neon-primary" />
              Distribuzione per Manuale
            </CardTitle>
            <CardDescription>
              Presenze per manuale di studio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(stats.manualStats)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([manual, count]) => (
                  <div key={manual} className="flex items-center justify-between">
                    <span className="text-sm text-foreground truncate">{manual}</span>
                    <Badge variant="secondary" className="text-xs">
                      {count} studenti
                    </Badge>
                  </div>
                ))}
              {Object.keys(stats.manualStats).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nessun manuale presente
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

