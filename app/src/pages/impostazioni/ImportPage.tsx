import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Download, FileSpreadsheet, CheckCircle, XCircle, AlertCircle, Database } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface ImportResult {
  success: boolean;
  message: string;
  data: {
    partners: { created: number; updated: number; errors: number };
    companies: { created: number; updated: number; errors: number };
    students: { created: number; updated: number; errors: number };
    supervisors: { created: number; updated: number; errors: number };
  };
  errors: string[];
}

export function ImportPage() {
  const { user, session } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [updateExisting, setUpdateExisting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('skipDuplicates', skipDuplicates.toString());
      formData.append('updateExisting', updateExisting.toString());

      const response = await fetch('/api/import/excel', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Errore durante l\'import');
      }

      setResult(data);
    } catch (error) {
      console.error('Import error:', error);
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Errore durante l\'import',
        data: {
          partners: { created: 0, updated: 0, errors: 0 },
          companies: { created: 0, updated: 0, errors: 0 },
          students: { created: 0, updated: 0, errors: 0 },
          supervisors: { created: 0, updated: 0, errors: 0 },
        },
        errors: [error instanceof Error ? error.message : 'Errore sconosciuto'],
      });
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await fetch('/api/import/template', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Errore durante il download del template');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'template_import.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      alert('Errore durante il download del template');
    }
  };

  const resetForm = () => {
    setFile(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
              Import Dati
            </h1>
            <p className="text-muted-foreground mt-2">
              Importa dati da file Excel nel sistema
            </p>
          </div>
        </div>
      </motion.div>

      {/* Upload Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="card-gaming">
          <CardHeader>
            <CardTitle className="flex items-center gap-x-2">
              <Upload className="h-5 w-5 text-neon-primary" />
              Carica File Excel
            </CardTitle>
            <CardDescription>
              Seleziona un file Excel (.xlsx) per importare i dati
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file-upload">File Excel</Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  ref={fileInputRef}
                />
                {file && (
                  <div className="flex items-center gap-x-2 text-sm text-muted-foreground">
                    <FileSpreadsheet className="h-4 w-4" />
                    <span>{file.name}</span>
                    <span>({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="skip-duplicates"
                    checked={skipDuplicates}
                    onChange={(e) => setSkipDuplicates(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="skip-duplicates">Salta duplicati</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="update-existing"
                    checked={updateExisting}
                    onChange={(e) => setUpdateExisting(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="update-existing">Aggiorna esistenti</Label>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={handleUpload}
                  disabled={!file || isUploading}
                  className="btn-neon"
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Importando...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Importa Dati
                    </>
                  )}
                </Button>
                <Button
                  onClick={downloadTemplate}
                  variant="outline"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Scarica Template
                </Button>
                {file && (
                  <Button
                    onClick={resetForm}
                    variant="outline"
                  >
                    Reset
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Results Section */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="card-gaming">
            <CardHeader>
              <CardTitle className="flex items-center gap-x-2">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                Risultati Import
              </CardTitle>
              <CardDescription>
                {result.message}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Partner</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-green-600">Creati:</span>
                      <span>{result.data.partners.created}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-600">Aggiornati:</span>
                      <span>{result.data.partners.updated}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-red-600">Errori:</span>
                      <span>{result.data.partners.errors}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Aziende</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-green-600">Creati:</span>
                      <span>{result.data.companies.created}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-600">Aggiornati:</span>
                      <span>{result.data.companies.updated}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-red-600">Errori:</span>
                      <span>{result.data.companies.errors}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Studenti</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-green-600">Creati:</span>
                      <span>{result.data.students.created}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-600">Aggiornati:</span>
                      <span>{result.data.students.updated}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-red-600">Errori:</span>
                      <span>{result.data.students.errors}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Supervisori</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-green-600">Creati:</span>
                      <span>{result.data.supervisors.created}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-600">Aggiornati:</span>
                      <span>{result.data.supervisors.updated}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-red-600">Errori:</span>
                      <span>{result.data.supervisors.errors}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Errors */}
              {result.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm flex items-center gap-x-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    Errori Dettagliati
                  </h4>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {result.errors.map((error, index) => (
                      <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="card-gaming">
          <CardHeader>
            <CardTitle className="flex items-center gap-x-2">
              <Database className="h-5 w-5 text-neon-primary" />
              Istruzioni per l'Import
            </CardTitle>
            <CardDescription>
              Come preparare il file Excel per l'import
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Struttura del File Excel</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Il file Excel deve contenere i seguenti fogli:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• <strong>Partners</strong> - Lista dei partner</li>
                  <li>• <strong>Aziende</strong> - Lista delle aziende</li>
                  <li>• <strong>Clienti</strong> - Lista degli studenti/clienti</li>
                  <li>• <strong>Supervisori</strong> - Lista dei supervisori</li>
                  <li>• <strong>Lista</strong> - Foglio unificato con tutti i dati</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">Colonne Richieste</h4>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2 text-sm">
                  <div>
                    <strong>Partners:</strong>
                    <ul className="ml-4 text-muted-foreground">
                      <li>• Nome Partner</li>
                    </ul>
                  </div>
                  <div>
                    <strong>Aziende:</strong>
                    <ul className="ml-4 text-muted-foreground">
                      <li>• Nome Azienda</li>
                      <li>• Indirizzo</li>
                      <li>• Telefono</li>
                      <li>• Email</li>
                      <li>• Partner</li>
                    </ul>
                  </div>
                  <div>
                    <strong>Studenti:</strong>
                    <ul className="ml-4 text-muted-foreground">
                      <li>• Nome Studente</li>
                      <li>• Email</li>
                      <li>• Telefono</li>
                      <li>• Partner</li>
                    </ul>
                  </div>
                  <div>
                    <strong>Supervisori:</strong>
                    <ul className="ml-4 text-muted-foreground">
                      <li>• Nome Supervisore</li>
                      <li>• Email</li>
                      <li>• Telefono</li>
                      <li>• Azienda</li>
                      <li>• Partner</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Note Importanti</h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• Le email devono essere valide</li>
                  <li>• I telefoni devono essere nel formato internazionale</li>
                  <li>• I partner devono esistere prima di creare aziende/studenti</li>
                  <li>• Le aziende devono esistere prima di creare supervisori</li>
                  <li>• Il file deve essere in formato .xlsx</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

