// Script per verificare la struttura completa della tabella supervisors
const SUPABASE_URL = 'https://cxegnwuwfpgfzbactgtc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4ZWdud3V3ZnBnZnpiYWN0Z3RjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODYxNzg2NCwiZXhwIjoyMDc0MTkzODY0fQ.LsSp6_k3-XAAetTT0Ht8gqgNvYBsukxQV3lXODF6Mcw';

async function checkSupervisorsStructure() {
  console.log('🔍 Controllando struttura tabella supervisors...\n');
  
  try {
    // Prova a inserire un record vuoto per vedere la struttura
    const response = await fetch(`${SUPABASE_URL}/rest/v1/supervisors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY
      },
      body: JSON.stringify({})
    });

    if (!response.ok) {
      const error = await response.text();
      console.log(`❌ Errore: ${error}`);
    } else {
      console.log('✅ Struttura OK');
    }
  } catch (error) {
    console.log(`❌ Errore: ${error.message}`);
  }

  // Prova a leggere un record esistente
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/supervisors?limit=1`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`📊 Record trovati: ${data.length}`);
      if (data.length > 0) {
        console.log(`   Colonne: ${Object.keys(data[0]).join(', ')}`);
      }
    }
  } catch (error) {
    console.log(`❌ Errore lettura: ${error.message}`);
  }
}

checkSupervisorsStructure();
