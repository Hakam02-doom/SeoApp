# Google OAuth Fix Guide

## What Was Fixed

1. **Enhanced Error Handling**: Added comprehensive error logging and specific error messages for common issues
2. **Account Creation Hooks**: Added hooks to track user and account creation for debugging
3. **Better Error Messages**: Improved error responses with specific error codes
4. **Test Endpoint**: Created `/api/auth/test-config` to verify configuration

## Configuration Check

Visit `http://localhost:4000/api/auth/test-config` to verify:
- Google Client ID is set
- Google Client Secret is set
- Base URL is correct
- Database connection is configured
- Callback URL is correct

## Google Cloud Console Setup

**CRITICAL**: Make sure your Google Cloud Console has the correct callback URL:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to: **APIs & Services** → **Credentials**
3. Edit your OAuth 2.0 Client ID
4. **Authorized JavaScript origins**:
   - `http://localhost:4000` (or your actual port)
5. **Authorized redirect URIs**:
   - `http://localhost:4000/api/auth/callback/social/google`
   - Also try: `http://localhost:4000/api/auth/callback/google` (if the first doesn't work)

## Environment Variables

Make sure your `.env` file has:

```env
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
BETTER_AUTH_URL="http://localhost:4000"
NEXT_PUBLIC_APP_URL="http://localhost:4000"
BETTER_AUTH_SECRET="your-secret-here"
DATABASE_URL="your-database-url"
```

## Debugging Steps

1. **Check Server Logs**: When you try to sign in with Google, watch the terminal for:
   - `[Better Auth Hook] User created:` - User was created successfully
   - `[Better Auth Hook] Account created:` - Account was linked successfully
   - `[Better Auth ERROR]` - Error occurred, check the message
   - `[Auth Route Handler] Error response body:` - Error details from Better Auth

2. **Check Browser Console**: Look for any JavaScript errors

3. **Check Network Tab**: 
   - Look for the request to `/api/auth/sign-in/social`
   - Check the response status and body
   - Look for the redirect to Google OAuth

4. **Test Configuration**: Visit `/api/auth/test-config` to verify all settings

## Common Issues

### "unable_to_create_user"
- **Cause**: Database constraint violation or missing required data
- **Fix**: Check server logs for specific error. May need to clean up duplicate accounts or fix database schema

### "unable_to_link_account"
- **Cause**: Account linking failed (user exists but can't link Google account)
- **Fix**: Check if user already exists with email/password. Account linking should handle this automatically.

### "redirect_uri_mismatch"
- **Cause**: Callback URL in Google Console doesn't match
- **Fix**: Update Google Console with exact callback URL from test-config endpoint

### "invalid_client"
- **Cause**: Wrong Client ID or Secret
- **Fix**: Verify environment variables are correct and server was restarted

## Next Steps

1. Restart the server (already done)
2. Visit `/api/auth/test-config` to verify configuration
3. Try signing in with Google
4. Check server logs for detailed error messages
5. If still failing, share the exact error message from server logs

