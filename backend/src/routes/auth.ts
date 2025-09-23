import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../index';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { CustomError } from '../middleware/errorHandler';
import { loginSchema, registerSchema, changePasswordSchema } from '../schemas/auth';

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

