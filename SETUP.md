# RankYak Setup Guide

## Phase 1: Foundation Setup Complete ✅

### What's Been Set Up

1. **Dependencies Installed**
   - tRPC v11 (type-safe API)
   - Prisma ORM v5
   - Better Auth
   - Polar Payments SDK
   - React Query
   - Zod validation

2. **Database Schema Created**
   - User, Account, Session models (Better Auth)
   - Project model
   - Keyword model
   - Article model
   - Backlink model
   - Integration model
   - Subscription model

3. **tRPC Infrastructure**
   - Server setup with context
   - Client setup with React Query
   - Router structure
   - Auth and User routers created

4. **Better Auth Configuration**
   - Email/password authentication
   - Google OAuth setup
   - Session management

5. **Polar Payments**
   - SDK configured
   - Webhook endpoint created

6. **Pages Created**
   - Login page
   - Register page
   - Dashboard layout

## Next Steps

### 1. Set Up Neon Database

1. Go to [Neon Console](https://neon.tech)
2. Create a new project
3. Copy the connection string
4. Add to `.env` file:
   ```
   DATABASE_URL="postgresql://..."
   ```

### 2. Run Database Migrations

```bash
# Generate Prisma Client (already done)
npm run db:generate

# Push schema to database
npm run db:push

# Or create a migration
npm run db:migrate
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env` and fill in:

```bash
cp .env.example .env
```

Required variables:
- `DATABASE_URL` - Neon PostgreSQL connection string
- `BETTER_AUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `BETTER_AUTH_URL` - Your app URL (http://localhost:5001)
- `GOOGLE_CLIENT_ID` - From Google Cloud Console
- `GOOGLE_CLIENT_SECRET` - From Google Cloud Console
- `POLAR_ACCESS_TOKEN` - From Polar dashboard
- `OPENAI_API_KEY` - For article generation (optional for now)

### 4. Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Add authorized redirect URI: `http://localhost:5001/api/auth/callback/google`
4. Copy Client ID and Secret to `.env`

### 5. Set Up Polar Payments

1. Sign up at [Polar.sh](https://polar.sh)
2. Create organization
3. Generate Organization Access Token
4. Add to `.env` as `POLAR_ACCESS_TOKEN`

### 6. Test the Setup

```bash
# Start development server
npm run dev

# Visit http://localhost:5001
# Try accessing /dashboard (should redirect to login)
# Try /login and /register pages
```

## Current Status

✅ Foundation complete
✅ Database schema ready
✅ tRPC infrastructure ready
✅ Auth structure ready
⏳ Need to connect to actual database
⏳ Need to implement Better Auth session handling
⏳ Need to complete auth flows

## File Structure Created

```
/
├── prisma/
│   └── schema.prisma          # Database schema
├── server/
│   └── trpc/
│       ├── trpc.ts            # tRPC setup
│       ├── router/
│       │   ├── _app.ts        # Main router
│       │   ├── auth.ts        # Auth router
│       │   └── user.ts        # User router
├── lib/
│   ├── db.ts                  # Prisma client
│   ├── auth.ts                # Better Auth config
│   ├── polar.ts               # Polar Payments
│   └── trpc/
│       ├── client.ts          # tRPC client
│       └── server.ts          # Server caller
├── app/
│   ├── api/
│   │   ├── trpc/[trpc]/route.ts
│   │   ├── auth/[...all]/route.ts
│   │   └── polar/webhook/route.ts
│   ├── login/page.tsx
│   ├── register/page.tsx
│   └── providers.tsx
└── middleware.ts
```

## Next Implementation Phase

Once database is connected and environment variables are set:
1. Complete Better Auth integration
2. Implement project management
3. Build article generation
4. Add keyword discovery
5. Create content calendar
6. Set up publishing system
