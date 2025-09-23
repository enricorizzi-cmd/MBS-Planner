import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../index';
import { authenticate, requirePartnerAccess, type AuthenticatedRequest } from '../middleware/auth';
import { CustomError } from '../middleware/errorHandler';

const router = Router();

const createStudentSchema = z.object({
  name: z.string().min(2, 'Nome deve essere di almeno 2 caratteri'),
  email: z.string().email('Email non valida'),
  phone: z.string().optional(),
  partner_id: z.string().uuid('ID partner non valido'),
});

const updateStudentSchema = z.object({
  name: z.string().min(2, 'Nome deve essere di almeno 2 caratteri').optional(),
  email: z.string().email('Email non valida').optional(),
  phone: z.string().optional(),
});

const studentQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  partner_id: z.string().uuid().optional(),
});

// Get all students
router.get('/', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { page, limit, search, partner_id } = studentQuerySchema.parse(req.query);

    let query = supabase
      .from('students')
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
      throw new CustomError('Errore nel recupero degli studenti', 500);
    }

    res.json({
      students: data,
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

// Get student by ID
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;

    let query = supabase
      .from('students')
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
      throw new CustomError('Studente non trovato', 404);
    }

    res.json({ student: data });
  } catch (error) {
    next(error);
  }
});

// Create student
router.post('/', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const studentData = createStudentSchema.parse(req.body);

    // Set partner_id for non-admin users
    if (req.user!.role !== 'admin') {
      studentData.partner_id = req.user!.partner_id;
    }

    const { data, error } = await supabase
      .from('students')
      .insert(studentData)
      .select(`
        *,
        partners:partner_id (
          id,
          name
        )
      `)
      .single();

    if (error) {
      throw new CustomError('Errore nella creazione dello studente', 500);
    }

    res.status(201).json({ student: data });
  } catch (error) {
    next(error);
  }
});

// Update student
router.put('/:id', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;
    const updateData = updateStudentSchema.parse(req.body);

    let query = supabase
      .from('students')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    // Apply partner filter for non-admin users
    if (req.user!.role !== 'admin') {
      query = query.eq('partner_id', req.user!.partner_id);
    }

    const { data, error } = await query.select(`
      *,
      partners:partner_id (
        id,
        name
      )
    `).single();

    if (error) {
      throw new CustomError('Errore nell\'aggiornamento dello studente', 500);
    }

    res.json({ student: data });
  } catch (error) {
    next(error);
  }
});

// Delete student
router.delete('/:id', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;

    let query = supabase
      .from('students')
      .delete()
      .eq('id', id);

    // Apply partner filter for non-admin users
    if (req.user!.role !== 'admin') {
      query = query.eq('partner_id', req.user!.partner_id);
    }

    const { error } = await query;

    if (error) {
      throw new CustomError('Errore nell\'eliminazione dello studente', 500);
    }

    res.json({ message: 'Studente eliminato con successo' });
  } catch (error) {
    next(error);
  }
});

export { router as studentsRoutes };

