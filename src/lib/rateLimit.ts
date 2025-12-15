import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting (use Redis in production)
class MemoryStore {
  private store = new Map<string, RateLimitEntry>();

  get(key: string): RateLimitEntry | undefined {
    const entry = this.store.get(key);
    
    // Clean up expired entries
    if (entry && Date.now() > entry.resetTime) {
      this.store.delete(key);
      return undefined;
    }
    
    return entry;
  }

  set(key: string, entry: RateLimitEntry): void {
    this.store.set(key, entry);
  }

  increment(key: string, windowMs: number): RateLimitEntry {
    const now = Date.now();
    const existing = this.get(key);
    
    if (existing) {
      existing.count++;
      return existing;
    } else {
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + windowMs,
      };
      this.set(key, newEntry);
      return newEntry;
    }
  }

  // Cleanup expired entries periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

const store = new MemoryStore();

// Cleanup every 5 minutes
setInterval(() => {
  store.cleanup();
}, 5 * 60 * 1000);

export function createRateLimit(config: RateLimitConfig) {
  const {
    windowMs,
    maxRequests,
    message = 'Too many requests, please try again later.',
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
  } = config;

  return async (request: NextRequest): Promise<NextResponse | null> => {
    // Get client identifier (IP address + user agent for better uniqueness)
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 
               request.headers.get('x-real-ip') || 
               'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const key = `${ip}:${userAgent}:${request.nextUrl.pathname}`;

    // Increment counter
    const entry = store.increment(key, windowMs);

    // Check if limit exceeded
    if (entry.count > maxRequests) {
      const resetTime = new Date(entry.resetTime).toISOString();
      
      return NextResponse.json(
        { 
          error: message,
          retryAfter: Math.ceil((entry.resetTime - Date.now()) / 1000),
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': resetTime,
            'Retry-After': Math.ceil((entry.resetTime - Date.now()) / 1000).toString(),
          }
        }
      );
    }

    // Add rate limit headers to successful responses
    const remaining = Math.max(0, maxRequests - entry.count);
    const resetTime = new Date(entry.resetTime).toISOString();

    // Return null to continue processing, but store headers for later
    request.headers.set('X-RateLimit-Limit', maxRequests.toString());
    request.headers.set('X-RateLimit-Remaining', remaining.toString());
    request.headers.set('X-RateLimit-Reset', resetTime);

    return null; // Continue processing
  };
}

// Predefined rate limit configurations
export const rateLimits = {
  // Strict rate limit for authentication endpoints
  auth: createRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
    message: 'Too many authentication attempts, please try again later.',
  }),

  // Moderate rate limit for API endpoints
  api: createRateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
    message: 'API rate limit exceeded, please slow down.',
  }),

  // Lenient rate limit for search endpoints
  search: createRateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
    message: 'Search rate limit exceeded, please slow down.',
  }),

  // Strict rate limit for file uploads
  upload: createRateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 uploads per minute
    message: 'Upload rate limit exceeded, please wait before uploading again.',
  }),

  // Very strict rate limit for admin operations
  admin: createRateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 requests per minute
    message: 'Admin operation rate limit exceeded.',
  }),
};

// Middleware helper to apply rate limiting
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  rateLimit: (request: NextRequest) => Promise<NextResponse | null>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Apply rate limiting
    const rateLimitResponse = await rateLimit(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Continue with original handler
    const response = await handler(request);

    // Add rate limit headers to response
    const limit = request.headers.get('X-RateLimit-Limit');
    const remaining = request.headers.get('X-RateLimit-Remaining');
    const reset = request.headers.get('X-RateLimit-Reset');

    if (limit) response.headers.set('X-RateLimit-Limit', limit);
    if (remaining) response.headers.set('X-RateLimit-Remaining', remaining);
    if (reset) response.headers.set('X-RateLimit-Reset', reset);

    return response;
  };
}

// CSRF Protection
export class CSRFProtection {
  private static readonly CSRF_HEADER = 'X-CSRF-Token';
  private static readonly CSRF_COOKIE = 'csrf-token';

  static generateToken(): string {
    // Generate a random token
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  static validateToken(request: NextRequest): boolean {
    // Skip CSRF for GET, HEAD, OPTIONS requests
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      return true;
    }

    const headerToken = request.headers.get(this.CSRF_HEADER);
    const cookieToken = request.cookies.get(this.CSRF_COOKIE)?.value;

    return !!(headerToken && cookieToken && headerToken === cookieToken);
  }

  static middleware(request: NextRequest): NextResponse | null {
    // Generate CSRF token for new sessions
    const existingToken = request.cookies.get(this.CSRF_COOKIE)?.value;
    
    if (!existingToken) {
      const token = this.generateToken();
      const response = NextResponse.next();
      response.cookies.set(this.CSRF_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24, // 24 hours
      });
      return response;
    }

    // Validate CSRF token for state-changing requests
    if (!this.validateToken(request)) {
      return NextResponse.json(
        { error: 'Invalid CSRF token' },
        { status: 403 }
      );
    }

    return null; // Continue processing
  }
}

// Input validation helpers
export const inputValidation = {
  // Sanitize string input
  sanitizeString(input: string, maxLength: number = 1000): string {
    return input
      .trim()
      .slice(0, maxLength)
      .replace(/[<>]/g, ''); // Basic XSS prevention
  },

  // Validate email format
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  },

  // Validate UUID format
  isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  },

  // Validate numeric input
  isValidNumber(value: any, min?: number, max?: number): boolean {
    const num = Number(value);
    if (isNaN(num)) return false;
    if (min !== undefined && num < min) return false;
    if (max !== undefined && num > max) return false;
    return true;
  },

  // Validate file upload
  isValidFile(file: File, allowedTypes: string[], maxSize: number): boolean {
    if (!allowedTypes.includes(file.type)) return false;
    if (file.size > maxSize) return false;
    return true;
  },
};

// Security audit logging
export class SecurityAuditLogger {
  static log(event: string, details: Record<string, any>, request?: NextRequest) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      details,
      ip: request?.headers.get('x-forwarded-for') || 
          request?.headers.get('x-real-ip') || 
          'unknown',
      userAgent: request?.headers.get('user-agent') || 'unknown',
      url: request?.url || 'unknown',
    };

    // In production, send to logging service
    console.log('SECURITY_AUDIT:', JSON.stringify(logEntry));
  }

  static logRateLimitExceeded(request: NextRequest) {
    this.log('RATE_LIMIT_EXCEEDED', {
      path: request.nextUrl.pathname,
      method: request.method,
    }, request);
  }

  static logCSRFViolation(request: NextRequest) {
    this.log('CSRF_VIOLATION', {
      path: request.nextUrl.pathname,
      method: request.method,
    }, request);
  }

  static logSuspiciousActivity(request: NextRequest, reason: string) {
    this.log('SUSPICIOUS_ACTIVITY', {
      reason,
      path: request.nextUrl.pathname,
      method: request.method,
    }, request);
  }
}