console.log('🚀 Avvio importazione COMPLETA dei dati reali...');

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
  console.log(`📝 Inserendo in ${table}:`, data.name || data.id);
  
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
  try {
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

    // 1. Importa Partner (solo primi 5 per test)
    console.log('📊 Importando primi 5 Partner...');
    const partnerSheet = workbook.Sheets['PARTNER'];
    const partnerRows = XLSX.utils.sheet_to_json(partnerSheet);
    
    let partnerCount = 0;
    for (let i = 0; i < Math.min(5, partnerRows.length); i++) {
      const row = partnerRows[i];
      try {
        const partnerName = cleanString(row['PARTNER']);
        
        if (!partnerName) continue;

        const partnerData = {
          id: generateUUID(),
          name: partnerName
        };

        await insertData('partners', partnerData);
        partnerCount++;
        console.log(`✅ Partner "${partnerName}" creato`);

      } catch (error) {
        console.log(`❌ Errore partner: ${error.message}`);
      }
    }

    console.log(`📈 Partner: ${partnerCount} creati\n`);

    // 2. Importa Aziende (solo prime 10 per test)
    console.log('🏢 Importando prime 10 Aziende...');
    const companySheet = workbook.Sheets['AZIENDE'];
    const companyRows = XLSX.utils.sheet_to_json(companySheet);
    
    let companyCount = 0;
    for (let i = 0; i < Math.min(10, companyRows.length); i++) {
      const row = companyRows[i];
      try {
        const companyName = cleanString(row['AZIENDA']);
        
        if (!companyName) continue;

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
        companyCount++;
        console.log(`✅ Azienda "${companyName}" creata`);

      } catch (error) {
        console.log(`❌ Errore azienda: ${error.message}`);
      }
    }

    console.log(`📈 Aziende: ${companyCount} create\n`);

    // 3. Importa Studenti (solo primi 10 per test)
    console.log('👨‍🎓 Importando primi 10 Studenti...');
    const studentSheet = workbook.Sheets['CLIENTI'];
    const studentRows = XLSX.utils.sheet_to_json(studentSheet);
    
    let studentCount = 0;
    for (let i = 0; i < Math.min(10, studentRows.length); i++) {
      const row = studentRows[i];
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

        if (!nome || !cognome) continue;

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
        studentCount++;
        console.log(`✅ Studente "${fullName}" creato`);

      } catch (error) {
        console.log(`❌ Errore studente: ${error.message}`);
      }
    }

    console.log(`📈 Studenti: ${studentCount} creati\n`);

    // Riepilogo finale
    console.log('🎉 Importazione di test completata!\n');
    console.log('📊 RIEPILOGO:');
    console.log(`   Partner: ${partnerCount} creati`);
    console.log(`   Aziende: ${companyCount} create`);
    console.log(`   Studenti: ${studentCount} creati`);
    
    const totalCreated = partnerCount + companyCount + studentCount;
    console.log(`\n📈 TOTALE: ${totalCreated} record creati`);

    if (totalCreated > 0) {
      console.log('\n✅ Test di importazione riuscito!');
      console.log('🚀 I dati di test sono ora disponibili nel database Supabase');
    }

  } catch (error) {
    console.error('❌ Errore durante l\'importazione:', error);
  }
}

// Esegui l'importazione
main();
