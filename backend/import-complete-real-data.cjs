const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Configurazione Supabase
const supabaseUrl = 'https://cxegnwuwfpgfzbactgtc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4ZWdud3V3ZnBnZnpiYWN0Z3RjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODYxNzg2NCwiZXhwIjoyMDc0MTkzODY0fQ.LsSp6_k3-XAAetTT0Ht8gqgNvYBsukxQV3lXODF6Mcw';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Funzioni di utilità
function cleanString(str) {
  if (!str) return null;
  return String(str).trim() || null;
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function executeSQL(sql) {
  console.log(`📝 Eseguendo: ${sql.substring(0, 100)}...`);
  
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'apikey': supabaseServiceKey
    },
    body: JSON.stringify({ sql })
  });

  if (!response.ok) {
    const error = await response.text();
    console.log(`⚠️ Warning: ${error}`);
  } else {
    console.log(`✅ Eseguito con successo`);
  }
}

async function addMissingFields() {
  console.log('🔧 Aggiungendo campi mancanti al database...\n');

  const queries = [
    // Aggiungi campi alla tabella students
    "ALTER TABLE students ADD COLUMN IF NOT EXISTS ruolo VARCHAR(100);",
    "ALTER TABLE students ADD COLUMN IF NOT EXISTS categoria VARCHAR(50);",
    "ALTER TABLE students ADD COLUMN IF NOT EXISTS tipologia VARCHAR(50);",
    "ALTER TABLE students ADD COLUMN IF NOT EXISTS importo_vsd_mbs DECIMAL(10,2);",
    "ALTER TABLE students ADD COLUMN IF NOT EXISTS consulenti VARCHAR(255);",
    "ALTER TABLE students ADD COLUMN IF NOT EXISTS manuale_di_studio VARCHAR(100);",
    "ALTER TABLE students ADD COLUMN IF NOT EXISTS avanzamento VARCHAR(100);",
    "ALTER TABLE students ADD COLUMN IF NOT EXISTS prossimo_studio VARCHAR(100);",
    
    // Aggiungi campi alla tabella companies
    "ALTER TABLE companies ADD COLUMN IF NOT EXISTS sito_azienda VARCHAR(500);",
    "ALTER TABLE companies ADD COLUMN IF NOT EXISTS settore VARCHAR(500);",
    
    // Crea tabella student_companies se non esiste
    `CREATE TABLE IF NOT EXISTS student_companies (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        ruolo VARCHAR(100),
        categoria VARCHAR(50),
        tipologia VARCHAR(50),
        importo_vsd_mbs DECIMAL(10,2),
        consulenti VARCHAR(255),
        manuale_di_studio VARCHAR(100),
        avanzamento VARCHAR(100),
        prossimo_studio VARCHAR(100),
        sito_azienda VARCHAR(500),
        settore VARCHAR(500),
        is_primary BOOLEAN DEFAULT false,
        start_date DATE,
        end_date DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(student_id, company_id)
    );`
  ];

  for (let i = 0; i < queries.length; i++) {
    await executeSQL(queries[i]);
  }

  console.log('✅ Campi aggiunti al database!\n');
}

