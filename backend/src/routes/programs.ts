import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../index';
import { authenticate, type AuthenticatedRequest } from '../middleware/auth';
import { CustomError } from '../middleware/errorHandler';

const router = Router();

const createProgramSchema = z.object({
  name: z.string().min(2, 'Nome deve essere di almeno 2 caratteri'),
  description: z.string().optional(),
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  status: z.enum(['draft', 'active', 'completed', 'cancelled']).default('draft'),
  partner_id: z.string().uuid('ID partner non valido'),
});

const updateProgramSchema = z.object({
  name: z.string().min(2, 'Nome deve essere di almeno 2 caratteri').optional(),
  description: z.string().optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  status: z.enum(['draft', 'active', 'completed', 'cancelled']).optional(),
});

const programQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.enum(['draft', 'active', 'completed', 'cancelled']).optional(),
  partner_id: z.string().uuid().optional(),
});

// Get all programs
router.get('/', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { page, limit, search, status, partner_id } = programQuerySchema.parse(req.query);

    let query = supabase
      .from('programs')
      .select(`
        *,
        partners:partner_id (
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

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (status) {
      query = query.eq('status', status);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await query.range(from, to);

    if (error) {
      throw new CustomError('Errore nel recupero dei programmi', 500);
    }

    res.json({
      programs: data,
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

// Get program by ID
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;

    let query = supabase
      .from('programs')
      .select(`
        *,
        partners:partner_id (
          id,
          name
        )
      `)
      .eq('id', id);

    // Apply partner filter for non-admin users
    if (req.user!.role !== 'admin') {
      query = query.eq('partner_id', req.user!.partner_id);
    }

    const { data, error } = await query.single();

    if (error) {
      throw new CustomError('Programma non trovato', 404);
    }

    res.json({ program: data });
  } catch (error) {
    next(error);
  }
});

// Create program
router.post('/', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const programData = createProgramSchema.parse(req.body);

    // Set partner_id for non-admin users
    if (req.user!.role !== 'admin') {
      programData.partner_id = req.user!.partner_id;
    }

    const { data, error } = await supabase
      .from('programs')
      .insert(programData)
      .select(`
        *,
        partners:partner_id (
          id,
          name
        )
      `)
      .single();

    if (error) {
      throw new CustomError('Errore nella creazione del programma', 500);
    }

    res.status(201).json({ program: data });
  } catch (error) {
    next(error);
  }
});

// Update program
router.put('/:id', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;
    const updateData = updateProgramSchema.parse(req.body);

    let query = supabase
      .from('programs')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    // Apply partner filter for non-admin users
    if (req.user!.role !== 'admin') {
      query = query.eq('partner_id', req.user!.partner_id);
    }

    query = query.select(`
      *,
      partners:partner_id (
        id,
        name
      )
    `);

    const { data, error } = await query.single();

    if (error) {
      throw new CustomError('Errore nell\'aggiornamento del programma', 500);
    }

    res.json({ program: data });
  } catch (error) {
    next(error);
  }
});

// Delete program
router.delete('/:id', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;

    let query = supabase
      .from('programs')
      .delete()
      .eq('id', id);

    // Apply partner filter for non-admin users
    if (req.user!.role !== 'admin') {
      query = query.eq('partner_id', req.user!.partner_id);
    }

    const { error } = await query;

    if (error) {
      throw new CustomError('Errore nell\'eliminazione del programma', 500);
    }

    res.json({ message: 'Programma eliminato con successo' });
  } catch (error) {
    next(error);
  }
});

export { router as programsRoutes };

