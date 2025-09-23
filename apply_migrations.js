const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Supabase configuration
const supabaseUrl = 'https://cxegnwuwfpgfzbactgtc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4ZWdud3V3ZnBnZnpiYWN0Z3RjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODYxNzg2NCwiZXhwIjoyMDc0MTkzODY0fQ.LsSp6_k3-XAAetTT0Ht8gqgNvYBsukxQV3lXODF6Mcw';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigrations() {
  try {
    console.log('🚀 Starting database migrations...');
    
    // Read the SQL file
    const sqlContent = fs.readFileSync('apply_migrations.sql', 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
          const { data, error } = await supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            console.error(`❌ Error in statement ${i + 1}:`, error);
            // Continue with next statement
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.error(`❌ Exception in statement ${i + 1}:`, err.message);
        }
      }
    }
    
    console.log('🎉 Migrations completed!');
    
    // Test the partners table
    console.log('🔍 Testing partners table...');
    const { data: partners, error: partnersError } = await supabase
      .from('partners')
      .select('*');
    
    if (partnersError) {
      console.error('❌ Error testing partners table:', partnersError);
    } else {
      console.log('✅ Partners table test successful:', partners);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Run migrations
applyMigrations();
