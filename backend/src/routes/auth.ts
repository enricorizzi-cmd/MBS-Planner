import { Router } from 'express';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../index.js';
import { config } from '../config.js';
import { authenticate, type AuthenticatedRequest } from '../middleware/auth.js';
import { CustomError } from '../middleware/errorHandler.js';
import { loginSchema, registerSchema, changePasswordSchema } from '../schemas/auth.js';

// Create admin client with service role key for bypassing RLS
const adminSupabase = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

const router = Router();

// Login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new CustomError('Credenziali non valide', 401);
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      throw new CustomError('Errore nel recupero del profilo utente', 500);
    }

    res.json({
      user: data.user,
      session: data.session,
      profile,
    });
  } catch (error) {
    next(error);
  }
});

// Logout
router.post('/logout', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      throw new CustomError('Errore durante il logout', 500);
    }

    res.json({ message: 'Logout effettuato con successo' });
  } catch (error) {
    next(error);
  }
});

// Get current user
router.get('/me', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { data: profile, error } = await supabase
      .from('users')
      .select(`
        *,
        partners:partner_id (
          id,
          name
        )
      `)
      .eq('id', req.user!.id)
      .single();

    if (error) {
      throw new CustomError('Profilo utente non trovato', 404);
    }

    res.json({
      user: req.user,
      profile,
    });
  } catch (error) {
    next(error);
  }
});

// Change password
router.post('/change-password', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

    // Verify current password
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: req.user!.email,
      password: currentPassword,
    });

    if (verifyError) {
      throw new CustomError('Password attuale non corretta', 400);
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      throw new CustomError('Errore durante l\'aggiornamento della password', 500);
    }

    res.json({ message: 'Password aggiornata con successo' });
  } catch (error) {
    next(error);
  }
});

// Test database connection
router.get('/test-db', async (req, res, next) => {
  try {
    console.log('🔍 Testing database connection...');
    console.log('🔧 Supabase URL:', config.supabase.url);
    console.log('🔧 Service Role Key length:', config.supabase.serviceRoleKey?.length || 0);
    
    // Test basic connection with admin client
    const { data, error } = await adminSupabase
      .from('partners')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Database connection test failed:', error);
      return res.status(500).json({ 
        success: false, 
        error: error.message,
        details: error,
        config: {
          url: config.supabase.url,
          hasServiceKey: !!config.supabase.serviceRoleKey,
          serviceKeyLength: config.supabase.serviceRoleKey?.length || 0
        }
      });
    }

    console.log('✅ Database connection test successful');
    return res.json({ 
      success: true, 
      message: 'Database connection successful',
      data 
    });
  } catch (error) {
    console.error('❌ Unexpected error in test-db:', error);
    return next(error);
  }
});

// Check configuration
router.get('/config-check', async (req, res, next) => {
  try {
    const configInfo = {
      supabaseUrl: config.supabase.url,
      hasAnonKey: !!config.supabase.anonKey,
      hasServiceKey: !!config.supabase.serviceRoleKey,
      serviceKeyLength: config.supabase.serviceRoleKey?.length || 0,
      anonKeyLength: config.supabase.anonKey?.length || 0,
      nodeEnv: config.nodeEnv,
      port: config.port
    };
    
    console.log('🔧 Configuration check:', configInfo);
    
    return res.json({
      success: true,
      config: configInfo,
      issues: []
    });
  } catch (error) {
    console.error('❌ Error checking configuration:', error);
    return next(error);
  }
});

// Force create partners table (simplified)
router.post('/force-create-partners', async (req, res, next) => {
  try {
    console.log('🚀 Force creating partners table...');
    
    // Direct approach: just try to insert a partner
    // This will fail if the table doesn't exist, giving us more info
    const { data: inserted, error: insertError } = await adminSupabase
      .from('partners')
      .insert([{ name: 'Partner Demo' }])
      .select('id, name');
    
    if (insertError) {
      console.error('❌ Cannot insert partner (table may not exist):', insertError);
      console.error('❌ Full error details:', JSON.stringify(insertError, null, 2));
      
      return res.status(500).json({
        success: false,
        error: 'Partners table does not exist or cannot insert',
        details: insertError,
        suggestion: 'Need to run database migrations manually'
      });
    }
    
    console.log('✅ Partner inserted successfully');
    
    return res.json({
      success: true,
      message: 'Partners table exists and works',
      partners: inserted
    });
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return next(error);
  }
});

