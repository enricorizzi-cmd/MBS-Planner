import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Settings, 
  Users, 
  MapPin, 
  RotateCcw,
  CheckCircle
} from 'lucide-react';
import { Layout } from '@/hooks/useDisposition';

interface DispositionControlsProps {
  layout: Layout | null;
  onAddRow: (sessionId: string) => void;
  onChangeLayout: (params: { sessionId: string; seatsPerBlock: number }) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

export function DispositionControls({
  layout,
  onAddRow,
  onChangeLayout,
  onGenerate,
  isGenerating
}: DispositionControlsProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  if (!layout) {
    return (
      <Card className="card-gaming">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">
            Configura il layout per iniziare
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleAddRow = () => {
    if (layout.rows_count >= 12) {
      alert('Numero massimo di righe raggiunto (12)');
      return;
    }
    onAddRow(layout.session_id);
  };

  const handleChangeLayout = (seatsPerBlock: number) => {
    if (seatsPerBlock === layout.seats_per_block) return;
    onChangeLayout({ sessionId: layout.session_id, seatsPerBlock });
  };

  return (
    <Card className="card-gaming">
      <CardHeader>
        <CardTitle className="flex items-center gap-x-2">
          <Settings className="h-5 w-5 text-neon-primary" />
          Controlli Disposizione
        </CardTitle>
        <CardDescription>
          Modifica la geometria della sala e gestisci la disposizione
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Layout Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-neon-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Righe</p>
              <p className="text-sm font-medium">{layout.rows_count}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-neon-secondary" />
            <div>
              <p className="text-xs text-muted-foreground">Colonne</p>
              <p className="text-sm font-medium">{layout.columns_count}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Settings className="h-4 w-4 text-neon-success" />
            <div>
              <p className="text-xs text-muted-foreground">Posti/Blocco</p>
              <p className="text-sm font-medium">{layout.seats_per_block}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-neon-warning" />
            <div>
              <p className="text-xs text-muted-foreground">Capienza</p>
              <p className="text-sm font-medium">{layout.rows_count * layout.columns_count}</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddRow}
            disabled={layout.rows_count >= 12}
          >
            <Plus className="mr-2 h-4 w-4" />
            Aggiungi Riga
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <Settings className="mr-2 h-4 w-4" />
            {showAdvanced ? 'Nascondi' : 'Avanzate'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onGenerate}
            disabled={isGenerating}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            {isGenerating ? 'Generazione...' : 'Rigenera'}
          </Button>
        </div>

        {/* Advanced Controls */}
        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 pt-4 border-t border-dark-border"
          >
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">
                Configurazione Posti per Blocco
              </h4>
              <div className="flex space-x-2">
                <Button
                  variant={layout.seats_per_block === 3 ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleChangeLayout(3)}
                >
                  3 Posti/Blocco
                </Button>
                <Button
                  variant={layout.seats_per_block === 4 ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleChangeLayout(4)}
                >
                  4 Posti/Blocco
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Cambiando la configurazione, la geometria verrà ricalcolata automaticamente
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">
                Area Mapping
              </h4>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-neon-danger/20 border border-neon-danger/50 rounded"></div>
                  <span className="text-muted-foreground">Area A: 1-{layout.seats_per_block}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-neon-primary/20 border border-neon-primary/50 rounded"></div>
                  <span className="text-muted-foreground">Area B: {layout.seats_per_block + 1}-{layout.seats_per_block * 2}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-neon-secondary/20 border border-neon-secondary/50 rounded"></div>
                  <span className="text-muted-foreground">Area C: {layout.seats_per_block * 2 + 1}-{layout.columns_count}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Status Badges */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="text-xs">
            <CheckCircle className="mr-1 h-3 w-3" />
            Layout Configurato
          </Badge>
          <Badge variant="secondary" className="text-xs">
            <Users className="mr-1 h-3 w-3" />
            {layout.rows_count} Righe
          </Badge>
          <Badge variant="secondary" className="text-xs">
            <MapPin className="mr-1 h-3 w-3" />
            {layout.columns_count} Colonne
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

