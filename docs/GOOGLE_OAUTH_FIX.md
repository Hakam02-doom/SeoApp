# Google OAuth Route Fix

## Issue
The route `/api/auth/sign-in/google` was returning 404.

## Changes Made

1. **Updated route path in login/register pages:**
   - Changed from: `/api/auth/sign-in/google`
   - Changed to: `/api/auth/sign-in/social/google`

2. **Route handler:**
   - The `[...all]` catch-all route should handle all Better Auth routes
   - Handler is correctly set up with `toNextJsHandler(auth)`

## Testing

1. **Restart the dev server:**
   ```bash
   npm run dev
   ```

2. **Test the route:**
   - Go to: `http://localhost:5001/login`
   - Click "Sign in with Google"
   - Should redirect to Google OAuth

## If Still Not Working

### Check Google Cloud Console:
1. **Authorized redirect URIs** should include:
   - `http://localhost:5001/api/auth/callback/google`
   - OR: `http://localhost:5001/api/auth/callback/social/google`

2. **Try both callback URLs:**
   - Better Auth might use different callback paths
   - Check server logs for the actual callback URL being used

### Alternative Route Paths to Try:
- `/api/auth/sign-in/social/google` (current)
- `/api/auth/sign-in/google` (original)
- `/api/auth/oauth/google`
- `/api/auth/google`

### Debug Steps:
1. Check server console for route matching
2. Check browser network tab for actual request URL
3. Verify Better Auth version compatibility
4. Check if route handler is being called at all
