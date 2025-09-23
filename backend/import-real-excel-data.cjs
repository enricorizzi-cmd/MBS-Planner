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

async function importPartners(rows) {
  console.log('📊 Importando Partner...');
  let created = 0;
  let errors = 0;
  let skipped = 0;

  for (const row of rows) {
    try {
      const partnerName = cleanString(row['PARTNER']);
      
      if (!partnerName) {
        console.log(`⚠️  Riga ${rows.indexOf(row) + 1}: Nome partner mancante`);
        errors++;
        continue;
      }

      // Controlla se il partner esiste già
      const existingId = await findExistingRecord('partners', 'name', partnerName);
      if (existingId) {
        skipped++;
        continue;
      }

      // Crea il partner
      const partnerData = {
        id: generateUUID(),
        name: partnerName
      };

      await insertData('partners', partnerData);
      created++;
      console.log(`✅ Partner "${partnerName}" creato`);

    } catch (error) {
      console.log(`❌ Errore riga ${rows.indexOf(row) + 1}: ${error.message}`);
      errors++;
    }
  }

  console.log(`📈 Partner: ${created} creati, ${errors} errori, ${skipped} saltati\n`);
  return { created, errors, skipped };
}

async function importCompanies(rows) {
  console.log('🏢 Importando Aziende...');
  let created = 0;
  let errors = 0;
  let skipped = 0;

  for (const row of rows) {
    try {
      const companyName = cleanString(row['AZIENDA']);
      
      if (!companyName) {
        console.log(`⚠️  Riga ${rows.indexOf(row) + 1}: Nome azienda mancante`);
        errors++;
        continue;
      }

      // Controlla se l'azienda esiste già
      const existingId = await findExistingRecord('companies', 'name', companyName);
      if (existingId) {
        skipped++;
        continue;
      }

      // Crea l'azienda (senza partner per ora, lo collegheremo dopo)
      const companyData = {
        id: generateUUID(),
        name: companyName,
        address: null,
        phone: null,
        email: null,
        contact_person: null,
        partner_id: null
      };

      await insertData('companies', companyData);
      created++;
      console.log(`✅ Azienda "${companyName}" creata`);

    } catch (error) {
      console.log(`❌ Errore riga ${rows.indexOf(row) + 1}: ${error.message}`);
      errors++;
    }
  }

  console.log(`📈 Aziende: ${created} create, ${errors} errori, ${skipped} saltati\n`);
  return { created, errors, skipped };
}

async function importStudents(rows) {
  console.log('👨‍🎓 Importando Studenti...');
  let created = 0;
  let errors = 0;
  let skipped = 0;

  for (const row of rows) {
    try {
      const nome = cleanString(row['NOME']);
      const cognome = cleanString(row['COGNOME']);
      const numero = cleanString(row['NUMERO']);
      const email = cleanString(row['EMAIL']);
      const partnerName = cleanString(row['PARTNER']);

      if (!nome || !cognome) {
        console.log(`⚠️  Riga ${rows.indexOf(row) + 1}: Nome o cognome mancanti`);
        errors++;
        continue;
      }

      const fullName = `${nome} ${cognome}`;

      // Ottieni l'ID del partner
      let partnerId = null;
      if (partnerName) {
        partnerId = await findExistingRecord('partners', 'name', partnerName);
        if (!partnerId) {
          console.log(`⚠️  Partner "${partnerName}" non trovato per studente "${fullName}"`);
          errors++;
          continue;
        }
      }

      // Controlla se lo studente esiste già (per email o nome completo)
      let existingId = null;
      if (email) {
        existingId = await findExistingRecord('students', 'email', email);
      }
      if (!existingId) {
        existingId = await findExistingRecord('students', 'name', fullName);
      }

      if (existingId) {
        skipped++;
        continue;
      }

      // Crea lo studente
      const studentData = {
        id: generateUUID(),
        name: fullName,
        email: email || null,
        phone: numero || null,
        partner_id: partnerId
      };

      await insertData('students', studentData);
      created++;
      console.log(`✅ Studente "${fullName}" creato`);

    } catch (error) {
      console.log(`❌ Errore riga ${rows.indexOf(row) + 1}: ${error.message}`);
      errors++;
    }
  }

  console.log(`📈 Studenti: ${created} creati, ${errors} errori, ${skipped} saltati\n`);
  return { created, errors, skipped };
}

