import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Minimal middleware - just passes through all requests
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

// Empty matcher means middleware runs on all routes
// But since we just pass through, it doesn't affect anything
export const config = {
  matcher: [],
};

