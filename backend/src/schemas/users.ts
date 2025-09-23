import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email('Email non valida'),
  name: z.string().min(2, 'Nome deve essere di almeno 2 caratteri'),
  role: z.enum(['admin', 'project_manager', 'amministrazione', 'titolare']),
  partner_id: z.string().uuid('ID partner non valido'),
});

export const updateUserSchema = z.object({
  name: z.string().min(2, 'Nome deve essere di almeno 2 caratteri').optional(),
  role: z.enum(['admin', 'project_manager', 'amministrazione', 'titolare']).optional(),
  partner_id: z.string().uuid('ID partner non valido').optional(),
});

export const userQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  role: z.enum(['admin', 'project_manager', 'amministrazione', 'titolare']).optional(),
  partner_id: z.string().uuid().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserQueryInput = z.infer<typeof userQuerySchema>;

