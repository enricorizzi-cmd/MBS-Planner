import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Users,
  Mail,
  Phone,
  Building2,
  Edit,
  PlusCircle,
  Crown,
  Euro,
} from 'lucide-react';
import { useStudents } from '@/hooks/useStudents';
import { useRevenues } from '@/hooks/useRevenues';
import { RevenueModal } from '@/components/revenue/RevenueModal';

export function StudentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [isRevenueModalOpen, setIsRevenueModalOpen] = useState(false);
  const [selectedCompanyForRevenue, setSelectedCompanyForRevenue] = useState<{id: string, name: string} | null>(null);
  const [isNewStudentModalOpen, setIsNewStudentModalOpen] = useState(false);
  
  const {
    students,
    studentCompanies
  } = useStudents();

  const {
  } = useRevenues(selectedCompanyForRevenue?.id || '');

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedStudentData = selectedStudent 
    ? students.find(s => s.id === selectedStudent)
    : null;

  const selectedStudentCompanies = selectedStudent 
    ? studentCompanies[selectedStudent] || []
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
              Studenti
            </h1>
            <p className="text-muted-foreground mt-2">
              Gestione anagrafica studenti
            </p>
          </div>
          <Button 
            className="btn-neon"
            onClick={() => setIsNewStudentModalOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuovo Studente
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
                  placeholder="Cerca studenti..."
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
        {/* Students List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="card-gaming">
            <CardHeader>
              <CardTitle className="flex items-center gap-x-2">
                <Users className="h-5 w-5 text-neon-primary" />
                Elenco Studenti
              </CardTitle>
              <CardDescription>
                Lista completa degli studenti registrati
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredStudents.map((student, index) => (
                  <motion.div
                    key={student.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                      selectedStudent === student.id
                        ? 'border-neon-primary bg-neon-primary/10'
                        : 'border-dark-border hover:border-neon-primary/50 hover:bg-neon-primary/5'
                    }`}
                    onClick={() => setSelectedStudent(student.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-neon-primary/20 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-neon-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground">{student.name}</h3>
                          <p className="text-sm text-muted-foreground">{student.email}</p>
                          <p className="text-xs text-muted-foreground">{student.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm font-medium text-foreground">
                            {selectedStudentCompanies.length}
                          </p>
                          <p className="text-xs text-muted-foreground">aziende</p>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                {filteredStudents.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      Nessuno studente trovato
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Student Details and Companies */}
        {selectedStudentData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="card-gaming">
              <CardHeader>
                <CardTitle className="flex items-center gap-x-2">
                  <Users className="h-5 w-5 text-neon-primary" />
                  {selectedStudentData.name}
                </CardTitle>
                <CardDescription>
                  Dettagli studente e aziende assegnate
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Student Info */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">{selectedStudentData.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">{selectedStudentData.phone}</span>
                  </div>
                </div>

                {/* Companies Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-medium text-foreground flex items-center gap-x-2">
                      <Building2 className="h-5 w-5 text-neon-primary" />
                      Aziende Assegnate
                    </h4>
                    <Button variant="outline" size="sm">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Aggiungi Azienda
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {selectedStudentCompanies.map((company, index) => (
                      <motion.div
                        key={company.company_id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="p-3 rounded-lg border border-dark-border bg-muted/20"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-neon-secondary/20 rounded-full flex items-center justify-center">
                              {company.is_primary ? (
                                <Crown className="h-4 w-4 text-neon-warning" />
                              ) : (
                                <Building2 className="h-4 w-4 text-neon-secondary" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {company.company_name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {company.start_date && `Dal ${new Date(company.start_date).toLocaleDateString()}`}
                                {company.end_date && ` al ${new Date(company.end_date).toLocaleDateString()}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge 
                              variant={company.is_primary ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {company.role}
                            </Badge>
                            {company.is_primary && (
                              <Badge variant="outline" className="text-xs">
                                Principale
                              </Badge>
                            )}
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setSelectedCompanyForRevenue({ id: company.company_id, name: company.company_name });
                                setIsRevenueModalOpen(true);
                              }}
                            >
                              <Euro className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    
                    {selectedStudentCompanies.length === 0 && (
                      <div className="text-center py-6">
                        <p className="text-muted-foreground text-sm">
                          Nessuna azienda assegnata a questo studente
                        </p>
                        <Button variant="outline" size="sm" className="mt-2">
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Assegna Prima Azienda
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
      {selectedCompanyForRevenue && (
        <RevenueModal
          isOpen={isRevenueModalOpen}
          onClose={() => {
            setIsRevenueModalOpen(false);
            setSelectedCompanyForRevenue(null);
          }}
          companyId={selectedCompanyForRevenue.id}
          companyName={selectedCompanyForRevenue.name}
        />
      )}

      {/* New Student Modal */}
      {isNewStudentModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-background border border-border rounded-xl p-6 w-full max-w-md"
          >
            <h2 className="text-xl font-bold text-foreground mb-4">Nuovo Studente</h2>
            <p className="text-muted-foreground mb-4">
              Funzionalità in sviluppo. Il form per creare un nuovo studente sarà disponibile presto.
            </p>
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setIsNewStudentModalOpen(false)}
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
