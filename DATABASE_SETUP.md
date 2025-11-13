# Database Setup Guide

## Step 1: Create Neon Database

1. Go to [Neon Console](https://neon.tech)
2. Sign up or log in
3. Click "Create Project"
4. Choose a name (e.g., "rankyak")
5. Select a region close to you
6. Click "Create Project"

## Step 2: Get Connection String

1. In your Neon project dashboard, you'll see a connection string
2. It looks like: `postgresql://user:password@host.neon.tech/dbname?sslmode=require`
3. Copy this connection string

## Step 3: Create .env File

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and paste your Neon connection string:
   ```
   DATABASE_URL="postgresql://your-actual-connection-string-here"
   ```

3. Generate a Better Auth secret:
   ```bash
   openssl rand -base64 32
   ```
   Copy the output and paste it as `BETTER_AUTH_SECRET` in `.env`

4. Set the URLs:
   ```
   BETTER_AUTH_URL="http://localhost:5001"
   NEXT_PUBLIC_APP_URL="http://localhost:5001"
   ```

## Step 4: Run Database Migrations

Once your `.env` file is set up with the DATABASE_URL:

```bash
# Generate Prisma Client (if not already done)
npm run db:generate

# Push schema to database (creates all tables)
npm run db:push
```

Or create a migration:
```bash
npm run db:migrate
```

## Step 5: Verify Connection

After running migrations, you should see:
- ✅ All tables created in Neon dashboard
- ✅ No errors in terminal

## Troubleshooting

### Connection Error
- Check your DATABASE_URL is correct
- Make sure the database is active in Neon
- Verify SSL mode is set correctly

### Migration Errors
- Make sure Prisma Client is generated: `npm run db:generate`
- Check that DATABASE_URL is in `.env` (not `.env.example`)
- Try `npm run db:push` instead of migrate

### Better Auth Errors
- Make sure BETTER_AUTH_SECRET is at least 32 characters
- Verify BETTER_AUTH_URL matches your app URL
