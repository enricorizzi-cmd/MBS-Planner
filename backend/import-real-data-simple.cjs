const XLSX = require('xlsx');
const path = require('path');

// Configurazione Supabase
const SUPABASE_URL = 'https://cxegnwuwfpgfzbactgtc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4ZWdud3V3ZnBnZnpiYWN0Z3RjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODYxNzg2NCwiZXhwIjoyMDc0MTkzODY0fQ.LsSp6_k3-XAAetTT0Ht8gqgNvYBsukxQV3lXODF6Mcw';

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
  console.log(`📝 Inserendo in ${table}:`, data);
  
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'apikey': SUPABASE_KEY,
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

async function main() {
  console.log('🚀 Avvio importazione DATI REALI dal file Excel\n');

  try {
    // Testa la connessione
    console.log('🔗 Testando connessione a Supabase...');
    const testResponse = await fetch(`${SUPABASE_URL}/rest/v1/partners?select=count`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY
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

    // Importa solo i primi 3 partner per test
    console.log('📊 Importando primi 3 Partner per test...');
    const partnerSheet = workbook.Sheets['PARTNER'];
    const partnerRows = XLSX.utils.sheet_to_json(partnerSheet);
    
    let created = 0;
    let errors = 0;

    for (let i = 0; i < Math.min(3, partnerRows.length); i++) {
      const row = partnerRows[i];
      try {
        const partnerName = cleanString(row['PARTNER']);
        
        if (!partnerName) {
          console.log(`⚠️  Riga ${i + 1}: Nome partner mancante`);
          errors++;
          continue;
        }

        const partnerData = {
          id: generateUUID(),
          name: partnerName
        };

        await insertData('partners', partnerData);
        created++;
        console.log(`✅ Partner "${partnerName}" creato`);

      } catch (error) {
        console.log(`❌ Errore riga ${i + 1}: ${error.message}`);
        errors++;
      }
    }

    console.log(`\n📈 Test Partner: ${created} creati, ${errors} errori`);

    if (created > 0) {
      console.log('\n✅ Test di importazione riuscito!');
      console.log('🚀 Procedo con l\'importazione completa...');
      
      // Ora importa tutto
      await importAllData(workbook);
    }

  } catch (error) {
    console.error('❌ Errore durante l\'importazione:', error);
  }
}

async function importAllData(workbook) {
  console.log('\n🔄 Avvio importazione completa...');
  
  const totalResults = {
    partners: { created: 0, errors: 0, skipped: 0 },
    companies: { created: 0, errors: 0, skipped: 0 },
    students: { created: 0, errors: 0, skipped: 0 }
  };

  // Importa Partner
  console.log('\n📊 Importando tutti i Partner...');
  const partnerSheet = workbook.Sheets['PARTNER'];
  const partnerRows = XLSX.utils.sheet_to_json(partnerSheet);
  
  for (const row of partnerRows) {
    try {
      const partnerName = cleanString(row['PARTNER']);
      
      if (!partnerName) {
        totalResults.partners.errors++;
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

  // Importa Aziende (solo prime 10 per test)
  console.log('\n🏢 Importando prime 10 Aziende...');
  const companySheet = workbook.Sheets['AZIENDE'];
  const companyRows = XLSX.utils.sheet_to_json(companySheet);
  
  for (let i = 0; i < Math.min(10, companyRows.length); i++) {
    const row = companyRows[i];
    try {
      const companyName = cleanString(row['AZIENDA']);
      
      if (!companyName) {
        totalResults.companies.errors++;
        continue;
      }

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
      totalResults.companies.created++;
      console.log(`✅ Azienda "${companyName}" creata`);

    } catch (error) {
      totalResults.companies.errors++;
      console.log(`❌ Errore azienda: ${error.message}`);
    }
  }

  // Importa Studenti (solo primi 10 per test)
  console.log('\n👨‍🎓 Importando primi 10 Studenti...');
  const studentSheet = workbook.Sheets['CLIENTI'];
  const studentRows = XLSX.utils.sheet_to_json(studentSheet);
  
  for (let i = 0; i < Math.min(10, studentRows.length); i++) {
    const row = studentRows[i];
    try {
      const nome = cleanString(row['NOME']);
      const cognome = cleanString(row['COGNOME']);
      const numero = cleanString(row['NUMERO']);
      const email = cleanString(row['EMAIL']);
      const partnerName = cleanString(row['PARTNER']);

      if (!nome || !cognome) {
        totalResults.students.errors++;
        continue;
      }

      const fullName = `${nome} ${cognome}`;

      // Trova il partner ID
      let partnerId = null;
      if (partnerName) {
        const partnerResponse = await fetch(`${SUPABASE_URL}/rest/v1/partners?name=eq.${encodeURIComponent(partnerName)}&select=id&limit=1`, {
          headers: {
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'apikey': SUPABASE_KEY
          }
        });
        
        if (partnerResponse.ok) {
          const partnerData = await partnerResponse.json();
          if (partnerData.length > 0) {
            partnerId = partnerData[0].id;
          }
        }
      }

      const studentData = {
        id: generateUUID(),
        name: fullName,
        email: email || null,
        phone: numero || null,
        partner_id: partnerId
      };

      await insertData('students', studentData);
      totalResults.students.created++;
      console.log(`✅ Studente "${fullName}" creato`);

    } catch (error) {
      totalResults.students.errors++;
      console.log(`❌ Errore studente: ${error.message}`);
    }
  }

  // Riepilogo finale
  console.log('\n🎉 Importazione completata!\n');
  console.log('📊 RIEPILOGO FINALE:');
  console.log(`   Partner: ${totalResults.partners.created} creati, ${totalResults.partners.errors} errori`);
  console.log(`   Aziende: ${totalResults.companies.created} create, ${totalResults.companies.errors} errori`);
  console.log(`   Studenti: ${totalResults.students.created} creati, ${totalResults.students.errors} errori`);
  
  const totalCreated = totalResults.partners.created + totalResults.companies.created + totalResults.students.created;
  const totalErrors = totalResults.partners.errors + totalResults.companies.errors + totalResults.students.errors;
  
  console.log(`\n📈 TOTALE: ${totalCreated} record creati, ${totalErrors} errori`);

  if (totalCreated > 0) {
    console.log('\n✅ Importazione completata con successo!');
    console.log('🚀 I dati REALI dal file Excel sono ora disponibili nel database Supabase');
  }
}

// Esegui l'importazione
main();
