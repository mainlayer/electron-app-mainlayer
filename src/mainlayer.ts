// src/mainlayer.ts
//
// License management for the Electron desktop app.
// Handles online verification, local caching, and offline grace period.

import { MainlayerClient } from '@mainlayer/sdk';
import Store from 'electron-store';

interface LicenseCache {
  userId: string;
  licenseKey: string;
  authorized: boolean;
  plan: string;
  verifiedAt: number; // Unix timestamp (ms)
  expiresAt?: number; // Unix timestamp (ms)
}

interface StoreSchema {
  license: LicenseCache | null;
}

const store = new Store<StoreSchema>({ name: 'mainlayer-license' });

const GRACE_PERIOD_MS = 7 * 24 * 60 * 60 * 1000; // 7 days offline grace
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // Re-verify every 24h

const mainlayer = new MainlayerClient({
  apiKey: process.env.MAINLAYER_API_KEY ?? '',
});

const PREMIUM_RESOURCE_ID =
  process.env.MAINLAYER_PREMIUM_RESOURCE_ID ?? 'license_premium';

export interface LicenseStatus {
  authorized: boolean;
  plan: string;
  offline: boolean;
  gracePeriodActive: boolean;
  gracePeriodRemainingMs?: number;
}

/**
 * Verify a license key against Mainlayer.
 * Falls back to cached result during offline grace period.
 */
export async function verifyLicense(
  userId: string,
  licenseKey?: string,
): Promise<LicenseStatus> {
  const cached = store.get('license');

  // Try online verification first
  try {
    const access = await mainlayer.resources.verifyAccess(
      PREMIUM_RESOURCE_ID,
      userId,
      licenseKey ? { licenseKey } : undefined,
    );

    const newCache: LicenseCache = {
      userId,
      licenseKey: licenseKey ?? cached?.licenseKey ?? '',
      authorized: access.authorized,
      plan: (access.metadata?.plan as string) ?? 'free',
      verifiedAt: Date.now(),
      expiresAt: access.metadata?.expiresAt
        ? new Date(access.metadata.expiresAt as string).getTime()
        : undefined,
    };
    store.set('license', newCache);

    return {
      authorized: access.authorized,
      plan: newCache.plan,
      offline: false,
      gracePeriodActive: false,
    };
  } catch (err) {
    console.warn('[Mainlayer] Online verification failed, checking cache:', err);
  }

  // Offline fallback
  if (cached && cached.userId === userId) {
    const ageMs = Date.now() - cached.verifiedAt;
    const withinGrace = ageMs < GRACE_PERIOD_MS;

    if (withinGrace) {
      return {
        authorized: cached.authorized,
        plan: cached.plan,
        offline: true,
        gracePeriodActive: true,
        gracePeriodRemainingMs: GRACE_PERIOD_MS - ageMs,
      };
    }
  }

  // Grace period expired or no cache — deny access
  return {
    authorized: false,
    plan: 'free',
    offline: true,
    gracePeriodActive: false,
  };
}

/**
 * Activate a license key for the given user.
 * Stores the result in the local cache on success.
 */
export async function activateLicense(
  userId: string,
  licenseKey: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const status = await verifyLicense(userId, licenseKey);
    if (status.authorized) {
      return { success: true, message: `License activated. Plan: ${status.plan}` };
    }
    return { success: false, message: 'License key is not valid or has expired.' };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Activation failed';
    return { success: false, message };
  }
}

/**
 * Clear the stored license (deactivate / sign out).
 */
export function clearLicense(): void {
  store.delete('license');
}

/**
 * Get the cached license without a network call.
 */
export function getCachedLicense(): LicenseCache | null {
  return store.get('license') ?? null;
}

/**
 * Check if the cache is stale and needs refresh.
 */
export function isCacheStale(): boolean {
  const cached = store.get('license');
  if (!cached) return true;
  return Date.now() - cached.verifiedAt > CACHE_TTL_MS;
}
