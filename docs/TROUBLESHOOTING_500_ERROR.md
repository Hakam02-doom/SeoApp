# Troubleshooting 500 Error on Sign-In

## Step 1: Check Vercel Function Logs

The 500 error means something is failing on the server. To find out what:

1. Go to your Vercel project dashboard
2. Click on **Deployments**
3. Click on the latest deployment
4. Click **View Function Logs** or check **Runtime Logs**
5. Look for error messages

## Common Causes and Solutions

### 1. Missing Environment Variables

**Check if these are set:**
- ✅ `DATABASE_URL` - Required
- ✅ `BETTER_AUTH_SECRET` - Required
- ✅ `NEXT_PUBLIC_APP_URL` - Required
- ✅ `BETTER_AUTH_URL` - Recommended (should match NEXT_PUBLIC_APP_URL)

**Solution:** Set all required variables in Vercel Settings → Environment Variables

### 2. Database Connection Failed

**Error in logs:** `DATABASE_URL is required but not set` or Prisma connection errors

**Solution:**
- Verify your `DATABASE_URL` is correct
- Test the connection string
- Make sure the database is accessible from Vercel
- For Neon: Use the direct connection string (not pooled)

### 3. Better Auth Initialization Failed

**Error in logs:** `Failed to initialize Better Auth` or `Auth initialization failed`

**Possible causes:**
- Missing `BETTER_AUTH_SECRET`
- Invalid `baseURL` configuration
- Database adapter initialization failed

**Solution:**
- Generate a new `BETTER_AUTH_SECRET`: `openssl rand -base64 32`
- Verify `NEXT_PUBLIC_APP_URL` matches your Vercel domain exactly
- Check database connection

### 4. Invalid Origin Error (403/500)

**Error in logs:** `Invalid origin` or origin mismatch

**Solution:**
- Make sure `NEXT_PUBLIC_APP_URL` exactly matches your Vercel URL
- Include `https://` in the URL
- No trailing slash
- Example: `https://seo-6zu5dweor-hakams-projects-a6d8ca99.vercel.app`

### 5. Database Schema Not Migrated

**Error in logs:** Prisma errors about missing tables or columns

**Solution:**
- Run database migrations:
  ```bash
  npx prisma migrate deploy
  ```
- Or push schema:
  ```bash
  npx prisma db push
  ```

## How to Check Logs in Vercel

1. **Function Logs:**
   - Go to your project → Deployments
   - Click on a deployment
   - Click **View Function Logs**
   - Look for `[Better Auth]`, `[Auth Route]`, or `[Prisma]` errors

2. **Runtime Logs:**
   - Same location, but check **Runtime Logs** tab
   - Shows all console.log and console.error output

## What to Look For in Logs

### Good Signs:
```
[Better Auth Config] Base URL: https://your-app.vercel.app
[Better Auth Config] Trusted Origins: [...]
[Auth Route] Better Auth initialized successfully
```

### Bad Signs:
```
[Better Auth] DATABASE_URL is required but not set
[Better Auth] BETTER_AUTH_SECRET is required but not set
[Auth Route] Failed to initialize Better Auth
[Prisma] Failed to connect to database
```

## Quick Checklist

- [ ] All environment variables are set in Vercel
- [ ] `DATABASE_URL` is correct and accessible
- [ ] `BETTER_AUTH_SECRET` is set (32+ characters)
- [ ] `NEXT_PUBLIC_APP_URL` matches your Vercel domain exactly
- [ ] Database schema is up to date
- [ ] Checked Vercel function logs for specific errors
- [ ] Redeployed after setting environment variables

## Still Getting 500 Error?

1. **Check the exact error in Vercel logs** - This will tell you what's wrong
2. **Verify environment variables** - Make sure they're set for Production environment
3. **Test database connection** - Try connecting with the same `DATABASE_URL`
4. **Check Better Auth initialization** - Look for initialization errors in logs

## Example: Setting Up Environment Variables

In Vercel Settings → Environment Variables, add:

```
DATABASE_URL=postgresql://user:password@host:5432/database
BETTER_AUTH_SECRET=your-generated-secret-here
NEXT_PUBLIC_APP_URL=https://seo-6zu5dweor-hakams-projects-a6d8ca99.vercel.app
BETTER_AUTH_URL=https://seo-6zu5dweor-hakams-projects-a6d8ca99.vercel.app
```

Then **redeploy** your application.

