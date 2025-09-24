import type { Request, Response, NextFunction } from 'express';
import type { MulterFile } from '../types/multer.js';
import { supabase } from '../index.js';
import { CustomError } from './errorHandler.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    partner_id: string;
  };
  file?: MulterFile;
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new CustomError('No token provided', 401);
    }

    const token = authHeader.substring(7);

    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw new CustomError('Invalid token', 401);
    }

    // Get user profile from database
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      throw new CustomError('User profile not found', 404);
    }

    req.user = {
      id: user.id,
      email: user.email!,
      role: profile.role,
      partner_id: profile.partner_id,
    };

    next();
  } catch (error) {
    next(error);
  }
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new CustomError('Authentication required', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new CustomError('Insufficient permissions', 403));
    }

    next();
  };
};

export const requireAdmin = requireRole(['admin']);

export const requirePartnerAccess = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new CustomError('Authentication required', 401));
  }

  // Admin can access all partners
  if (req.user.role === 'admin') {
    return next();
  }

  // Other users can only access their own partner
  const partnerId = req.params.partnerId || req.body.partner_id || req.query.partner_id;
  
  if (partnerId && partnerId !== req.user.partner_id) {
    return next(new CustomError('Access denied to this partner', 403));
  }

  next();
};

