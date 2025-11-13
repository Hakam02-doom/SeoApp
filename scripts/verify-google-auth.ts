/**
 * Script to verify Google OAuth configuration
 * Run with: npx tsx scripts/verify-google-auth.ts
 */

const requiredEnvVars = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'BETTER_AUTH_URL',
  'BETTER_AUTH_SECRET',
];

console.log('🔍 Verifying Google OAuth Configuration...\n');

let allValid = true;

for (const envVar of requiredEnvVars) {
  const value = process.env[envVar];
  if (!value || value.trim() === '') {
    console.log(`❌ ${envVar} is not set or is empty`);
    allValid = false;
  } else {
    console.log(`✅ ${envVar} is set`);
    if (envVar.includes('SECRET') || envVar.includes('CLIENT_SECRET')) {
      console.log(`   Value: ${value.substring(0, 10)}... (hidden)`);
    } else {
      console.log(`   Value: ${value}`);
    }
  }
}

console.log('\n📋 Configuration Checklist:');
console.log('1. Google OAuth credentials obtained from Google Cloud Console');
console.log('2. Authorized redirect URI set to: http://localhost:5001/api/auth/callback/google');
console.log('3. Authorized JavaScript origin set to: http://localhost:5001');
console.log('4. Google+ API or Google Identity API enabled in Google Cloud Console');

if (allValid) {
  console.log('\n✅ All environment variables are set!');
  console.log('🚀 Google OAuth should work. Try signing in at /login');
} else {
  console.log('\n⚠️  Some environment variables are missing.');
  console.log('📝 Please update your .env file with the required values.');
  console.log('📖 See GOOGLE_SETUP.md for detailed instructions.');
}
