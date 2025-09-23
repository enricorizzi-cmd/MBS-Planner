const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configurazione Supabase
const supabaseUrl = 'https://cxegnwuwfpgfzbactgtc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4ZWdud3V3ZnBnZnpiYWN0Z3RjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODYxNzg2NCwiZXhwIjoyMDc0MTkzODY0fQ.LsSp6_k3-XAAetTT0Ht8gqgNvYBsukxQV3lXODF6Mcw';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('🔄 Applicando migrazione per aggiungere campi mancanti...\n');

  try {
    // Leggi il file di migrazione
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '015_add_missing_fields.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Contenuto migrazione:');
    console.log(migrationSQL.substring(0, 500) + '...\n');

    // Applica la migrazione usando l'API REST
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({
        sql: migrationSQL
      })
    });

    if (response.ok) {
      console.log('✅ Migrazione applicata con successo!');
    } else {
      const error = await response.text();
      console.log('❌ Errore nell\'applicazione della migrazione:', error);
      
      // Prova con un approccio diverso - esegui le query una per una
      console.log('\n🔄 Tentativo con approccio alternativo...');
      await applyMigrationAlternative();
    }

  } catch (error) {
    console.error('❌ Errore durante l\'applicazione della migrazione:', error.message);
  }
}

async function applyMigrationAlternative() {
  console.log('🔄 Applicando migrazione con approccio alternativo...\n');

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
    
    // Crea tabella student_companies
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
    const query = queries[i];
    console.log(`📝 Eseguendo query ${i + 1}/${queries.length}...`);
    
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey
        },
        body: JSON.stringify({
          sql: query
        })
      });

      if (response.ok) {
        console.log(`✅ Query ${i + 1} eseguita con successo`);
      } else {
        const error = await response.text();
        console.log(`⚠️ Query ${i + 1} con warning:`, error);
      }
    } catch (error) {
      console.log(`❌ Errore query ${i + 1}:`, error.message);
    }
  }

  console.log('\n✅ Migrazione alternativa completata!');
}

// Esegui la migrazione
applyMigration();
