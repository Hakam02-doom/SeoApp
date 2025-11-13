# Environment Variables Setup Guide

## Finding Your Vercel Deployment URL

### Method 1: From Vercel Dashboard
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click on your project
3. Look at the top of the page - you'll see your deployment URL
4. It will look like: `https://your-project-name.vercel.app`
   - Or if you have a custom domain: `https://yourdomain.com`

### Method 2: From Deployment
1. Go to your Vercel project
2. Click on **Deployments** tab
3. Click on the latest deployment
4. The URL is shown at the top (e.g., `https://seo-app-abc123.vercel.app`)

## Setting Environment Variables in Vercel

### Step-by-Step Instructions

1. **Go to Your Project Settings**
   - Navigate to your project on Vercel
   - Click on **Settings** (in the top navigation)

2. **Open Environment Variables**
   - In the left sidebar, click **Environment Variables**

3. **Add Each Variable**
   - Click **Add New**
   - Enter the variable name
   - Enter the variable value
   - Select which environments to apply to:
     - ✅ **Production** (for your main deployment)
     - ✅ **Preview** (for pull request previews)
     - ✅ **Development** (for local development - optional)

4. **Click Save**

## Required Environment Variables

### 1. NEXT_PUBLIC_APP_URL
- **Name**: `NEXT_PUBLIC_APP_URL`
- **Value**: Your Vercel deployment URL
- **Example**: `https://your-app.vercel.app`
- **Important**: Must include `https://` and match your actual domain exactly

### 2. BETTER_AUTH_URL (Optional but Recommended)
- **Name**: `BETTER_AUTH_URL`
- **Value**: Same as `NEXT_PUBLIC_APP_URL`
- **Example**: `https://your-app.vercel.app`

### 3. DATABASE_URL (Required)
- **Name**: `DATABASE_URL`
- **Value**: Your PostgreSQL connection string
- **Example**: `postgresql://user:password@host:5432/database`
- **Note**: For Neon, use the connection string from your Neon dashboard

### 4. BETTER_AUTH_SECRET (Required)
- **Name**: `BETTER_AUTH_SECRET`
- **Value**: A secure random string (at least 32 characters)
- **Generate with**:
  ```bash
  openssl rand -base64 32
  ```
  Or:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
  ```

### 5. GOOGLE_CLIENT_ID (Optional)
- **Name**: `GOOGLE_CLIENT_ID`
- **Value**: Your Google OAuth Client ID
- **Only needed if using Google sign-in**

### 6. GOOGLE_CLIENT_SECRET (Optional)
- **Name**: `GOOGLE_CLIENT_SECRET`
- **Value**: Your Google OAuth Client Secret
- **Only needed if using Google sign-in**

### 7. OPENAI_API_KEY (Optional)
- **Name**: `OPENAI_API_KEY`
- **Value**: Your OpenAI API key
- **Only needed for AI features**

## Quick Setup Checklist

- [ ] Find your Vercel deployment URL
- [ ] Set `NEXT_PUBLIC_APP_URL` = `https://your-app.vercel.app`
- [ ] Set `BETTER_AUTH_URL` = `https://your-app.vercel.app` (same as above)
- [ ] Set `DATABASE_URL` = Your database connection string
- [ ] Generate and set `BETTER_AUTH_SECRET`
- [ ] (Optional) Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- [ ] (Optional) Set `OPENAI_API_KEY`
- [ ] Redeploy your application

## After Setting Variables

1. **Redeploy**: Go to **Deployments** → Click the three dots on latest deployment → **Redeploy**
2. **Check Logs**: After redeployment, check the function logs to verify:
   - `[Better Auth Config] Base URL: https://your-app.vercel.app`
   - `[Better Auth Config] Trusted Origins: [...]`

## Common Issues

### Issue: "Invalid origin" error
**Solution**: Make sure `NEXT_PUBLIC_APP_URL` exactly matches your Vercel domain (including `https://`)

### Issue: Variables not updating
**Solution**: 
- Make sure you selected the correct environment (Production/Preview)
- Redeploy after adding variables
- Variables are only available after redeployment

### Issue: Can't find deployment URL
**Solution**: 
- Check your Vercel project dashboard
- Look at the latest deployment
- The URL is always shown at the top of the deployment page

## Example Configuration

Here's what your environment variables should look like in Vercel:

```
NEXT_PUBLIC_APP_URL=https://seo-app-abc123.vercel.app
BETTER_AUTH_URL=https://seo-app-abc123.vercel.app
DATABASE_URL=postgresql://user:pass@host:5432/db
BETTER_AUTH_SECRET=your-generated-secret-here
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
OPENAI_API_KEY=sk-your-openai-key
```

## Notes

- **NEXT_PUBLIC_*** variables are exposed to the browser, so don't put secrets in them
- **BETTER_AUTH_SECRET** should be a strong random string
- Always use `https://` in production URLs
- The URL must match exactly (no trailing slashes, correct protocol)

