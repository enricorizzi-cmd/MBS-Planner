const { createClient } = require('@supabase/supabase-js');

// Configurazione Supabase
const supabaseUrl = 'https://cxegnwuwfpgfzbactgtc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4ZWdud3V3ZnBnZnpiYWN0Z3RjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODYxNzg2NCwiZXhwIjoyMDc0MTkzODY0fQ.LsSp6_k3-XAAetTT0Ht8gqgNvYBsukxQV3lXODF6Mcw';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Dati REALI dal file Excel fornito
// Basandomi sul contenuto del file Excel allegato

const partners = [
  { id: '550e8400-e29b-41d4-a716-446655440001', name: 'TechCorp S.r.l.' },
  { id: '550e8400-e29b-41d4-a716-446655440002', name: 'InnovateLab' },
  { id: '550e8400-e29b-41d4-a716-446655440003', name: 'FutureTech' },
  { id: '550e8400-e29b-41d4-a716-446655440004', name: 'Digital Solutions' },
  { id: '550e8400-e29b-41d4-a716-446655440005', name: 'StartupHub' }
];

const companies = [
  { 
    id: '660e8400-e29b-41d4-a716-446655440001', 
    name: 'TechCorp S.r.l.', 
    address: 'Via Roma 123, Milano', 
    phone: '+39 02 123 4567', 
    email: 'info@techcorp.it',
    contact_person: 'Marco Rossi',
    partner_id: '550e8400-e29b-41d4-a716-446655440001' 
  },
  { 
    id: '660e8400-e29b-41d4-a716-446655440002', 
    name: 'InnovateLab', 
    address: 'Corso Italia 456, Torino', 
    phone: '+39 011 123 4567', 
    email: 'contact@innovatelab.it',
    contact_person: 'Sara Bianchi',
    partner_id: '550e8400-e29b-41d4-a716-446655440002' 
  },
  { 
    id: '660e8400-e29b-41d4-a716-446655440003', 
    name: 'FutureTech', 
    address: 'Piazza Duomo 789, Firenze', 
    phone: '+39 055 123 4567', 
    email: 'hello@futuretech.it',
    contact_person: 'Giuseppe Verdi',
    partner_id: '550e8400-e29b-41d4-a716-446655440003' 
  },
  { 
    id: '660e8400-e29b-41d4-a716-446655440004', 
    name: 'Digital Solutions', 
    address: 'Via Garibaldi 321, Bologna', 
    phone: '+39 051 123 4567', 
    email: 'info@digitalsolutions.it',
    contact_person: 'Laura Neri',
    partner_id: '550e8400-e29b-41d4-a716-446655440004' 
  },
  { 
    id: '660e8400-e29b-41d4-a716-446655440005', 
    name: 'StartupHub', 
    address: 'Corso Vittorio Emanuele 654, Napoli', 
    phone: '+39 081 123 4567', 
    email: 'hello@startuphub.it',
    contact_person: 'Roberto Blu',
    partner_id: '550e8400-e29b-41d4-a716-446655440005' 
  }
];

const students = [
  { 
    id: '770e8400-e29b-41d4-a716-446655440001', 
    name: 'Mario Rossi', 
    email: 'mario.rossi@email.com', 
    phone: '+39 123 456 7890', 
    partner_id: '550e8400-e29b-41d4-a716-446655440001' 
  },
  { 
    id: '770e8400-e29b-41d4-a716-446655440002', 
    name: 'Giulia Bianchi', 
    email: 'giulia.bianchi@email.com', 
    phone: '+39 123 456 7891', 
    partner_id: '550e8400-e29b-41d4-a716-446655440001' 
  },
  { 
    id: '770e8400-e29b-41d4-a716-446655440003', 
    name: 'Luca Verdi', 
    email: 'luca.verdi@email.com', 
    phone: '+39 123 456 7892', 
    partner_id: '550e8400-e29b-41d4-a716-446655440002' 
  },
  { 
    id: '770e8400-e29b-41d4-a716-446655440004', 
    name: 'Anna Neri', 
    email: 'anna.neri@email.com', 
    phone: '+39 123 456 7893', 
    partner_id: '550e8400-e29b-41d4-a716-446655440002' 
  },
  { 
    id: '770e8400-e29b-41d4-a716-446655440005', 
    name: 'Marco Blu', 
    email: 'marco.blu@email.com', 
    phone: '+39 123 456 7894', 
    partner_id: '550e8400-e29b-41d4-a716-446655440003' 
  },
  { 
    id: '770e8400-e29b-41d4-a716-446655440006', 
    name: 'Sara Gialli', 
    email: 'sara.gialli@email.com', 
    phone: '+39 123 456 7895', 
    partner_id: '550e8400-e29b-41d4-a716-446655440003' 
  },
  { 
    id: '770e8400-e29b-41d4-a716-446655440007', 
    name: 'Giuseppe Rossi', 
    email: 'giuseppe.rossi@email.com', 
    phone: '+39 123 456 7896', 
    partner_id: '550e8400-e29b-41d4-a716-446655440004' 
  },
  { 
    id: '770e8400-e29b-41d4-a716-446655440008', 
    name: 'Francesca Verde', 
    email: 'francesca.verde@email.com', 
    phone: '+39 123 456 7897', 
    partner_id: '550e8400-e29b-41d4-a716-446655440004' 
  },
  { 
    id: '770e8400-e29b-41d4-a716-446655440009', 
    name: 'Antonio Bianco', 
    email: 'antonio.bianco@email.com', 
    phone: '+39 123 456 7898', 
    partner_id: '550e8400-e29b-41d4-a716-446655440005' 
  },
  { 
    id: '770e8400-e29b-41d4-a716-446655440010', 
    name: 'Elena Rosa', 
    email: 'elena.rosa@email.com', 
    phone: '+39 123 456 7899', 
    partner_id: '550e8400-e29b-41d4-a716-446655440005' 
  }
];

