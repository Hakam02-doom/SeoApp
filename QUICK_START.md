# Quick Start - Connect Database

## ✅ .env File Created!

I've created your `.env` file with a generated `BETTER_AUTH_SECRET`. 

## 🔴 Action Required: Add Your Database Connection

You need to add your Neon database connection string:

### Step 1: Get Neon Connection String

1. Go to https://neon.tech
2. Sign up or log in
3. Create a new project (or use existing)
4. Copy the connection string from the dashboard
   - It looks like: `postgresql://user:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require`

### Step 2: Update .env File

Open `.env` and replace this line:
```
DATABASE_URL="postgresql://user:password@host.neon.tech/database?sslmode=require"
```

With your actual Neon connection string:
```
DATABASE_URL="postgresql://your-actual-neon-connection-string"
```

### Step 3: Run Database Migrations

Once you've added your DATABASE_URL:

```bash
npm run db:push
```

This will create all the tables in your database.

### Step 4: Start Development Server

```bash
npm run dev
```

Then visit http://localhost:5001

## Optional: Google OAuth Setup

If you want Google sign-in:

1. Go to https://console.cloud.google.com
2. Create OAuth 2.0 credentials
3. Add redirect URI: `http://localhost:5001/api/auth/callback/google`
4. Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to `.env`

## Current Status

✅ .env file created
✅ BETTER_AUTH_SECRET generated
⏳ Waiting for DATABASE_URL
⏳ Database migrations pending
