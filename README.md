![CI](https://github.com/your-org/electron-app-mainlayer/actions/workflows/ci.yml/badge.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

# electron-app-mainlayer

Desktop app starter with Electron and in-app Mainlayer payments — license key activation, premium feature unlocking, and a 7-day offline grace period.

## Installation

```bash
git clone https://github.com/your-org/electron-app-mainlayer.git
cd electron-app-mainlayer && npm install
```

## Quickstart

```bash
export MAINLAYER_API_KEY=your_key
export MAINLAYER_PREMIUM_RESOURCE_ID=license_premium
npm run build
npm run dev
```

Set the following environment variables:

| Variable | Description |
|---|---|
| `MAINLAYER_API_KEY` | Your Mainlayer secret key |
| `MAINLAYER_PREMIUM_RESOURCE_ID` | Resource ID for the premium license |

## Architecture

- **Main process** (`src/main.ts`): Electron entry point. Handles all Mainlayer API calls via IPC.
- **Preload** (`src/preload.ts`): Typed `contextBridge` exposing `window.mainlayer` to the renderer.
- **Renderer** (`src/renderer/App.tsx`): React UI. Calls `window.mainlayer.*` for license operations.
- **License manager** (`src/mainlayer.ts`): Verification, caching, and offline grace period logic.

## Features

- License key activation via Mainlayer
- Persistent local cache with `electron-store`
- 7-day offline grace period
- 24h background cache refresh
- Paywall overlay component (`Paywall.tsx`)
- Vitest test suite with mocked SDK + electron-store

## Running Tests

```bash
npm ci && npm test
```

📚 Docs at [mainlayer.fr](https://mainlayer.fr)
