# Google OAuth Setup Guide

## Step 1: Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Enable the **Google+ API** (or **Google Identity API**)
4. Go to **Credentials** → **Create Credentials** → **OAuth client ID**
5. Choose **Web application**
6. Configure:
   - **Name**: RankYak (or your app name)
   - **Authorized JavaScript origins**: 
     - `http://localhost:5001` (for development)
     - Your production URL (for production)
   - **Authorized redirect URIs**:
     - `http://localhost:5001/api/auth/callback/google` (for development)
     - `https://yourdomain.com/api/auth/callback/google` (for production)

7. Copy the **Client ID** and **Client Secret**

## Step 2: Add to .env File

Open your `.env` file and add:

```env
GOOGLE_CLIENT_ID="your-client-id-here.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret-here"
```

## Step 3: Restart Development Server

After adding the credentials, restart your dev server:

```bash
npm run dev
```

## Step 4: Test Google Sign-In

1. Go to `/login` or `/register`
2. Click "Sign in with Google" or "Sign up with Google"
3. You should be redirected to Google's consent screen
4. After approval, you'll be redirected back and logged in

## Troubleshooting

### "redirect_uri_mismatch" Error
- Make sure the redirect URI in Google Console exactly matches: `http://localhost:5001/api/auth/callback/google`
- Check for trailing slashes or http vs https

### "invalid_client" Error
- Verify your Client ID and Secret are correct in `.env`
- Make sure there are no extra spaces or quotes

### OAuth Not Working
- Check that Better Auth is properly configured
- Verify `BETTER_AUTH_URL` matches your app URL
- Check browser console for errors
