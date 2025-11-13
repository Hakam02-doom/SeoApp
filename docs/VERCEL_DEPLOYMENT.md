# Vercel Deployment Guide

## Required Environment Variables

Make sure to set these environment variables in your Vercel project settings:

### Essential Variables

1. **DATABASE_URL** (Required)
   - Your PostgreSQL database connection string
   - Example: `postgresql://user:password@host:5432/database`
   - For Neon: Use the connection string from your Neon dashboard

2. **BETTER_AUTH_SECRET** (Required)
   - A secure random string for encrypting sessions
   - Generate with: `openssl rand -base64 32`
   - Or use: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`

3. **NEXT_PUBLIC_APP_URL** (Required)
   - Your Vercel deployment URL
   - Example: `https://your-app.vercel.app`
   - This should match your Vercel domain

4. **BETTER_AUTH_URL** (Optional, but recommended)
   - Should match `NEXT_PUBLIC_APP_URL`
   - Example: `https://your-app.vercel.app`

### Optional Variables

5. **GOOGLE_CLIENT_ID** (Optional)
   - Required only if you want Google OAuth
   - Get from Google Cloud Console

6. **GOOGLE_CLIENT_SECRET** (Optional)
   - Required only if you want Google OAuth
   - Get from Google Cloud Console

7. **OPENAI_API_KEY** (Optional)
   - Required for AI features (article generation, keyword research)
   - Get from OpenAI dashboard

8. **REDIS_URL** (Optional)
   - Required only if using background jobs
   - Example: `redis://default:password@host:6379`

## Setting Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable:
   - **Name**: The variable name (e.g., `DATABASE_URL`)
   - **Value**: The variable value
   - **Environment**: Select which environments (Production, Preview, Development)
4. Click **Save**

## Common Deployment Issues

### 500 Error on Sign-In

If you're getting a 500 error when trying to sign in, check:

1. **Database Connection**
   - Verify `DATABASE_URL` is set correctly
   - Test the connection string
   - Ensure the database is accessible from Vercel's IP ranges

2. **Auth Secret**
   - Verify `BETTER_AUTH_SECRET` is set
   - Make sure it's a strong random string (at least 32 characters)

3. **Base URL**
   - Verify `NEXT_PUBLIC_APP_URL` matches your Vercel domain
   - Check that `BETTER_AUTH_URL` (if set) matches

4. **Database Schema**
   - Run migrations: `npx prisma migrate deploy`
   - Or push schema: `npx prisma db push`

### Database Connection Issues

If you're using Neon or another serverless Postgres:

1. **Connection Pooling**
   - Use the direct connection string (not pooled) for Better Auth
   - Set `DATABASE_URL` to the direct connection string
   - Optionally set `DATABASE_URL_UNPOOLED` for Prisma

2. **SSL Mode**
   - Some databases require SSL
   - Add `?sslmode=require` to your connection string if needed

### Checking Logs

1. Go to your Vercel project dashboard
2. Navigate to **Deployments**
3. Click on a deployment
4. Click **View Function Logs** or check the **Runtime Logs**

Look for errors like:
- `DATABASE_URL is required but not set`
- `BETTER_AUTH_SECRET is required but not set`
- `Failed to initialize Better Auth`
- Prisma connection errors

## Post-Deployment Checklist

- [ ] All environment variables are set
- [ ] Database is accessible from Vercel
- [ ] Database schema is up to date
- [ ] `NEXT_PUBLIC_APP_URL` matches your Vercel domain
- [ ] Test sign-in functionality
- [ ] Test sign-up functionality
- [ ] Test Google OAuth (if enabled)
- [ ] Check Vercel function logs for errors

## Troubleshooting

### Error: "Authentication service unavailable"

This means Better Auth failed to initialize. Check:
1. Environment variables are set correctly
2. Database is accessible
3. Vercel function logs for specific error messages

### Error: "Sign in failed (500)"

Check Vercel function logs for:
- Database connection errors
- Missing environment variables
- Better Auth initialization errors

### Database Migration Issues

If you need to run migrations:

```bash
# Option 1: Use Prisma Migrate
npx prisma migrate deploy

# Option 2: Push schema (development only)
npx prisma db push
```

Note: You may need to run these locally and commit the migration files, or use Vercel's build command to run migrations during deployment.

