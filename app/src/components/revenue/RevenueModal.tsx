import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  Plus, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  Calendar,
  Euro,
  BarChart3
} from 'lucide-react';
import { useRevenues } from '@/hooks/useRevenues';
import { RevenueChart } from './RevenueChart';
import { cn } from '@/lib/utils';

interface RevenueModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  companyName: string;
}

export function RevenueModal({ isOpen, onClose, companyId, companyName }: RevenueModalProps) {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [newMonth, setNewMonth] = useState<number>(new Date().getMonth() + 1);
  const [newYear, setNewYear] = useState<number>(new Date().getFullYear());
  const [newAmount, setNewAmount] = useState<string>('');
  const [newNotes, setNewNotes] = useState<string>('');

  const {
    revenues,
    monthlyData,
    annualData,
    lastMonthData,
    loading,
    createRevenue,
    updateRevenue,
    deleteRevenue
  } = useRevenues(companyId);

  const availableYears = Array.from(new Set(revenues.map(r => r.year))).sort((a, b) => b - a);
  const currentYear = new Date().getFullYear();

  const handleAddRevenue = async () => {
    if (!newAmount || !newMonth || !newYear) return;

    try {
      await createRevenue({
        company_id: companyId,
        month: newMonth,
        year: newYear,
        amount: parseFloat(newAmount),
        notes: newNotes || undefined
      });

      // Reset form
      setNewAmount('');
      setNewNotes('');
      setNewMonth(new Date().getMonth() + 1);
      setNewYear(new Date().getFullYear());
    } catch (error) {
      console.error('Error adding revenue:', error);
    }
  };

  const handleDeleteRevenue = async (id: string) => {
    if (confirm('Sei sicuro di voler eliminare questo fatturato?')) {
      try {
        await deleteRevenue(id);
      } catch (error) {
        console.error('Error deleting revenue:', error);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-background rounded-xl border border-dark-border w-full max-w-6xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-border">
          <div>
            <h2 className="text-2xl font-display font-bold text-neon-primary">
              Fatturati - {companyName}
            </h2>
            <p className="text-muted-foreground mt-1">
              Gestione fatturati mensili e analisi performance
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - List and Form */}
            <div className="space-y-6">
              {/* Add New Revenue Form */}
              <Card className="card-gaming">
                <CardHeader>
                  <CardTitle className="flex items-center gap-x-2">
                    <Plus className="h-5 w-5 text-neon-primary" />
                    Aggiungi Fatturato
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Mese
                      </label>
                      <select
                        value={newMonth}
                        onChange={(e) => setNewMonth(parseInt(e.target.value))}
                        className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm"
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                          <option key={month} value={month}>
                            {new Date(2024, month - 1).toLocaleDateString('it-IT', { month: 'long' })}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Anno
                      </label>
                      <select
                        value={newYear}
                        onChange={(e) => setNewYear(parseInt(e.target.value))}
                        className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm"
                      >
                        {Array.from({ length: 5 }, (_, i) => currentYear - 2 + i).map(year => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Importo (€)
                    </label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Note (opzionale)
                    </label>
                    <Input
                      placeholder="Note aggiuntive..."
                      value={newNotes}
                      onChange={(e) => setNewNotes(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={handleAddRevenue}
                    disabled={!newAmount || !newMonth || !newYear}
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Aggiungi Fatturato
                  </Button>
                </CardContent>
              </Card>

              {/* Revenues List */}
              <Card className="card-gaming">
                <CardHeader>
                  <CardTitle className="flex items-center gap-x-2">
                    <Calendar className="h-5 w-5 text-neon-primary" />
                    Fatturati Mensili
                  </CardTitle>
                  <CardDescription>
                    Lista completa dei fatturati per {selectedYear}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {monthlyData
                      .filter(item => item.year === selectedYear)
                      .sort((a, b) => a.month - b.month)
                      .map((item, index) => (
                        <motion.div
                          key={`${item.year}-${item.month}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          className="p-3 rounded-lg border border-dark-border bg-muted/20"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-neon-primary/20 rounded-full flex items-center justify-center">
                                <span className="text-xs font-medium text-neon-primary">
                                  {item.month}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-foreground">
                                  {new Date(2024, item.month - 1).toLocaleDateString('it-IT', { month: 'long' })} {item.year}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  €{item.amount?.toLocaleString('it-IT', { minimumFractionDigits: 2 }) || 'N/A'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {item.increment_percent !== null && (
                                <Badge 
                                  variant={item.increment_percent >= 0 ? 'success' : 'destructive'}
                                  className="text-xs"
                                >
                                  {item.increment_percent >= 0 ? (
                                    <TrendingUp className="mr-1 h-3 w-3" />
                                  ) : (
                                    <TrendingDown className="mr-1 h-3 w-3" />
                                  )}
                                  {Math.abs(item.increment_percent).toFixed(1)}%
                                </Badge>
                              )}
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDeleteRevenue(`${item.year}-${item.month}`)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    
                    {monthlyData.filter(item => item.year === selectedYear).length === 0 && (
                      <div className="text-center py-6">
                        <p className="text-muted-foreground text-sm">
                          Nessun fatturato per {selectedYear}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Chart and Annual Summary */}
            <div className="space-y-6">
              {/* Chart */}
              <Card className="card-gaming">
                <CardHeader>
                  <CardTitle className="flex items-center gap-x-2">
                    <BarChart3 className="h-5 w-5 text-neon-primary" />
                    Andamento Fatturati
                  </CardTitle>
                  <CardDescription>
                    Grafico a linea dei fatturati mensili
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RevenueChart data={monthlyData} />
                </CardContent>
              </Card>

              {/* Annual Summary */}
              <Card className="card-gaming">
                <CardHeader>
                  <CardTitle className="flex items-center gap-x-2">
                    <Euro className="h-5 w-5 text-neon-primary" />
                    Riepilogo Annuale
                  </CardTitle>
                  <CardDescription>
                    Fatturati totali per anno con incrementi
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {annualData.map((item, index) => (
                      <motion.div
                        key={item.year}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="p-4 rounded-lg border border-dark-border bg-muted/20"
                      >
                        <div className="text-center">
                          <h4 className="text-lg font-bold text-foreground mb-2">
                            {item.year}
                          </h4>
                          <p className="text-2xl font-bold text-neon-primary mb-2">
                            €{item.total_amount?.toLocaleString('it-IT', { minimumFractionDigits: 2 }) || '0.00'}
                          </p>
                          {item.year === currentYear ? (
                            // YTD increment for current year
                            item.ytd_increment_percent !== null && (
                              <Badge 
                                variant={item.ytd_increment_percent >= 0 ? 'success' : 'destructive'}
                                className="text-xs"
                              >
                                {item.ytd_increment_percent >= 0 ? (
                                  <TrendingUp className="mr-1 h-3 w-3" />
                                ) : (
                                  <TrendingDown className="mr-1 h-3 w-3" />
                                )}
                                YTD {Math.abs(item.ytd_increment_percent).toFixed(1)}%
                              </Badge>
                            )
                          ) : (
                            // Year-over-year increment for past years
                            item.increment_percent !== null && (
                              <Badge 
                                variant={item.increment_percent >= 0 ? 'success' : 'destructive'}
                                className="text-xs"
                              >
                                {item.increment_percent >= 0 ? (
                                  <TrendingUp className="mr-1 h-3 w-3" />
                                ) : (
                                  <TrendingDown className="mr-1 h-3 w-3" />
                                )}
                                {Math.abs(item.increment_percent).toFixed(1)}%
                              </Badge>
                            )
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

