import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock dependencies before any imports
vi.mock('@mainlayer/sdk', () => ({
  MainlayerClient: vi.fn().mockImplementation(() => ({
    resources: {
      verifyAccess: vi.fn(),
    },
  })),
}));

vi.mock('electron-store', () => {
  const data: Record<string, unknown> = {};
  return {
    default: vi.fn().mockImplementation(() => ({
      get: (key: string, fallback?: unknown) => data[key] ?? fallback,
      set: (key: string, value: unknown) => { data[key] = value; },
      delete: (key: string) => { delete data[key]; },
    })),
  };
});

process.env.MAINLAYER_API_KEY = 'test_key';
process.env.MAINLAYER_PREMIUM_RESOURCE_ID = 'license_premium';

const { MainlayerClient } = await import('@mainlayer/sdk');
type MockFn = ReturnType<typeof vi.fn>;

function getResourcesMock() {
  return ((MainlayerClient as MockFn).mock.results[0]?.value as { resources: { verifyAccess: MockFn } })?.resources;
}

describe('verifyLicense', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns authorized=true when Mainlayer grants access', async () => {
    const resources = getResourcesMock();
    if (resources) {
      resources.verifyAccess.mockResolvedValue({
        authorized: true,
        metadata: { plan: 'premium', expiresAt: '2027-01-01T00:00:00Z' },
      });
    }

    const { verifyLicense } = await import('../src/mainlayer');
    const result = await verifyLicense('user_123', 'LICENSE-KEY-ABCD');

    expect(result.authorized).toBe(true);
    expect(result.plan).toBe('premium');
    expect(result.offline).toBe(false);
  });

  it('returns authorized=false when Mainlayer denies access', async () => {
    const resources = getResourcesMock();
    if (resources) {
      resources.verifyAccess.mockResolvedValue({
        authorized: false,
        metadata: {},
      });
    }

    const { verifyLicense } = await import('../src/mainlayer');
    const result = await verifyLicense('user_456');

    expect(result.authorized).toBe(false);
    expect(result.plan).toBe('free');
    expect(result.offline).toBe(false);
  });

  it('falls back to offline grace period on network error', async () => {
    const resources = getResourcesMock();
    if (resources) {
      resources.verifyAccess.mockRejectedValue(new Error('Network timeout'));
    }

    // Simulate an existing cache set by a previous successful call
    const ElectronStore = (await import('electron-store')).default as MockFn;
    const storeInstance = ElectronStore.mock.results[0]?.value as {
      set: (k: string, v: unknown) => void;
    };
    if (storeInstance) {
      storeInstance.set('license', {
        userId: 'user_789',
        licenseKey: 'key',
        authorized: true,
        plan: 'premium',
        verifiedAt: Date.now() - 1000, // just 1 second ago
      });
    }

    const { verifyLicense } = await import('../src/mainlayer');
    const result = await verifyLicense('user_789');

    expect(result.offline).toBe(true);
    expect(result.gracePeriodActive).toBe(true);
    expect(result.authorized).toBe(true);
  });
});

describe('activateLicense', () => {
  it('returns success=true when license is valid', async () => {
    const resources = getResourcesMock();
    if (resources) {
      resources.verifyAccess.mockResolvedValue({
        authorized: true,
        metadata: { plan: 'premium' },
      });
    }

    const { activateLicense } = await import('../src/mainlayer');
    const result = await activateLicense('user_123', 'VALID-LICENSE-KEY');

    expect(result.success).toBe(true);
    expect(result.message).toMatch(/premium/i);
  });

  it('returns success=false for invalid license key', async () => {
    const resources = getResourcesMock();
    if (resources) {
      resources.verifyAccess.mockResolvedValue({
        authorized: false,
        metadata: {},
      });
    }

    const { activateLicense } = await import('../src/mainlayer');
    const result = await activateLicense('user_123', 'INVALID-KEY');

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/not valid/i);
  });
});

describe('clearLicense', () => {
  it('removes the cached license from the store', async () => {
    const { clearLicense, getCachedLicense } = await import('../src/mainlayer');

    clearLicense();
    const cached = getCachedLicense();
    expect(cached).toBeNull();
  });
});

describe('isCacheStale', () => {
  it('returns true when no cache exists', async () => {
    const { isCacheStale, clearLicense } = await import('../src/mainlayer');
    clearLicense();
    expect(isCacheStale()).toBe(true);
  });
});
