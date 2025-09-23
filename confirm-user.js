import { createClient } from '@supabase/supabase-js';

// Configurazione Supabase
const supabaseUrl = 'https://cxegnwuwfpgfzbactgtc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4ZWdud3V3ZnBnZnpiYWN0Z3RjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODYxNzg2NCwiZXhwIjoyMDc0MTkzODY0fQ.LsSp6_k3-XAAetTT0Ht8gqgNvYBsukxQV3lXODF6Mcw';

// Crea client con service role key (può bypassare RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function confirmUserEmail(email) {
  try {
    console.log(`🔍 Cercando utente con email: ${email}`);
    
    // Trova l'utente per email
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Errore nel recupero utenti:', listError);
      return;
    }
    
    const user = users.users.find(u => u.email === email);
    
    if (!user) {
      console.error(`❌ Utente con email ${email} non trovato`);
      return;
    }
    
    console.log(`✅ Utente trovato: ${user.email} (ID: ${user.id})`);
    console.log(`📧 Email confermata: ${user.email_confirmed_at ? 'SÌ' : 'NO'}`);
    
    if (user.email_confirmed_at) {
      console.log('✅ Email già confermata!');
      return;
    }
    
    // Conferma l'email manualmente
    const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
      email_confirm: true
    });
    
    if (error) {
      console.error('❌ Errore nella conferma email:', error);
      return;
    }
    
    console.log('✅ Email confermata con successo!');
    console.log('🎉 Ora puoi effettuare il login!');
    
  } catch (error) {
    console.error('❌ Errore generale:', error);
  }
}

// Esegui lo script
const email = process.argv[2];

if (!email) {
  console.log('❌ Uso: node confirm-user.js <email>');
  console.log('📝 Esempio: node confirm-user.js admin@example.com');
  process.exit(1);
}

confirmUserEmail(email);
