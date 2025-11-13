import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { db } from './db';

// Better Auth is now enabled
const ENABLE_BETTER_AUTH = true;

// Lazy initialization to avoid errors during module import
let authInstance: ReturnType<typeof betterAuth> | null = null;

export function getAuthInstance() {
  if (!authInstance) {
    authInstance = getAuth();
  }
  return authInstance;
}

function getAuth() {
  if (!ENABLE_BETTER_AUTH) {
    // Return mock auth to allow app to load
    return {
      api: {
        getSession: async () => null,
        signInEmail: async () => null,
        signUpEmail: async () => null,
        signOut: async () => null,
      },
    } as any;
  }

  try {
    // Check if database URL is configured
    if (!process.env.DATABASE_URL) {
      console.warn('[Better Auth] DATABASE_URL not found, using mock auth');
      return {
        api: {
          getSession: async () => null,
          signInEmail: async () => null,
          signUpEmail: async () => null,
          signOut: async () => null,
        },
      } as any;
    }

    return betterAuth({
      database: prismaAdapter(db, {
        provider: 'postgresql',
        usePlural: false,
      }),
      emailAndPassword: {
        enabled: true,
        requireEmailVerification: false,
      },
      socialProviders: {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID || '',
          clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        },
      },
      account: {
        accountLinking: {
          enabled: true,
          // Allow linking accounts even if emails don't match
          allowDifferentEmails: true,
          // Trust Google as a provider for account linking
          trustedProviders: ['google'],
          // Allow updating user info when linking
          updateUserInfoOnLink: true,
        },
      },
      baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4000',
      secret: process.env.BETTER_AUTH_SECRET || process.env.AUTH_SECRET || 'fallback-secret-for-development-only-change-in-production',
      session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // 1 day
      },
      trustedOrigins: [
        process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4000',
      ],
    });
  } catch (error: any) {
    console.error('[Better Auth] Initialization error:', error);
    console.error('[Better Auth] Error details:', error?.message, error?.stack);
    // Return a mock object to prevent app crash
    return {
      api: {
        getSession: async () => null,
        signInEmail: async () => null,
        signUpEmail: async () => null,
        signOut: async () => null,
      },
    } as any;
  }
}

// Export auth with lazy initialization using Proxy
// This prevents Better Auth from initializing during module import
export const auth = new Proxy({} as ReturnType<typeof betterAuth>, {
  get(_target, prop) {
    try {
      const instance = getAuth();
      if (!instance) {
        // Return mock methods if initialization failed
        if (prop === 'api') {
          return {
            getSession: async () => null,
            signInEmail: async () => null,
            signUpEmail: async () => null,
            signOut: async () => null,
          };
        }
        return undefined;
      }
      const value = (instance as any)[prop];
      if (typeof value === 'function') {
        return value.bind(instance);
      }
      return value;
    } catch (error) {
      console.error('[Auth Proxy] Error accessing property:', prop, error);
      // Return mock methods if there's an error
      if (prop === 'api') {
        return {
          getSession: async () => null,
          signInEmail: async () => null,
          signUpEmail: async () => null,
          signOut: async () => null,
        };
      }
      return undefined;
    }
  },
});

// Type exports - these won't cause initialization
export type Session = any;
export type User = any;