// Debug database structure
router.get('/debug-db', async (req, res, next) => {
  try {
    console.log('🔍 Debugging database structure...');
    
    // Test 1: Check if we can connect to Supabase at all
    const { data: healthCheck, error: healthError } = await adminSupabase
      .from('_supabase_migrations')
      .select('version')
      .limit(1);
    
    if (healthError) {
      console.error('❌ Cannot connect to Supabase:', healthError);
      return res.status(500).json({
        success: false,
        step: 'health_check',
        error: healthError.message,
        details: healthError
      });
    }
    
    console.log('✅ Supabase connection successful');
    
    // Test 2: Check if partners table exists
    const { data: tableCheck, error: tableError } = await adminSupabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'partners')
      .eq('table_schema', 'public');
    
    if (tableError) {
      console.error('❌ Cannot check table existence:', tableError);
      return res.status(500).json({
        success: false,
        step: 'table_check',
        error: tableError.message,
        details: tableError
      });
    }
    
    console.log('✅ Table check successful:', tableCheck);
    
    if (!tableCheck || tableCheck.length === 0) {
      return res.status(404).json({
        success: false,
        step: 'table_exists',
        error: 'Partners table does not exist',
        suggestion: 'Run database migrations'
      });
    }
    
    // Test 3: Try to select from partners table
    const { data: partnersData, error: partnersError } = await adminSupabase
      .from('partners')
      .select('*')
      .limit(1);
    
    if (partnersError) {
      console.error('❌ Cannot select from partners table:', partnersError);
      return res.status(500).json({
        success: false,
        step: 'select_partners',
        error: partnersError.message,
        details: partnersError,
        rlsError: partnersError.message.includes('RLS') || partnersError.message.includes('policy')
      });
    }
    
    console.log('✅ Partners table access successful:', partnersData);
    
    return res.json({
      success: true,
      message: 'Database structure is correct',
      data: {
        supabaseConnected: true,
        partnersTableExists: true,
        canAccessPartners: true,
        partnersCount: partnersData?.length || 0
      }
    });
    
  } catch (error) {
    console.error('❌ Unexpected error in debug-db:', error);
    return next(error);
  }
});

// Get partners for registration
router.get('/partners', async (req, res, next) => {
  try {
    const { data: partners, error } = await adminSupabase
      .from('partners')
      .select('id, name')
      .order('name');

    if (error) {
      throw new CustomError('Errore nel recupero dei partner', 500);
    }

    res.json(partners);
  } catch (error) {
    next(error);
  }
});

// Temporary: Seed a demo partner for first-time setup
router.post('/partners/seed', async (req, res, next) => {
  try {
    console.log('🔍 Checking existing partners...');
    console.log('🔧 Using admin client with service role key');
    
    // First, try to disable RLS temporarily for this operation
    const { error: rlsError } = await adminSupabase.rpc('disable_rls_for_partners');
    if (rlsError) {
      console.log('⚠️ Could not disable RLS (this is normal if function doesn\'t exist):', rlsError.message);
    }
    
    const { data: existingPartners, error: existingError } = await adminSupabase
      .from('partners')
      .select('id')
      .limit(1);

    if (existingError) {
      console.error('❌ Error checking existing partners:', existingError);
      console.error('❌ Error details:', JSON.stringify(existingError, null, 2));
      
      // Try to re-enable RLS even if there was an error
      await adminSupabase.rpc('enable_rls_for_partners');
      
      throw new CustomError(`Errore nel controllo dei partner esistenti: ${existingError.message}`, 500);
    }

    console.log('✅ Existing partners check successful:', existingPartners);

    if (existingPartners && existingPartners.length > 0) {
      // Re-enable RLS before returning
      await adminSupabase.rpc('enable_rls_for_partners');
      return res.json({ created: false, message: 'Partner già presenti' });
    }

    console.log('🔧 Creating demo partner...');
    
    const { data: inserted, error: insertError } = await adminSupabase
      .from('partners')
      .insert([{ name: 'Partner Demo' }])
      .select('id, name');

    if (insertError) {
      console.error('❌ Error creating demo partner:', insertError);
      console.error('❌ Insert error details:', JSON.stringify(insertError, null, 2));
      
      // Try to re-enable RLS even if there was an error
      await adminSupabase.rpc('enable_rls_for_partners');
      
      throw new CustomError(`Errore nella creazione del partner di test: ${insertError.message}`, 500);
    }

    // Re-enable RLS after successful operation
    await adminSupabase.rpc('enable_rls_for_partners');

    console.log('✅ Demo partner created successfully:', inserted);
    return res.status(201).json({ created: true, partners: inserted });
  } catch (error) {
    console.error('❌ Unexpected error in partners/seed:', error);
    
    // Try to re-enable RLS even if there was an unexpected error
    try {
      await adminSupabase.rpc('enable_rls_for_partners');
    } catch (rlsError) {
      console.error('❌ Could not re-enable RLS:', rlsError);
    }
    
    return next(error);
  }
});

// Register new user
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, name, role, partner_id } = registerSchema.parse(req.body);

    // Check if this is the first user in the system
    const { data: existingUsers, error: countError } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (countError) {
      throw new CustomError('Errore nel controllo utenti esistenti', 500);
    }

    const isFirstUser = existingUsers.length === 0;
    const finalRole = isFirstUser ? 'admin' : role;

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      throw new CustomError('Errore durante la registrazione: ' + authError.message, 400);
    }

    if (!authData.user) {
      throw new CustomError('Errore durante la creazione dell\'utente', 500);
    }

    // Create user profile in database
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        name,
        role: finalRole,
        partner_id,
      })
      .select()
      .single();

    if (profileError) {
      // If profile creation fails, we should clean up the auth user
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw new CustomError('Errore durante la creazione del profilo utente', 500);
    }

    res.status(201).json({
      user: authData.user,
      session: authData.session,
      profile,
      isFirstUser,
    });
  } catch (error) {
    next(error);
  }
});

// Refresh token
router.post('/refresh', async (req, res, next) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      throw new CustomError('Refresh token richiesto', 400);
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token,
    });

    if (error) {
      throw new CustomError('Token di refresh non valido', 401);
    }

    res.json({
      user: data.user,
      session: data.session,
    });
  } catch (error) {
    next(error);
  }
});

export { router as authRoutes };

