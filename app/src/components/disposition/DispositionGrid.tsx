import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Lock, 
  User, 
  CheckCircle,
  Clock
} from 'lucide-react';
import { Seat, Layout } from '@/hooks/useDisposition';
import { cn } from '@/lib/utils';

interface DispositionGridProps {
  seats: Seat[];
  layout: Layout | null;
  onSeatUpdate: (params: { seatId: string; updates: Partial<Seat> }) => void;
}

export function DispositionGrid({ 
  seats, 
  layout, 
  onSeatUpdate
}: DispositionGridProps) {
  const [draggedSeat, setDraggedSeat] = useState<Seat | null>(null);
  const [hoveredSeat, setHoveredSeat] = useState<string | null>(null);

  if (!layout) {
    return (
      <Card className="card-gaming">
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">
            Nessun layout configurato per questa sessione
          </p>
        </CardContent>
      </Card>
    );
  }

  // Create grid structure
  const rows = Array.from({ length: layout.rows_count }, (_, i) => 
    String.fromCharCode(97 + i) // a, b, c, ...
  );

  const columns = Array.from({ length: layout.columns_count }, (_, i) => i + 1);

  // Get seat by position
  const getSeatByPosition = (row: string, column: number) => {
    return seats.find(s => s.row_letter === row && s.column_number === column);
  };

  // Get area from column
  const getAreaFromColumn = (column: number) => {
    const seatsPerBlock = layout.seats_per_block;
    if (column <= seatsPerBlock) return 'A';
    if (column <= seatsPerBlock * 2) return 'B';
    return 'C';
  };

  // Get area color
  const getAreaColor = (area: string) => {
    switch (area) {
      case 'A': return 'bg-neon-danger/20 border-neon-danger/50';
      case 'B': return 'bg-neon-primary/20 border-neon-primary/50';
      case 'C': return 'bg-neon-secondary/20 border-neon-secondary/50';
      default: return 'bg-muted/20 border-muted/50';
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'occupied': return 'bg-neon-success/20 border-neon-success/50';
      case 'reserved': return 'bg-neon-warning/20 border-neon-warning/50';
      case 'locked': return 'bg-neon-danger/20 border-neon-danger/50';
      default: return 'bg-muted/20 border-muted/50';
    }
  };

  // Handle seat click
  const handleSeatClick = (seat: Seat) => {
    if (seat.is_locked) return;
    
    // Toggle lock status
    onSeatUpdate({
      seatId: seat.id,
      updates: { is_locked: !seat.is_locked }
    });
  };

  // Handle drag start
  const handleDragStart = (seat: Seat) => {
    if (seat.is_locked) return;
    setDraggedSeat(seat);
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent, targetSeat: Seat) => {
    e.preventDefault();
    
    if (!draggedSeat || targetSeat.is_locked) return;
    
    // Swap seats
    onSeatUpdate({
      seatId: draggedSeat.id,
      updates: { 
        row_letter: targetSeat.row_letter,
        column_number: targetSeat.column_number,
        area: targetSeat.area
      }
    });
    
    onSeatUpdate({
      seatId: targetSeat.id,
      updates: { 
        row_letter: draggedSeat.row_letter,
        column_number: draggedSeat.column_number,
        area: draggedSeat.area
      }
    });
    
    setDraggedSeat(null);
  };

  return (
    <Card className="card-gaming">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header with column numbers */}
          <div className="flex items-center space-x-2">
            <div className="w-12 h-8 flex items-center justify-center text-xs font-medium text-muted-foreground">
              Riga
            </div>
            {columns.map((col) => (
              <div
                key={col}
                className="w-16 h-8 flex items-center justify-center text-xs font-medium text-muted-foreground border border-dark-border rounded"
              >
                {col}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="space-y-2">
            {rows.map((row) => (
              <div key={row} className="flex items-center space-x-2">
                {/* Row letter */}
                <div className="w-12 h-16 flex items-center justify-center text-sm font-medium text-foreground border border-dark-border rounded">
                  {row.toUpperCase()}
                </div>

                {/* Seats */}
                {columns.map((col) => {
                  const seat = getSeatByPosition(row, col);
                  const area = getAreaFromColumn(col);
                  
                  if (!seat) {
                    return (
                      <div
                        key={col}
                        className="w-16 h-16 border-2 border-dashed border-muted/30 rounded flex items-center justify-center"
                      >
                        <span className="text-xs text-muted-foreground">-</span>
                      </div>
                    );
                  }

                  const isOccupied = seat.status === 'occupied';
                  const isReserved = seat.status === 'reserved';
                  const isLocked = seat.is_locked;
                  const isHovered = hoveredSeat === seat.id;

                  return (
                    <motion.div
                      key={col}
                      className={cn(
                        'w-16 h-16 border-2 rounded cursor-pointer transition-all duration-200 flex flex-col items-center justify-center p-1',
                        getAreaColor(area),
                        getStatusColor(seat.status),
                        isHovered && 'scale-105 shadow-lg',
                        isLocked && 'opacity-75'
                      )}
                      draggable={!isLocked}
                      onDragStart={() => handleDragStart(seat)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, seat)}
                      onClick={() => handleSeatClick(seat)}
                      onMouseEnter={() => setHoveredSeat(seat.id)}
                      onMouseLeave={() => setHoveredSeat(null)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {/* Seat content */}
                      {isOccupied && seat.booking ? (
                        <div className="w-full h-full flex flex-col items-center justify-center space-y-1">
                          <div className="text-xs font-medium text-foreground text-center leading-tight">
                            {seat.booking.student?.name.split(' ')[0]}
                          </div>
                          <div className="text-xs text-muted-foreground text-center">
                            {seat.booking.manual?.name}
                          </div>
                          {seat.booking.tags.length > 0 && (
                            <div className="flex space-x-1">
                              {seat.booking.tags.map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs px-1 py-0">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : isReserved ? (
                        <div className="w-full h-full flex flex-col items-center justify-center space-y-1">
                          <div className="text-xs font-medium text-foreground text-center">
                            Riservato
                          </div>
                          <div className="text-xs text-muted-foreground text-center">
                            {seat.reservation_student?.name.split(' ')[0]}
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">-</span>
                        </div>
                      )}

                      {/* Lock indicator */}
                      {isLocked && (
                        <div className="absolute top-1 right-1">
                          <Lock className="h-3 w-3 text-neon-danger" />
                        </div>
                      )}

                      {/* Status indicator */}
                      <div className="absolute bottom-1 left-1">
                        {isOccupied && <CheckCircle className="h-3 w-3 text-neon-success" />}
                        {isReserved && <Clock className="h-3 w-3 text-neon-warning" />}
                        {seat.status === 'empty' && <User className="h-3 w-3 text-muted-foreground" />}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-6 p-4 bg-muted/20 rounded-lg">
            <h4 className="text-sm font-medium text-foreground mb-3">Legenda</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-neon-danger/20 border border-neon-danger/50 rounded"></div>
                <span className="text-muted-foreground">Area A</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-neon-primary/20 border border-neon-primary/50 rounded"></div>
                <span className="text-muted-foreground">Area B</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-neon-secondary/20 border border-neon-secondary/50 rounded"></div>
                <span className="text-muted-foreground">Area C</span>
              </div>
              <div className="flex items-center space-x-2">
                <Lock className="h-4 w-4 text-neon-danger" />
                <span className="text-muted-foreground">Bloccato</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

