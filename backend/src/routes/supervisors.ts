import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../index';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { CustomError } from '../middleware/errorHandler';

const router = Router();

const createSupervisorSchema = z.object({
  name: z.string().min(2, 'Nome deve essere di almeno 2 caratteri'),
  email: z.string().email('Email non valida'),
  phone: z.string().optional(),
  company_id: z.string().uuid('ID azienda non valido'),
  partner_id: z.string().uuid('ID partner non valido'),
});

const updateSupervisorSchema = z.object({
  name: z.string().min(2, 'Nome deve essere di almeno 2 caratteri').optional(),
  email: z.string().email('Email non valida').optional(),
  phone: z.string().optional(),
  company_id: z.string().uuid('ID azienda non valido').optional(),
});

const supervisorQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  partner_id: z.string().uuid().optional(),
  company_id: z.string().uuid().optional(),
});

// Get all supervisors
router.get('/', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { page, limit, search, partner_id, company_id } = supervisorQuerySchema.parse(req.query);

    let query = supabase
      .from('supervisors')
      .select(`
        *,
        partners:partner_id (
          id,
          name
        ),
        companies:company_id (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false });

    // Apply partner filter for non-admin users
    if (req.user!.role !== 'admin') {
      query = query.eq('partner_id', req.user!.partner_id);
    } else if (partner_id) {
      query = query.eq('partner_id', partner_id);
    }

    // Apply company filter
    if (company_id) {
      query = query.eq('company_id', company_id);
    }

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await query.range(from, to);

    if (error) {
      throw new CustomError('Errore nel recupero dei supervisori', 500);
    }

    res.json({
      supervisors: data,
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

// Get supervisor by ID
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;

    let query = supabase
      .from('supervisors')
      .select(`
        *,
        partners:partner_id (
          id,
          name
        ),
        companies:company_id (
          id,
          name
        )
      `)
      .eq('id', id)
      .single();

    // Apply partner filter for non-admin users
    if (req.user!.role !== 'admin') {
      query = query.eq('partner_id', req.user!.partner_id);
    }

    const { data, error } = await query;

    if (error) {
      throw new CustomError('Supervisore non trovato', 404);
    }

    res.json({ supervisor: data });
  } catch (error) {
    next(error);
  }
});

// Create supervisor
router.post('/', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const supervisorData = createSupervisorSchema.parse(req.body);

    // Set partner_id for non-admin users
    if (req.user!.role !== 'admin') {
      supervisorData.partner_id = req.user!.partner_id;
    }

    const { data, error } = await supabase
      .from('supervisors')
      .insert(supervisorData)
      .select(`
        *,
        partners:partner_id (
          id,
          name
        ),
        companies:company_id (
          id,
          name
        )
      `)
      .single();

    if (error) {
      throw new CustomError('Errore nella creazione del supervisore', 500);
    }

    res.status(201).json({ supervisor: data });
  } catch (error) {
    next(error);
  }
});

// Update supervisor
router.put('/:id', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;
    const updateData = updateSupervisorSchema.parse(req.body);

    let query = supabase
      .from('supervisors')
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
        ),
        companies:company_id (
          id,
          name
        )
      `)
      .single();

    // Apply partner filter for non-admin users
    if (req.user!.role !== 'admin') {
      query = query.eq('partner_id', req.user!.partner_id);
    }

    const { data, error } = await query;

    if (error) {
      throw new CustomError('Errore nell\'aggiornamento del supervisore', 500);
    }

    res.json({ supervisor: data });
  } catch (error) {
    next(error);
  }
});

// Delete supervisor
router.delete('/:id', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;

    let query = supabase
      .from('supervisors')
      .delete()
      .eq('id', id);

    // Apply partner filter for non-admin users
    if (req.user!.role !== 'admin') {
      query = query.eq('partner_id', req.user!.partner_id);
    }

    const { error } = await query;

    if (error) {
      throw new CustomError('Errore nell\'eliminazione del supervisore', 500);
    }

    res.json({ message: 'Supervisore eliminato con successo' });
  } catch (error) {
    next(error);
  }
});

export { router as supervisorsRoutes };

