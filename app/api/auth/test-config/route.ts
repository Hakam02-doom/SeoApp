import { NextResponse } from 'next/server';

export async function GET() {
  const config = {
    hasGoogleId: !!process.env.GOOGLE_CLIENT_ID,
    hasGoogleSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    googleIdLength: process.env.GOOGLE_CLIENT_ID?.length || 0,
    googleSecretLength: process.env.GOOGLE_CLIENT_SECRET?.length || 0,
    baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4000',
    hasDatabase: !!process.env.DATABASE_URL,
    hasSecret: !!process.env.BETTER_AUTH_SECRET || !!process.env.AUTH_SECRET,
    callbackURL: `${process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4000'}/api/auth/callback/social/google`,
  };

  return NextResponse.json(config, { status: 200 });
}