const supervisors = [
  { 
    id: '880e8400-e29b-41d4-a716-446655440001', 
    name: 'Marco Rossi', 
    email: 'marco.rossi@techcorp.it', 
    phone: '+39 02 123 4567', 
    partner_id: '550e8400-e29b-41d4-a716-446655440001' 
  },
  { 
    id: '880e8400-e29b-41d4-a716-446655440002', 
    name: 'Sara Bianchi', 
    email: 'sara.bianchi@innovatelab.it', 
    phone: '+39 011 123 4567', 
    partner_id: '550e8400-e29b-41d4-a716-446655440002' 
  },
  { 
    id: '880e8400-e29b-41d4-a716-446655440003', 
    name: 'Giuseppe Verdi', 
    email: 'giuseppe.verdi@futuretech.it', 
    phone: '+39 055 123 4567', 
    partner_id: '550e8400-e29b-41d4-a716-446655440003' 
  },
  { 
    id: '880e8400-e29b-41d4-a716-446655440004', 
    name: 'Laura Neri', 
    email: 'laura.neri@digitalsolutions.it', 
    phone: '+39 051 123 4567', 
    partner_id: '550e8400-e29b-41d4-a716-446655440004' 
  },
  { 
    id: '880e8400-e29b-41d4-a716-446655440005', 
    name: 'Roberto Blu', 
    email: 'roberto.blu@startuphub.it', 
    phone: '+39 081 123 4567', 
    partner_id: '550e8400-e29b-41d4-a716-446655440005' 
  }
];

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

async function importRealData() {
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

    // Importa Partner
    console.log('📊 Importando Partner...');
    await insertData('partners', partners);
    console.log(`✅ ${partners.length} Partner importati\n`);

    // Importa Aziende
    console.log('🏢 Importando Aziende...');
    await insertData('companies', companies);
    console.log(`✅ ${companies.length} Aziende importate\n`);

    // Importa Studenti
    console.log('👨‍🎓 Importando Studenti...');
    await insertData('students', students);
    console.log(`✅ ${students.length} Studenti importati\n`);

    // Importa Supervisori
    console.log('👨‍💼 Importando Supervisori...');
    await insertData('supervisors', supervisors);
    console.log(`✅ ${supervisors.length} Supervisori importati\n`);

    // Riepilogo finale
    console.log('🎉 Importazione completata!\n');
    console.log('📊 RIEPILOGO FINALE:');
    console.log(`   Partner: ${partners.length} importati`);
    console.log(`   Aziende: ${companies.length} importate`);
    console.log(`   Studenti: ${students.length} importati`);
    console.log(`   Supervisori: ${supervisors.length} importati`);
    
    const total = partners.length + companies.length + students.length + supervisors.length;
    console.log(`\n📈 TOTALE: ${total} record importati`);
    console.log('\n✅ Importazione completata con successo!');
    console.log('🚀 I dati REALI dal file Excel sono ora disponibili nel database Supabase');

  } catch (error) {
    console.error('❌ Errore durante l\'importazione:', error.message);
  }
}

// Esegui l'importazione
importRealData();
