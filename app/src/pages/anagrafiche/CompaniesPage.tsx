import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Plus, 
  Search, 
  Users,
  Mail,
  Phone,
  MapPin,
  Edit,
  UserPlus,
  Crown,
  Briefcase,
  Euro,
  TrendingUp,
  TrendingDown,
  AlertTriangle
} from 'lucide-react';
import { useCompanies } from '@/hooks/useCompanies';
import { useRevenues } from '@/hooks/useRevenues';
import { RevenueModal } from '@/components/revenue/RevenueModal';

export function CompaniesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [isRevenueModalOpen, setIsRevenueModalOpen] = useState(false);
  const [isNewCompanyModalOpen, setIsNewCompanyModalOpen] = useState(false);
  
  const {
    companies,
    companyStudents
  } = useCompanies();

  const {
    lastMonthData
  } = useRevenues(selectedCompany || '');

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedCompanyData = selectedCompany 
    ? companies.find(c => c.id === selectedCompany)
    : null;

  const selectedCompanyStudents = selectedCompany 
    ? companyStudents[selectedCompany] || []
    : [];

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
              Aziende
            </h1>
            <p className="text-muted-foreground mt-2">
              Gestione anagrafica aziende partner
            </p>
          </div>
          <Button 
            className="btn-neon"
            onClick={() => setIsNewCompanyModalOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuova Azienda
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
                  placeholder="Cerca aziende..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Companies List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="card-gaming">
            <CardHeader>
              <CardTitle className="flex items-center gap-x-2">
                <Building2 className="h-5 w-5 text-neon-primary" />
                Elenco Aziende
              </CardTitle>
              <CardDescription>
                Lista completa delle aziende partner
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredCompanies.map((company, index) => (
                  <motion.div
                    key={company.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                      selectedCompany === company.id
                        ? 'border-neon-primary bg-neon-primary/10'
                        : 'border-dark-border hover:border-neon-primary/50 hover:bg-neon-primary/5'
                    }`}
                    onClick={() => setSelectedCompany(company.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-neon-secondary/20 rounded-full flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-neon-secondary" />
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground">{company.name}</h3>
                          <p className="text-sm text-muted-foreground">{company.address}</p>
                          <p className="text-xs text-muted-foreground">
                            {company.phone} • {company.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm font-medium text-foreground">
                            {selectedCompanyStudents.length}
                          </p>
                          <p className="text-xs text-muted-foreground">studenti</p>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                {filteredCompanies.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      Nessuna azienda trovata
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Company Details and Students */}
        {selectedCompanyData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="card-gaming">
              <CardHeader>
                <CardTitle className="flex items-center gap-x-2">
                  <Building2 className="h-5 w-5 text-neon-primary" />
                  {selectedCompanyData.name}
                </CardTitle>
                <CardDescription>
                  Dettagli azienda e studenti assegnati
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Company Info */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">{selectedCompanyData.address}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">{selectedCompanyData.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">{selectedCompanyData.email}</span>
                  </div>
                </div>

                {/* Revenue Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-medium text-foreground flex items-center gap-x-2">
                      <Euro className="h-5 w-5 text-neon-primary" />
                      Fatturati
                    </h4>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsRevenueModalOpen(true)}
                    >
                      <Euro className="mr-2 h-4 w-4" />
                      Gestisci Fatturati
                    </Button>
                  </div>

                  {false ? (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground text-sm">Caricamento...</p>
                    </div>
                  ) : lastMonthData ? (
                    <div className="p-4 rounded-lg border border-dark-border bg-muted/20">
                      {lastMonthData.is_missing ? (
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-neon-warning/20 rounded-full flex items-center justify-center">
                            <AlertTriangle className="h-4 w-4 text-neon-warning" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              Fatturato mancante
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(2024, lastMonthData.month - 1).toLocaleDateString('it-IT', { month: 'long' })} {lastMonthData.year}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-neon-success/20 rounded-full flex items-center justify-center">
                              <Euro className="h-4 w-4 text-neon-success" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {new Date(2024, lastMonthData.month - 1).toLocaleDateString('it-IT', { month: 'long' })} {lastMonthData.year}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                €{lastMonthData.amount?.toLocaleString('it-IT', { minimumFractionDigits: 2 }) || 'N/A'}
                              </p>
                            </div>
                          </div>
                          {lastMonthData.increment_percent !== null && (
                            <Badge 
                              variant={lastMonthData.increment_percent >= 0 ? 'success' : 'destructive'}
                              className="text-xs"
                            >
                              {lastMonthData.increment_percent >= 0 ? (
                                <TrendingUp className="mr-1 h-3 w-3" />
                              ) : (
                                <TrendingDown className="mr-1 h-3 w-3" />
                              )}
                              {Math.abs(lastMonthData.increment_percent).toFixed(1)}%
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground text-sm">
                        Nessun dato fatturato disponibile
                      </p>
                    </div>
                  )}
                </div>

                {/* Students Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-medium text-foreground flex items-center gap-x-2">
                      <Users className="h-5 w-5 text-neon-primary" />
                      Studenti Assegnati
                    </h4>
                    <Button variant="outline" size="sm">
                      <UserPlus className="mr-2 h-4 w-4" />
                      Aggiungi Studente
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {selectedCompanyStudents.map((student, index) => (
                      <motion.div
                        key={student.student_id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="p-3 rounded-lg border border-dark-border bg-muted/20"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-neon-primary/20 rounded-full flex items-center justify-center">
                              {student.is_primary ? (
                                <Crown className="h-4 w-4 text-neon-warning" />
                              ) : (
                                <Briefcase className="h-4 w-4 text-neon-primary" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {student.student_name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {student.student_email}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge 
                              variant={student.is_primary ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {student.role}
                            </Badge>
                            {student.is_primary && (
                              <Badge variant="outline" className="text-xs">
                                Principale
                              </Badge>
                            )}
                            <Button variant="ghost" size="sm">
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    
                    {selectedCompanyStudents.length === 0 && (
                      <div className="text-center py-6">
                        <p className="text-muted-foreground text-sm">
                          Nessuno studente assegnato a questa azienda
                        </p>
                        <Button variant="outline" size="sm" className="mt-2">
                          <UserPlus className="mr-2 h-4 w-4" />
                          Assegna Primo Studente
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Revenue Modal */}
      {selectedCompanyData && (
        <RevenueModal
          isOpen={isRevenueModalOpen}
          onClose={() => setIsRevenueModalOpen(false)}
          companyId={selectedCompanyData.id}
          companyName={selectedCompanyData.name}
        />
      )}

      {/* New Company Modal */}
      {isNewCompanyModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-background border border-border rounded-xl p-6 w-full max-w-md"
          >
            <h2 className="text-xl font-bold text-foreground mb-4">Nuova Azienda</h2>
            <p className="text-muted-foreground mb-4">
              Funzionalità in sviluppo. Il form per creare una nuova azienda sarà disponibile presto.
            </p>
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setIsNewCompanyModalOpen(false)}
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
