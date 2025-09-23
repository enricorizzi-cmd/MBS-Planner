const { createClient } = require('@supabase/supabase-js');

// Configurazione Supabase
const supabaseUrl = 'https://cxegnwuwfpgfzbactgtc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4ZWdud3V3ZnBnZnpiYWN0Z3RjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODYxNzg2NCwiZXhwIjoyMDc0MTkzODY0fQ.LsSp6_k3-XAAetTT0Ht8gqgNvYBsukxQV3lXODF6Mcw';

// Inizializza il client Supabase
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testConnection() {
  console.log('🔗 Testando connessione a Supabase...');
  
  try {
    const { data, error } = await supabase
      .from('partners')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('❌ Errore connessione:', error.message);
      return false;
    }
    
    console.log('✅ Connessione a Supabase riuscita!');
    return true;
  } catch (error) {
    console.log('❌ Errore:', error.message);
    return false;
  }
}

async function main() {
  const connected = await testConnection();
  if (connected) {
    console.log('🚀 Pronto per l\'importazione!');
  } else {
    console.log('❌ Impossibile procedere con l\'importazione');
  }
}

main();