async function main() {
  console.log('🚀 Avvio importazione DATI REALI dal file Excel nel database Supabase\n');

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

    // Leggi il file Excel
    const excelPath = path.join(__dirname, '..', 'MBS DATI IMPORT.xlsx');
    console.log(`📖 Leggendo file: ${excelPath}`);
    
    const workbook = XLSX.readFile(excelPath);
    const sheetNames = workbook.SheetNames;

    console.log(`📋 Fogli trovati: ${sheetNames.join(', ')}\n`);

    const totalResults = {
      partners: { created: 0, errors: 0, skipped: 0 },
      companies: { created: 0, errors: 0, skipped: 0 },
      students: { created: 0, errors: 0, skipped: 0 }
    };

    // Processa ogni foglio
    for (const sheetName of sheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet);

      if (rows.length === 0) {
        console.log(`⚠️  Foglio "${sheetName}" vuoto, saltato\n`);
        continue;
      }

      console.log(`📄 Processando foglio "${sheetName}" (${rows.length} righe)`);

      try {
        switch (sheetName.toUpperCase()) {
          case 'PARTNER':
            const partnerResult = await importPartners(rows);
            totalResults.partners.created += partnerResult.created;
            totalResults.partners.errors += partnerResult.errors;
            totalResults.partners.skipped += partnerResult.skipped;
            break;

          case 'AZIENDE':
            const companyResult = await importCompanies(rows);
            totalResults.companies.created += companyResult.created;
            totalResults.companies.errors += companyResult.errors;
            totalResults.companies.skipped += companyResult.skipped;
            break;

          case 'CLIENTI':
            const studentResult = await importStudents(rows);
            totalResults.students.created += studentResult.created;
            totalResults.students.errors += studentResult.errors;
            totalResults.students.skipped += studentResult.skipped;
            break;

          case 'LISTA':
            console.log('📋 Foglio "Lista" contiene dati aggregati, saltato per evitare duplicati\n');
            break;

          default:
            console.log(`⚠️  Foglio "${sheetName}" non riconosciuto, saltato\n`);
        }
      } catch (error) {
        console.log(`❌ Errore nel processamento del foglio ${sheetName}: ${error.message}\n`);
      }
    }

    // Riepilogo finale
    console.log('🎉 Importazione completata!\n');
    console.log('📊 RIEPILOGO FINALE:');
    console.log(`   Partner: ${totalResults.partners.created} creati, ${totalResults.partners.errors} errori, ${totalResults.partners.skipped} saltati`);
    console.log(`   Aziende: ${totalResults.companies.created} create, ${totalResults.companies.errors} errori, ${totalResults.companies.skipped} saltati`);
    console.log(`   Studenti: ${totalResults.students.created} creati, ${totalResults.students.errors} errori, ${totalResults.students.skipped} saltati`);
    
    const totalCreated = totalResults.partners.created + totalResults.companies.created + totalResults.students.created;
    const totalErrors = totalResults.partners.errors + totalResults.companies.errors + totalResults.students.errors;
    
    console.log(`\n📈 TOTALE: ${totalCreated} record creati, ${totalErrors} errori`);

    if (totalErrors === 0) {
      console.log('\n✅ Importazione completata con successo!');
      console.log('🚀 I dati REALI dal file Excel sono ora disponibili nel database Supabase');
    } else {
      console.log('\n⚠️  Importazione completata con alcuni errori');
      console.log('🔍 Controlla i log sopra per i dettagli degli errori');
    }

  } catch (error) {
    console.error('❌ Errore durante l\'importazione:', error);
  }
}

// Esegui l'importazione
main();
