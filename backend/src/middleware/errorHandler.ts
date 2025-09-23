import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export class CustomError extends Error implements AppError {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal Server Error';

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    statusCode = 400;
    message = 'Validation Error';
    const errors = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
    }));

    return res.status(statusCode).json({
      error: 'Validation Error',
      message,
      details: errors,
      timestamp: new Date().toISOString(),
      path: req.path,
    });
  }

  // Handle Supabase errors
  if (error.message?.includes('JWT')) {
    statusCode = 401;
    message = 'Invalid or expired token';
  }

  if (error.message?.includes('RLS')) {
    statusCode = 403;
    message = 'Access denied';
  }

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', {
      message: error.message,
      stack: error.stack,
      statusCode,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString(),
    });
  }

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production' && !error.isOperational) {
    message = 'Something went wrong';
  }

  res.status(statusCode).json({
    error: statusCode >= 500 ? 'Internal Server Error' : 'Client Error',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    timestamp: new Date().toISOString(),
    path: req.path,
  });
};

