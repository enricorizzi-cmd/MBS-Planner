import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email non valida'),
  password: z.string().min(6, 'Password deve essere di almeno 6 caratteri'),
});

export const registerSchema = z.object({
  email: z.string().email('Email non valida'),
  password: z.string().min(6, 'Password deve essere di almeno 6 caratteri'),
  name: z.string().min(2, 'Nome deve essere di almeno 2 caratteri'),
  role: z.enum(['admin', 'project_manager', 'amministrazione', 'titolare']),
  partner_id: z.string().uuid('ID partner non valido'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Password attuale richiesta'),
  newPassword: z.string().min(6, 'Nuova password deve essere di almeno 6 caratteri'),
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Email non valida'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

