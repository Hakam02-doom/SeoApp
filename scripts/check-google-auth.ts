/**
 * Script to check Google OAuth setup and identify issues
 */

import { db } from '../lib/db';

async function checkGoogleAuth() {
  console.log('🔍 Checking Google OAuth Setup...\n');

  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log('  GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Missing');
  console.log('  GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '✅ Set' : '❌ Missing');
  console.log('  BETTER_AUTH_URL:', process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || '❌ Missing');
  console.log('  DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Missing');
  console.log('');

  // Check users
  console.log('👥 Users in Database:');
  const users = await db.user.findMany({
    include: {
      accounts: true,
    },
  });

  console.log(`  Total users: ${users.length}`);
  
  users.forEach((user, index) => {
    console.log(`\n  User ${index + 1}:`);
    console.log(`    ID: ${user.id}`);
    console.log(`    Email: ${user.email}`);
    console.log(`    Name: ${user.name || 'N/A'}`);
    console.log(`    Accounts: ${user.accounts.length}`);
    user.accounts.forEach((account) => {
      console.log(`      - ${account.provider} (${account.providerAccountId || 'N/A'})`);
    });
  });

  // Check for potential conflicts
  console.log('\n⚠️  Potential Issues:');
  
  // Users with multiple accounts
  const usersWithMultipleAccounts = users.filter(u => u.accounts.length > 1);
  if (usersWithMultipleAccounts.length > 0) {
    console.log(`  ⚠️  ${usersWithMultipleAccounts.length} user(s) have multiple accounts (this is OK if account linking worked)`);
  }

  // Users with email/password but no Google account
  const usersWithEmailOnly = users.filter(u => 
    u.accounts.some(a => a.provider === 'credential') && 
    !u.accounts.some(a => a.provider === 'google')
  );
  if (usersWithEmailOnly.length > 0) {
    console.log(`  ⚠️  ${usersWithEmailOnly.length} user(s) have email/password but no Google account`);
    console.log('     These users might cause "unable_to_link_account" when trying to sign in with Google');
    usersWithEmailOnly.forEach(u => {
      console.log(`     - ${u.email} (ID: ${u.id})`);
    });
  }

  // Check for duplicate Google accounts
  const googleAccounts = await db.account.findMany({
    where: { provider: 'google' },
    include: { user: true },
  });
  
  const providerAccountIds = new Map<string, number>();
  googleAccounts.forEach(acc => {
    if (acc.providerAccountId) {
      const count = providerAccountIds.get(acc.providerAccountId) || 0;
      providerAccountIds.set(acc.providerAccountId, count + 1);
    }
  });

  const duplicates = Array.from(providerAccountIds.entries()).filter(([_, count]) => count > 1);
  if (duplicates.length > 0) {
    console.log(`  ❌ Found ${duplicates.length} duplicate Google account(s):`);
    duplicates.forEach(([providerAccountId, count]) => {
      console.log(`     - Provider Account ID: ${providerAccountId} (appears ${count} times)`);
    });
  }

  console.log('\n✅ Check complete!\n');
  
  // Recommendations
  if (usersWithEmailOnly.length > 0) {
    console.log('💡 Recommendations:');
    console.log('  1. Try signing in with Google using the same email as an existing email/password account');
    console.log('  2. Account linking should automatically connect them');
    console.log('  3. If it fails, the user might need to delete their email/password account first');
    console.log('');
  }

  await db.$disconnect();
}

checkGoogleAuth().catch(console.error);

