![CI](https://github.com/your-org/electron-app-mainlayer/actions/workflows/ci.yml/badge.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

# electron-app-mainlayer

Production-ready Electron desktop app with Mainlayer payment gating. Supports license key activation, premium feature unlocking, and 7-day offline grace period for seamless user experience.

## Quick Start

```bash
# Clone and install
git clone https://github.com/your-org/electron-app-mainlayer.git
cd electron-app-mainlayer && npm install

# Set environment variables
export MAINLAYER_API_KEY=your_secret_key
export MAINLAYER_PREMIUM_RESOURCE_ID=your_resource_id

# Run dev
npm run build && npm run dev
```

## Environment Variables

Create a `.env.local` file (not committed):

```env
MAINLAYER_API_KEY=sk_live_...
MAINLAYER_PREMIUM_RESOURCE_ID=feature_premium
```

| Variable | Description | Example |
|---|---|---|
| `MAINLAYER_API_KEY` | Secret API key from Mainlayer dashboard | `sk_live_abc123...` |
| `MAINLAYER_PREMIUM_RESOURCE_ID` | Resource ID for premium tier | `feature_premium` |

## Architecture

The app follows **process isolation** best practices:

- **Main process** (`src/main.ts`): Electron entry. All Mainlayer API calls via IPC.
- **Preload** (`src/preload.ts`): Typed `contextBridge` bridge. Renderer calls `window.mainlayer.*`.
- **Renderer** (`src/renderer/App.tsx`): React UI, zero Node.js/Electron API access.
- **License manager** (`src/mainlayer.ts`): License verification, local caching, offline fallback.

## Features

- **Online verification** with fallback to cached license
- **7-day offline grace period** for intermittent connectivity
- **24h cache refresh** with background updates
- **Paywall component** with beautiful UI
- **IPC-based security** — no API keys exposed to renderer
- **TypeScript** throughout with full type safety
- **Vitest** test suite with mocked dependencies

## Usage

### Checking License Status

```typescript
const status = await window.mainlayer.verify(userId);
console.log(status.authorized); // true | false
console.log(status.plan);       // 'free' | 'pro' | 'enterprise'
console.log(status.offline);    // true if in offline grace period
```

### Activating a License

```typescript
const result = await window.mainlayer.activate(userId, licenseKey);
if (result.success) {
  console.log(result.message);
  // Re-verify to get updated plan
  const updated = await window.mainlayer.verify(userId);
}
```

### License Lifecycle

1. **Startup**: Main process verifies license on app launch
2. **Cache miss**: Falls back to 7-day grace period
3. **Activation**: User enters license key via paywall
4. **Refresh**: Background refresh every 24h
5. **Offline**: Works offline for up to 7 days

## Building & Distribution

```bash
# Development
npm run dev

# Build
npm run build

# Package (requires code signing for distribution)
npm run dist

# Quick package (no signing)
npm run pack
```

## Testing

```bash
# Run tests
npm test

# Watch mode
npm test:watch

# Lint
npm run lint
```

## Deployment Checklist

- [ ] Set `MAINLAYER_API_KEY` in production environment
- [ ] Update `MAINLAYER_PREMIUM_RESOURCE_ID` to your actual resource
- [ ] Enable code signing for macOS/Windows distributions
- [ ] Test offline grace period (disconnect network, verify after 7 days)
- [ ] Verify IPC security (no API key leakage to renderer)
- [ ] Set proper app name/icon in `electron-builder` config

## Project Structure

```
src/
├── main.ts                    # Electron main (IPC handlers)
├── preload.ts                 # Typed contextBridge API
├── mainlayer.ts               # License manager logic
└── renderer/
    ├── App.tsx                # Root component
    ├── components/
    │   └── Paywall.tsx        # Payment/activation UI
    └── index.html
```

## API Reference

### `window.mainlayer.verify(userId)`

Check if user has license. Returns cached result or offline grace period status.

**Returns**: `Promise<LicenseStatus>`

```typescript
interface LicenseStatus {
  authorized: boolean;
  plan: string;
  offline: boolean;
  gracePeriodActive: boolean;
  gracePeriodRemainingMs?: number;
}
```

### `window.mainlayer.activate(userId, licenseKey)`

Activate a license key for the user.

**Returns**: `Promise<{ success: boolean; message: string }>`

### `window.mainlayer.clear()`

Sign out / clear the stored license.

**Returns**: `Promise<{ success: boolean }>`

### `window.mainlayer.openPricing()`

Open Mainlayer pricing page in default browser.

## Support

- **Docs**: https://docs.mainlayer.fr
- **Issues**: Report bugs on GitHub
- **Contact**: support@mainlayer.fr
