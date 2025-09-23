import { Router } from 'express';
import { supabase } from '../index';
import { authenticate, requireAdmin, requirePartnerAccess, AuthenticatedRequest } from '../middleware/auth';
import { CustomError } from '../middleware/errorHandler';
import { createUserSchema, updateUserSchema, userQuerySchema } from '../schemas/users';

const router = Router();

// Get all users (admin only)
router.get('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { page, limit, search, role, partner_id } = userQuerySchema.parse(req.query);

    let query = supabase
      .from('users')
      .select(`
        *,
        partners:partner_id (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    if (role) {
      query = query.eq('role', role);
    }

    if (partner_id) {
      query = query.eq('partner_id', partner_id);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await query.range(from, to);

    if (error) {
      throw new CustomError('Errore nel recupero degli utenti', 500);
    }

    res.json({
      users: data,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get users by partner (for non-admin users)
router.get('/partner/:partnerId', authenticate, requirePartnerAccess, async (req, res, next) => {
  try {
    const { partnerId } = req.params;
    const { page, limit, search, role } = userQuerySchema.parse(req.query);

    let query = supabase
      .from('users')
      .select(`
        *,
        partners:partner_id (
          id,
          name
        )
      `)
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    if (role) {
      query = query.eq('role', role);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await query.range(from, to);

    if (error) {
      throw new CustomError('Errore nel recupero degli utenti', 500);
    }

    res.json({
      users: data,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get user by ID
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;

    // Check if user can access this user's data
    if (req.user!.role !== 'admin' && req.user!.id !== id) {
      throw new CustomError('Accesso negato', 403);
    }

    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        partners:partner_id (
          id,
          name
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw new CustomError('Utente non trovato', 404);
    }

    res.json({ user: data });
  } catch (error) {
    next(error);
  }
});

// Create user (admin only)
router.post('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const userData = createUserSchema.parse(req.body);

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: 'temp_password_123', // User will need to change this
      email_confirm: true,
    });

    if (authError) {
      throw new CustomError('Errore nella creazione dell\'utente', 500);
    }

    // Create user profile
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        partner_id: userData.partner_id,
      })
      .select(`
        *,
        partners:partner_id (
          id,
          name
        )
      `)
      .single();

    if (error) {
      // Clean up auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw new CustomError('Errore nella creazione del profilo utente', 500);
    }

    res.status(201).json({ user: data });
  } catch (error) {
    next(error);
  }
});

// Update user
router.put('/:id', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;
    const updateData = updateUserSchema.parse(req.body);

    // Check permissions
    if (req.user!.role !== 'admin' && req.user!.id !== id) {
      throw new CustomError('Accesso negato', 403);
    }

    // Non-admin users can only update their own name
    if (req.user!.role !== 'admin') {
      delete updateData.role;
      delete updateData.partner_id;
    }

    const { data, error } = await supabase
      .from('users')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`
        *,
        partners:partner_id (
          id,
          name
        )
      `)
      .single();

    if (error) {
      throw new CustomError('Errore nell\'aggiornamento dell\'utente', 500);
    }

    res.json({ user: data });
  } catch (error) {
    next(error);
  }
});

// Delete user (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (req.user!.id === id) {
      throw new CustomError('Non puoi eliminare il tuo stesso account', 400);
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (dbError) {
      throw new CustomError('Errore nell\'eliminazione dell\'utente', 500);
    }

    // Delete from auth
    const { error: authError } = await supabase.auth.admin.deleteUser(id);

    if (authError) {
      console.error('Error deleting user from auth:', authError);
    }

    res.json({ message: 'Utente eliminato con successo' });
  } catch (error) {
    next(error);
  }
});

export { router as usersRoutes };

