/**
 * Script to fix existing accounts by syncing provider field with providerId
 */
import { db } from '../lib/db';

async function fixProviderField() {
  console.log('🔧 Fixing provider field for existing accounts...\n');

  try {
    // Get all accounts
    const accounts = await db.account.findMany({
      select: {
        id: true,
        provider: true,
        providerId: true,
      },
    });

    console.log(`Found ${accounts.length} accounts`);

    let updated = 0;
    for (const account of accounts) {
      if (account.providerId && account.provider !== account.providerId) {
        await db.account.update({
          where: { id: account.id },
          data: { provider: account.providerId },
        });
        console.log(`✅ Updated account ${account.id}: provider = "${account.providerId}"`);
        updated++;
      }
    }

    console.log(`\n✅ Fixed ${updated} accounts`);
  } catch (error: any) {
    console.error('❌ Error fixing provider field:', error);
    throw error;
  }
}

fixProviderField()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

