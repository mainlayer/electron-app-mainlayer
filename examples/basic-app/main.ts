/**
 * examples/basic-app/main.ts
 *
 * Minimal Electron + Mainlayer example.
 * Shows how to verify a license in the main process without the full template.
 *
 * Run: MAINLAYER_API_KEY=your_key npx tsx examples/basic-app/main.ts
 */
import { MainlayerClient } from '@mainlayer/sdk';

const mainlayer = new MainlayerClient({
  apiKey: process.env.MAINLAYER_API_KEY!,
});

const PREMIUM_RESOURCE_ID = process.env.MAINLAYER_PREMIUM_RESOURCE_ID ?? 'license_premium';

async function checkAccess(userId: string, licenseKey?: string) {
  console.log(`Checking access for user: ${userId}`);
  const access = await mainlayer.resources.verifyAccess(
    PREMIUM_RESOURCE_ID,
    userId,
    licenseKey ? { licenseKey } : undefined,
  );
  console.log('Result:', {
    authorized: access.authorized,
    plan: access.metadata?.plan ?? 'free',
  });
  return access;
}

async function main() {
  const userId = 'user_demo_desktop';
  const licenseKey = process.env.DEMO_LICENSE_KEY;

  // 1. Check without a key (returns false for unlicensed users)
  const anonymous = await checkAccess(userId);

  if (!anonymous.authorized && licenseKey) {
    // 2. Try with license key
    console.log('\nRetrying with license key...');
    await checkAccess(userId, licenseKey);
  }
}

main().catch(console.error);
