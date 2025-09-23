// Script per testare l'importazione dei supervisori
const SUPABASE_URL = 'https://cxegnwuwfpgfzbactgtc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4ZWdud3V3ZnBnZnpiYWN0Z3RjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODYxNzg2NCwiZXhwIjoyMDc0MTkzODY0fQ.LsSp6_k3-XAAetTT0Ht8gqgNvYBsukxQV3lXODF6Mcw';

const supervisors = [
  { id: '880e8400-e29b-41d4-a716-446655440001', name: 'Marco Rossi', email: 'marco.rossi@techcorp.it', phone: '+39 02 123 4567', company_id: '660e8400-e29b-41d4-a716-446655440001', partner_id: '550e8400-e29b-41d4-a716-446655440001' },
  { id: '880e8400-e29b-41d4-a716-446655440002', name: 'Sara Bianchi', email: 'sara.bianchi@innovatelab.it', phone: '+39 011 123 4567', company_id: '660e8400-e29b-41d4-a716-446655440002', partner_id: '550e8400-e29b-41d4-a716-446655440002' },
  { id: '880e8400-e29b-41d4-a716-446655440003', name: 'Giuseppe Verdi', email: 'giuseppe.verdi@futuretech.it', phone: '+39 055 123 4567', company_id: '660e8400-e29b-41d4-a716-446655440003', partner_id: '550e8400-e29b-41d4-a716-446655440003' },
  { id: '880e8400-e29b-41d4-a716-446655440004', name: 'Laura Neri', email: 'laura.neri@digitalsolutions.it', phone: '+39 051 123 4567', company_id: '660e8400-e29b-41d4-a716-446655440004', partner_id: '550e8400-e29b-41d4-a716-446655440004' },
  { id: '880e8400-e29b-41d4-a716-446655440005', name: 'Roberto Blu', email: 'roberto.blu@startuphub.it', phone: '+39 081 123 4567', company_id: '660e8400-e29b-41d4-a716-446655440005', partner_id: '550e8400-e29b-41d4-a716-446655440005' }
];

async function insertSupervisor(supervisor) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/supervisors`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'apikey': SUPABASE_KEY,
      'Prefer': 'resolution=merge-duplicates'
    },
    body: JSON.stringify(supervisor)
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

async function testSupervisors() {
  console.log('🔍 Testando importazione supervisori uno alla volta...\n');

  for (let i = 0; i < supervisors.length; i++) {
    const supervisor = supervisors[i];
    try {
      console.log(`📝 Importando supervisore ${i + 1}: ${supervisor.name}`);
      await insertSupervisor(supervisor);
      console.log(`✅ Supervisore "${supervisor.name}" importato con successo\n`);
    } catch (error) {
      console.log(`❌ Errore con supervisore "${supervisor.name}": ${error.message}\n`);
    }
  }
}

testSupervisors();
