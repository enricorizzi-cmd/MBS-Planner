import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../index';
import { authenticate, type AuthenticatedRequest } from '../middleware/auth';
import { CustomError } from '../middleware/errorHandler';

const router = Router();

const createCompanySchema = z.object({
  name: z.string().min(2, 'Nome deve essere di almeno 2 caratteri'),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email non valida').optional(),
  partner_id: z.string().uuid('ID partner non valido'),
});

const updateCompanySchema = z.object({
  name: z.string().min(2, 'Nome deve essere di almeno 2 caratteri').optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email non valida').optional(),
});

const companyQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  partner_id: z.string().uuid().optional(),
});

// Get all companies
router.get('/', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { page, limit, search, partner_id } = companyQuerySchema.parse(req.query);

    let query = supabase
      .from('companies')
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

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await query.range(from, to);

    if (error) {
      throw new CustomError('Errore nel recupero delle aziende', 500);
    }

    res.json({
      companies: data,
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

// Get company by ID
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;

    let query = supabase
      .from('companies')
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
      throw new CustomError('Azienda non trovata', 404);
    }

    res.json({ company: data });
  } catch (error) {
    next(error);
  }
});

// Create company
router.post('/', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const companyData = createCompanySchema.parse(req.body);

    // Set partner_id for non-admin users
    if (req.user!.role !== 'admin') {
      companyData.partner_id = req.user!.partner_id;
    }

    const { data, error } = await supabase
      .from('companies')
      .insert(companyData)
      .select(`
        *,
        partners:partner_id (
          id,
          name
        )
      `)
      .single();

    if (error) {
      throw new CustomError('Errore nella creazione dell\'azienda', 500);
    }

    res.status(201).json({ company: data });
  } catch (error) {
    next(error);
  }
});

// Update company
router.put('/:id', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;
    const updateData = updateCompanySchema.parse(req.body);

    let query = supabase
      .from('companies')
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
      throw new CustomError('Errore nell\'aggiornamento dell\'azienda', 500);
    }

    res.json({ company: data });
  } catch (error) {
    next(error);
  }
});

// Delete company
router.delete('/:id', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;

    let query = supabase
      .from('companies')
      .delete()
      .eq('id', id);

    // Apply partner filter for non-admin users
    if (req.user!.role !== 'admin') {
      query = query.eq('partner_id', req.user!.partner_id);
    }

    const { error } = await query;

    if (error) {
      throw new CustomError('Errore nell\'eliminazione dell\'azienda', 500);
    }

    res.json({ message: 'Azienda eliminata con successo' });
  } catch (error) {
    next(error);
  }
});

export { router as companiesRoutes };

