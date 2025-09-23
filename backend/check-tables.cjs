// Script per verificare la struttura delle tabelle
const SUPABASE_URL = 'https://cxegnwuwfpgfzbactgtc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4ZWdud3V3ZnBnZnpiYWN0Z3RjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODYxNzg2NCwiZXhwIjoyMDc0MTkzODY0fQ.LsSp6_k3-XAAetTT0Ht8gqgNvYBsukxQV3lXODF6Mcw';

async function checkTable(tableName) {
  console.log(`🔍 Controllando tabella: ${tableName}`);
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?limit=1`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Tabella ${tableName} esiste`);
      if (data.length > 0) {
        console.log(`   Colonne: ${Object.keys(data[0]).join(', ')}`);
      }
    } else {
      const error = await response.text();
      console.log(`❌ Errore tabella ${tableName}: ${error}`);
    }
  } catch (error) {
    console.log(`❌ Errore controllo ${tableName}: ${error.message}`);
  }
  console.log('');
}

async function checkTables() {
  console.log('🔍 Controllando struttura delle tabelle...\n');
  
  await checkTable('partners');
  await checkTable('companies');
  await checkTable('students');
  await checkTable('supervisors');
}

checkTables();
