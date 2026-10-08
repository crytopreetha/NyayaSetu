import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let details = err.details;

  // Handle known PostgreSQL Database Errors
  if (err.code === '23505') {
    // Unique violation
    statusCode = 409;
    message = 'A record with these unique details already exists.';
    details = { constraint: err.constraint };
  } else if (err.code === '23503') {
    // Foreign key violation
    statusCode = 400;
    message = 'Referenced related record does not exist or violates dependency rules.';
    details = { constraint: err.constraint };
  } else if (err.code === '22P02') {
    // Invalid text representation (e.g. invalid UUID format)
    statusCode = 400;
    message = 'Invalid identifier format (e.g., malformed UUID).';
  }

  // Safe logging without leaking sensitive document content
  logger.error('Handled API Error', {
    method: req.method,
    path: req.originalUrl || req.url,
    statusCode,
    message: err.message,
    code: err.code,
  });

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(details && { details }),
      ...(process.env.NODE_ENV === 'development' && !err.isOperational && { stack: err.stack }),
    },
  });
};