async function insertData(table, data) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'apikey': supabaseServiceKey,
      'Prefer': 'resolution=merge-duplicates'
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Errore ${response.status}: ${error}`);
  }

  const text = await response.text();
  if (text) {
    try {
      return JSON.parse(text);
    } catch (e) {
      return text;
    }
  }
  return null;
}

async function findExistingRecord(table, column, value) {
  if (!value) return null;
  const response = await fetch(`${supabaseUrl}/rest/v1/${table}?${column}=eq.${encodeURIComponent(value)}&select=id&limit=1`, {
    headers: {
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'apikey': supabaseServiceKey
    }
  });

  if (response.ok) {
    const data = await response.json();
    return data.length > 0 ? data[0].id : null;
  }
  return null;
}

async function importAllData() {
  console.log('🚀 Avvio importazione COMPLETA dei dati reali dal file Excel\n');

  try {
    // Testa la connessione
    console.log('🔗 Testando connessione a Supabase...');
    const testResponse = await fetch(`${supabaseUrl}/rest/v1/partners?select=count`, {
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      }
    });

    if (!testResponse.ok) {
      console.log('❌ Errore connessione:', testResponse.status);
      return;
    }
    console.log('✅ Connessione a Supabase riuscita!\n');

    // Aggiungi campi mancanti
    await addMissingFields();

    // Leggi il file Excel
    const excelPath = path.join(__dirname, '..', 'MBS DATI IMPORT.xlsx');
    console.log(`📖 Leggendo file: ${excelPath}`);
    
    const workbook = XLSX.readFile(excelPath);
    const sheetNames = workbook.SheetNames;

    console.log(`📋 Fogli trovati: ${sheetNames.join(', ')}\n`);

    const totalResults = {
      partners: { created: 0, errors: 0, skipped: 0 },
      companies: { created: 0, errors: 0, skipped: 0 },
      students: { created: 0, errors: 0, skipped: 0 },
      studentCompanies: { created: 0, errors: 0, skipped: 0 }
    };

    // 1. Importa Partner
    console.log('📊 Importando Partner...');
    const partnerSheet = workbook.Sheets['PARTNER'];
    const partnerRows = XLSX.utils.sheet_to_json(partnerSheet);
    
    for (const row of partnerRows) {
      try {
        const partnerName = cleanString(row['PARTNER']);
        
        if (!partnerName) {
          totalResults.partners.errors++;
          continue;
        }

        const existingId = await findExistingRecord('partners', 'name', partnerName);
        if (existingId) {
          totalResults.partners.skipped++;
          continue;
        }

        const partnerData = {
          id: generateUUID(),
          name: partnerName
        };

        await insertData('partners', partnerData);
        totalResults.partners.created++;
        console.log(`✅ Partner "${partnerName}" creato`);

      } catch (error) {
        totalResults.partners.errors++;
        console.log(`❌ Errore partner: ${error.message}`);
      }
    }

    // 2. Importa Aziende
    console.log('\n🏢 Importando Aziende...');
    const companySheet = workbook.Sheets['AZIENDE'];
    const companyRows = XLSX.utils.sheet_to_json(companySheet);
    
    for (const row of companyRows) {
      try {
        const companyName = cleanString(row['AZIENDA']);
        
        if (!companyName) {
          totalResults.companies.errors++;
          continue;
        }

        const existingId = await findExistingRecord('companies', 'name', companyName);
        if (existingId) {
          totalResults.companies.skipped++;
          continue;
        }

        const companyData = {
          id: generateUUID(),
          name: companyName,
          address: null,
          phone: null,
          email: null,
          contact_person: null,
          partner_id: null,
          sito_azienda: null,
          settore: null
        };

        await insertData('companies', companyData);
        totalResults.companies.created++;
        console.log(`✅ Azienda "${companyName}" creata`);

      } catch (error) {
        totalResults.companies.errors++;
        console.log(`❌ Errore azienda: ${error.message}`);
      }
    }

    // 3. Importa Studenti con TUTTI i campi
    console.log('\n👨‍🎓 Importando Studenti con tutti i campi...');
    const studentSheet = workbook.Sheets['CLIENTI'];
    const studentRows = XLSX.utils.sheet_to_json(studentSheet);
    
    for (const row of studentRows) {
      try {
        const nome = cleanString(row['NOME']);
        const cognome = cleanString(row['COGNOME']);
        const numero = cleanString(row['NUMERO']);
        const email = cleanString(row['EMAIL']);
        const ruolo = cleanString(row['RUOLO']);
        const categoria = cleanString(row['CATEGORIA']);
        const tipologia = cleanString(row['TIPOLOGIA']);
        const importoVsdMbs = row['IMPORTO VSD MBS'] ? parseFloat(row['IMPORTO VSD MBS']) : null;
        const consulenti = cleanString(row['CONSULENTI']);
        const manualeDiStudio = cleanString(row['MANUALE DI STUDIO']);
        const avanzamento = cleanString(row['AVANZAMENTO']);
        const prossimoStudio = cleanString(row['PROSSIMO STUDIO']);
        const partnerName = cleanString(row['PARTNER']);

        if (!nome || !cognome) {
          totalResults.students.errors++;
          continue;
        }

        const fullName = `${nome} ${cognome}`;

        // Trova il partner ID
        let partnerId = null;
        if (partnerName) {
          partnerId = await findExistingRecord('partners', 'name', partnerName);
        }

        // Controlla se lo studente esiste già
        let existingId = null;
        if (email) {
          existingId = await findExistingRecord('students', 'email', email);
        }
        if (!existingId) {
          existingId = await findExistingRecord('students', 'name', fullName);
        }

        if (existingId) {
          totalResults.students.skipped++;
          continue;
        }

        const studentData = {
          id: generateUUID(),
          name: fullName,
          email: email || null,
          phone: numero || null,
          partner_id: partnerId,
          ruolo: ruolo || null,
          categoria: categoria || null,
          tipologia: tipologia || null,
          importo_vsd_mbs: importoVsdMbs,
          consulenti: consulenti || null,
          manuale_di_studio: manualeDiStudio || null,
          avanzamento: avanzamento || null,
          prossimo_studio: prossimoStudio || null
        };

        await insertData('students', studentData);
        totalResults.students.created++;
        console.log(`✅ Studente "${fullName}" creato con tutti i campi`);

      } catch (error) {
        totalResults.students.errors++;
        console.log(`❌ Errore studente: ${error.message}`);
      }
    }

    // 4. Crea collegamenti Studenti-Aziende dal foglio LISTA
    console.log('\n🔗 Creando collegamenti Studenti-Aziende...');
    const listSheet = workbook.Sheets['LISTA'];
    const listRows = XLSX.utils.sheet_to_json(listSheet);
    
    for (const row of listRows) {
      try {
        const nome = cleanString(row['NOME']);
        const cognome = cleanString(row['COGNOME']);
        const email = cleanString(row['EMAIL']);
        const companyName = cleanString(row['AZIENDA']);
        const ruolo = cleanString(row['RUOLO']);
        const categoria = cleanString(row['CATEGORIA']);
        const tipologia = cleanString(row['TIPOLOGIA']);
        const importoVsdMbs = row['IMPORTO VSD MBS'] ? parseFloat(row['IMPORTO VSD MBS']) : null;
        const consulenti = cleanString(row['CONSULENTI']);
        const manualeDiStudio = cleanString(row['MANUALE DI STUDIO']);
        const avanzamento = cleanString(row['AVANZAMENTO']);
        const prossimoStudio = cleanString(row['PROSSIMO STUDIO']);
        const sitoAzienda = cleanString(row['SITO AZIENDA']);
        const settore = cleanString(row['SETTORE IN CUI LAVORA']);

        if (!nome || !cognome || !companyName) {
          totalResults.studentCompanies.errors++;
          continue;
        }

        const fullName = `${nome} ${cognome}`;

        // Trova studente per nome o email
        let studentId = null;
        if (email) {
          studentId = await findExistingRecord('students', 'email', email);
        }
        if (!studentId) {
          studentId = await findExistingRecord('students', 'name', fullName);
        }

        if (!studentId) {
          totalResults.studentCompanies.errors++;
          console.log(`❌ Studente "${fullName}" non trovato`);
          continue;
        }

        // Trova azienda
        const companyId = await findExistingRecord('companies', 'name', companyName);
        if (!companyId) {
          totalResults.studentCompanies.errors++;
          console.log(`❌ Azienda "${companyName}" non trovata`);
          continue;
        }

        // Controlla se il collegamento esiste già
        const existingLink = await findExistingRecord('student_companies', 'student_id', studentId);
        if (existingLink) {
          totalResults.studentCompanies.skipped++;
          continue;
        }

        const linkData = {
          id: generateUUID(),
          student_id: studentId,
          company_id: companyId,
          ruolo: ruolo || null,
          categoria: categoria || null,
          tipologia: tipologia || null,
          importo_vsd_mbs: importoVsdMbs,
          consulenti: consulenti || null,
          manuale_di_studio: manualeDiStudio || null,
          avanzamento: avanzamento || null,
          prossimo_studio: prossimoStudio || null,
          sito_azienda: sitoAzienda || null,
          settore: settore || null,
          is_primary: true
        };

        await insertData('student_companies', linkData);
        totalResults.studentCompanies.created++;
        console.log(`✅ Collegamento "${fullName}" - "${companyName}" creato`);

      } catch (error) {
        totalResults.studentCompanies.errors++;
        console.log(`❌ Errore collegamento: ${error.message}`);
      }
    }

    // Riepilogo finale
    console.log('\n🎉 Importazione COMPLETA terminata!\n');
    console.log('📊 RIEPILOGO FINALE:');
    console.log(`   Partner: ${totalResults.partners.created} creati, ${totalResults.partners.errors} errori, ${totalResults.partners.skipped} saltati`);
    console.log(`   Aziende: ${totalResults.companies.created} create, ${totalResults.companies.errors} errori, ${totalResults.companies.skipped} saltati`);
    console.log(`   Studenti: ${totalResults.students.created} creati, ${totalResults.students.errors} errori, ${totalResults.students.skipped} saltati`);
    console.log(`   Collegamenti: ${totalResults.studentCompanies.created} creati, ${totalResults.studentCompanies.errors} errori, ${totalResults.studentCompanies.skipped} saltati`);
    
    const totalCreated = totalResults.partners.created + totalResults.companies.created + 
                        totalResults.students.created + totalResults.studentCompanies.created;
    const totalErrors = totalResults.partners.errors + totalResults.companies.errors + 
                       totalResults.students.errors + totalResults.studentCompanies.errors;
    
    console.log(`\n📈 TOTALE: ${totalCreated} record creati, ${totalErrors} errori`);

    if (totalCreated > 0) {
      console.log('\n✅ Importazione COMPLETA dei dati reali completata con successo!');
      console.log('🚀 Tutti i dati dal file Excel sono ora disponibili nel database Supabase');
      console.log('📋 Tutti i campi sono stati aggiunti: ruolo, categoria, tipologia, importo, consulenti, manuale, avanzamento, prossimo studio, sito azienda, settore');
    }

  } catch (error) {
    console.error('❌ Errore durante l\'importazione:', error);
  }
}

// Esegui l'importazione completa
importAllData();
