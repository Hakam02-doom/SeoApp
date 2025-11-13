import { NextResponse } from 'next/server';

export enum ErrorCode {
  // Client errors (4xx)
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMIT = 'RATE_LIMIT',
  
  // Server errors (5xx)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR = 'DATABASE_ERROR',
  
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  
  // Business logic errors
  DUPLICATE = 'DUPLICATE',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  MISSING_KEYWORD = 'MISSING_KEYWORD',
  MISSING_PROJECT_ID = 'MISSING_PROJECT_ID',
  INVALID_PLATFORM = 'INVALID_PLATFORM',
  NO_INTEGRATION = 'NO_INTEGRATION',
  PUBLISH_FAILED = 'PUBLISH_FAILED',
  IMAGE_GENERATION_FAILED = 'IMAGE_GENERATION_FAILED',
  
  // Unknown
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export class APIError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export function handleAPIError(error: unknown): NextResponse {
  console.error('[API Error]', error);

  if (error instanceof APIError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        details: error.details,
      },
      { 
        status: error.statusCode,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  if (error instanceof Error) {
    // Prisma errors
    if (error.message.includes('Unique constraint') || error.message.includes('P2002')) {
      return NextResponse.json(
        {
          error: 'Resource already exists',
          code: ErrorCode.DUPLICATE,
        },
        { 
          status: 409,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (error.message.includes('Record to delete does not exist') || error.message.includes('P2025')) {
      return NextResponse.json(
        {
          error: 'Resource not found',
          code: ErrorCode.NOT_FOUND,
        },
        { 
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (error.message.includes('Foreign key constraint') || error.message.includes('P2003')) {
      return NextResponse.json(
        {
          error: 'Cannot perform this operation due to related records',
          code: ErrorCode.CONFLICT,
        },
        { 
          status: 409,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (error.message.includes('Prisma') || error.message.includes('database')) {
      return NextResponse.json(
        {
          error: 'Database error occurred',
          code: ErrorCode.DATABASE_ERROR,
        },
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Validation errors
    if (error.name === 'ZodError' || error.message.includes('validation')) {
      return NextResponse.json(
        {
          error: 'Invalid input data',
          code: ErrorCode.VALIDATION_ERROR,
          details: (error as any).issues || error.message,
        },
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
        code: ErrorCode.INTERNAL_ERROR,
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  return NextResponse.json(
    {
      error: 'Internal server error',
      code: ErrorCode.UNKNOWN_ERROR,
    },
    { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

export function successResponse(data: any, status: number = 200): NextResponse {
  return NextResponse.json(data, { status });
}

