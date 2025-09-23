import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://cxegnwuwfpgfzbactgtc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4ZWdud3V3ZnBnZnpiYWN0Z3RjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODYxNzg2NCwiZXhwIjoyMDc0MTkzODY0fQ.LsSp6_k3-XAAetTT0Ht8gqgNvYBsukxQV3lXODF6Mcw';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testDatabase() {
  console.log('🔍 Testing database connection...');
  console.log('🔧 Supabase URL:', supabaseUrl);
  console.log('🔧 Service Key length:', supabaseServiceKey.length);
  
  try {
    // Test 1: Basic connection
    console.log('\n1️⃣ Testing basic connection...');
    const { data: healthCheck, error: healthError } = await supabase
      .from('_supabase_migrations')
      .select('version')
      .limit(1);
    
    if (healthError) {
      console.error('❌ Basic connection failed:', healthError);
      return;
    }
    
    console.log('✅ Basic connection successful');
    
    // Test 2: Check if partners table exists
    console.log('\n2️⃣ Checking if partners table exists...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'partners')
      .eq('table_schema', 'public');
    
    if (tableError) {
      console.error('❌ Cannot check table existence:', tableError);
      return;
    }
    
    if (!tableCheck || tableCheck.length === 0) {
      console.log('❌ Partners table does NOT exist');
      console.log('🔧 Need to create the table');
      return;
    }
    
    console.log('✅ Partners table exists');
    
    // Test 3: Try to select from partners table
    console.log('\n3️⃣ Testing partners table access...');
    const { data: partnersData, error: partnersError } = await supabase
      .from('partners')
      .select('*');
    
    if (partnersError) {
      console.error('❌ Cannot access partners table:', partnersError);
      console.error('❌ Error details:', JSON.stringify(partnersError, null, 2));
      return;
    }
    
    console.log('✅ Partners table access successful');
    console.log('📊 Partners data:', partnersData);
    console.log('📊 Number of partners:', partnersData?.length || 0);
    
    // Test 4: Try to insert a test partner
    console.log('\n4️⃣ Testing partner insertion...');
    const { data: inserted, error: insertError } = await supabase
      .from('partners')
      .insert([{ name: 'Test Partner' }])
      .select('id, name');
    
    if (insertError) {
      console.error('❌ Cannot insert into partners table:', insertError);
      console.error('❌ Insert error details:', JSON.stringify(insertError, null, 2));
    } else {
      console.log('✅ Partner insertion successful');
      console.log('📊 Inserted partner:', inserted);
      
      // Clean up - delete the test partner
      if (inserted && inserted[0]) {
        const { error: deleteError } = await supabase
          .from('partners')
          .delete()
          .eq('id', inserted[0].id);
        
        if (deleteError) {
          console.log('⚠️ Could not delete test partner:', deleteError);
        } else {
          console.log('🧹 Test partner cleaned up');
        }
      }
    }
    
    console.log('\n🎉 Database test completed successfully!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testDatabase();
