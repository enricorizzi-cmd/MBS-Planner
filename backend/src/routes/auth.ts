import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../index.js';
import { authenticate, type AuthenticatedRequest } from '../middleware/auth.js';
import { CustomError } from '../middleware/errorHandler.js';
import { loginSchema, registerSchema, changePasswordSchema } from '../schemas/auth.js';

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

// Get partners for registration
router.get('/partners', async (req, res, next) => {
  try {
    const { data: partners, error } = await supabase
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

