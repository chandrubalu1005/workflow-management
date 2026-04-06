import rateLimit from 'express-rate-limit';

/**
 * Auth limiter — 5 login attempts per 15 minutes
 */
export const authLimiter = (req, res, next) => next(); // COMPLETELY DISABLED

/**
 * Signup limiter — 3 accounts per hour
 */
export const signupLimiter = (req, res, next) => next(); // COMPLETELY DISABLED

/**
 * General API limiter — 100 requests per minute
 */
export const apiLimiter = (req, res, next) => next(); // COMPLETELY DISABLED
